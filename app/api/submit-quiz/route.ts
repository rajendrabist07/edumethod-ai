import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { recordQuizSubmission, getOrCreateLearnerProfile } from "@/lib/learner-profile";
import { determineTeachingStrategy } from "@/lib/ai/adaptive-strategy";
import { logQuizOutcome } from "@/lib/flywheel";

const requestSchema = z.object({
  quizId: z.string().uuid(),
  answers: z.array(z.number()),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate Limit: 30 requests per minute
  const rateLimit = await checkRateLimit(`rate-limit:${userId}:submit-quiz`, 30, "60 s");
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a moment." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { quizId, answers } = parsed.data;

  const { data: quiz, error: fetchError } = await supabaseAdmin
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const questions = quiz.questions as {
    question: string;
    options: string[];
    correctIndex: number;
    topic: string;
  }[];

  let correctCount = 0;
  const weakTopics: Record<string, { correct: number; total: number }> = {};

  // Fetch learner profile to evaluate strategy used for each topic
  const profile = await getOrCreateLearnerProfile(userId);
  const masteryMap = profile.mastery_scores || {};
  const mistakes = profile.recent_mistakes || [];

  questions.forEach((q, i) => {
    const isCorrect = answers[i] === q.correctIndex;
    if (isCorrect) correctCount++;

    if (!weakTopics[q.topic]) weakTopics[q.topic] = { correct: 0, total: 0 };
    weakTopics[q.topic].total++;
    if (isCorrect) weakTopics[q.topic].correct++;

    const topicMistakesCount = mistakes.filter((m) => m.topic.toLowerCase() === q.topic.toLowerCase()).length;
    const strategyUsed = determineTeachingStrategy({
      masteryScore: masteryMap[q.topic] ?? null,
      recentMistakesCount: topicMistakesCount,
      topic: q.topic,
      userPreference: profile.preferred_explanation_style,
    });

    void logQuizOutcome({
      userId,
      quizId,
      questionIndex: i,
      topic: q.topic,
      strategyUsed,
      isCorrect,
      timeTakenSeconds: 15, // Default average estimate per question
    });
  });

  const weakTopicNames = Object.entries(weakTopics)
    .filter(([, stats]) => stats.correct / stats.total < 0.6)
    .map(([topic]) => topic);

  // Automatically update learner profile in background
  void recordQuizSubmission(userId, quizId, answers);

  return NextResponse.json({
    score: correctCount,
    totalQuestions: questions.length,
    weakTopics: weakTopicNames,
  });
}