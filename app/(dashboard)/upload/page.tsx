"use client";

import { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "../../components/theme-toggle";

interface Topic {
  name: string;
  difficulty: "easy" | "medium" | "hard";
  estimatedHours: number;
}

interface PlanDay {
  day: number;
  topics: string[];
  method: string;
  durationMinutes: number;
  hack: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  topic: string;
}

export default function UploadPage() {
  const [subject, setSubject] = useState("");
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [learningPathId, setLearningPathId] = useState("");
  const [plan, setPlan] = useState<PlanDay[]>([]);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [error, setError] = useState("");

  const [quizId, setQuizId] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    totalQuestions: number;
    weakTopics: string[];
  } | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, rawText }),
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error("JSON parse error:", jsonErr);
        const text = await res.text();
        console.error("Response was not JSON:", text);
        setError(`Server returned status ${res.status}. Check console for details.`);
        return;
      }

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setTopics(data.topics);
      setLearningPathId(data.learningPathId);
      setPlan([]);
    } catch (err) {
      console.error("Submit error:", err);
      setError("Network error, please check connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneratePlan() {
    if (!learningPathId) {
      setError("Please generate topics first.");
      return;
    }

    setGeneratingPlan(true);
    setError("");

    try {
      const res = await fetch("/api/generate-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learningPathId }),
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error("JSON parse error in plan generation:", jsonErr);
        const text = await res.text();
        console.error("Plan generation response was not JSON:", text);
        setError(`Server returned status ${res.status}. Check console for details.`);
        return;
      }

      if (!res.ok) {
        setError(data.error || "Failed to generate learning plan");
        return;
      }

      setPlan(data.plan.days);
    } catch (err) {
      console.error("Plan generation error:", err);
      setError("Network error while generating the plan");
    } finally {
      setGeneratingPlan(false);
    }
  }

  async function handleGenerateQuiz() {
    setLoadingQuiz(true);
    setError("");
    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learningPathId }),
      });
      
      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error("JSON parse error in quiz generation:", jsonErr);
        const text = await res.text();
        console.error("Quiz generation response was not JSON:", text);
        setError(`Server returned status ${res.status}. Check console for details.`);
        return;
      }

      if (res.ok) {
        setQuizId(data.quizId);
        setQuizQuestions(data.questions);
        setUserAnswers(new Array(data.questions.length).fill(-1));
        setQuizResult(null);
      } else {
        setError(data.error || "Failed to create quiz");
      }
    } catch (err) {
      console.error("Quiz generation error:", err);
      setError("Network error while creating the quiz");
    } finally {
      setLoadingQuiz(false);
    }
  }

  async function handleSubmitQuiz() {
    if (userAnswers.includes(-1)) {
      setError("Please answer all questions before submitting.");
      return;
    }
    setError("");
    
    try {
      const res = await fetch("/api/submit-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, answers: userAnswers }),
      });
      const data = await res.json();
      if (res.ok) {
        setQuizResult(data);
      } else {
        setError(data.error || "Failed to submit quiz");
      }
    } catch {
      setError("Network error while submitting quiz");
    }
  }

  return (
    <main className="grid-bg min-h-screen px-4 py-8 text-[color:var(--text)] transition-colors duration-300 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        
        {/* Header Bar */}
        <header className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]/70 px-6 py-4 shadow-lg shadow-blue-500/5 backdrop-blur-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-lg font-bold text-white shadow-md">
              E
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
                EduMethod AI
              </p>
              <p className="text-[10px] font-medium text-[color:var(--muted)]">
                AI Study Roadmaps
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/doubt-solver"
              className="rounded-full bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-600/10 transition duration-300 hover:bg-purple-700 hover:shadow-lg active:scale-95 sm:text-sm"
            >
              Doubt Solver
            </Link>
            <ThemeToggle />
          </div>
        </header>

        {/* Hero Card */}
        <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)]/60 p-6 shadow-sm backdrop-blur-sm sm:p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-2xs font-bold uppercase tracking-wider text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            📚 Core Engine
          </span>
          <h1 className="mt-3 text-2xl font-black sm:text-3xl lg:text-4xl">
            Build your personalized learning roadmap.
          </h1>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)] sm:text-base">
            Paste your syllabus, chapters, or textbook outline. The AI will decompose it, map the conceptual difficulty, estimate times, and create a structured study routine.
          </p>
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)]/60 p-6 shadow-md backdrop-blur-sm"
        >
          <div className="space-y-5">
            <div>
              <label htmlFor="subject" className="block text-xs font-bold uppercase tracking-wider text-[color:var(--muted)] mb-2">
                Subject
              </label>
              <input
                id="subject"
                type="text"
                placeholder="e.g. Organic Chemistry, Quantum Mechanics, World History"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-soft)]/50 px-4 py-3 text-sm outline-none transition duration-300 focus:border-blue-500 focus:bg-[color:var(--surface)] focus:ring-4 focus:ring-blue-500/10"
                required
              />
            </div>

            <div>
              <label htmlFor="rawText" className="block text-xs font-bold uppercase tracking-wider text-[color:var(--muted)] mb-2">
                Syllabus Outline or Chapter Text
              </label>
              <textarea
                id="rawText"
                placeholder="Paste the raw text of your topics, subtopics, notes or chapters here..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="h-48 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-soft)]/50 px-4 py-3 text-sm outline-none transition duration-300 focus:border-blue-500 focus:bg-[color:var(--surface)] focus:ring-4 focus:ring-blue-500/10 resize-y"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50 active:scale-98"
          >
            {loading ? "Analyzing syllabus text..." : "Generate Learning Structure"}
          </button>
        </form>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
            ⚠️ {error}
          </div>
        )}

        {/* Extracted Topics */}
        {topics.length > 0 && (
          <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)]/60 p-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4 border-b border-[color:var(--border)]/30 pb-3">
              <h2 className="text-lg font-bold text-[color:var(--text)]">
                Extracted Concept Map
              </h2>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-2xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                {topics.length} Modules
              </span>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2">
              {topics.map((topic, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-sm transition duration-300 hover:border-blue-500/20"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-sm text-[color:var(--text)]">
                      {topic.name}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-3xs font-extrabold uppercase tracking-wide ${
                      topic.difficulty === "easy" 
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/45 dark:text-emerald-400"
                        : topic.difficulty === "medium"
                        ? "bg-amber-50 text-amber-600 dark:bg-amber-950/45 dark:text-amber-400"
                        : "bg-rose-50 text-rose-600 dark:bg-rose-950/45 dark:text-rose-400"
                    }`}>
                      {topic.difficulty}
                    </span>
                  </div>
                  <p className="mt-2 text-2xs text-[color:var(--muted)] flex items-center gap-1">
                    ⏱️ Estimated time: <span className="font-bold text-[color:var(--text)]">{topic.estimatedHours} hours</span>
                  </p>
                </div>
              ))}
            </div>

            {plan.length === 0 && (
              <button
                type="button"
                onClick={handleGeneratePlan}
                disabled={generatingPlan}
                className="mt-6 w-full rounded-full bg-gradient-to-r from-emerald-600 to-green-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:from-emerald-700 hover:to-green-700 hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50 active:scale-98"
              >
                {generatingPlan ? "Structuring study roadmap..." : "Generate 7-Day Structured Plan"}
              </button>
            )}
          </div>
        )}

        {/* 7-Day Plan timeline */}
        {plan.length > 0 && (
          <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)]/60 p-6 shadow-sm backdrop-blur-sm">
            <h2 className="text-lg font-bold text-[color:var(--text)] border-b border-[color:var(--border)]/30 pb-3 mb-6">
              Your 7-Day Learning Roadmap
            </h2>
            
            <div className="relative pl-6 border-l-2 border-blue-500/30 space-y-6">
              {plan.map((day) => (
                <div key={day.day} className="relative group">
                  {/* Timeline Indicator Dot */}
                  <div className="absolute -left-[31px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[color:var(--surface)] border-2 border-blue-500 transition-all duration-300 group-hover:bg-blue-500">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 group-hover:bg-[color:var(--surface)]"></div>
                  </div>

                  <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-sm transition duration-300 hover:border-blue-500/20 hover:shadow-md">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--border)]/30 pb-2 mb-2.5">
                      <p className="font-extrabold text-sm text-blue-600 dark:text-blue-400">
                        Day {day.day}
                      </p>
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-3xs font-extrabold text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                        {day.durationMinutes} minutes
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-semibold text-[color:var(--muted)]">Modules: </span>
                        <span className="font-bold text-[color:var(--text)]">{day.topics.join(", ")}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-[color:var(--muted)]">Methodology: </span>
                        <span className="font-medium text-[color:var(--text)]">{day.method}</span>
                      </div>
                      <div className="mt-3 rounded-xl bg-blue-50/60 p-3 text-xs italic text-blue-800 dark:bg-blue-950/20 dark:text-blue-300 border border-blue-100/50 dark:border-blue-900/20">
                        💡 <span className="font-bold">Mnemonic / Tip:</span> {day.hack}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Take Quiz Button */}
        {plan.length > 0 && quizQuestions.length === 0 && (
          <button
            onClick={handleGenerateQuiz}
            disabled={loadingQuiz}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full py-4 font-bold shadow-lg shadow-purple-500/20 transition-all duration-300 hover:from-purple-700 hover:to-indigo-700 hover:shadow-purple-500/30 disabled:opacity-50 active:scale-98"
          >
            {loadingQuiz ? "Crafting active recall quiz questions..." : "Take Active Recall Quiz"}
          </button>
        )}

        {/* Active Recall Quiz Panel */}
        {quizQuestions.length > 0 && !quizResult && (
          <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)]/60 p-6 shadow-md backdrop-blur-sm flex flex-col gap-6">
            <div className="border-b border-[color:var(--border)]/30 pb-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-3xs font-extrabold uppercase tracking-wide text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                📝 Active Recall
              </span>
              <h2 className="text-xl font-bold mt-1 text-[color:var(--text)]">Concept Retention Quiz</h2>
              <p className="text-xs text-[color:var(--muted)]">Answer all questions to analyze and detect your weaker topic areas.</p>
            </div>
            
            <div className="space-y-6">
              {quizQuestions.map((q, qi) => (
                <div key={qi} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-sm">
                  <div className="flex items-start gap-2 mb-4">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-3xs font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      {qi + 1}
                    </span>
                    <p className="font-bold text-sm text-[color:var(--text)]">
                      {q.question}
                    </p>
                  </div>

                  <div className="grid gap-2.5">
                    {q.options.map((opt, oi) => {
                      const isSelected = userAnswers[qi] === oi;
                      return (
                        <label
                          key={oi}
                          className={`flex items-center gap-3 border rounded-xl px-4 py-3 text-xs font-semibold cursor-pointer transition duration-300 hover:bg-[color:var(--surface-soft)]/50 ${
                            isSelected 
                              ? "border-purple-600 bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300"
                              : "border-[color:var(--border)]/80 bg-[color:var(--surface-soft)]/20 text-[color:var(--text)]"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${qi}`}
                            checked={isSelected}
                            onChange={() => {
                              const updated = [...userAnswers];
                              updated[qi] = oi;
                              setUserAnswers(updated);
                            }}
                            className="hidden"
                          />
                          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                            isSelected 
                              ? "border-purple-600 bg-purple-600" 
                              : "border-[color:var(--muted)]/50"
                          }`}>
                            {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white"></div>}
                          </span>
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                  
                  <div className="mt-3 text-right">
                    <span className="inline-block rounded-full bg-[color:var(--surface-soft)] px-2.5 py-0.5 text-4xs font-bold uppercase tracking-wider text-[color:var(--muted)]">
                      Concept: {q.topic}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmitQuiz}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full py-3.5 font-bold shadow-lg shadow-green-500/20 transition duration-300 hover:from-green-700 hover:to-emerald-700 active:scale-98"
            >
              Submit Quiz Answers
            </button>
          </div>
        )}

        {/* Quiz Result Report Card */}
        {quizResult && (
          <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-lg backdrop-blur-sm">
            <h2 className="text-lg font-bold text-[color:var(--text)] border-b border-[color:var(--border)]/30 pb-3 mb-5">
              Active Recall Assessment Report
            </h2>

            <div className="grid gap-6 sm:grid-cols-[1fr_2fr] items-center">
              {/* Score Display Ring */}
              <div className="flex flex-col items-center justify-center rounded-2xl bg-[color:var(--surface-soft)]/50 p-6 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--muted)]">Your Score</p>
                <div className="mt-2 text-5xl font-black text-blue-600 dark:text-blue-400">
                  {quizResult.score} <span className="text-xl text-[color:var(--muted)]">/ {quizResult.totalQuestions}</span>
                </div>
                <p className="mt-2 text-2xs font-semibold text-[color:var(--muted)]">
                  {quizResult.score === quizResult.totalQuestions 
                    ? "🎉 Perfect! Excellent retention." 
                    : quizResult.score >= quizResult.totalQuestions * 0.7 
                    ? "👍 Good progress! Review weak areas." 
                    : "📚 We recommend a complete study run."}
                </p>
              </div>

              {/* Assessment details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wide text-[color:var(--muted)]">Topic Assessment</h3>
                  {quizResult.weakTopics.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                        We detected concept weaknesses in these modules (&lt;60% accuracy):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {quizResult.weakTopics.map((topic, i) => (
                          <span
                            key={i}
                            className="rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-2xs font-bold text-rose-700 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400"
                          >
                            ⚠️ {topic}
                          </span>
                        ))}
                      </div>
                      <p className="text-2xs text-[color:var(--muted)] mt-1">
                        Use the **Doubt Solver** chat to ask follow-up questions about these topics for step-by-step help.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 rounded-xl bg-emerald-50/50 border border-emerald-200 p-3 text-xs text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400 font-semibold">
                      ✨ Outstanding performance! No weak topic modules detected. Keep up the good work!
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleGenerateQuiz}
                    className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-2.5 text-xs font-bold text-[color:var(--text)] transition hover:bg-[color:var(--surface-soft)] active:scale-95"
                  >
                    Retake Quiz
                  </button>
                  <Link
                    href="/doubt-solver"
                    className="rounded-full bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-purple-700 active:scale-95"
                  >
                    Discuss Weak Topics
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
