import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch decks with all associated card ids and review dates
    const { data: decks, error: fetchError } = await supabaseAdmin
      .from("flashcard_decks")
      .select(`
        id,
        subject,
        topic,
        created_at,
        flashcards (
          id,
          next_review_date
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching flashcard decks:", fetchError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const now = new Date();

    const formattedDecks = (decks || []).map((deck) => {
      const cards = deck.flashcards || [];
      const totalCards = cards.length;
      const dueCards = cards.filter(
        (card: any) => new Date(card.next_review_date) <= now
      ).length;

      return {
        id: deck.id,
        subject: deck.subject,
        topic: deck.topic,
        createdAt: deck.created_at,
        totalCards,
        dueCards,
      };
    });

    return NextResponse.json({ decks: formattedDecks });
  } catch (error) {
    console.error("Decks API error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
