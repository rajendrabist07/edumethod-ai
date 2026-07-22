import { describe, it, expect } from "vitest";
import { calculateSM2, mapRatingToQuality } from "../spaced-repetition";

describe("SM-2 Spaced Repetition Algorithm", () => {
  it("should calculate correct updates for correct response (quality >= 3)", () => {
    // First review session
    const firstReview = calculateSM2(4, 0, 1, 2.5);
    expect(firstReview.repetitions).toBe(1);
    expect(firstReview.interval).toBe(1);
    expect(firstReview.easeFactor).toBeCloseTo(2.5, 2);

    // Second review session
    const secondReview = calculateSM2(4, 1, 1, 2.5);
    expect(secondReview.repetitions).toBe(2);
    expect(secondReview.interval).toBe(6);
    expect(secondReview.easeFactor).toBeCloseTo(2.5, 2);

    // Subsequent correct review with 'easy' rating (repetitions = 2, interval = 6)
    const thirdReview = calculateSM2(5, 2, 6, 2.5);
    expect(thirdReview.repetitions).toBe(3);
    expect(thirdReview.interval).toBe(15); // Math.round(6 * 2.5) = 15
    expect(thirdReview.easeFactor).toBeGreaterThan(2.5);
  });

  it("should reset repetitions and interval to 1 on failure (quality < 3)", () => {
    const failedReview = calculateSM2(1, 3, 15, 2.7);
    expect(failedReview.repetitions).toBe(0);
    expect(failedReview.interval).toBe(1);
    expect(failedReview.easeFactor).toBeLessThan(2.7);
    expect(failedReview.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("should clamp ease factor to a minimum of 1.3", () => {
    let easeFactor = 1.4;
    for (let i = 0; i < 5; i++) {
      const result = calculateSM2(1, 0, 1, easeFactor);
      easeFactor = result.easeFactor;
    }
    expect(easeFactor).toBe(1.3);
  });

  it("should map text ratings to numeric quality correctly", () => {
    expect(mapRatingToQuality("again")).toBe(1);
    expect(mapRatingToQuality("hard")).toBe(3);
    expect(mapRatingToQuality("good")).toBe(4);
    expect(mapRatingToQuality("easy")).toBe(5);
  });
});
