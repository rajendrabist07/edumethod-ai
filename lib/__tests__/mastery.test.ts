import { describe, it, expect } from "vitest";
import { calculateMasteryScore } from "../spaced-repetition";

describe("Spaced Repetition Mastery Scoring", () => {
  it("should calculate correct baseline scores", () => {
    // 0 repetitions, default ease factor 2.5
    // raw = 0*20 + (2.5-1.3)*30 = 1.2*30 = 36
    expect(calculateMasteryScore(0, 2.5)).toBe(36);

    // 1 repetition, default ease factor 2.5
    // raw = 20 + 36 = 56
    expect(calculateMasteryScore(1, 2.5)).toBe(56);
  });

  it("should clamp maximum mastery score to 100", () => {
    // 5 repetitions, default ease factor 2.5
    // raw = 100 + 36 = 136 -> clamped to 100
    expect(calculateMasteryScore(5, 2.5)).toBe(100);

    // 10 repetitions, ease factor 3.0
    expect(calculateMasteryScore(10, 3.0)).toBe(100);
  });

  it("should clamp minimum mastery score to 0", () => {
    // Negative inputs or extremely low ease factors (though clamped to 1.3 by SM-2)
    expect(calculateMasteryScore(0, 1.0)).toBe(0);
    expect(calculateMasteryScore(-5, 1.3)).toBe(0);
  });
});
