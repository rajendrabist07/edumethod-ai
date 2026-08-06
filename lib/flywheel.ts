import { supabaseAdmin } from "@/lib/supabase-admin";
import { AdaptiveTeachingStrategy, STRATEGY_PROMPT_INSTRUCTIONS } from "@/lib/ai/adaptive-strategy";

export interface QuizOutcomeLogInput {
  userId: string;
  quizId: string;
  questionIndex: number;
  topic: string;
  strategyUsed: AdaptiveTeachingStrategy;
  isCorrect: boolean;
  timeTakenSeconds?: number;
}

export interface StrategyPerformanceMetric {
  strategy: AdaptiveTeachingStrategy;
  label: string;
  totalAttempted: number;
  correctCount: number;
  correctnessRatePercentage: number;
  avgTimeTakenSeconds: number;
}

export interface TopicStrategyBreakdown {
  topic: string;
  bestStrategy: AdaptiveTeachingStrategy;
  strategyLabel: string;
  correctnessRatePercentage: number;
  sampleSize: number;
}

export interface FlywheelMetrics {
  totalOutcomesTracked: number;
  strategyPerformance: StrategyPerformanceMetric[];
  topicStrategyBreakdown: TopicStrategyBreakdown[];
}

/**
 * Persists a quiz question outcome log into Supabase.
 */
export async function logQuizOutcome(input: QuizOutcomeLogInput): Promise<void> {
  try {
    await supabaseAdmin.from("quiz_outcome_logs").insert({
      user_id: input.userId,
      quiz_id: input.quizId,
      question_index: input.questionIndex,
      topic: input.topic,
      strategy_used: input.strategyUsed,
      is_correct: input.isCorrect,
      time_taken_seconds: input.timeTakenSeconds || 0,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to log quiz outcome:", err);
  }
}

/**
 * Pure-logic deterministic helper calculating correctness rates and metrics from raw logs.
 */
export function calculateStrategyMetrics(
  logs: Array<{
    strategy_used: string;
    is_correct: boolean;
    time_taken_seconds?: number;
    topic?: string;
  }>
): {
  totalCount: number;
  performance: StrategyPerformanceMetric[];
} {
  const strategies: AdaptiveTeachingStrategy[] = [
    "socratic",
    "direct-explanation",
    "worked-example",
    "challenge",
  ];

  const statsMap = new Map<
    AdaptiveTeachingStrategy,
    { total: number; correct: number; totalTime: number }
  >();

  strategies.forEach((s) => statsMap.set(s, { total: 0, correct: 0, totalTime: 0 }));

  let totalCount = 0;

  for (const log of logs) {
    const s = log.strategy_used as AdaptiveTeachingStrategy;
    if (statsMap.has(s)) {
      totalCount++;
      const current = statsMap.get(s)!;
      current.total++;
      if (log.is_correct) current.correct++;
      current.totalTime += log.time_taken_seconds || 0;
    }
  }

  const performance: StrategyPerformanceMetric[] = strategies.map((s) => {
    const data = statsMap.get(s)!;
    const info = STRATEGY_PROMPT_INSTRUCTIONS[s];
    const rate = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
    const avgTime = data.total > 0 ? Math.round(data.totalTime / data.total) : 0;

    return {
      strategy: s,
      label: info?.label || s,
      totalAttempted: data.total,
      correctCount: data.correct,
      correctnessRatePercentage: rate,
      avgTimeTakenSeconds: avgTime,
    };
  });

  return { totalCount, performance };
}

/**
 * Retrieves outcome flywheel metrics aggregated across all student quiz responses.
 */
export async function getOutcomeFlywheelMetrics(userId?: string): Promise<FlywheelMetrics> {
  try {
    let query = supabaseAdmin
      .from("quiz_outcome_logs")
      .select("strategy_used, is_correct, time_taken_seconds, topic");

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: logs, error } = await query;

    if (error || !logs || logs.length === 0) {
      const emptyPerformance: StrategyPerformanceMetric[] = (
        ["socratic", "direct-explanation", "worked-example", "challenge"] as AdaptiveTeachingStrategy[]
      ).map((s) => ({
        strategy: s,
        label: STRATEGY_PROMPT_INSTRUCTIONS[s]?.label || s,
        totalAttempted: 0,
        correctCount: 0,
        correctnessRatePercentage: 0,
        avgTimeTakenSeconds: 0,
      }));

      return {
        totalOutcomesTracked: 0,
        strategyPerformance: emptyPerformance,
        topicStrategyBreakdown: [],
      };
    }

    const { totalCount, performance } = calculateStrategyMetrics(logs);

    // Group by topic to find the best strategy per topic
    const topicGroupMap = new Map<
      string,
      Map<AdaptiveTeachingStrategy, { total: number; correct: number }>
    >();

    for (const log of logs) {
      const topic = log.topic || "General";
      const strat = log.strategy_used as AdaptiveTeachingStrategy;

      if (!topicGroupMap.has(topic)) {
        topicGroupMap.set(topic, new Map());
      }
      const stratMap = topicGroupMap.get(topic)!;
      if (!stratMap.has(strat)) {
        stratMap.set(strat, { total: 0, correct: 0 });
      }
      const stats = stratMap.get(strat)!;
      stats.total++;
      if (log.is_correct) stats.correct++;
    }

    const topicBreakdown: TopicStrategyBreakdown[] = [];

    topicGroupMap.forEach((stratMap, topic) => {
      let bestStrat: AdaptiveTeachingStrategy = "socratic";
      let bestRate = -1;
      let totalSample = 0;

      stratMap.forEach((stats, strat) => {
        totalSample += stats.total;
        const rate = stats.total > 0 ? stats.correct / stats.total : 0;
        if (rate > bestRate) {
          bestRate = rate;
          bestStrat = strat;
        }
      });

      topicBreakdown.push({
        topic,
        bestStrategy: bestStrat,
        strategyLabel: STRATEGY_PROMPT_INSTRUCTIONS[bestStrat]?.label || bestStrat,
        correctnessRatePercentage: Math.round(bestRate * 100),
        sampleSize: totalSample,
      });
    });

    return {
      totalOutcomesTracked: totalCount,
      strategyPerformance: performance,
      topicStrategyBreakdown: topicBreakdown.slice(0, 6),
    };
  } catch (err) {
    console.error("Error retrieving flywheel metrics:", err);
    return {
      totalOutcomesTracked: 0,
      strategyPerformance: [],
      topicStrategyBreakdown: [],
    };
  }
}
