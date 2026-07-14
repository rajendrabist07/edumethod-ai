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

export default function UploadPage() {
  const [subject, setSubject] = useState("");
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [learningPathId, setLearningPathId] = useState("");
  const [plan, setPlan] = useState<PlanDay[]>([]);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [error, setError] = useState("");

  interface QuizQuestion {
    question: string;
    options: string[];
    topic: string;
  }

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

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setTopics(data.topics);
      setLearningPathId(data.learningPathId);
      setPlan([]);
    } catch {
      setError("Network error, please try again");
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

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate learning plan");
        return;
      }

      setPlan(data.plan.days);
    } catch {
      setError("Network error while generating the plan");
    } finally {
      setGeneratingPlan(false);
    }
  }

  async function handleGenerateQuiz() {
    setLoadingQuiz(true);
    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learningPathId }),
      });
      const data = await res.json();
      if (res.ok) {
        setQuizId(data.quizId);
        setQuizQuestions(data.questions);
        setUserAnswers(new Array(data.questions.length).fill(-1));
      } else {
        setError(data.error);
      }
    } finally {
      setLoadingQuiz(false);
    }
  }

  async function handleSubmitQuiz() {
    const res = await fetch("/api/submit-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId, answers: userAnswers }),
    });
    const data = await res.json();
    if (res.ok) {
      setQuizResult(data);
    }
  }

  return (
    <main className="min-h-screen bg-[color:var(--bg)] px-4 py-10 text-[color:var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <header className="flex items-center justify-between rounded-full border border-[color:var(--border)] bg-[color:var(--surface)]/80 px-4 py-3 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-400 to-indigo-600 text-lg font-bold text-white shadow-lg">
              E
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                EduMethod AI
              </p>
              <p className="text-xs text-[color:var(--muted)]">
                AI-generated study routes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/doubt-solver"
              className="rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition"
            >
              Doubt Solver
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
            Upload syllabus
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Create a learning roadmap from your notes.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[color:var(--muted)]">
            Paste your chapter or syllabus text and let the AI organize it into
            clear topics with difficulty and time estimates.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm"
        >
          <div className="grid gap-4">
            <input
              type="text"
              placeholder="Subject (e.g. Physics)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-[color:var(--surface)]"
              required
            />

            <textarea
              placeholder="Paste your chapter/syllabus text here..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="h-44 w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-[color:var(--surface)]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-5 rounded-full bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Generate Learning Path"}
          </button>
        </form>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {topics.length > 0 && (
          <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[color:var(--text)]">
              Extracted Topics
            </h2>
            <div className="mt-4 flex flex-col gap-3">
              {topics.map((topic, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-[color:var(--text)]">
                      {topic.name}
                    </p>
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-sm font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                      {topic.difficulty}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">
                    Estimated study time: {topic.estimatedHours}h
                  </p>
                </div>
              ))}
            </div>

            {plan.length === 0 && (
              <button
                type="button"
                onClick={handleGeneratePlan}
                disabled={generatingPlan}
                className="mt-6 rounded-full bg-green-600 px-5 py-3 font-semibold text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generatingPlan
                  ? "Creating your plan..."
                  : "Generate 7-Day Learning Path"}
              </button>
            )}
          </div>
        )}

        {plan.length > 0 && (
          <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[color:var(--text)]">
              Your 7-Day Learning Path
            </h2>
            <div className="mt-4 flex flex-col gap-4">
              {plan.map((day) => (
                <div
                  key={day.day}
                  className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4"
                >
                  <p className="font-semibold text-[color:var(--text)]">
                    Day {day.day}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    Topics: {day.topics.join(", ")}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    Method: {day.method}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    Duration: {day.durationMinutes} min
                  </p>
                  <p className="mt-2 text-sm italic text-blue-700">
                    💡 {day.hack}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {plan.length > 0 && quizQuestions.length === 0 && (
          <button
            onClick={handleGenerateQuiz}
            disabled={loadingQuiz}
            className="mt-4 bg-purple-600 text-white rounded-lg p-3 font-semibold disabled:opacity-50"
          >
            {loadingQuiz ? "Creating quiz..." : "Take a Quiz"}
          </button>
        )}

        {quizQuestions.length > 0 && !quizResult && (
          <div className="mt-8 flex flex-col gap-6">
            <h2 className="text-lg font-semibold">Quiz Time</h2>
            {quizQuestions.map((q, qi) => (
              <div key={qi} className="border rounded-lg p-4">
                <p className="font-medium mb-2">
                  {qi + 1}. {q.question}
                </p>
                {q.options.map((opt, oi) => (
                  <label key={oi} className="flex items-center gap-2 mb-1">
                    <input
                      type="radio"
                      name={`q-${qi}`}
                      checked={userAnswers[qi] === oi}
                      onChange={() => {
                        const updated = [...userAnswers];
                        updated[qi] = oi;
                        setUserAnswers(updated);
                      }}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            ))}
            <button
              onClick={handleSubmitQuiz}
              className="bg-green-600 text-white rounded-lg p-3 font-semibold"
            >
              Submit Quiz
            </button>
          </div>
        )}

        {quizResult && (
          <div className="mt-8 border rounded-lg p-4 bg-blue-50">
            <p className="font-bold text-lg">
              Score: {quizResult.score}/{quizResult.totalQuestions}
            </p>
            {quizResult.weakTopics.length > 0 ? (
              <p className="text-red-600 mt-2">
                Weak topics to review: {quizResult.weakTopics.join(", ")}
              </p>
            ) : (
              <p className="text-green-600 mt-2">
                Great job! No weak areas detected.
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
