import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { aiGateway } from "@/lib/ai/gateway";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkUsageLimit } from "@/lib/usage";
import { checkRateLimit } from "@/lib/rate-limit";
import { getHash, getCache, setCache } from "@/lib/cache";
import { Client } from "@upstash/qstash";

const qstash = new Client({
  token: process.env.QSTASH_TOKEN || "mock_token_for_dev",
});

const requestSchema = z.object({
  learningPathId: z.string().uuid(),
});

const quizSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()).length(4),
      correctIndex: z.number().min(0).max(3),
      topic: z.string(),
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
    const rateLimit = await checkRateLimit(`rate-limit:${userId}:generate-quiz`, 10, "60 s");
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a moment." },
        { status: 429 }
      );
    }

    // Validate usage limit for quiz generation
    const usage = await checkUsageLimit(userId, "quiz");
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Daily quiz limit reached. Please continue after the quota window resets." },
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

    // Cost Caching: Check if we already have generated quiz questions for these topics
    const cacheKey = `cache:quiz:${getHash(learningPath.topics)}`;
    const cachedQuiz = await getCache<any>(cacheKey);
    if (cachedQuiz) {
      const { data: quiz, error: insertError } = await supabaseAdmin
        .from("quizzes")
        .insert({
          learning_path_id: learningPathId,
          user_id: userId,
          questions: cachedQuiz.questions,
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      const questionsForFrontend = cachedQuiz.questions.map((q: any) => ({
        question: q.question,
        options: q.options,
        topic: q.topic,
      }));

      return NextResponse.json({ quizId: quiz.id, questions: questionsForFrontend, cached: true });
    }

    // Enqueue background job to QStash
    try {
      const host = req.headers.get("host") || "edumethod-ai.vercel.app";
      const protocol = host.includes("localhost") ? "http" : "https";
      
      await qstash.publishJSON({
        url: `${protocol}://${host}/api/jobs/generate-quiz`,
        body: { learningPathId, userId },
      });

      return NextResponse.json({ status: "processing" }, { status: 202 });
    } catch (jobError: any) {
      console.error("QStash enqueue error:", jobError);
      return NextResponse.json(
        { error: "Failed to queue quiz generation task." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Generate quiz error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
