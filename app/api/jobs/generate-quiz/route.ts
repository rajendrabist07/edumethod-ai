import { NextRequest, NextResponse } from "next/server";
import { aiGateway } from "@/lib/ai/gateway";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getHash, setCache } from "@/lib/cache";
import { z } from "zod";

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

async function handler(req: NextRequest) {
  try {
    const body = await req.json();
    const { learningPathId, userId } = body;

    if (!learningPathId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: learningPath, error: fetchError } = await supabaseAdmin
      .from("learning_paths")
      .select("*")
      .eq("id", learningPathId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !learningPath) {
      return NextResponse.json({ error: "Learning path not found" }, { status: 404 });
    }

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

    const { error: insertError } = await supabaseAdmin
      .from("quizzes")
      .insert({
        learning_path_id: learningPathId,
        user_id: userId,
        questions: validated.data.questions,
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Write quiz to cache
    const cacheKey = `cache:quiz:${getHash(learningPath.topics)}`;
    await setCache(cacheKey, validated.data);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Generate quiz job error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// In production, uncomment the verifySignatureEdge wrapper to ensure only QStash can hit this
// export const POST = verifySignatureEdge(handler);
export const POST = handler;
