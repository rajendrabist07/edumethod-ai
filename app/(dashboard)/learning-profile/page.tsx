"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { ThemeToggle } from "../../components/theme-toggle";
import { BrandMark } from "../../components/brand-mark";
import {
  Brain,
  Clock,
  Target,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  UserCheck,
  Zap,
  Info,
} from "lucide-react";
import { toast } from "sonner";

interface RecentMistake {
  topic: string;
  question: string;
  studentAnswer: string;
  correctAnswer: string;
  misconception: string;
  timestamp: string;
}

type ExplanationStyle = "socratic" | "concise" | "detailed" | "conversational" | "balanced";

interface LearnerProfile {
  user_id: string;
  mastery_scores: Record<string, number>;
  recent_mistakes: RecentMistake[];
  preferred_explanation_style: ExplanationStyle;
  study_times: Record<string, number>;
  updated_at: string;
}

const STYLE_DESCRIPTIONS: Record<ExplanationStyle, { label: string; desc: string; icon: string }> = {
  socratic: {
    label: "Socratic Scaffolding",
    desc: "Guides you with targeted questions rather than giving direct answers immediately.",
    icon: "🧠",
  },
  concise: {
    label: "Concise & Fast",
    desc: "Provides punchy, to-the-point answers with minimal extra theory.",
    icon: "⚡",
  },
  detailed: {
    label: "Deep & Thorough",
    desc: "Gives senior-level step-by-step breakdowns, edge cases, and theory checks.",
    icon: "📖",
  },
  conversational: {
    label: "Conversational Voice",
    desc: "Uses smooth, natural plain-text dialogue tuned for reading out loud.",
    icon: "💬",
  },
  balanced: {
    label: "Balanced Tutor",
    desc: "Harmoniously balances conceptual clarity, step-by-step math, and practice checkpoints.",
    icon: "⚖️",
  },
};

