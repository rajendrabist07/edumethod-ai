"use client";

import { useEffect } from "react";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { Lightbulb, TriangleAlert } from "lucide-react";

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
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-prism-surface border border-prism-border text-lg font-bold text-prism-accent shadow-lg">
              E
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-prism-accent">
                EduMethod AI
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-8 shadow-sm">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400">
              <TriangleAlert className="h-8 w-8" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold text-red-600 dark:text-red-400">
              Oops! Something went wrong
            </h1>
            <p className="mt-4 text-[color:var(--muted)]">
              We encountered an unexpected error. Don&apos;t worry, our team has been
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
                className="rounded-full bg-prism-accent px-6 py-3 font-semibold text-white hover:bg-opacity-90 transition"
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

        <div className="mt-8 rounded-lg border border-prism-border bg-prism-surface p-4">
          <p className="flex items-start gap-2 text-sm text-prism-muted">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-prism-accent" aria-hidden="true" />
            <span>
              <strong>Tip:</strong> If this error persists, try clearing your browser cache or reloading the page.
              If the problem continues, please contact support.
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}
