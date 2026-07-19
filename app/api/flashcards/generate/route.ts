import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { groq } from "@/lib/groq";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkUsageLimit } from "@/lib/usage";

const requestSchema = z.object({
  learningPathId: z.string().uuid(),
  topicName: z.string().min(1),
});

const cardsSchema = z.object({
  flashcards: z.array(
    z.object({
      front: z.string().min(1),
      back: z.string().min(1),
    })
  ).min(3),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Reuse study path limits or allow free generation
    const usage = await checkUsageLimit(userId, "quiz");
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Daily limit reached. Upgrade to Pro for unlimited flashcard generations." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const { learningPathId, topicName } = parsed.data;

    // Fetch the syllabus study path details
    const { data: learningPath, error: fetchError } = await supabaseAdmin
      .from("learning_paths")
      .select("*")
      .eq("id", learningPathId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !learningPath) {
      return NextResponse.json({ error: "Associated study path not found" }, { status: 404 });
    }

    // Call Groq LLM to generate cards
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are an expert curriculum designer. Given a subject and a specific topic, generate exactly 8-10 high-quality flashcards for active recall study.
Each flashcard must contain:
1. "front": A conceptual question, core term, or study prompt. For math/scientific topics, wrap equations in valid LaTeX: single dollar signs ($...$) for inline math, and double dollar signs ($$...$$) for block display equations.
2. "back": The concise, clear, and complete answer or explanation (also using LaTeX math formatting if applicable).

Return ONLY a valid JSON object in this exact format:
{
  "flashcards": [
    { "front": "string", "back": "string" }
  ]
}`,
          },
          {
            role: "user",
            content: `Subject: ${learningPath.subject}\nTopic: ${topicName}\nRaw Syllabus Reference Context: ${learningPath.raw_input}`,
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

      const validated = cardsSchema.safeParse(aiData);
      if (!validated.success) {
        return NextResponse.json({ error: "AI response format mismatch" }, { status: 500 });
      }

      // Check if a deck already exists for this path & topic; if so, delete it first to avoid duplicates
      const { data: existingDeck } = await supabaseAdmin
        .from("flashcard_decks")
        .select("id")
        .eq("user_id", userId)
        .eq("learning_path_id", learningPathId)
        .eq("topic", topicName)
        .maybeSingle();

      if (existingDeck) {
        await supabaseAdmin
          .from("flashcard_decks")
          .delete()
          .eq("id", existingDeck.id);
      }

      // Insert the new deck metadata
      const { data: newDeck, error: deckError } = await supabaseAdmin
        .from("flashcard_decks")
        .insert({
          user_id: userId,
          learning_path_id: learningPathId,
          subject: learningPath.subject,
          topic: topicName,
        })
        .select()
        .single();

      if (deckError || !newDeck) {
        return NextResponse.json({ error: deckError?.message || "Failed to create flashcard deck" }, { status: 500 });
      }

      // Insert all flashcards
      const cardsToInsert = validated.data.flashcards.map((card) => ({
        deck_id: newDeck.id,
        user_id: userId,
        front: card.front,
        back: card.back,
        interval: 1,
        ease_factor: 2.5,
        repetitions: 0,
        next_review_date: new Date().toISOString(),
      }));

      const { error: cardsError } = await supabaseAdmin
        .from("flashcards")
        .insert(cardsToInsert);

      if (cardsError) {
        // Cleanup deck if card insertion fails
        await supabaseAdmin.from("flashcard_decks").delete().eq("id", newDeck.id);
        return NextResponse.json({ error: cardsError.message }, { status: 500 });
      }

      return NextResponse.json({ deckId: newDeck.id, count: cardsToInsert.length });
    } catch (groqError) {
      console.error("Groq error in flashcard route:", groqError);
      const err = groqError as { status?: number; message?: string };
      if (err?.status === 429 || err?.message?.includes("429")) {
        return NextResponse.json(
          { error: "AI service is busy. Please try again in a moment." },
          { status: 429 }
        );
      }
      throw groqError;
    }
  } catch (error) {
    console.error("Generate flashcards error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
