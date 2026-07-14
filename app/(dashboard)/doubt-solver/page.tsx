"use client";

import { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "../../components/theme-toggle";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function DoubtSolverPage() {
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleSend() {
    if (!input.trim()) return;
    setLoading(true);
    setError("");

    const userMessage: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const payload: {
        sessionId?: string;
        message: string;
        imageBase64?: string;
        mimeType?: string;
      } = { message: input };

      if (sessionId) payload.sessionId = sessionId;

      if (imageFile) {
        payload.imageBase64 = await fileToBase64(imageFile);
        payload.mimeType = imageFile.type;
      }

      const res = await fetch("/api/solve-doubt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.reply) {
        setSessionId(data.sessionId);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      } else {
        setError(data.error || "Failed to get response. Please try again.");
        setMessages((prev) => prev.slice(0, -1));
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Network error. Please check your connection and try again.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setInput("");
      setImageFile(null);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[color:var(--bg)] px-4 py-10 text-[color:var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 h-screen">
        <header className="flex items-center justify-between rounded-full border border-[color:var(--border)] bg-[color:var(--surface)]/80 px-4 py-3 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 via-pink-400 to-red-600 text-lg font-bold text-white shadow-lg">
              D
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-600">
                Doubt Solver
              </p>
              <p className="text-xs text-[color:var(--muted)]">
                Step-by-step solutions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/upload"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Back to Study
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm flex-1 flex flex-col overflow-hidden">
            <h1 className="text-2xl font-bold mb-4">Ask Your Questions</h1>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 mb-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="flex-1 overflow-y-auto flex flex-col gap-4 mb-6 rounded-lg bg-[color:var(--surface-soft)] p-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-[color:var(--muted)]">
                  <p>Type a question or upload an image to get started...</p>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg max-w-[80%] ${
                      m.role === "user"
                        ? "bg-blue-600 text-white self-end rounded-br-none"
                        : "bg-[color:var(--border)] text-[color:var(--text)] self-start rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {m.content}
                    </p>
                  </div>
                ))
              )}
              {loading && (
                <div className="bg-[color:var(--border)] p-4 rounded-lg self-start rounded-bl-none">
                  <p className="text-[color:var(--muted)] animate-pulse">
                    Thinking...
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="text-sm px-3 py-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-soft)]"
              />
              {imageFile && (
                <p className="text-xs text-[color:var(--muted)]">
                  📎 {imageFile.name}
                </p>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your question..."
                  className="flex-1 border border-[color:var(--border)] rounded-lg px-4 py-3 bg-[color:var(--surface-soft)] text-[color:var(--text)] outline-none transition focus:border-purple-500"
                  onKeyDown={(e) =>
                    e.key === "Enter" && !loading && handleSend()
                  }
                />
                <button
                  onClick={handleSend}
                  disabled={loading}
                  className="bg-purple-600 text-white rounded-lg px-6 py-3 font-semibold hover:bg-purple-700 disabled:opacity-50 transition"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
