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
      "MANDATORY ADAPTIVE TEACHING STRATEGY: SOCRATIC SCAFFOLDING. Do NOT give direct solutions or answers immediately. Instead, ask 1-2 targeted guiding questions to help the student discover the key concept step-by-step.",
  },
  "direct-explanation": {
    strategy: "direct-explanation",
    label: "Direct Plain Explanation",
    description: "The student is struggling with fundamentals. States facts and definitions clearly and plainly.",
    promptInstruction:
      "MANDATORY ADAPTIVE TEACHING STRATEGY: DIRECT EXPLANATION. The student is currently struggling with core concepts. State foundational definitions and facts clearly and plainly first. Avoid circular hints or complex jargon.",
  },
  "worked-example": {
    strategy: "worked-example",
    label: "Step-by-Step Worked Example",
    description: "The student needs procedural clarity. Shows a complete step-by-step worked example.",
    promptInstruction:
      "MANDATORY ADAPTIVE TEACHING STRATEGY: WORKED EXAMPLE. The student needs to see the exact procedure. Provide a complete, step-by-step worked example with clear numbered steps demonstrating how to solve this problem.",
  },
  challenge: {
    strategy: "challenge",
    label: "Advanced Challenge & Extension",
    description: "The student has high mastery. Extends concepts and probes deeper edge cases.",
    promptInstruction:
      "MANDATORY ADAPTIVE TEACHING STRATEGY: ADVANCED CHALLENGE. The student has already achieved high mastery. Provide an advanced extension, probe deeper edge cases, or present a high-level conceptual challenge question.",
  },
};

/**
 * Pure-logic, 100% deterministic function (no AI call) that determines the optimal teaching strategy
 * based on mastery score, recent mistake count, and user preferences.
 */
export function determineTeachingStrategy(input: StrategySelectionInput): AdaptiveTeachingStrategy {
  const { masteryScore, recentMistakesCount = 0, userPreference } = input;

  // 1. Manual User Preference Override
  if (userPreference) {
    const pref = userPreference.toLowerCase();
    if (pref === "socratic") return "socratic";
    if (pref === "direct-explanation" || pref === "concise" || pref === "detailed") return "direct-explanation";
    if (pref === "worked-example") return "worked-example";
    if (pref === "challenge") return "challenge";
  }

  // 2. High Mastery (>= 80%) + Low Mistakes (<= 1) -> Challenge Mode
  if (masteryScore !== undefined && masteryScore !== null && masteryScore >= 80 && recentMistakesCount <= 1) {
    return "challenge";
  }

  // 3. Low Mastery (< 40%) OR High Recent Mistakes (>= 3) -> Direct Explanation Mode
  if ((masteryScore !== undefined && masteryScore !== null && masteryScore < 40) || recentMistakesCount >= 3) {
    return "direct-explanation";
  }

  // 4. Moderate Mastery (40% - 64%) -> Worked Example Mode
  if (masteryScore !== undefined && masteryScore !== null && masteryScore >= 40 && masteryScore < 65) {
    return "worked-example";
  }

  // 5. Target Mastery (65% - 79%) OR Default Fallback -> Socratic Mode
  return "socratic";
}
