"use client";

import { useEffect } from "react";
import { ThemeToggle } from "@/app/components/theme-toggle";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[color:var(--bg)] px-4 py-10 text-[color:var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-400 to-indigo-600 text-lg font-bold text-white shadow-lg">
              E
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                EduMethod AI
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-8 shadow-sm">
          <div className="text-center">
            <div className="mb-4 text-6xl">⚠️</div>
            <h1 className="text-3xl font-bold text-red-600 dark:text-red-400">
              Oops! Something went wrong
            </h1>
            <p className="mt-4 text-[color:var(--muted)]">
              We encountered an unexpected error. Don't worry, our team has been
              notified.
            </p>

            {process.env.NODE_ENV === "development" && (
              <details className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-left dark:border-red-900 dark:bg-red-950/40">
                <summary className="cursor-pointer font-semibold text-red-700 dark:text-red-300">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-red-600 dark:text-red-400">
                  {error.message}
                </pre>
              </details>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={reset}
                className="rounded-full bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition"
              >
                Try Again
              </button>
              <a
                href="/upload"
                className="rounded-full border border-[color:var(--border)] px-6 py-3 font-semibold text-[color:var(--text)] hover:bg-[color:var(--surface-soft)] transition"
              >
                Go to Home
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>💡 Tip:</strong> If this error persists, try clearing your
            browser cache or reloading the page. If the problem continues,
            please contact support.
          </p>
        </div>
      </div>
    </main>
  );
}
