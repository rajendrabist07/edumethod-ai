import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { aiGateway } from "@/lib/ai/gateway";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit } from "@/lib/rate-limit";

const requestSchema = z.object({
  learningPathId: z.string().uuid(),
});

function calculateReadabilityMetrics(text: string) {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => w.trim().length > 0);
  
  const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
  
  // Complexity heuristic: proportion of words longer than 6 letters
  const longWords = words.filter((w) => w.replace(/[^a-zA-Z]/g, "").length > 6);
  const density = words.length > 0 ? (longWords.length / words.length) * 100 : 0;

  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    complexityScore: Math.min(Math.max(Math.round(density * 2), 0), 100), // Scaled to 0-100 index
  };
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limit: 10 requests per minute
    const rateLimit = await checkRateLimit(`rate-limit:${userId}:cognitive-insights`, 10, "60 s");
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a moment." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const { learningPathId } = parsed.data;

    // Fetch the learning path raw syllabus context
    const { data: pathData, error: pathError } = await supabaseAdmin
      .from("learning_paths")
      .select("raw_input, subject")
      .eq("id", learningPathId)
      .eq("user_id", userId)
      .single();

    if (pathError || !pathData) {
      return NextResponse.json({ error: "Learning path raw syllabus not found" }, { status: 404 });
    }

    const textToAnalyze = pathData.raw_input || "";
    const stats = calculateReadabilityMetrics(textToAnalyze);

    // Call AI to evaluate conceptual cognitive indicators
    const prompt = `You are a learning psychologist. Analyze this syllabus snippet and assess its cognitive load details:
Subject: ${pathData.subject}
Syllabus Content:
"${textToAnalyze.slice(0, 1500)}"

Evaluate the text and return ONLY a valid JSON object matching this schema:
{
  "vocabularyLevel": "Basic" | "Intermediate" | "Advanced",
  "attentionSpan": "Short focus bursts" | "Medium focused reading" | "Deep logical immersion",
  "conceptualDensity": "Low" | "Balanced" | "Highly Dense",
  "suggestions": string[]
}`;

    let aiData = {
      vocabularyLevel: "Intermediate",
      attentionSpan: "Medium focused reading",
      conceptualDensity: "Balanced",
      suggestions: ["Break down complex topics into active recall flashcards."],
    };

    try {
      const result = await aiGateway.chat(
        {
          messages: [{ role: "system", content: prompt }],
          jsonMode: true,
        },
        userId
      );

      if (result.text) {
        aiData = JSON.parse(result.text);
      }
    } catch (aiErr) {
      console.warn("[Cognitive Load AI Warning]: Failed to fetch AI metrics. Returning heuristics fallback.", aiErr);
    }

    return NextResponse.json({
      wordCount: stats.wordCount,
      avgSentenceLength: stats.avgSentenceLength,
      complexityScore: stats.complexityScore,
      ...aiData,
    });
  } catch (error) {
    console.error("Cognitive insights API error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
