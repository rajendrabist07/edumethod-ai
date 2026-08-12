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

/**
 * PEDAGOGICAL PRINCIPLE 5: Interleaved, Not Blocked, Practice.
 * Round-robin merges study/flashcard items across multiple active topics
 * to maximize long-term retention over blocked practice.
 */
export function interleaveStudyItems<T extends { topic?: string; subject?: string }>(items: T[]): T[] {
  if (!items || items.length <= 1) return items;

  // Group items by topic/subject key
  const topicMap = new Map<string, T[]>();
  items.forEach((item) => {
    const key = (item.topic || item.subject || "General").trim().toLowerCase();
    if (!topicMap.has(key)) {
      topicMap.set(key, []);
    }
    topicMap.get(key)!.push(item);
  });

  // If only 1 active topic, return original items
  if (topicMap.size <= 1) return items;

  const topicArrays = Array.from(topicMap.values());
  const interleaved: T[] = [];
  let maxLen = 0;
  topicArrays.forEach((arr) => {
    if (arr.length > maxLen) maxLen = arr.length;
  });

  for (let i = 0; i < maxLen; i++) {
    for (const arr of topicArrays) {
      if (i < arr.length) {
        interleaved.push(arr[i]);
      }
    }
  }

  return interleaved;
}

/**
 * PEDAGOGICAL PRINCIPLE 2: Retrieval Before Review.
 * Evaluates active text recall input prior to revealing card/answer details.
 */
export function verifyRetrievalBeforeReview(input: {
  recalledText?: string;
  cardAnswer: string;
}): { attempted: boolean; similarityScore: number; passed: boolean } {
  const { recalledText, cardAnswer } = input;
  if (!recalledText || recalledText.trim().length === 0) {
    return { attempted: false, similarityScore: 0, passed: false };
  }

  const cleanRecall = recalledText.trim().toLowerCase();
  const cleanAnswer = cardAnswer.trim().toLowerCase();

  // Simple token overlap metric for active recall
  const recallTokens = new Set(cleanRecall.split(/\s+/).filter((w) => w.length > 2));
  const answerTokens = cleanAnswer.split(/\s+/).filter((w) => w.length > 2);

  if (answerTokens.length === 0) {
    return { attempted: true, similarityScore: 100, passed: true };
  }

  let matches = 0;
  answerTokens.forEach((token) => {
    if (recallTokens.has(token)) matches++;
  });

  const score = Math.round((matches / answerTokens.length) * 100);
  return {
    attempted: true,
    similarityScore: score,
    passed: score >= 40 || cleanAnswer.includes(cleanRecall) || cleanRecall.includes(cleanAnswer),
  };
}

