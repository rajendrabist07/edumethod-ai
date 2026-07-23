import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { aiGateway } from "@/lib/ai/gateway";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { getEmbedding } from "@/lib/ai/embeddings";

const requestSchema = z.object({
  learningPathId: z.string().uuid(),
  topicName: z.string().min(1),
  userExplanation: z.string().min(10),
});

const responseSchema = z.object({
  clarityScore: z.number().min(0).max(100),
  gaps: z.array(z.string()),
  suggestions: z.array(z.string()),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limit: 10 requests per minute
    const rateLimit = await checkRateLimit(`rate-limit:${userId}:feynman-eval`, 10, "60 s");
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a moment." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request input" }, { status: 400 });
    }

    const { learningPathId, topicName, userExplanation } = parsed.data;

    // 1. Generate query embedding for similarity lookup
    let contextText = "";
    try {
      const queryEmbedding = await getEmbedding(userExplanation);
      const { data: matchedChunks } = await supabaseAdmin.rpc("match_syllabus_chunks", {
        query_embedding: queryEmbedding,
        match_threshold: 0.3,
        match_count: 3,
        filter_learning_path_id: learningPathId,
      });

      if (matchedChunks && matchedChunks.length > 0) {
        contextText = matchedChunks.map((c: any) => c.content).join("\n\n");
      }
    } catch (embeddingError) {
      console.warn("[Feynman RAG Warning]: Failed to fetch context chunks. Falling back to zero-shot.", embeddingError);
    }

    // 2. Call AI Gateway with prompt
    const systemPrompt = `You are a learning science expert evaluating a student using the Feynman Technique.
The student is trying to explain the topic: "${topicName}" in simple terms (as if explaining to a 5-year-old child).
Compare the student's explanation against the following verified textbook/syllabus reference context.
Identify:
1. "clarityScore": A score from 0 to 100 representing how simple, accurate, and clear their explanation is.
2. "gaps": An array of strings describing any logical gaps, inaccuracies, or key details they missed compared to the reference context.
3. "suggestions": An array of strings providing concrete guidance on how they can improve.

Return ONLY a valid JSON object in this exact format:
{
  "clarityScore": number,
  "gaps": string[],
  "suggestions": string[]
}

Verified Reference Context:
${contextText || "(No reference context found. Evaluate based on general scientific accuracy of the explanation.)"}`;

    const result = await aiGateway.chat(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Student explanation:\n"${userExplanation}"` },
        ],
        jsonMode: true,
      },
      userId
    );

    let aiData;
    try {
      aiData = JSON.parse(result.text || "{}");
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON evaluation format" }, { status: 500 });
    }

    const validated = responseSchema.safeParse(aiData);
    if (!validated.success) {
      return NextResponse.json({ error: "AI response schema format mismatch" }, { status: 500 });
    }

    // 3. Log the evaluation to feynman_evaluations table
    const { error: dbError } = await supabaseAdmin
      .from("feynman_evaluations")
      .insert({
        user_id: userId,
        learning_path_id: learningPathId,
        topic: topicName,
        explanation: userExplanation,
        clarity_score: validated.data.clarityScore,
        feedback: {
          gaps: validated.data.gaps,
          suggestions: validated.data.suggestions,
        },
      });

    if (dbError) {
      console.error("[Feynman Log Database Error]: Failed to save history logs.", dbError);
      // We still return the validation results even if the logging fails, so the user's experience is not broken
    }

    return NextResponse.json(validated.data);
  } catch (err) {
    console.error("Feynman evaluate API error:", err);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
