import { NextRequest, NextResponse } from "next/server";
import { aiGateway } from "@/lib/ai/gateway";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getHash, setCache } from "@/lib/cache";
import { z } from "zod";

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
    const cacheKey = `cache:study-plan:${getHash(learningPath.topics)}`;
    await setCache(cacheKey, validated.data);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Generate path job error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// In production, uncomment the verifySignatureEdge wrapper from @upstash/qstash/dist/nextjs to ensure only QStash can hit this
// export const POST = verifySignatureEdge(handler);
export const POST = handler;
