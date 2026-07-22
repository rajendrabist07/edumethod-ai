import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { aiGateway } from "@/lib/ai/gateway";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkUsageLimit } from "@/lib/usage";
import { getHash, getCache, setCache } from "@/lib/cache";

const requestSchema = z.object({
  learningPathId: z.string().uuid(),
});

const planSchema = z.object({
  days: z.array(
    z.object({
      day: z.number(),
      topics: z.array(z.string()),
      method: z.string(),
      durationMinutes: z.number(),
      hack: z.string(),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limit: 10 requests per minute
    const rateLimit = await checkRateLimit(`rate-limit:${userId}:generate-path`, 10, "60 s");
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a moment." },
        { status: 429 }
      );
    }

    // Daily Limit check
    const usage = await checkUsageLimit(userId, "learning_path");
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Daily study path limit reached. Upgrade to Pro for unlimited generation." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { learningPathId } = parsed.data;

    const { data: learningPath, error: fetchError } = await supabaseAdmin
      .from("learning_paths")
      .select("*")
      .eq("id", learningPathId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !learningPath) {
      return NextResponse.json({ error: "Learning path not found" }, { status: 404 });
    }

    // Cost Caching: Hash the topics list
    const cacheKey = `cache:study-plan:${getHash(learningPath.topics)}`;
    const cachedPlan = await getCache<any>(cacheKey);
    if (cachedPlan) {
      const { error: dbUpdateError } = await supabaseAdmin
        .from("learning_paths")
        .update({ learning_plan: cachedPlan })
        .eq("id", learningPathId);

      if (dbUpdateError) {
        return NextResponse.json({ error: dbUpdateError.message }, { status: 500 });
      }

      return NextResponse.json({ plan: cachedPlan, cached: true });
    }

    try {
      const result = await aiGateway.chat(
        {
          messages: [
            {
              role: "system",
              content: `You are a learning science expert. Given a list of topics with difficulty and estimated hours, create an optimal 7-day study plan using interleaving (mix related topics), spaced repetition principles, and active recall methods. Return ONLY valid JSON in this exact format: { "days": [{ "day": number, "topics": string[], "method": string, "durationMinutes": number, "hack": string }] }. "method" should describe the study technique for that day (e.g. "Active recall with flashcards"). "hack" should be one practical tip/mnemonic for that day's topics.`,
            },
            {
              role: "user",
              content: `Subject: ${learningPath.subject}\nTopics: ${JSON.stringify(learningPath.topics)}`,
            },
          ],
          jsonMode: true,
        },
        userId
      );

      const aiText = result.text;

      let aiData;
      try {
        aiData = JSON.parse(aiText || "{}");
      } catch {
        return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
      }

      const validated = planSchema.safeParse(aiData);
      if (!validated.success) {
        return NextResponse.json({ error: "AI response format mismatch" }, { status: 500 });
      }

      const { error: updateError } = await supabaseAdmin
        .from("learning_paths")
        .update({ learning_plan: validated.data })
        .eq("id", learningPathId);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Write plan to cache
      await setCache(cacheKey, validated.data);

      return NextResponse.json({ plan: validated.data });
    } catch (aiError: any) {
      console.error("AI Gateway error in plan generation:", aiError);
      return NextResponse.json(
        { error: aiError.message || "AI service is busy. Please try again in a moment." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Generate path error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
