import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { aiGateway } from "@/lib/ai/gateway";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkUsageLimit } from "@/lib/usage";
import { getHash, getCache, setCache } from "@/lib/cache";
import { Client } from "@upstash/qstash";

const qstash = new Client({
  token: process.env.QSTASH_TOKEN || "mock_token_for_dev",
});

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
        { error: "Daily study path limit reached. Please continue after the quota window resets." },
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

    // Enqueue background job to QStash
    try {
      // In local dev, you might want to call the AI directly or use ngrok.
      // Assuming production/Vercel:
      const host = req.headers.get("host") || "edumethod-ai.vercel.app";
      const protocol = host.includes("localhost") ? "http" : "https";
      
      await qstash.publishJSON({
        url: `${protocol}://${host}/api/jobs/generate-path`,
        body: { learningPathId, userId },
      });

      return NextResponse.json({ status: "processing" }, { status: 202 });
    } catch (jobError: any) {
      console.error("QStash enqueue error:", jobError);
      return NextResponse.json(
        { error: "Failed to queue generation task." },
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
