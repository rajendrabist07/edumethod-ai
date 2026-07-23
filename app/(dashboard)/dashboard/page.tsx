"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { ThemeToggle } from "../../components/theme-toggle";
import { BrandMark } from "../../components/brand-mark";
import { PathProgressIcon } from "@/components/icons/PathProgressIcon";
import { ChatSparkIcon } from "@/components/icons/ChatSparkIcon";
import { QuizTargetIcon } from "@/components/icons/QuizTargetIcon";

interface UsageLimits {
  plan: "free" | "pro";
  usage: {
    learning_path: { current: number; limit: number };
    doubt_message: { current: number; limit: number };
    quiz: { current: number; limit: number };
  };
}

interface HistoryItem {
  id: string;
  type: "path" | "doubt";
  title: string;
  date: string;
}

export default function DashboardPage() {
  const { user } = useUser();
  const [usage, setUsage] = useState<UsageLimits | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [masteryData, setMasteryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      // Fetch plan usage limits
      const usageRes = await fetch("/api/usage");
      if (usageRes.ok) {
        const usageData = await usageRes.json();
        setUsage(usageData);
      }

      // Fetch history listing
      const historyRes = await fetch("/api/history");
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData.history || []);
      }

      // Fetch mastery scoring data
      const masteryRes = await fetch("/api/mastery");
      if (masteryRes.ok) {
        const masteryJson = await masteryRes.json();
        setMasteryData(masteryJson.topics || []);
      }
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  // Helper for date formatting
  function formatDate(dateString: string) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Recent";
    }
  }

  const firstName = user?.firstName || "Student";

  return (
    <main className="grid-bg h-full overflow-y-auto px-4 py-8 text-prism-text transition-colors duration-300 sm:px-6 sm:py-10 lg:px-8 font-sans bg-prism-base">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 animate-focus-lens">
        
        {/* Header Bar */}
        <header className="glass-prism flex items-center justify-between rounded-2xl px-6 py-4 transition-all duration-300">
          <div className="flex items-center gap-2 pl-12 lg:pl-0">
            <BrandMark />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-3xs font-extrabold uppercase tracking-widest text-prism-muted font-mono">
              Welcome, {firstName}
            </span>
            <ThemeToggle />
          </div>
        </header>

        {/* Welcome Section */}
        <div className="glass-prism rounded-3xl p-6 shadow-sm sm:p-8 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-prism-accent/5 to-transparent pointer-events-none" />
          <h1 className="text-2xl font-black sm:text-3xl lg:text-4xl font-display">
            Welcome Back, <span className="bg-gradient-to-r from-prism-accent to-blue-400 bg-clip-text text-transparent">{firstName}</span>!
          </h1>
          <p className="mt-2 text-xs font-semibold text-prism-muted max-w-lg leading-relaxed">
            Construct optimal study paths, check memory retention with recall assessments, and consult your step-by-step doubt-solving AI tutor.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* Quick Action: New Syllabus Path */}
          <Link
            href="/upload"
            className="glass-prism rounded-2xl p-5 shadow-sm border border-prism-border flex flex-col justify-between hover:border-prism-accent/40 hover:shadow-lg transition duration-300 hover:-translate-y-0.5"
          >
            <div>
              <span className="text-xl">📚</span>
              <h3 className="text-sm font-black mt-3 font-display">Personalized Roadmap</h3>
              <p className="text-[10px] font-semibold text-prism-muted leading-relaxed mt-1">
                Convert book outlines, syllabus snaps, or lecture texts into step study paths.
              </p>
            </div>
            <span className="text-prism-accent font-extrabold text-[10px] uppercase tracking-wider mt-4 block font-mono">
              Decompose Syllabus →
            </span>
          </Link>

          {/* Quick Action: Doubt Solver */}
          <Link
            href="/doubt-solver"
            className="glass-prism rounded-2xl p-5 shadow-sm border border-prism-border flex flex-col justify-between hover:border-prism-accent/40 hover:shadow-lg transition duration-300 hover:-translate-y-0.5"
          >
            <div>
              <span className="text-xl">💬</span>
              <h3 className="text-sm font-black mt-3 font-display">Doubt Solving Tutor</h3>
              <p className="text-[10px] font-semibold text-prism-muted leading-relaxed mt-1">
                Submit raw questions, equations, or images to get detailed step-by-step guidance.
              </p>
            </div>
            <span className="text-indigo-400 font-extrabold text-[10px] uppercase tracking-wider mt-4 block font-mono">
              Consult AI Tutor →
            </span>
          </Link>

          {/* Quick Action: Plan details */}
          <Link
            href="/pricing"
            className="glass-prism rounded-2xl p-5 shadow-sm border border-prism-border flex flex-col justify-between hover:border-prism-accent/40 hover:shadow-lg transition duration-300 hover:-translate-y-0.5"
          >
            <div>
              <span className="text-xl">💎</span>
              <h3 className="text-sm font-black mt-3 font-display">Plan Subscription</h3>
              <p className="text-[10px] font-semibold text-prism-muted leading-relaxed mt-1">
                Upgrade to the Titan tier to remove daily API limits and unlock prior Vision scanning.
              </p>
            </div>
            <span className="text-prism-warm font-extrabold text-[10px] uppercase tracking-wider mt-4 block font-mono">
              View Pricing Tier →
            </span>
          </Link>
        </div>

        {/* Daily Quotas & Recent Activity split */}
        <div className="grid gap-6 md:grid-cols-12">
          
          {/* Usage Limit Tracker Widgets */}
          <div className="md:col-span-5 glass-prism rounded-3xl p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-prism-muted border-b border-prism-border pb-2 font-display">
              Today's Usage Quotas
            </h2>

            {usage ? (
              <div className="space-y-4 pt-1">
                {/* 1. Paths Tracker */}
                <div>
                  <div className="flex justify-between text-4xs font-black text-prism-muted mb-1 uppercase tracking-wider font-mono">
                    <span>Syllabus Paths</span>
                    <span>{usage.usage.learning_path.current} / {usage.usage.learning_path.limit}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-prism-accent rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (usage.usage.learning_path.current / usage.usage.learning_path.limit) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* 2. Doubt Solves Tracker */}
                <div>
                  <div className="flex justify-between text-4xs font-black text-prism-muted mb-1 uppercase tracking-wider font-mono">
                    <span>AI Chat Queries</span>
                    <span>{usage.usage.doubt_message.current} / {usage.usage.doubt_message.limit}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (usage.usage.doubt_message.current / usage.usage.doubt_message.limit) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* 3. Quiz Tracker */}
                <div>
                  <div className="flex justify-between text-4xs font-black text-prism-muted mb-1 uppercase tracking-wider font-mono">
                    <span>Practice Quizzes</span>
                    <span>{usage.usage.quiz.current} / {usage.usage.quiz.limit}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-prism-warm rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (usage.usage.quiz.current / usage.usage.quiz.limit) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="text-center pt-2">
                  <p className="text-4xs font-semibold text-prism-muted uppercase tracking-wider leading-relaxed font-mono">
                    Active Plan Tier: <span className="text-prism-text font-extrabold">{usage.plan.toUpperCase()}</span>
                  </p>
                  {usage.plan === "free" && (
                    <Link
                      href="/pricing"
                      className="text-4xs font-bold text-prism-accent hover:text-prism-accent/80 block mt-1 hover:underline uppercase tracking-wider font-mono"
                    >
                      Upgrade to Pro for Unlimited usage →
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-2xs text-prism-muted animate-pulse font-mono">
                Loading usage parameters...
              </div>
            )}
          </div>

          {/* Recent History Widget */}
          <div className="md:col-span-7 glass-prism rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-prism-muted border-b border-prism-border pb-2 font-display">
                Recent Activity Logs
              </h2>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <span className="h-5 w-5 rounded-full border-2 border-t-prism-accent border-r-transparent animate-spin"></span>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 text-prism-muted">
                  <span className="text-2xl block mb-2">🔭</span>
                  <p className="text-2xs font-bold uppercase tracking-wider font-mono">Workspace is empty</p>
                  <p className="text-4xs font-semibold mt-1">Start by constructing a learning path outline.</p>
                </div>
              ) : (
                <div className="divide-y divide-prism-border/40 max-h-[220px] overflow-y-auto pr-1 mt-1">
                  {history.slice(0, 5).map((item) => {
                    const isPath = item.type === "path";
                    const url = isPath
                      ? `/upload?pathId=${item.id}`
                      : `/doubt-solver?sessionId=${item.id}`;

                    return (
                      <Link
                        key={item.id}
                        href={url}
                        className="flex items-center justify-between py-3 hover:bg-white/5 px-2 rounded-xl transition duration-150 group"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-3">
                          <span className="shrink-0">
                            {isPath ? (
                              <PathProgressIcon size={14} className="text-prism-accent" />
                            ) : (
                              <ChatSparkIcon size={14} className="text-indigo-400" />
                            )}
                          </span>
                          <span className="text-2xs font-bold truncate group-hover:text-prism-accent transition">
                            {item.title}
                          </span>
                        </div>
                        <span className="text-4xs font-bold text-prism-muted uppercase tracking-wider shrink-0 font-mono">
                          {formatDate(item.date)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {history.length > 5 && (
              <div className="text-center pt-3 border-t border-prism-border/40">
                <span className="text-4xs font-bold text-prism-muted uppercase tracking-widest font-mono">
                  View remaining history in the side navigation menu
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Analytics & Mastery Dashboard */}
        <div className="glass-prism rounded-3xl p-6 shadow-sm border border-prism-border">
          <h2 className="text-xs font-black uppercase tracking-widest text-prism-muted border-b border-prism-border pb-2 font-display">
            🧠 Spaced Repetition & Topic Mastery Dashboard
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="h-5 w-5 rounded-full border-2 border-t-prism-accent border-r-transparent animate-spin"></span>
            </div>
          ) : masteryData.length === 0 ? (
            <div className="text-center py-10 text-prism-muted">
              <span className="text-2xl block mb-2">🎓</span>
              <p className="text-2xs font-bold uppercase tracking-wider font-mono">No mastery data available yet</p>
              <p className="text-4xs font-semibold mt-1">Generate a flashcard deck and review cards to see your topic mastery grow!</p>
            </div>
          ) : (
            <div className="mt-4 space-y-6">
              {/* Mastery Heatmap / Progress list */}
              <div className="grid gap-4 sm:grid-cols-2">
                {masteryData.map((t, idx) => {
                  const getMasteryColor = (pct: number) => {
                    if (pct < 40) return "text-red-400 bg-red-500/10 border-red-500/20";
                    if (pct < 75) return "text-prism-warm bg-prism-warm/10 border-prism-warm/20";
                    return "text-prism-accent bg-prism-accent/10 border-prism-accent/20";
                  };

                  const getMasteryBarColor = (pct: number) => {
                    if (pct < 40) return "bg-red-500";
                    if (pct < 75) return "bg-prism-warm";
                    return "bg-prism-accent";
                  };

                  return (
                    <div key={idx} className="glass-prism p-4 rounded-xl border border-prism-border flex flex-col justify-between hover:border-prism-accent/30 transition">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[9px] font-bold text-prism-accent uppercase tracking-wide truncate block font-mono">{t.subject}</span>
                          <h4 className="text-2xs font-black mt-1 leading-snug truncate font-display">{t.topic}</h4>
                        </div>
                        <span className={`text-4xs font-extrabold px-2 py-0.5 rounded-full border shrink-0 font-mono ${getMasteryColor(t.mastery)}`}>
                          {t.mastery}%
                        </span>
                      </div>
                      
                      <div className="mt-4">
                        <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getMasteryBarColor(t.mastery)}`}
                            style={{ width: `${t.mastery}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center mt-2 text-[8px] font-semibold text-prism-muted font-mono">
                          <span>{t.totalCards} Flashcards</span>
                          <span>
                            {t.nextReview ? `Next: ${new Date(t.nextReview).toLocaleDateString()}` : "Completed"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Weak-Topic Alert Notification */}
              {masteryData.some(t => t.mastery < 60) && (
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 flex items-start gap-3">
                  <span className="text-base shrink-0">⚠️</span>
                  <div>
                    <h4 className="text-3xs font-black text-red-500 uppercase tracking-wide font-display">Attention: Weak Topics Found</h4>
                    <p className="text-[10px] font-medium text-prism-muted mt-0.5 leading-relaxed">
                      Your mastery score in some topics is below 60%. We recommend generating more quiz questions or reviewing flashcards for:{" "}
                      <span className="font-bold text-prism-text font-mono">
                        {masteryData.filter(t => t.mastery < 60).map(t => t.topic).join(", ")}
                      </span>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
