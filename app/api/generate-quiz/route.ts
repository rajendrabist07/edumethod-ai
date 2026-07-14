import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { groq } from "@/lib/groq";
import { supabaseAdmin } from "@/lib/supabase-admin";

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

    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
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
        response_format: { type: "json_object" },
      });

      const aiText = completion.choices[0].message.content;

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

      const questionsForFrontend = validated.data.questions.map((q) => ({
        question: q.question,
        options: q.options,
        topic: q.topic,
      }));

      return NextResponse.json({ quizId: quiz.id, questions: questionsForFrontend });
    } catch (groqError) {
      console.error("Groq error:", groqError);
      
      const err = groqError as { status?: number; message?: string };
      // Handle rate limiting
      if (err?.status === 429 || err?.message?.includes("429")) {
        return NextResponse.json(
          { error: "AI service is busy. Please try again in a moment." },
          { status: 429 }
        );
      }
      
      throw groqError;
    }
  } catch (error) {
    console.error("Generate quiz error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}