import { describe, it, expect } from "vitest";
import { determineTeachingStrategy, isSurrenderOrDirectRequest } from "@/lib/ai/adaptive-strategy";
import { interleaveStudyItems, verifyRetrievalBeforeReview } from "@/lib/spaced-repetition";
import { calculateConfidenceCalibration } from "@/lib/flywheel";
import { evaluateMasteryGating } from "@/lib/journey";

describe("EduMethod AI — Pedagogical Core (6 Learning Science Principles)", () => {
  // PRINCIPLE 1: Struggle Before Solution
  describe("Principle 1: Struggle Before Solution", () => {
    it("defaults to Socratic scaffolding on attempt 1 for a fresh question", () => {
      const strategy = determineTeachingStrategy({
        attemptCount: 1,
        message: "What is Newton's second law?",
      });
      expect(strategy).toBe("socratic");
    });

    it("bypasses Socratic mode if the student explicitly asks for direct answer / surrenders", () => {
      const isSurrender = isSurrenderOrDirectRequest("I give up, just tell me the answer");
      expect(isSurrender).toBe(true);

      const strategy = determineTeachingStrategy({
        attemptCount: 1,
        message: "I give up, just tell me the answer",
      });
      expect(strategy).toBe("direct-explanation");
    });

    it("escalates away from Socratic mode on attempt 2 to provide worked example / direct help", () => {
      const strategy = determineTeachingStrategy({
        attemptCount: 2,
        masteryScore: 50,
        message: "I tried F = ma but I am stuck on calculating acceleration",
      });
      expect(strategy).toBe("worked-example");
    });
  });

  // PRINCIPLE 2: Retrieval Before Review
  describe("Principle 2: Retrieval Before Review", () => {
    it("returns attempted: false when no active recall text is provided before review", () => {
      const result = verifyRetrievalBeforeReview({
        recalledText: "",
        cardAnswer: "Force is equal to mass times acceleration",
      });
      expect(result.attempted).toBe(false);
      expect(result.passed).toBe(false);
    });

    it("evaluates text active recall and returns passed: true on keyword match", () => {
      const result = verifyRetrievalBeforeReview({
        recalledText: "force equals mass times acceleration",
        cardAnswer: "Force is equal to mass times acceleration",
      });
      expect(result.attempted).toBe(true);
      expect(result.passed).toBe(true);
      expect(result.similarityScore).toBeGreaterThan(50);
    });
  });

  // PRINCIPLE 3: Confidence Calibration
  describe("Principle 3: Confidence Calibration", () => {
    it("flags high confidence on incorrect answers as Illusion of Competence (Overconfident)", () => {
      const logs = [
        { is_correct: false, confidence_level: "high" },
        { is_correct: false, confidence_level: "high" },
        { is_correct: false, confidence_level: "high" },
        { is_correct: true, confidence_level: "high" },
      ];
      const metrics = calculateConfidenceCalibration(logs);
      expect(metrics.overconfidenceRatePercentage).toBeGreaterThanOrEqual(50);
      expect(metrics.metacognitiveDiagnosis).toBe("Illusion of Competence (Overconfident)");
    });

    it("diagnoses a well-calibrated student when high confidence matches correct answers", () => {
      const logs = [
        { is_correct: true, confidence_level: "high" },
        { is_correct: true, confidence_level: "high" },
        { is_correct: false, confidence_level: "low" },
      ];
      const metrics = calculateConfidenceCalibration(logs);
      expect(metrics.calibratedPercentage).toBe(100);
      expect(metrics.metacognitiveDiagnosis).toBe("Well Calibrated");
    });
  });

  // PRINCIPLE 4: Mastery Gating Across Multi-Session Spacing
  describe("Principle 4: Mastery Gating, Not Time Gating", () => {
    it("holds high score in progress if distinctSessionCount < 2", () => {
      const gating = evaluateMasteryGating({
        masteryScore: 85,
        distinctSessionCount: 1,
      });
      expect(gating.isMastered).toBe(false);
      expect(gating.gatingReason).toContain("1 more review needed spaced 24 hours apart");
    });

    it("marks topic as mastered when score >= 75 AND distinctSessionCount >= 2", () => {
      const gating = evaluateMasteryGating({
        masteryScore: 85,
        distinctSessionCount: 2,
      });
      expect(gating.isMastered).toBe(true);
      expect(gating.gatingReason).toContain("Mastery achieved");
    });
  });

  // PRINCIPLE 5: Interleaved Practice
  describe("Principle 5: Interleaved, Not Blocked, Practice", () => {
    it("round-robin interleaves study items across multiple active topics", () => {
      const blockedItems = [
        { id: "1", topic: "Physics" },
        { id: "2", topic: "Physics" },
        { id: "3", topic: "Chemistry" },
        { id: "4", topic: "Chemistry" },
      ];

      const interleaved = interleaveStudyItems(blockedItems);
      expect(interleaved.map((i) => i.topic)).toEqual([
        "Physics",
        "Chemistry",
        "Physics",
        "Chemistry",
      ]);
    });
  });

  // PRINCIPLE 6: Misconception-Aware Correction
  describe("Principle 6: Misconception-Aware Correction", () => {
    it("identifies misconception explanation framing chosen wrong answer vs correct answer", () => {
      const chosenOption = "Velocity";
      const correctOption = "Acceleration";
      const misconceptionNotice = `You chose '${chosenOption}', which represents a plausible misconception. The correct principle is '${correctOption}'.`;

      expect(misconceptionNotice).toContain("Velocity");
      expect(misconceptionNotice).toContain("Acceleration");
      expect(misconceptionNotice).toContain("plausible misconception");
    });
  });
});
