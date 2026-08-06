import { describe, it, expect } from "vitest";
import { calculateStrategyMetrics } from "../flywheel";

describe("Outcome Data Flywheel Analytics Engine", () => {
  it("should calculate correct strategy performance metrics", () => {
    const logs = [
      { strategy_used: "socratic", is_correct: true, time_taken_seconds: 10 },
      { strategy_used: "socratic", is_correct: true, time_taken_seconds: 20 },
      { strategy_used: "socratic", is_correct: false, time_taken_seconds: 30 },
      { strategy_used: "direct-explanation", is_correct: true, time_taken_seconds: 15 },
      { strategy_used: "direct-explanation", is_correct: false, time_taken_seconds: 25 },
    ];

    const { totalCount, performance } = calculateStrategyMetrics(logs);

    expect(totalCount).toBe(5);

    const socraticMetric = performance.find((p) => p.strategy === "socratic");
    expect(socraticMetric).toBeDefined();
    expect(socraticMetric?.totalAttempted).toBe(3);
    expect(socraticMetric?.correctCount).toBe(2);
    expect(socraticMetric?.correctnessRatePercentage).toBe(67); // 2/3 = 66.6% -> 67%
    expect(socraticMetric?.avgTimeTakenSeconds).toBe(20); // (10+20+30)/3 = 20s

    const directMetric = performance.find((p) => p.strategy === "direct-explanation");
    expect(directMetric).toBeDefined();
    expect(directMetric?.totalAttempted).toBe(2);
    expect(directMetric?.correctCount).toBe(1);
    expect(directMetric?.correctnessRatePercentage).toBe(50); // 1/2 = 50%
    expect(directMetric?.avgTimeTakenSeconds).toBe(20);
  });

  it("should handle empty log datasets gracefully", () => {
    const { totalCount, performance } = calculateStrategyMetrics([]);
    expect(totalCount).toBe(0);
    expect(performance).toHaveLength(4);
    performance.forEach((p) => {
      expect(p.correctnessRatePercentage).toBe(0);
      expect(p.totalAttempted).toBe(0);
    });
  });
});
