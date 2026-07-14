import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { groq } from "@/lib/groq";
import { supabaseAdmin } from "@/lib/supabase-admin";

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
            content: `You are a learning science expert. Given a list of topics with difficulty and estimated hours, create an optimal 7-day study plan using interleaving (mix related topics), spaced repetition principles, and active recall methods. Return ONLY valid JSON in this exact format: { "days": [{ "day": number, "topics": string[], "method": string, "durationMinutes": number, "hack": string }] }. "method" should describe the study technique for that day (e.g. "Active recall with flashcards"). "hack" should be one practical tip/mnemonic for that day's topics.`,
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

      return NextResponse.json({ plan: validated.data });
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
    console.error("Generate path error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
