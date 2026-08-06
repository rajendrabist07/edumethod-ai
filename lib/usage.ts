import { supabaseAdmin } from "./supabase-admin";

export type ActionType = "learning_path" | "doubt_message" | "quiz";
export type UsageTier = "standard";

/**
 * Retrieves the current plan tier of a user.
 * If the user profile doesn't exist yet, it creates a compatible default profile.
 */
export async function getUserPlan(userId: string): Promise<UsageTier> {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .select("plan")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      // Keep the persisted value compatible with the original DB constraint.
      // The product surface exposes only the honest "standard" tier.
      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from("user_profiles")
        .insert({ user_id: userId, plan: "free" })
        .select("plan")
        .single();

      if (insertError) {
        console.error("Database error inserting user profile, falling back to standard:", insertError);
        return "standard";
      }

      return newProfile?.plan === "standard" ? "standard" : "standard";
    }

    return "standard";
  } catch (err) {
    console.error("Exception fetching user plan:", err);
    return "standard";
  }
}

/**
 * Validates if the user is allowed to perform an action based on their daily plan limits.
 * Counts records created since the start of today.
 */
export async function checkUsageLimit(
  userId: string,
  actionType: ActionType
): Promise<{ allowed: boolean; limit: number; current: number; plan: UsageTier }> {
  if (process.env.ENABLE_E2E_MOCK === "true") {
    return {
      allowed: true,
      limit: 999999,
      current: 0,
      plan: "standard",
    };
  }

  const plan = await getUserPlan(userId);
  
  const limits: Record<UsageTier, Record<ActionType, number>> = {
    standard: {
      learning_path: 20,
      doubt_message: 200,
      quiz: 50,
    },
  };

  const userLimit = limits[plan][actionType];
  let currentCount = 0;

  // Calculate beginning of today in UTC/Server local time
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfDayISO = startOfDay.toISOString();

  try {
    if (actionType === "learning_path") {
      const { count, error } = await supabaseAdmin
        .from("learning_paths")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", startOfDayISO);

      if (!error && count !== null) {
        currentCount = count;
      }
    } else if (actionType === "quiz") {
      const { count, error } = await supabaseAdmin
        .from("quizzes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", startOfDayISO);

      if (!error && count !== null) {
        currentCount = count;
      }
    } else if (actionType === "doubt_message") {
      // Find all sessions updated today and count messages belonging to 'user'
      const { data, error } = await supabaseAdmin
        .from("doubt_sessions")
        .select("messages")
        .eq("user_id", userId)
        .gte("created_at", startOfDayISO);

      if (!error && data) {
        data.forEach((row) => {
          const messages = row.messages || [];
          messages.forEach((msg: { role: string; content: string }) => {
            if (msg.role === "user") {
              currentCount++;
            }
          });
        });
      }
    }
  } catch (dbErr) {
    console.error(`Database error checking limit for ${actionType}:`, dbErr);
  }

  return {
    allowed: currentCount < userLimit,
    limit: userLimit,
    current: currentCount,
    plan,
  };
}
