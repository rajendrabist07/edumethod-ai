import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type DynamicParams = {
  params: Promise<{ deckId: string }>;
};

export async function GET(req: NextRequest, { params }: DynamicParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { deckId } = await params;

    // Fetch deck details
    const { data: deck, error: deckError } = await supabaseAdmin
      .from("flashcard_decks")
      .select("*")
      .eq("id", deckId)
      .eq("user_id", userId)
      .single();

    if (deckError || !deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    // Fetch all cards belonging to the deck
    const { data: cards, error: cardsError } = await supabaseAdmin
      .from("flashcards")
      .select("*")
      .eq("deck_id", deckId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (cardsError) {
      console.error("Error fetching cards:", cardsError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const now = new Date();
    const formattedCards = (cards || []).map((card) => ({
      id: card.id,
      front: card.front,
      back: card.back,
      interval: card.interval,
      easeFactor: card.ease_factor,
      repetitions: card.repetitions,
      nextReviewDate: card.next_review_date,
      isDue: new Date(card.next_review_date) <= now,
    }));

    return NextResponse.json({
      deck: {
        id: deck.id,
        subject: deck.subject,
        topic: deck.topic,
        createdAt: deck.created_at,
      },
      cards: formattedCards,
    });
  } catch (error) {
    console.error("Single deck API error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: DynamicParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { deckId } = await params;

    // Fetch deck first to verify user ownership
    const { data: deck, error: deckError } = await supabaseAdmin
      .from("flashcard_decks")
      .select("user_id")
      .eq("id", deckId)
      .single();

    if (deckError || !deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    if (deck.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden: You do not own this deck" }, { status: 403 });
    }

    // Delete the deck (cascading deletes the cards in PostgreSQL)
    const { error: deleteError } = await supabaseAdmin
      .from("flashcard_decks")
      .delete()
      .eq("id", deckId);

    if (deleteError) {
      console.error("Error deleting deck:", deleteError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Flashcard deck deleted successfully" });
  } catch (error) {
    console.error("Delete deck API error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
