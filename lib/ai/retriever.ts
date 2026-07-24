import { supabaseAdmin } from "@/lib/supabase-admin";
import { getEmbedding } from "@/lib/ai/embeddings";
import { calculateMasteryScore } from "@/lib/spaced-repetition";

export interface RetrievedContext {
  studentId: string;
  originalQuestion: string;
  identifiedTopic: string | null;
  ragChunks: { content: string; source: string }[];
  masteryScore: number | null;
  recentMistakes: { question: string; studentAnswer: string; correctAnswer: string }[];
}

/**
 * Stage 1: Retriever
 * Fetches semantic context, user's mastery scores, and past mistakes.
 */
export async function runRetriever(
  studentId: string,
  question: string,
  learningPathId?: string
): Promise<RetrievedContext> {
  let targetLearningPathId = learningPathId;

  // 1. Resolve Learning Path ID if not provided
  if (!targetLearningPathId) {
    const { data: recentPath } = await supabaseAdmin
      .from("learning_paths")
      .select("id")
      .eq("user_id", studentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (recentPath) {
      targetLearningPathId = recentPath.id;
    }
  }

  // 2. Fetch RAG Chunks
  let ragChunks: { content: string; source: string; topic?: string }[] = [];
  let identifiedTopic: string | null = null;

  if (targetLearningPathId) {
    try {
      const queryEmbedding = await getEmbedding(question);
      const { data: matchedChunks, error: rpcError } = await supabaseAdmin.rpc(
        "match_syllabus_chunks",
        {
          query_embedding: queryEmbedding,
          match_threshold: 0.3,
          match_count: 3,
          filter_learning_path_id: targetLearningPathId,
        }
      );

      if (!rpcError && matchedChunks && matchedChunks.length > 0) {
        ragChunks = matchedChunks.map((chunk: any) => ({
          content: chunk.content,
          source: chunk.metadata?.source || "Syllabus",
          topic: chunk.topic || null
        }));
        
        // Infer topic from the best matched chunk
        const chunkWithTopic = ragChunks.find(c => c.topic);
        if (chunkWithTopic) {
          identifiedTopic = chunkWithTopic.topic ?? null;
        }
      }
    } catch (e) {
      console.warn("Failed to fetch RAG chunks in Retriever:", e);
    }
  }

  // 3. Fetch Mastery Score
  let masteryScore: number | null = null;
  if (identifiedTopic) {
    // First, find the deck for this topic
    const { data: deck } = await supabaseAdmin
      .from("flashcard_decks")
      .select("id")
      .eq("user_id", studentId)
      .ilike("topic", identifiedTopic)
      .maybeSingle();

    if (deck) {
      const { data: cards } = await supabaseAdmin
        .from("flashcards")
        .select("repetitions, ease_factor")
        .eq("deck_id", deck.id);

      if (cards && cards.length > 0) {
        let totalReps = 0;
        let totalEase = 0;
        cards.forEach((c) => {
          totalReps += c.repetitions || 0;
          totalEase += c.ease_factor || 2.5;
        });
        const avgReps = totalReps / cards.length;
        const avgEase = totalEase / cards.length;
        masteryScore = calculateMasteryScore(avgReps, avgEase);
      }
    }
  }

  // 4. Fetch Past Mistakes
  // (Currently, quizzes schema doesn't explicitly store historical incorrect questions individually,
  // but we can look for recent flashcards with repetitions = 0 which indicates recent failure)
  const recentMistakes: { question: string; studentAnswer: string; correctAnswer: string }[] = [];
  if (identifiedTopic) {
    const { data: deck } = await supabaseAdmin
      .from("flashcard_decks")
      .select("id")
      .eq("user_id", studentId)
      .ilike("topic", identifiedTopic)
      .maybeSingle();

    if (deck) {
      const { data: weakCards } = await supabaseAdmin
        .from("flashcards")
        .select("front, back")
        .eq("deck_id", deck.id)
        .eq("repetitions", 0) // Repetitions 0 means they got it wrong recently
        .limit(3);

      if (weakCards) {
        weakCards.forEach(card => {
          recentMistakes.push({
            question: card.front,
            studentAnswer: "Unknown (failed recently)",
            correctAnswer: card.back
          });
        });
      }
    }
  }

  return {
    studentId,
    originalQuestion: question,
    identifiedTopic,
    ragChunks,
    masteryScore,
    recentMistakes,
  };
}
