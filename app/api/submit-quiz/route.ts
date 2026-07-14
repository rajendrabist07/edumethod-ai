import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";

const requestSchema = z.object({
  quizId: z.string().uuid(),
  answers: z.array(z.number()),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  questions.forEach((q, i) => {
    const isCorrect = answers[i] === q.correctIndex;
    if (isCorrect) correctCount++;

    if (!weakTopics[q.topic]) weakTopics[q.topic] = { correct: 0, total: 0 };
    weakTopics[q.topic].total++;
    if (isCorrect) weakTopics[q.topic].correct++;
  });

  const weakTopicNames = Object.entries(weakTopics)
    .filter(([, stats]) => stats.correct / stats.total < 0.6)
    .map(([topic]) => topic);

  return NextResponse.json({
    score: correctCount,
    totalQuestions: questions.length,
    weakTopics: weakTopicNames,
  });
}