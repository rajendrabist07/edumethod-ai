import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { calculateSM2, mapRatingToQuality } from "@/lib/spaced-repetition";
import { checkRateLimit } from "@/lib/rate-limit";

const reviewSchema = z.object({
  cardId: z.string().uuid(),
  rating: z.enum(["again", "hard", "good", "easy"]),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limit: 30 requests per minute
    const rateLimit = await checkRateLimit(`rate-limit:${userId}:review-flashcard`, 30, "60 s");
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a moment." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const { cardId, rating } = parsed.data;

    // Fetch the flashcard from database
    const { data: card, error: cardError } = await supabaseAdmin
      .from("flashcards")
      .select("*")
      .eq("id", cardId)
      .eq("user_id", userId)
      .single();

    if (cardError || !card) {
      return NextResponse.json({ error: "Flashcard not found" }, { status: 404 });
    }

    // Map user rating string to SM-2 quality score
    const quality = mapRatingToQuality(rating);

    // Calculate new SM-2 spaced repetition state
    const { repetitions, interval, easeFactor, nextReviewDate } = calculateSM2(
      quality,
      card.repetitions,
      card.interval,
      card.ease_factor
    );

    // Update flashcard in the database
    const { error: updateError } = await supabaseAdmin
      .from("flashcards")
      .update({
        repetitions,
        interval,
        ease_factor: easeFactor,
        next_review_date: nextReviewDate.toISOString(),
      })
      .eq("id", cardId);

    if (updateError) {
      console.error("Error updating flashcard review metrics:", updateError);
      return NextResponse.json({ error: "Database update error" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      cardId,
      nextReviewDate: nextReviewDate.toISOString(),
      interval,
      repetitions,
    });
  } catch (error) {
    console.error("Flashcard review API error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
