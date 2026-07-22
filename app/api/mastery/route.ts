import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { calculateMasteryScore } from "@/lib/spaced-repetition";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limit: 30 requests per minute
    const rateLimit = await checkRateLimit(`rate-limit:${userId}:mastery`, 30, "60 s");
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a moment." },
        { status: 429 }
      );
    }

    // Fetch all decks for the user
    const { data: decks, error: decksError } = await supabaseAdmin
      .from("flashcard_decks")
      .select("id, topic, subject")
      .eq("user_id", userId);

    if (decksError) {
      return NextResponse.json({ error: decksError.message }, { status: 500 });
    }

    if (!decks || decks.length === 0) {
      return NextResponse.json({ topics: [] });
    }

    const deckIds = decks.map((d) => d.id);

    // Fetch all flashcards for these decks
    const { data: cards, error: cardsError } = await supabaseAdmin
      .from("flashcards")
      .select("deck_id, repetitions, ease_factor, next_review_date")
      .in("deck_id", deckIds);

    if (cardsError) {
      return NextResponse.json({ error: cardsError.message }, { status: 500 });
    }

    // Group cards by deck
    const cardsByDeck: Record<string, typeof cards> = {};
    cards?.forEach((card) => {
      if (!cardsByDeck[card.deck_id]) {
        cardsByDeck[card.deck_id] = [];
      }
      cardsByDeck[card.deck_id].push(card);
    });

    // Calculate mastery per topic
    const topicMasteryList = decks.map((deck) => {
      const deckCards = cardsByDeck[deck.id] || [];
      if (deckCards.length === 0) {
        return {
          topic: deck.topic,
          subject: deck.subject,
          mastery: 0,
          totalCards: 0,
          nextReview: null,
        };
      }

      let totalReps = 0;
      let totalEase = 0;
      let nearestReview: Date | null = null;

      deckCards.forEach((card) => {
        totalReps += card.repetitions || 0;
        totalEase += card.ease_factor || 2.5;

        if (card.next_review_date) {
          const reviewDate = new Date(card.next_review_date);
          if (!nearestReview || reviewDate < nearestReview) {
            nearestReview = reviewDate;
          }
        }
      });

      const avgReps = totalReps / deckCards.length;
      const avgEase = totalEase / deckCards.length;
      const mastery = calculateMasteryScore(avgReps, avgEase);

      return {
        topic: deck.topic,
        subject: deck.subject,
        mastery,
        totalCards: deckCards.length,
        nextReview: nearestReview ? (nearestReview as Date).toISOString() : null,
      };
    });

    return NextResponse.json({ topics: topicMasteryList });
  } catch (error) {
    console.error("Mastery route error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
