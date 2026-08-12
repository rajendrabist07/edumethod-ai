export type AdaptiveTeachingStrategy =
  | "socratic"
  | "direct-explanation"
  | "worked-example"
  | "challenge";

export interface StrategySelectionInput {
  masteryScore?: number | null;
  recentMistakesCount?: number;
  topic?: string | null;
  userPreference?: string | null;
  attemptCount?: number;
  message?: string;
}

export interface StrategyDetails {
  strategy: AdaptiveTeachingStrategy;
  label: string;
  description: string;
  promptInstruction: string;
}

export const STRATEGY_PROMPT_INSTRUCTIONS: Record<AdaptiveTeachingStrategy, StrategyDetails> = {
  socratic: {
    strategy: "socratic",
    label: "Socratic Scaffolding",
    description: "Guides the student with targeted questions step-by-step so they discover the answer themselves.",
    promptInstruction:
      "PEDAGOGICAL PRINCIPLE 1 (STRUGGLE BEFORE SOLUTION): SOCRATIC SCAFFOLDING. Do NOT give direct solutions or complete answers immediately. Instead, ask 1-2 targeted guiding questions or hints to help the student discover the key concept step-by-step.",
  },
  "direct-explanation": {
    strategy: "direct-explanation",
    label: "Direct Plain Explanation",
    description: "The student is struggling with fundamentals or requested direct help. States facts and definitions clearly.",
    promptInstruction:
      "ADAPTIVE TEACHING STRATEGY: DIRECT EXPLANATION. State foundational definitions and facts clearly and plainly first. Avoid circular hints or complex jargon.",
  },
  "worked-example": {
    strategy: "worked-example",
    label: "Step-by-Step Worked Example",
    description: "The student needs procedural clarity. Shows a complete step-by-step worked example.",
    promptInstruction:
      "ADAPTIVE TEACHING STRATEGY: WORKED EXAMPLE. Provide a complete, step-by-step worked example with clear numbered steps demonstrating how to solve this problem.",
  },
  challenge: {
    strategy: "challenge",
    label: "Advanced Challenge & Extension",
    description: "The student has high mastery. Extends concepts and probes deeper edge cases.",
    promptInstruction:
      "ADAPTIVE TEACHING STRATEGY: ADVANCED CHALLENGE. Provide an advanced extension, probe deeper edge cases, or present a high-level conceptual challenge question.",
  },
};

/**
 * Checks if the student's message contains an explicit surrender or direct answer request phrase.
 */
export function isSurrenderOrDirectRequest(message?: string): boolean {
  if (!message) return false;
  const surrenderRegex = /(just tell me|i give up|tell me the answer|direct answer|explain directly|give me the answer|answer directly|solution please|show me the answer)/i;
  return surrenderRegex.test(message);
}

/**
 * Pure-logic, 100% deterministic function that determines the optimal teaching strategy.
 * Enforces Principle 1 (Struggle Before Solution):
 * - Attempt 1 on doubt solver without explicit surrender -> Socratic
 * - Surrender phrase or Attempt >= 2 -> Escalates to direct explanation or worked example based on mastery
 */
export function determineTeachingStrategy(input: StrategySelectionInput): AdaptiveTeachingStrategy {
  const { masteryScore, recentMistakesCount = 0, userPreference, attemptCount, message } = input;

  const userSurrendered = isSurrenderOrDirectRequest(message);

  // 1. Manual User Preference Override
  if (userPreference) {
    const pref = userPreference.toLowerCase();
    if (pref === "socratic") return "socratic";
    if (pref === "direct-explanation" || pref === "concise" || pref === "detailed") return "direct-explanation";
    if (pref === "worked-example") return "worked-example";
    if (pref === "challenge") return "challenge";
  }

  // 2. Principle 1: Struggle Before Solution
  // First attempt on a fresh doubt solver thread MUST be Socratic UNLESS the user explicitly asks for direct help.
  if (attemptCount === 1 && !userSurrendered) {
    return "socratic";
  }

  // 3. High Mastery (>= 80%) + Low Mistakes (<= 1) -> Challenge Mode
  if (masteryScore !== undefined && masteryScore !== null && masteryScore >= 80 && recentMistakesCount <= 1) {
    return "challenge";
  }

  // 4. Low Mastery (< 40%), High Recent Mistakes (>= 3), or Surrendered -> Direct Explanation Mode
  if (userSurrendered || (masteryScore !== undefined && masteryScore !== null && masteryScore < 40) || recentMistakesCount >= 3) {
    return "direct-explanation";
  }

  // 5. Moderate Mastery (40% - 64%) or Attempt >= 2 -> Worked Example Mode
  if ((masteryScore !== undefined && masteryScore !== null && masteryScore >= 40 && masteryScore < 65) || (attemptCount !== undefined && attemptCount >= 2)) {
    return "worked-example";
  }

  // 6. Default Fallback -> Socratic Mode
  return "socratic";
}
