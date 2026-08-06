"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { ThemeToggle } from "../../components/theme-toggle";
import { BrandMark } from "../../components/brand-mark";
import {
  TrendingUp,
  Brain,
  CheckCircle2,
  Clock,
  BarChart3,
  Award,
  Zap,
  Target,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface StrategyPerformanceMetric {
  strategy: string;
  label: string;
  totalAttempted: number;
  correctCount: number;
  correctnessRatePercentage: number;
  avgTimeTakenSeconds: number;
}

interface TopicStrategyBreakdown {
  topic: string;
  bestStrategy: string;
  strategyLabel: string;
  correctnessRatePercentage: number;
  sampleSize: number;
}

interface FlywheelMetrics {
  totalOutcomesTracked: number;
  strategyPerformance: StrategyPerformanceMetric[];
  topicStrategyBreakdown: TopicStrategyBreakdown[];
}

export default function FlywheelDashboardPage() {
  const { user } = useUser();
  const [metrics, setMetrics] = useState<FlywheelMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFlywheelData() {
      try {
        const res = await fetch("/api/flywheel");
        if (res.ok) {
          const data = await res.json();
          setMetrics(data.flywheel);
        } else {
          toast.error("Failed to load flywheel telemetry.");
        }
      } catch (err) {
        console.error("Flywheel data fetch error:", err);
        toast.error("Network error loading flywheel data.");
      } finally {
        setLoading(false);
      }
    }

    void fetchFlywheelData();
  }, []);

  const firstName = user?.firstName || "Student";

  return (
    <main className="grid-bg h-full overflow-y-auto px-4 py-8 text-prism-text transition-colors duration-300 sm:px-6 sm:py-10 lg:px-8 font-sans bg-prism-base">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 animate-focus-lens">
        {/* Header Bar */}
        <header className="glass-prism flex items-center justify-between rounded-2xl px-6 py-4 transition-all duration-300">
          <div className="flex items-center gap-2 pl-12 lg:pl-0">
            <BrandMark />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-3xs font-extrabold uppercase tracking-widest text-prism-muted font-mono">
              Outcome Flywheel • {firstName}
            </span>
            <ThemeToggle />
          </div>
        </header>

        {/* Hero Title Section */}
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-prism-accent">
            <TrendingUp className="h-4 w-4" />
            <span>Empirical Telemetry & Continuous Improvement</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-prism-text sm:text-3xl">
            Outcome Data Flywheel Dashboard
          </h1>
          <p className="text-xs font-medium text-prism-muted leading-relaxed max-w-2xl">
            EduMethod AI continuously tracks quiz outcomes, strategy selection, correctness rates, and response times across topics. This data flywheel enables objective measurement of teaching efficacy over time.
          </p>
        </div>

        {/* Global Flywheel Overview Banner */}
        <div className="glass-card rounded-3xl p-6 border border-prism-accent/30 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-prism-accent/5 via-transparent to-emerald-500/5">
          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-prism-accent/10 text-prism-accent border border-prism-accent/20">
              <BarChart3 className="h-7 w-7" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-widest text-prism-accent flex items-center gap-2">
                <span>Outcome Flywheel Data Engine</span>
                <span className="px-2 py-0.5 rounded-full text-4xs font-mono bg-prism-accent/20 text-prism-accent">COLLECTING TELEMETRY</span>
              </span>
              <h2 className="text-lg font-black tracking-tight text-prism-text sm:text-xl mt-0.5">
                Strategy Efficacy Measurement
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-6 font-mono shrink-0">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-prism-accent">
                {metrics?.totalOutcomesTracked ?? 0}
              </span>
              <span className="text-4xs font-bold text-prism-muted uppercase tracking-wider">Outcomes Tracked</span>
            </div>
            <div className="h-8 w-px bg-prism-border/50" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {metrics?.strategyPerformance && metrics.strategyPerformance.length > 0
                  ? Math.round(
                      metrics.strategyPerformance.reduce((acc, curr) => acc + curr.correctnessRatePercentage, 0) /
                        metrics.strategyPerformance.length
                    )
                  : 0}%
              </span>
              <span className="text-4xs font-bold text-prism-muted uppercase tracking-wider">Avg Correctness Rate</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="h-8 w-8 rounded-full border-3 border-t-prism-accent border-r-transparent animate-spin" />
            <p className="text-xs font-bold text-prism-muted">Aggregating outcome flywheel telemetry...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Strategy Performance Matrix */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-prism-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-prism-accent" />
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-prism-text">
                    Teaching Strategy Performance Matrix
                  </h2>
                </div>
                <span className="text-3xs font-mono font-bold text-prism-muted uppercase">
                  Aggregated Across Student Quizzes
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {(metrics?.strategyPerformance || []).map((s) => {
                  let badgeBg = "bg-amber-500/10 text-amber-600 border-amber-500/20";
                  let barBg = "bg-amber-500";
                  if (s.correctnessRatePercentage >= 75) {
                    badgeBg = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
                    barBg = "bg-emerald-500";
                  } else if (s.correctnessRatePercentage >= 50) {
                    badgeBg = "bg-blue-500/10 text-blue-600 border-blue-500/20";
                    barBg = "bg-blue-500";
                  }

                  return (
                    <div
                      key={s.strategy}
                      className="glass-card rounded-2xl p-5 border border-prism-border shadow-xs flex flex-col justify-between gap-4"
                    >
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-black text-prism-text truncate">{s.label}</span>
                        <span className="text-4xs font-mono text-prism-muted uppercase">{s.strategy}</span>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-baseline font-mono">
                          <span className="text-2xl font-black text-prism-text">
                            {s.correctnessRatePercentage}%
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-4xs font-bold border ${badgeBg}`}>
                            {s.correctnessRatePercentage >= 75 ? "High Efficacy" : "Active Data"}
                          </span>
                        </div>

                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${barBg} rounded-full transition-all duration-500`}
                            style={{ width: `${s.correctnessRatePercentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-4xs font-mono text-prism-muted pt-2 border-t border-prism-border/40">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          {s.correctCount}/{s.totalAttempted} Correct
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-blue-500" />
                          {s.avgTimeTakenSeconds}s avg
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Best Strategy per Topic Breakdown */}
            <div className="glass-card rounded-2xl p-6 border border-prism-border shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-prism-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-prism-text">
                    Best Performing Strategy per Topic Breakdown
                  </h2>
                </div>
                <span className="text-3xs font-mono font-bold text-prism-muted uppercase">
                  Empirical Selection Insights
                </span>
              </div>

              {!metrics?.topicStrategyBreakdown || metrics.topicStrategyBreakdown.length === 0 ? (
                <div className="py-8 text-center flex flex-col items-center gap-2">
                  <Sparkles className="h-6 w-6 text-prism-muted/50" />
                  <p className="text-xs font-bold text-prism-text">No topic breakdown data logged yet</p>
                  <p className="text-4xs font-medium text-prism-muted max-w-sm">
                    Complete quizzes across different subjects to build topic-level strategy efficacy models.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {metrics.topicStrategyBreakdown.map((t) => (
                    <div
                      key={t.topic}
                      className="p-4 rounded-xl border border-prism-border/50 bg-prism-surface/50 flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-black text-prism-text truncate">{t.topic}</span>
                        <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                          {t.correctnessRatePercentage}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-4xs font-mono text-prism-accent">
                        <Zap className="h-3 w-3 shrink-0" />
                        <span className="font-bold truncate">Best: {t.strategyLabel}</span>
                      </div>
                      <span className="text-4xs font-mono text-prism-muted">
                        Sample size: {t.sampleSize} question attempts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
