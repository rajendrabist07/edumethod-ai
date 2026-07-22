import { supabaseAdmin } from "./supabase-admin";

export type ActionType = "learning_path" | "doubt_message" | "quiz";

/**
 * Retrieves the current plan tier of a user.
 * If the user profile doesn't exist yet, it creates a default 'free' profile.
 */
export async function getUserPlan(userId: string): Promise<"free" | "pro"> {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .select("plan")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      // Auto-insert default 'free' profile on first check
      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from("user_profiles")
        .insert({ user_id: userId, plan: "free" })
        .select("plan")
        .single();

      if (insertError) {
        console.error("Database error inserting user profile, falling back to free:", insertError);
        return "free";
      }

      return (newProfile?.plan as "free" | "pro") || "free";
    }

    return (data.plan as "free" | "pro") || "free";
  } catch (err) {
    console.error("Exception fetching user plan:", err);
    return "free";
  }
}

/**
 * Validates if the user is allowed to perform an action based on their daily plan limits.
 * Counts records created since the start of today.
 */
export async function checkUsageLimit(
  userId: string,
  actionType: ActionType
): Promise<{ allowed: boolean; limit: number; current: number; plan: "free" | "pro" }> {
  const plan = await getUserPlan(userId);
  
  // Set usage caps
  const limits = {
    free: {
      learning_path: 3,
      doubt_message: 10,
      quiz: 3,
    },
    pro: {
      learning_path: 50,
      doubt_message: 100,
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
