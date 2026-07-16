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
    <main className="grid-bg h-full overflow-y-auto px-4 py-8 text-[color:var(--text)] transition-colors duration-300 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        
        {/* Header Bar */}
        <header className="glass-card flex items-center justify-between rounded-2xl px-6 py-4 transition-all duration-300">
          <div className="flex items-center gap-2 pl-12 lg:pl-0">
            <BrandMark />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-3xs font-extrabold uppercase tracking-widest text-[color:var(--muted)]">
              Welcome, {firstName}
            </span>
            <ThemeToggle />
          </div>
        </header>

        {/* Welcome Section */}
        <div className="glass-card rounded-3xl p-6 shadow-sm sm:p-8 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-blue-500/5 to-transparent pointer-events-none" />
          <h1 className="text-2xl font-black sm:text-3xl lg:text-4xl">
            Welcome Back, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">{firstName}</span>!
          </h1>
          <p className="mt-2 text-xs font-semibold text-[color:var(--muted)] max-w-lg leading-relaxed">
            Construct optimal study paths, check memory retention with recall assessments, and consult your step-by-step doubt-solving AI tutor.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* Quick Action: New Syllabus Path */}
          <Link
            href="/upload"
            className="glass-card glass-card-hover rounded-2xl p-5 shadow-sm border border-[color:var(--border)]/40 flex flex-col justify-between"
          >
            <div>
              <span className="text-xl">📚</span>
              <h3 className="text-sm font-black mt-3">Personalized Roadmap</h3>
              <p className="text-[10px] font-semibold text-[color:var(--muted)] leading-relaxed mt-1">
                Convert book outlines, syllabus snaps, or lecture texts into step study paths.
              </p>
            </div>
            <span className="text-blue-500 font-extrabold text-[10px] uppercase tracking-wider mt-4 block">
              Decompose Syllabus →
            </span>
          </Link>

          {/* Quick Action: Doubt Solver */}
          <Link
            href="/doubt-solver"
            className="glass-card glass-card-hover rounded-2xl p-5 shadow-sm border border-[color:var(--border)]/40 flex flex-col justify-between"
          >
            <div>
              <span className="text-xl">💬</span>
              <h3 className="text-sm font-black mt-3">Doubt Solving Tutor</h3>
              <p className="text-[10px] font-semibold text-[color:var(--muted)] leading-relaxed mt-1">
                Submit raw questions, equations, or images to get detailed step-by-step guidance.
              </p>
            </div>
            <span className="text-purple-500 font-extrabold text-[10px] uppercase tracking-wider mt-4 block">
              Consult AI Tutor →
            </span>
          </Link>

          {/* Quick Action: Plan details */}
          <Link
            href="/pricing"
            className="glass-card glass-card-hover rounded-2xl p-5 shadow-sm border border-[color:var(--border)]/40 flex flex-col justify-between"
          >
            <div>
              <span className="text-xl">💎</span>
              <h3 className="text-sm font-black mt-3">Plan Subscription</h3>
              <p className="text-[10px] font-semibold text-[color:var(--muted)] leading-relaxed mt-1">
                Upgrade to the Titan tier to remove daily API limits and unlock prior Vision scanning.
              </p>
            </div>
            <span className="text-emerald-500 font-extrabold text-[10px] uppercase tracking-wider mt-4 block">
              View Pricing Tier →
            </span>
          </Link>
        </div>

        {/* Daily Quotas & Recent Activity split */}
        <div className="grid gap-6 md:grid-cols-12">
          
          {/* Usage Limit Tracker Widgets */}
          <div className="md:col-span-5 glass-card rounded-3xl p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-[color:var(--muted)] border-b border-[color:var(--border)]/35 pb-2">
              Today's Usage Quotas
            </h2>

            {usage ? (
              <div className="space-y-4 pt-1">
                {/* 1. Paths Tracker */}
                <div>
                  <div className="flex justify-between text-4xs font-black text-[color:var(--muted)] mb-1 uppercase tracking-wider">
                    <span>Syllabus Paths</span>
                    <span>{usage.usage.learning_path.current} / {usage.usage.learning_path.limit}</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (usage.usage.learning_path.current / usage.usage.learning_path.limit) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* 2. Doubt Solves Tracker */}
                <div>
                  <div className="flex justify-between text-4xs font-black text-[color:var(--muted)] mb-1 uppercase tracking-wider">
                    <span>AI Chat Queries</span>
                    <span>{usage.usage.doubt_message.current} / {usage.usage.doubt_message.limit}</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (usage.usage.doubt_message.current / usage.usage.doubt_message.limit) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* 3. Quiz Tracker */}
                <div>
                  <div className="flex justify-between text-4xs font-black text-[color:var(--muted)] mb-1 uppercase tracking-wider">
                    <span>Practice Quizzes</span>
                    <span>{usage.usage.quiz.current} / {usage.usage.quiz.limit}</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (usage.usage.quiz.current / usage.usage.quiz.limit) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="text-center pt-2">
                  <p className="text-4xs font-semibold text-[color:var(--muted)] uppercase tracking-wider leading-relaxed">
                    Active Plan Tier: <span className="text-[color:var(--text)] font-extrabold">{usage.plan.toUpperCase()}</span>
                  </p>
                  {usage.plan === "free" && (
                    <Link
                      href="/pricing"
                      className="text-4xs font-bold text-blue-500 hover:text-blue-600 block mt-1 hover:underline uppercase tracking-wider"
                    >
                      Upgrade to Pro for Unlimited usage →
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-2xs text-[color:var(--muted)] animate-pulse">
                Loading usage parameters...
              </div>
            )}
          </div>

          {/* Recent History Widget */}
          <div className="md:col-span-7 glass-card rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-[color:var(--muted)] border-b border-[color:var(--border)]/35 pb-2">
                Recent Activity Logs
              </h2>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <span className="h-5 w-5 rounded-full border-2 border-t-blue-500 border-r-transparent animate-spin"></span>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 text-[color:var(--muted)]">
                  <span className="text-2xl block mb-2">🔭</span>
                  <p className="text-2xs font-bold uppercase tracking-wider">Workspace is empty</p>
                  <p className="text-4xs font-semibold mt-1">Start by constructing a learning path outline.</p>
                </div>
              ) : (
                <div className="divide-y divide-[color:var(--border)]/30 max-h-[220px] overflow-y-auto pr-1 mt-1">
                  {history.slice(0, 5).map((item) => {
                    const isPath = item.type === "path";
                    const url = isPath
                      ? `/upload?pathId=${item.id}`
                      : `/doubt-solver?sessionId=${item.id}`;

                    return (
                      <Link
                        key={item.id}
                        href={url}
                        className="flex items-center justify-between py-3 hover:bg-[color:var(--surface-soft)]/20 px-2 rounded-xl transition duration-150 group"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-3">
                          <span className="shrink-0">
                            {isPath ? (
                              <PathProgressIcon size={14} className="text-blue-500" />
                            ) : (
                              <ChatSparkIcon size={14} className="text-purple-500" />
                            )}
                          </span>
                          <span className="text-2xs font-bold truncate group-hover:text-blue-500 transition">
                            {item.title}
                          </span>
                        </div>
                        <span className="text-4xs font-bold text-[color:var(--muted)] uppercase tracking-wider shrink-0">
                          {formatDate(item.date)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {history.length > 5 && (
              <div className="text-center pt-3 border-t border-[color:var(--border)]/30">
                <span className="text-4xs font-bold text-[color:var(--muted)] uppercase tracking-widest">
                  View remaining history in the side navigation menu
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
