"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ThemeToggle } from "../../components/theme-toggle";
import { BrandMark } from "../../components/brand-mark";
import { ChatSparkIcon } from "@/components/icons/ChatSparkIcon";
import { Send, BookOpen, Quote, ShieldAlert, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { toast } from "sonner";

interface LearningPath {
  id: string;
  subject: string;
  created_at: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function TextbookChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialPathId = searchParams.get("pathId") || "";

  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [selectedPathId, setSelectedPathId] = useState(initialPathId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [socratic, setSocratic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Highlighted RAG citations
  const [citations, setCitations] = useState<string[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLearningPaths();
  }, []);

  useEffect(() => {
    if (selectedPathId) {
      // Clear chat on textbook change
      setMessages([]);
      setSessionId(null);
      setCitations([]);
    }
  }, [selectedPathId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchLearningPaths() {
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        // Filter history items of type 'path'
        const pathItems = (data.history || [])
          .filter((item: any) => item.type === "path")
          .map((item: any) => ({
            id: item.id,
            subject: item.title,
            created_at: item.date,
          }));
        setPaths(pathItems);
        if (!selectedPathId && pathItems.length > 0) {
          setSelectedPathId(pathItems[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load textbooks", err);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !selectedPathId || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const response = await fetch("/api/solve-doubt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId || undefined,
          learningPathId: selectedPathId,
          message: userMsg,
          socratic,
        }),
      });

      if (!response.ok) {
        throw new Error("Tutor service returned an error");
      }

      // Track session ID from headers
      const returnedSessionId = response.headers.get("x-session-id");
      if (returnedSessionId) {
        setSessionId(returnedSessionId);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("Stream reader not supported");

      // Insert blank assistant message to stream into
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      let assistantText = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantText += chunk;

        // Strip citation headers if present and store citations separately
        const citationRegex = /\[Syllabus Context Section \d+\]:\s*([\s\S]*?)(?=\n\n\[Syllabus Context Section|$)/g;
        let match;
        const foundCitations: string[] = [];
        while ((match = citationRegex.exec(assistantText)) !== null) {
          foundCitations.push(match[1].trim());
        }
        if (foundCitations.length > 0) {
          setCitations(foundCitations);
        }

        // Remove raw citations block from rendering in main bubbles to avoid duplicate text
        const cleanedText = assistantText.replace(/Use the following verified syllabus context[\s\S]*?Verified Context:[\s\S]*?$/g, "").trim();

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: cleanedText || assistantText,
          };
          return updated;
        });
      }

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to get reply");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid-bg h-full overflow-y-auto px-4 py-8 text-prism-text sm:px-6 sm:py-10 lg:px-8 bg-prism-base font-sans flex flex-col justify-between">
      <div className="mx-auto flex max-w-5xl w-full flex-col gap-6 h-full flex-grow animate-focus-lens">
        
        {/* Top Header */}
        <header className="glass-prism flex items-center justify-between rounded-2xl px-6 py-4 transition-all duration-300">
          <div className="flex items-center gap-2 pl-12 lg:pl-0">
            <BrandMark />
            <span className="text-2xs font-extrabold uppercase tracking-widest text-prism-accent font-mono ml-2 border-l border-prism-border pl-3 hidden sm:inline">
              Textbook Chat RAG
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>

        {/* Selection & Controls */}
        <div className="grid gap-4 sm:grid-cols-12 items-center">
          <div className="sm:col-span-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-2xs font-black uppercase tracking-wider text-prism-muted font-mono whitespace-nowrap">
              Select Textbook:
            </span>
            <select
              value={selectedPathId}
              onChange={(e) => setSelectedPathId(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 rounded-xl bg-prism-surface border border-prism-border text-prism-text text-2xs font-bold outline-none cursor-pointer focus:border-prism-accent/50"
            >
              <option value="" disabled>-- Select a study roadmap --</option>
              {paths.map((p) => (
                <option key={p.id} value={p.id}>{p.subject}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-4 flex justify-end">
            {/* Socratic Mode Toggle */}
            <button
              onClick={() => setSocratic(!socratic)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-3xs font-extrabold uppercase tracking-wider transition ${
                socratic
                  ? "bg-prism-accent/10 border-prism-accent text-prism-accent"
                  : "bg-prism-surface border-prism-border text-prism-muted"
              }`}
            >
              <Sparkles size={11} className={socratic ? "animate-pulse" : ""} />
              {socratic ? "Socratic Mode On" : "Enable Socratic Mode"}
            </button>
          </div>
        </div>

        {/* Main Work Area */}
        <div className="grid gap-6 md:grid-cols-12 items-stretch flex-grow min-h-[50vh]">
          {/* Chat Window */}
          <div className={`flex flex-col justify-between rounded-3xl glass-prism p-5 border border-prism-border ${citations.length > 0 ? "md:col-span-8" : "md:col-span-12"}`}>
            {/* Message List */}
            <div className="flex-grow overflow-y-auto space-y-4 max-h-[45vh] pr-2">
              {messages.length === 0 ? (
                <div className="text-center py-20 text-prism-muted">
                  <ChatSparkIcon size={40} className="mx-auto text-prism-accent" />
                  <h3 className="text-xs font-black mt-4 uppercase tracking-widest font-mono">Ask Your Textbook</h3>
                  <p className="text-4xs font-semibold mt-1">Submit questions or concepts. Context chunks are matched and cited live.</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={index}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 border text-2xs leading-relaxed ${
                          isUser
                            ? "bg-prism-accent/10 border-prism-accent/30 text-prism-text rounded-tr-none font-semibold"
                            : "bg-white/5 border-prism-border text-prism-text rounded-tl-none"
                        }`}
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            code: ({ children }) => <code className="bg-black/40 px-1 py-0.5 rounded text-prism-accent font-mono text-[10px]">{children}</code>
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="mt-4 flex gap-2 pt-4 border-t border-prism-border">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={loading ? "Streaming answers..." : "Enter your textbook doubt..."}
                disabled={loading || !selectedPathId}
                className="flex-grow px-4 py-3 rounded-xl bg-prism-surface border border-prism-border text-prism-text text-2xs font-semibold outline-none focus:border-prism-accent/50 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim() || !selectedPathId}
                className="px-4 rounded-xl bg-prism-accent text-prism-base hover:bg-prism-accent/80 transition flex items-center justify-center disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </form>
          </div>

          {/* RAG Context / Citations Sidebar */}
          {citations.length > 0 && (
            <div className="md:col-span-4 flex flex-col gap-4 rounded-3xl glass-prism p-5 border border-prism-border">
              <div className="flex items-center gap-2 border-b border-prism-border pb-2 shrink-0">
                <Quote size={14} className="text-prism-accent" />
                <h3 className="text-xs font-black uppercase tracking-widest text-prism-muted font-display">Verified Citations</h3>
              </div>
              <div className="flex-grow overflow-y-auto space-y-3 max-h-[45vh] pr-1">
                {citations.map((cite, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/5 border border-prism-border space-y-2">
                    <span className="text-[8px] font-black uppercase tracking-wider text-prism-accent font-mono">
                      Context Section {idx + 1}
                    </span>
                    <p className="text-[10px] font-medium leading-relaxed text-prism-muted">
                      {cite}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
