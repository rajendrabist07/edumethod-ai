import { describe, it, expect, vi, beforeEach } from "vitest";
import { runRetriever } from "../ai/retriever";
import { supabaseAdmin } from "../supabase-admin";
import * as embeddings from "../ai/embeddings";
import * as spacedRepetition from "../spaced-repetition";

// Mock external dependencies
vi.mock("../supabase-admin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock("../ai/embeddings", () => ({
  getEmbedding: vi.fn(),
}));

vi.mock("../spaced-repetition", () => ({
  calculateMasteryScore: vi.fn(),
}));

describe("runRetriever Stage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch RAG chunks, mastery score, and mistakes if learning path exists", async () => {
    const mockStudentId = "user_123";
    const mockQuestion = "What is mitosis?";
    const mockLearningPathId = "lp_123";

    // 1. Mock getEmbedding
    vi.mocked(embeddings.getEmbedding).mockResolvedValue([0.1, 0.2, 0.3]);

    // 2. Mock RAG chunks RPC
    vi.mocked(supabaseAdmin.rpc).mockResolvedValue({
      data: [
        { content: "Mitosis is cell division", metadata: { source: "bio.pdf" }, topic: "Biology" },
      ],
      error: null,
    } as any);

    // 3. Mock supabase.from() for deck, flashcards
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      const builder: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      };

      if (table === "flashcard_decks") {
        builder.maybeSingle = vi.fn().mockResolvedValue({ data: { id: "deck_1" } });
      } else if (table === "flashcards") {
        builder.limit = vi.fn().mockResolvedValue({
          data: [{ front: "What is mitosis?", back: "Cell division" }],
        });
        builder.eq = vi.fn((field: string, val: any) => {
          if (field === "repetitions" && val === 0) {
            return builder;
          }
          if (field === "deck_id") {
             // For mastery query, let's return some mock cards if it doesn't have limit
             builder.then = (cb: any) => cb({ data: [{ repetitions: 2, ease_factor: 2.5 }] });
             return builder;
          }
          return builder;
        });
      }
      return builder;
    });

    vi.mocked(supabaseAdmin.from).mockImplementation(mockFrom as any);
    vi.mocked(spacedRepetition.calculateMasteryScore).mockReturnValue(85);

    const result = await runRetriever(mockStudentId, mockQuestion, mockLearningPathId);

    expect(result.studentId).toBe(mockStudentId);
    expect(result.originalQuestion).toBe(mockQuestion);
    expect(result.ragChunks).toHaveLength(1);
    expect(result.ragChunks[0].content).toBe("Mitosis is cell division");
    expect(result.identifiedTopic).toBe("Biology");
    expect(result.masteryScore).toBe(85);
    expect(result.recentMistakes).toHaveLength(1);
    expect(result.recentMistakes[0].question).toBe("What is mitosis?");
  });
});