export default function LearningProfilePage() {
  const { user } = useUser();
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStyle, setUpdatingStyle] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/learner-profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        } else {
          toast.error("Failed to load your learning profile.");
        }
      } catch (err) {
        console.error("Error loading learner profile:", err);
        toast.error("Network error loading learner profile.");
      } finally {
        setLoading(false);
      }
    }

    void fetchProfile();
  }, []);

  async function handleStyleChange(newStyle: ExplanationStyle) {
    if (!profile || profile.preferred_explanation_style === newStyle) return;
    setUpdatingStyle(true);
    try {
      const res = await fetch("/api/learner-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferred_explanation_style: newStyle }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        toast.success(`Explanation style updated to ${STYLE_DESCRIPTIONS[newStyle].label}!`);
      } else {
        toast.error("Failed to update explanation style.");
      }
    } catch {
      toast.error("Network error updating preference.");
    } finally {
      setUpdatingStyle(false);
    }
  }

  function formatTime(seconds: number): string {
    if (!seconds || seconds <= 0) return "0 mins";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} mins`;
  }

  const firstName = user?.firstName || "Student";
  const masteryEntries = Object.entries(profile?.mastery_scores || {});
  const studyTimeEntries = Object.entries(profile?.study_times || {});
  const mistakes = profile?.recent_mistakes || [];

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
              Learner Memory • {firstName}
            </span>
            <ThemeToggle />
          </div>
        </header>

        {/* Hero Title Section */}
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-prism-accent">
            <Brain className="h-4 w-4" />
            <span>Persistent Memory & System Trust</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-prism-text sm:text-3xl">
            Your Personalized Learning Profile
          </h1>
          <p className="text-xs font-medium text-prism-muted leading-relaxed max-w-2xl">
            EduMethod AI automatically remembers your topic mastery, study duration, past mistakes, and preferred explanation style across all doubt-solving and quiz interactions.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="h-8 w-8 rounded-full border-3 border-t-prism-accent border-r-transparent animate-spin" />
            <p className="text-xs font-bold text-prism-muted">Accessing persistent learner memory...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column: Preference & Study Times (1 Col) */}
            <div className="flex flex-col gap-6 lg:col-span-1">
              {/* Preferred Explanation Style */}
              <div className="glass-card rounded-2xl p-5 flex flex-col gap-4 border border-prism-border shadow-xs">
                <div className="flex items-center justify-between border-b border-prism-border/50 pb-3">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-prism-accent" />
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-prism-text">
                      Explanation Style
                    </h2>
                  </div>
                  <span className="text-[10px] font-bold text-prism-muted uppercase font-mono">
                    Auto-Tuned
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {(Object.keys(STYLE_DESCRIPTIONS) as ExplanationStyle[]).map((styleKey) => {
                    const info = STYLE_DESCRIPTIONS[styleKey];
                    const isSelected = profile?.preferred_explanation_style === styleKey;

                    return (
                      <button
                        key={styleKey}
                        onClick={() => handleStyleChange(styleKey)}
                        disabled={updatingStyle}
                        className={`flex flex-col gap-1 p-3 rounded-xl border text-left transition duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-prism-accent/10 border-prism-accent text-prism-text font-bold shadow-xs"
                            : "border-prism-border/40 hover:bg-prism-accent/5 text-prism-muted"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold flex items-center gap-1.5">
                            <span>{info.icon}</span>
                            <span>{info.label}</span>
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-prism-accent shrink-0" />
                          )}
                        </div>
                        <p className="text-4xs font-medium text-prism-muted leading-tight">
                          {info.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Total Study Time per Subject */}
              <div className="glass-card rounded-2xl p-5 flex flex-col gap-4 border border-prism-border shadow-xs">
                <div className="flex items-center gap-2 border-b border-prism-border/50 pb-3">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-prism-text">
                    Study Time per Subject
                  </h2>
                </div>

                {studyTimeEntries.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-2xs font-semibold text-prism-muted">
                      No study time recorded yet. Interact with quizzes or flashcards to log duration!
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {studyTimeEntries.map(([subject, seconds]) => {
                      const maxSec = Math.max(...studyTimeEntries.map(([, s]) => s), 1);
                      const percent = Math.min(100, Math.round((seconds / maxSec) * 100));

                      return (
                        <div key={subject} className="flex flex-col gap-1">
                          <div className="flex justify-between text-2xs font-bold">
                            <span className="truncate text-prism-text">{subject}</span>
                            <span className="text-prism-muted font-mono">{formatTime(seconds)}</span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Mastery Scores & Misconceptions Log (2 Cols) */}
            <div className="flex flex-col gap-6 lg:col-span-2">
              {/* Per-Topic Mastery Breakdown */}
              <div className="glass-card rounded-2xl p-5 flex flex-col gap-4 border border-prism-border shadow-xs">
                <div className="flex items-center justify-between border-b border-prism-border/50 pb-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-500" />
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-prism-text">
                      Per-Topic Mastery Matrix
                    </h2>
                  </div>
                  <span className="text-3xs font-extrabold text-prism-muted uppercase font-mono">
                    {masteryEntries.length} Topics Tracked
                  </span>
                </div>

                {masteryEntries.length === 0 ? (
                  <div className="py-8 text-center flex flex-col items-center gap-2">
                    <Zap className="h-6 w-6 text-prism-muted/50" />
                    <p className="text-xs font-bold text-prism-text">No topic mastery scores yet</p>
                    <p className="text-4xs font-medium text-prism-muted max-w-sm">
                      Complete active recall deck reviews or generate quizzes to calculate topic-level mastery.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {masteryEntries.map(([topic, score]) => {
                      let colorClass = "bg-amber-500 text-amber-600";
                      let barBg = "bg-amber-500";
                      if (score >= 75) {
                        colorClass = "bg-emerald-500 text-emerald-600";
                        barBg = "bg-emerald-500";
                      } else if (score >= 50) {
                        colorClass = "bg-blue-500 text-blue-600";
                        barBg = "bg-blue-500";
                      }

                      return (
                        <div
                          key={topic}
                          className="p-3.5 rounded-xl border border-prism-border/40 bg-prism-surface/40 flex flex-col gap-2"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-2xs font-extrabold truncate text-prism-text">
                              {topic}
                            </span>
                            <span className="text-xs font-black font-mono">{score}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${barBg} rounded-full transition-all duration-500`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent Mistakes & AI Misconception Diagnosis Log */}
              <div className="glass-card rounded-2xl p-5 flex flex-col gap-4 border border-prism-border shadow-xs">
                <div className="flex items-center justify-between border-b border-prism-border/50 pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-purple-500" />
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-prism-text">
                      Recent Mistakes & AI Misconception Diagnoses
                    </h2>
                  </div>
                  <span className="text-3xs font-extrabold text-prism-muted uppercase font-mono">
                    {mistakes.length} Logged
                  </span>
                </div>

                {mistakes.length === 0 ? (
                  <div className="py-8 text-center flex flex-col items-center gap-2">
                    <Sparkles className="h-6 w-6 text-emerald-500" />
                    <p className="text-xs font-bold text-prism-text">No recent mistakes logged</p>
                    <p className="text-4xs font-medium text-prism-muted max-w-sm">
                      When you get a question wrong on a quiz or fail a flashcard review, the AI will diagnose your core misconception and display it here!
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {mistakes.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 flex flex-col gap-2.5 transition hover:border-purple-500/30"
                      >
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-4xs font-black uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300">
                            {m.topic}
                          </span>
                          <span className="text-4xs font-mono text-prism-muted">
                            {new Date(m.timestamp).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="text-2xs font-bold text-prism-text">
                          <span className="text-prism-muted font-normal">Q: </span>
                          {m.question}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-4xs font-medium">
                          <div className="p-2 rounded bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20">
                            <span className="font-bold">Your Choice: </span>
                            {m.studentAnswer}
                          </div>
                          <div className="p-2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            <span className="font-bold">Correct Choice: </span>
                            {m.correctAnswer}
                          </div>
                        </div>

                        <div className="flex items-start gap-2 pt-1 border-t border-purple-500/10 text-3xs font-semibold text-purple-900 dark:text-purple-200">
                          <Info className="h-3.5 w-3.5 text-purple-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                              Diagnosed Misconception:{" "}
                            </span>
                            {m.misconception}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
