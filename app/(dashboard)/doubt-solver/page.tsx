"use client";

import { useState, useRef, useEffect } from "react";
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleSend() {
    if (!input.trim() && !imageFile) return;
    setLoading(true);
    setError("");

    const displayContent = imageFile 
      ? `[Image Attached: ${imageFile.name}]\n\n${input}`
      : input;

    const userMessage: ChatMessage = { role: "user", content: displayContent };
    setMessages((prev) => [...prev, userMessage]);
    
    const originalInput = input;
    setInput("");

    try {
      const payload: {
        sessionId?: string;
        message: string;
        imageBase64?: string;
        mimeType?: string;
      } = { message: originalInput || "Solve the attached problem step-by-step." };

      if (sessionId) payload.sessionId = sessionId;

      if (imageFile) {
        payload.imageBase64 = await fileToBase64(imageFile);
        payload.mimeType = imageFile.type;
      }

      // Reset image state for UI immediately
      setImageFile(null);

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
        setInput(originalInput); // Restore input on failure
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Network error. Please check your connection and try again.");
      setMessages((prev) => prev.slice(0, -1));
      setInput(originalInput); // Restore input on failure
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid-bg min-h-screen flex flex-col text-[color:var(--text)] transition-colors duration-300">
      
      {/* Outer Container containing Header and Main Area */}
      <div className="mx-auto flex w-full max-w-4xl flex-col h-screen p-4 gap-4 sm:p-6 lg:p-8">
        
        {/* Navigation Header */}
        <header className="flex shrink-0 items-center justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]/70 px-6 py-4 shadow-lg shadow-blue-500/5 backdrop-blur-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 text-lg font-bold text-white shadow-md">
              D
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-purple-600">
                Doubt Solver
              </p>
              <p className="text-[10px] font-medium text-[color:var(--muted)]">
                Step-by-step Explanations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/upload"
              className="rounded-full bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/10 transition duration-300 hover:bg-blue-700 hover:shadow-lg active:scale-95 sm:text-sm"
            >
              Back to Study
            </Link>
            <ThemeToggle />
          </div>
        </header>

        {/* Chat Interface Panel */}
        <div className="flex-1 min-h-0 flex flex-col rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)]/60 shadow-lg backdrop-blur-sm overflow-hidden p-4 sm:p-6">
          
          <div className="flex shrink-0 items-center justify-between border-b border-[color:var(--border)]/30 pb-3 mb-4">
            <h1 className="text-base font-black sm:text-lg">Tutor Conversation</h1>
            <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-3xs font-extrabold uppercase tracking-wide text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              Multimodal Ready
            </span>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 mb-4 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400 shrink-0">
              ⚠️ {error}
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-4 mb-4 rounded-2xl bg-[color:var(--surface-soft)]/40 p-4 border border-[color:var(--border)]/30">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-[color:var(--muted)]">
                <div className="mb-4 text-4xl">💡</div>
                <h3 className="font-extrabold text-sm text-[color:var(--text)] mb-1">Ask your doubts</h3>
                <p className="max-w-xs text-xs leading-5">Type your question or attach an image of your homework/problem sheet to receive a structured explanation.</p>
              </div>
            ) : (
              messages.map((m, i) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={i}
                    className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${
                      isUser ? "self-end items-end" : "self-start items-start"
                    }`}
                  >
                    <span className="text-4xs font-extrabold uppercase tracking-wider text-[color:var(--muted)] mb-1 px-1">
                      {isUser ? "You" : "AI Tutor"}
                    </span>
                    <div
                      className={`p-4 rounded-2xl text-xs font-medium leading-relaxed whitespace-pre-wrap shadow-sm transition-all duration-300 ${
                        isUser
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-blue-500/5"
                          : "bg-[color:var(--surface)] text-[color:var(--text)] border border-[color:var(--border)]/80 rounded-tl-none"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })
            )}

            {loading && (
              <div className="flex flex-col items-start max-w-[75%] self-start">
                <span className="text-4xs font-extrabold uppercase tracking-wider text-[color:var(--muted)] mb-1 px-1">
                  AI Tutor
                </span>
                <div className="bg-[color:var(--surface)] border border-[color:var(--border)]/80 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="h-2 w-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="h-2 w-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Form Actions / Input Section */}
          <div className="flex flex-col gap-3 shrink-0">
            {/* Hidden Input File Element */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="hidden"
            />

            {/* Image Attachment Panel */}
            {imageFile && (
              <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-100/50 dark:border-blue-900/30">
                <span className="truncate max-w-[80%]">📎 Attached: {imageFile.name}</span>
                <button
                  type="button"
                  onClick={() => setImageFile(null)}
                  className="text-red-500 hover:text-red-700 font-bold ml-2 active:scale-90"
                >
                  Remove
                </button>
              </div>
            )}

            <div className="flex gap-2">
              {/* Attachment Button Trigger */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`flex shrink-0 h-12 w-12 items-center justify-center rounded-xl border border-[color:var(--border)] transition duration-300 active:scale-95 ${
                  imageFile 
                    ? "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/65 dark:text-blue-300"
                    : "bg-[color:var(--surface-soft)]/50 text-[color:var(--muted)] hover:border-blue-400 hover:text-blue-600"
                }`}
                title="Attach Image"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 0 11-.75 0 .375 0 01.75 0z"
                  />
                </svg>
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={imageFile ? "Add a description or question about the image..." : "Type your explanation query here..."}
                className="flex-1 border border-[color:var(--border)] rounded-xl px-4 py-3 bg-[color:var(--surface-soft)]/50 text-xs sm:text-sm text-[color:var(--text)] outline-none transition duration-300 focus:border-purple-500 focus:bg-[color:var(--surface)] focus:ring-4 focus:ring-purple-500/10"
                onKeyDown={(e) =>
                  e.key === "Enter" && !loading && handleSend()
                }
              />

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl px-6 py-3 text-xs sm:text-sm font-bold shadow-md shadow-purple-500/20 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition active:scale-95 shrink-0"
              >
                Send
              </button>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
