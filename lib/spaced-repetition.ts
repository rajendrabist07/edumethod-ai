export interface SM2State {
  repetitions: number;
  interval: number;
  easeFactor: number;
}

/**
 * Calculates spaced repetition intervals using the SuperMemo-2 (SM-2) algorithm.
 * 
 * Quality ratings mapping:
 * - 5: "easy"   - Perfect response, no hesitation (increase EF, increment reps, scale interval)
 * - 4: "good"   - Correct response after a hesitation (maintain/slightly increase EF, increment reps, scale interval)
 * - 3: "hard"   - Correct response recalled with serious difficulty (decrease EF, increment reps, scale interval)
 * - 1: "again"  - Incorrect response (reset reps to 0, reset interval to 1 day, decrease EF)
 * 
 * @param quality Quality score from 0 to 5.
 * @param previousRepetitions Number of consecutive correct reviews.
 * @param previousInterval Current interval in days.
 * @param previousEaseFactor Current ease factor (multiplier).
 */
export function calculateSM2(
  quality: number,
  previousRepetitions: number,
  previousInterval: number,
  previousEaseFactor: number
): { repetitions: number; interval: number; easeFactor: number; nextReviewDate: Date } {
  let repetitions = previousRepetitions;
  let interval = previousInterval;
  let easeFactor = previousEaseFactor;

  if (quality < 3) {
    // Incorrect answer (user needs to review it again tomorrow)
    repetitions = 0;
    interval = 1;
  } else {
    // Correct answer
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions++;
  }

  // Update ease factor (min clamp 1.3)
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  // Calculate the next review timestamp (in days)
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    repetitions,
    interval,
    easeFactor,
    nextReviewDate,
  };
}

/**
 * Maps the user-facing string rating to the SM-2 numeric quality score.
 * 
 * - 'again' -> 1 (incorrect, easily reviewable again)
 * - 'hard'  -> 3 (correct, but with serious difficulty)
 * - 'good'  -> 4 (correct, after hesitation)
 * - 'easy'  -> 5 (perfect, no hesitation)
 */
export function mapRatingToQuality(rating: "again" | "hard" | "good" | "easy"): number {
  switch (rating) {
    case "again":
      return 1;
    case "hard":
      return 3;
    case "good":
      return 4;
    case "easy":
      return 5;
    default:
      return 4;
  }
}

/**
 * Calculates a mastery percentage (0-100) from SM-2 metrics.
 */
export function calculateMasteryScore(avgRepetitions: number, avgEaseFactor: number): number {
  const rawMastery = (avgRepetitions * 20) + ((avgEaseFactor - 1.3) * 30);
  return Math.min(Math.max(Math.round(rawMastery), 0), 100);
}

