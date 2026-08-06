import { describe, it, expect } from "vitest";
import { determineTeachingStrategy, STRATEGY_PROMPT_INSTRUCTIONS } from "../ai/adaptive-strategy";

describe("Deterministic Adaptive Teaching Strategy Selector", () => {
  it("should select 'challenge' for high mastery (>= 80%) with few mistakes", () => {
    const strategy = determineTeachingStrategy({
      masteryScore: 85,
      recentMistakesCount: 0,
    });
    expect(strategy).toBe("challenge");
  });

  it("should select 'direct-explanation' for low mastery (< 40%)", () => {
    const strategy = determineTeachingStrategy({
      masteryScore: 35,
      recentMistakesCount: 1,
    });
    expect(strategy).toBe("direct-explanation");
  });

  it("should select 'direct-explanation' when recent mistakes count is >= 3 regardless of mastery", () => {
    const strategy = determineTeachingStrategy({
      masteryScore: 70,
      recentMistakesCount: 3,
    });
    expect(strategy).toBe("direct-explanation");
  });

  it("should select 'worked-example' for moderate mastery (40% - 64%)", () => {
    const strategy = determineTeachingStrategy({
      masteryScore: 50,
      recentMistakesCount: 1,
    });
    expect(strategy).toBe("worked-example");
  });

  it("should select 'socratic' for target mastery (65% - 79%)", () => {
    const strategy = determineTeachingStrategy({
      masteryScore: 72,
      recentMistakesCount: 1,
    });
    expect(strategy).toBe("socratic");
  });

  it("should respect manual user preference overrides", () => {
    expect(determineTeachingStrategy({ userPreference: "challenge", masteryScore: 20 })).toBe("challenge");
    expect(determineTeachingStrategy({ userPreference: "socratic", masteryScore: 90 })).toBe("socratic");
  });

  it("should return valid prompt instructions for all strategies", () => {
    expect(STRATEGY_PROMPT_INSTRUCTIONS.socratic.promptInstruction).toContain("SOCRATIC SCAFFOLDING");
    expect(STRATEGY_PROMPT_INSTRUCTIONS["direct-explanation"].promptInstruction).toContain("DIRECT EXPLANATION");
    expect(STRATEGY_PROMPT_INSTRUCTIONS["worked-example"].promptInstruction).toContain("WORKED EXAMPLE");
    expect(STRATEGY_PROMPT_INSTRUCTIONS.challenge.promptInstruction).toContain("ADVANCED CHALLENGE");
  });
});
