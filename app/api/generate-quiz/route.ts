import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { aiGateway } from "@/lib/ai/gateway";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkUsageLimit } from "@/lib/usage";
import { checkRateLimit } from "@/lib/rate-limit";
import { getHash, getCache, setCache } from "@/lib/cache";

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
        { error: "Daily limit reached. Upgrade to Pro for unlimited access." },
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

    try {
      const result = await aiGateway.chat(
        {
          messages: [
            {
              role: "system",
              content: `You are a quiz generator. Given a subject and topics, create 5 multiple-choice questions (4 options each, only one correct) that test conceptual understanding, not just memorization. Return ONLY valid JSON: { "questions": [{ "question": string, "options": string[4], "correctIndex": number, "topic": string }] }. "topic" must match one of the given topic names exactly, so we can track which topic each question belongs to.`,
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

      const validated = quizSchema.safeParse(aiData);
      if (!validated.success) {
        return NextResponse.json({ error: "AI response format mismatch" }, { status: 500 });
      }

      const { data: quiz, error: insertError } = await supabaseAdmin
        .from("quizzes")
        .insert({
          learning_path_id: learningPathId,
          user_id: userId,
          questions: validated.data.questions,
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      // Write plan to cache
      await setCache(cacheKey, validated.data);

      const questionsForFrontend = validated.data.questions.map((q) => ({
        question: q.question,
        options: q.options,
        topic: q.topic,
      }));

      return NextResponse.json({ quizId: quiz.id, questions: questionsForFrontend });
    } catch (aiError: any) {
      console.error("AI Gateway error in quiz generation:", aiError);
      return NextResponse.json(
        { error: aiError.message || "AI service is busy. Please try again in a moment." },
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