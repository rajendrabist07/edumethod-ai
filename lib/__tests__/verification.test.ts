import { describe, it, expect, vi, beforeEach } from "vitest";
import { evaluateMathExpression, verifyMathCalculations, verifyQuizQuestions } from "../ai/verification";
import { aiGateway } from "../ai/gateway";
import { supabaseAdmin } from "../supabase-admin";

vi.mock("../ai/gateway", () => ({
  aiGateway: {
    chat: vi.fn(),
  },
}));

vi.mock("../supabase-admin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

describe("Verification & Reliability Layer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Code Execution Math Verification", () => {
    it("should evaluate arithmetic expressions correctly", () => {
      expect(evaluateMathExpression("12 * 15")).toBe(180);
      expect(evaluateMathExpression("(100 - 25) / 5")).toBe(15);
      expect(evaluateMathExpression("2 ^ 3")).toBe(8);
      expect(evaluateMathExpression("invalid text")).toBeNull();
    });

    it("should pass when text math statements match actual code calculations", () => {
      const text = "We know that 12 * 15 = 180 and (100 - 25) / 5 = 15.";
      const result = verifyMathCalculations(text);
      expect(result.passed).toBe(true);
      expect(result.verifiedCount).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it("should catch math errors when model arithmetic is incorrect", () => {
      const text = "Calculating gives 12 * 15 = 175.";
      const result = verifyMathCalculations(text);
      expect(result.passed).toBe(false);
      expect(result.verifiedCount).toBe(1);
      expect(result.errors[0]).toContain("evaluated to 180, but text claimed 175");
    });
  });

  describe("Independent Quiz Auditor", () => {
    it("should audit quiz questions using an independent AI call", async () => {
      vi.mocked(aiGateway.chat).mockResolvedValue({
        text: JSON.stringify({ pass: true, reason: "Verified correct" }),
      } as any);

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      });
      vi.mocked(supabaseAdmin.from).mockImplementation(mockFrom as any);

      const questions = [
        {
          question: "What is 5 + 5?",
          options: ["8", "10", "12", "14"],
          correctIndex: 1,
          topic: "Math",
        },
      ];

      const res = await verifyQuizQuestions(questions, "user_123");
      expect(res.passed).toBe(true);
      expect(aiGateway.chat).toHaveBeenCalledTimes(1);
    });
  });
});
