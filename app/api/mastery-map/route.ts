import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { calculateMasteryScore } from "@/lib/spaced-repetition";

interface LearningPathTopic {
  name?: string;
  topic?: string;
}

interface LearningPathRow {
  subject: string | null;
  topics: Array<string | LearningPathTopic> | null;
}

interface DeckRow {
  id: string;
  topic: string;
  subject: string | null;
}

interface CardRow {
  deck_id: string;
  repetitions: number | null;
  ease_factor: number | null;
}

interface PrerequisiteRow {
  topic: string;
  prerequisite_topic: string;
}

function normalizeTopic(topic: string | LearningPathTopic): string {
  if (typeof topic === "string") return topic;
  return topic.name || topic.topic || "Untitled topic";
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: paths, error: pathError } = await supabaseAdmin
      .from("learning_paths")
      .select("subject, topics")
      .eq("user_id", userId)
      .returns<LearningPathRow[]>();

    if (pathError) {
      return NextResponse.json({ error: pathError.message }, { status: 500 });
    }

    const { data: decks, error: deckError } = await supabaseAdmin
      .from("flashcard_decks")
      .select("id, topic, subject")
      .eq("user_id", userId)
      .returns<DeckRow[]>();

    if (deckError) {
      return NextResponse.json({ error: deckError.message }, { status: 500 });
    }

    const topicSubject = new Map<string, string>();
    const subjectOrder = new Map<string, string[]>();

    paths?.forEach((path) => {
      const subject = path.subject || "General";
      const topics = Array.isArray(path.topics) ? path.topics.map(normalizeTopic) : [];
      subjectOrder.set(subject, topics);
      topics.forEach((topic) => topicSubject.set(topic, subject));
    });

    decks?.forEach((deck) => {
      topicSubject.set(deck.topic, deck.subject || topicSubject.get(deck.topic) || "General");
    });

    const cardsByDeck: Record<string, CardRow[]> = {};
    if (decks && decks.length > 0) {
      const { data: cards, error: cardError } = await supabaseAdmin
        .from("flashcards")
        .select("deck_id, repetitions, ease_factor")
        .in("deck_id", decks.map((deck) => deck.id))
        .returns<CardRow[]>();

      if (cardError) {
        return NextResponse.json({ error: cardError.message }, { status: 500 });
      }

      cards?.forEach((card) => {
        if (!cardsByDeck[card.deck_id]) cardsByDeck[card.deck_id] = [];
        cardsByDeck[card.deck_id].push(card);
      });
    }

    const masteryByTopic = new Map<string, number>();
    decks?.forEach((deck) => {
      const cards = cardsByDeck[deck.id] || [];
      if (cards.length === 0) {
        masteryByTopic.set(deck.topic, 0);
        return;
      }

      const avgReps = cards.reduce((sum, card) => sum + (card.repetitions || 0), 0) / cards.length;
      const avgEase = cards.reduce((sum, card) => sum + (card.ease_factor || 2.5), 0) / cards.length;
      masteryByTopic.set(deck.topic, calculateMasteryScore(avgReps, avgEase));
    });

    const nodes = Array.from(topicSubject.entries()).map(([topic, subject]) => ({
      id: topic,
      name: topic,
      subject,
      val: masteryByTopic.get(topic) ?? 0,
    }));

    if (nodes.length === 0) {
      return NextResponse.json({ nodes: [], links: [] });
    }

    const { data: prereqs } = await supabaseAdmin
      .from("topic_prerequisites")
      .select("topic, prerequisite_topic")
      .returns<PrerequisiteRow[]>();

    const topicsSet = new Set(nodes.map((node) => node.id));
    const linkKeys = new Set<string>();
    const links: Array<{ source: string; target: string }> = [];

    prereqs?.forEach((p) => {
      if (topicsSet.has(p.topic) && topicsSet.has(p.prerequisite_topic)) {
        const key = `${p.prerequisite_topic}->${p.topic}`;
        if (!linkKeys.has(key)) {
          linkKeys.add(key);
          links.push({ source: p.prerequisite_topic, target: p.topic });
        }
      }
    });

    subjectOrder.forEach((topics) => {
      topics.forEach((topic, index) => {
        const previous = topics[index - 1];
        if (!previous || !topicsSet.has(previous) || !topicsSet.has(topic)) return;

        const key = `${previous}->${topic}`;
        if (!linkKeys.has(key)) {
          linkKeys.add(key);
          links.push({ source: previous, target: topic });
        }
      });
    });

    return NextResponse.json({ nodes, links });
  } catch (error) {
    console.error("Mastery map API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
