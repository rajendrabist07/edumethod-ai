"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ThemeToggle } from "../../components/theme-toggle";
import { Logo } from "@/components/ui/Logo";
import { ChatSparkIcon } from "@/components/icons/ChatSparkIcon";
import { CameraScanIcon } from "@/components/icons/CameraScanIcon";
import { useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { useUser } from "@clerk/nextjs";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  timestamp?: string;
  feedback?: "up" | "down";
  feedbackText?: string;
}

export default function DoubtSolverPage() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get("sessionId");

  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Voice Interaction Mode states
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [voiceSupported, setVoiceSupported] = useState(false);

  // Feedback Modal states
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackIndex, setFeedbackIndex] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speechUtteranceRef = useRef<any>(null);

  // Auto scroll to latest messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, voiceState]);

  // Handle image preview URL
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [imageFile]);

  // Check speech support
  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const speechSupported = !!SpeechRecognition && !!window.speechSynthesis;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVoiceSupported(speechSupported);
    }
  }, []);

  // Sync with search parameter to resume conversations
  useEffect(() => {
    if (sessionIdParam) {
      loadSession(sessionIdParam);
    } else {
      setSessionId("");
      setMessages([]);
      setInput("");
      setImageFile(null);
      setError("");
    }
  }, [sessionIdParam]);

  // Load a specific session
  async function loadSession(id: string) {
    setError("");
    setLoading(true);
    setSessionId(id);
    
    // Stop speaking if active
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setVoiceState("idle");
    }

    try {
      const res = await fetch(`/api/solve-doubt/sessions?sessionId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      } else {
        setError("Failed to load chat history");
      }
    } catch {
      setError("Network error while loading chat history");
    } finally {
      setLoading(false);
    }
  }

  // Start a new chat session
  function handleNewChat() {
    if (loading) return;
    router.push("/doubt-solver");
  }

  // Voice recognition activation logic
  function startVoiceListening() {
    if (!voiceSupported) return;
    window.speechSynthesis.cancel();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onstart = () => {
      setVoiceState("listening");
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setVoiceState("thinking");
      
      // Auto send speech input
      handleSend(transcript);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      console.error("Speech recognition error:", e);
      setVoiceState("idle");
    };

    rec.onend = () => {
      // Re-enable listing only if voice mode is still open and not currently speaking or thinking
      setVoiceState((prev) => (prev === "listening" ? "idle" : prev));
    };

    recognitionRef.current = rec;
    rec.start();
  }

  // Speak response out loud
  function speakResponse(text: string) {
    if (!voiceSupported || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    // Clean text: strip markdown symbols, code blocks, etc. for cleaner speech
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "[Code snippet omitted]")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[*_#\-]/g, " ");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "en-US";
    utterance.rate = 1.05;

    utterance.onstart = () => {
      setVoiceState("speaking");
    };

    utterance.onend = () => {
      setVoiceState("idle");
      // Loop back: auto listen again for true voice conversation mode
      if (voiceMode) {
        setTimeout(() => startVoiceListening(), 500);
      }
    };

    utterance.onerror = (e) => {
      console.error("Speech synthesis error:", e);
      setVoiceState("idle");
    };

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }

  // Toggle voice conversation mode
  function toggleVoiceMode() {
    const nextMode = !voiceMode;
    setVoiceMode(nextMode);
    
    if (nextMode) {
      setTimeout(() => startVoiceListening(), 200);
    } else {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      setVoiceState("idle");
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Message Send & Stream response logic
  async function handleSend(forcedInput?: string, isRegenerate = false) {
    const textToSend = forcedInput !== undefined ? forcedInput : input;
    if (!textToSend.trim() && !imageFile) return;

    setLoading(true);
    setError("");
    setVoiceState("thinking");

    const displayContent = textToSend;

    const userMessage: ChatMessage = { 
      role: "user", 
      content: displayContent,
      imageUrl: imageFile ? URL.createObjectURL(imageFile) : undefined,
      timestamp: new Date().toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMessage]);
    
    setInput("");

    try {
      const payload: {
        sessionId?: string;
        message: string;
        imageBase64?: string;
        mimeType?: string;
        regenerate?: boolean;
      } = { message: textToSend || "Analyze the attached image." };

      if (sessionId) payload.sessionId = sessionId;
      if (isRegenerate) payload.regenerate = true;

      if (imageFile) {
        payload.imageBase64 = await fileToBase64(imageFile);
        payload.mimeType = imageFile.type;
      }

      // Reset image preview state
      setImageFile(null);

      const res = await fetch("/api/solve-doubt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || "Failed to initiate AI reply.");
        setMessages((prev) => prev.slice(0, -1));
        setVoiceState("idle");
        setLoading(false);
        return;
      }

      // Fetch dynamic session ID header
      const newSessionId = res.headers.get("x-session-id");
      if (newSessionId && newSessionId !== sessionId) {
        setSessionId(newSessionId);
        // Update URL to match current conversation state, refreshing the global history sidebar
        router.replace(`/doubt-solver?sessionId=${newSessionId}`);
      }

      // Read response stream
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) {
        setError("Unable to initialize response stream.");
        setVoiceState("idle");
        setLoading(false);
        return;
      }

      let accumulatedText = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;

        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.role === "assistant") {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...lastMsg,
              content: accumulatedText,
            };
            return updated;
          } else {
            return [...prev, { role: "assistant", content: accumulatedText }];
          }
        });
      }

      // Speak final streamed result if voice mode is on
      if (voiceMode) {
        speakResponse(accumulatedText);
      } else {
        setVoiceState("idle");
      }

    } catch (err) {
      console.error("Stream fetch failure:", err);
      setError("Network connection issue. Please retry.");
      setMessages((prev) => prev.slice(0, -1));
      setVoiceState("idle");
    } finally {
      setLoading(false);
    }
  }

  // Message rating updates
  async function submitFeedback(index: number, rating: "up" | "down") {
    if (!sessionId) return;

    try {
      const res = await fetch("/api/solve-doubt/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          messageIndex: index,
          rating,
        }),
      });

      if (res.ok) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            feedback: rating,
          };
          return updated;
        });
      }
    } catch (err) {
      console.error("Feedback submit error:", err);
    }
  }

  function handleReportClick(index: number) {
    setFeedbackIndex(index);
    setFeedbackText("");
    setFeedbackModalOpen(true);
  }

  async function handleFeedbackSubmit() {
    if (feedbackIndex !== null && feedbackText.trim()) {
      const messageContent = messages[feedbackIndex].content;
      try {
        const res = await fetch("/api/solve-doubt/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            messageIndex: feedbackIndex,
            messageContent,
            reportText: feedbackText,
          }),
        });

        if (res.ok) {
          alert("Thank you. Your issue report has been submitted successfully!");
        } else {
          alert("Failed to submit issue report.");
        }
      } catch (err) {
        console.error("Report submit error:", err);
        alert("Failed to submit issue report.");
      }
    }
    setFeedbackModalOpen(false);
    setFeedbackIndex(null);
    setFeedbackText("");
  }

  function handleCopyMessage(index: number, content: string) {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    }).catch((err) => {
      console.error("Clipboard copy failed:", err);
    });
  }

  function handleShareMessage(index: number, content: string) {
    const shareText = `EduMethod AI Tutor Response:\n\n${content}\n\nJoin and solve your doubts at: ${window.location.origin}`;
    navigator.clipboard.writeText(shareText).then(() => {
      alert("Share link content copied to clipboard!");
    }).catch((err) => {
      console.error("Clipboard share failed:", err);
    });
  }

  function handleRegenerateMessage(index: number) {
    if (index < 1) return;
    const precedingUserMessage = messages[index - 1];
    if (precedingUserMessage.role !== "user") return;

    const userText = precedingUserMessage.content;
    
    // Visually replace by removing from list
    setMessages((prev) => prev.slice(0, index - 1));

    // Re-trigger handleSend with regenerate flag
    handleSend(userText, true);
  }

  return (
    <main className="grid-bg min-h-screen flex text-[color:var(--text)] transition-colors duration-300">
      
      {/* Main Chat Panel Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 relative">
        
        {/* Navigation Header */}
        <header className="glass-card flex shrink-0 items-center justify-between px-4 py-3.5 shadow-sm z-10 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Logo and title */}
            <div className="flex items-center gap-2 pl-12 lg:pl-0">
              <Logo size={26} />
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-purple-600">Doubt Solver</p>
                <p className="text-[10px] text-[color:var(--muted)] font-bold uppercase tracking-wider">Active Cognition</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] p-2 sm:px-4.5 sm:py-2 text-[color:var(--text)] transition hover:bg-[color:var(--surface-soft)] active:scale-95 flex items-center justify-center gap-1.5"
              title="Back to study dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="h-4.5 w-4.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span className="hidden sm:inline text-xs font-bold">Dashboard</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>

        {/* Conversation list window */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 flex flex-col">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-700 dark:border-red-950/40 dark:bg-red-950/45 dark:text-red-400 shrink-0">
              ⚠️ {error}
            </div>
          )}

          {messages.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-6 my-auto max-w-xl mx-auto w-full select-none animate-in fade-in zoom-in-95 duration-500">
              {/* Pulsing neural cognition graphics icon */}
              <div className="mb-8 relative">
                <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-2xl animate-pulse" />
                <div className="relative p-5 rounded-3xl bg-[color:var(--surface)] border border-[color:var(--border)] shadow-md text-purple-600 dark:text-purple-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-10 h-10 animate-spin-slow">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.467 5.99 5.99 0 0 0-1.925 3.546 5.974 5.974 0 0 1-2.133-1A3.75 3.75 0 0 0 12 18Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75a3.75 3.75 0 1 1 0-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
              </div>
              
              <h2 className="font-black text-lg tracking-tight text-[color:var(--text)] mb-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
                What can I help with?
              </h2>
              <p className="text-2xs font-semibold text-[color:var(--muted)] leading-relaxed max-w-sm mb-8">
                Submit homework equations, upload screenshots, or ask quick step-by-step calculus limits questions.
              </p>

              {/* Quick action prompt badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full">
                {[
                  {
                    title: "📐 Solve Calculus Limit",
                    desc: "Calculate lim x->0 sin(x)/x step-by-step",
                    prompt: "Solve the limit equation: \\lim_{x \\to 0} \\frac{\\sin x}{x} = 1 step-by-step."
                  },
                  {
                    title: "🧪 Biology Processes",
                    desc: "Explain the cellular respiration cycle",
                    prompt: "Explain the process of cellular respiration in clear, simplified biology terms."
                  },
                  {
                    title: "🍎 Physics Equation",
                    desc: "Explain the force formula F = ma",
                    prompt: "Explain Newton's second law of motion and explain its equation $F = ma$ with examples."
                  }
                ].map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(action.prompt)}
                    className="p-3.5 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] hover:bg-[color:var(--surface-soft)] text-left transition hover:border-purple-500/30 hover:shadow-sm active:scale-98 cursor-pointer"
                  >
                    <p className="text-3xs font-extrabold text-[color:var(--text)] uppercase tracking-wide mb-1">{action.title}</p>
                    <p className="text-4xs font-medium text-[color:var(--muted)] leading-normal">{action.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 flex-grow">
              {messages.map((m, i) => {
                const isUser = m.role === "user";
                return (
                  <div key={i} className="flex flex-col w-full mb-1">
                    
                    {/* Timestamp Center like first image */}
                    {m.timestamp && (
                      <div className="w-full flex justify-center mt-6 mb-4">
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">
                          {m.timestamp}
                        </span>
                      </div>
                    )}
                    
                    <div
                      className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${
                        isUser ? "self-end items-end ml-auto" : "self-start items-start mr-auto"
                      }`}
                    >
                      {/* AI Header */}
                      {!isUser && (
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-sm text-white">
                            <ChatSparkIcon size={14} />
                          </div>
                          <span className="text-[11px] font-bold tracking-wide text-[color:var(--text)]">AI Tutor</span>
                        </div>
                      )}
                      
                      {/* Message Bubble Container */}
                      <div className="flex flex-col gap-2 w-full">
                        {/* If User Image exists, render it elegantly like the first image */}
                        {isUser && m.imageUrl && (
                          <div className="flex justify-end gap-2 mb-1">
                            <img src={m.imageUrl} alt="Uploaded attachment" className="h-32 w-auto max-w-[200px] object-cover rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm" />
                          </div>
                        )}
                        
                        {/* Text Bubble */}
                        {m.content && (
                          <div
                            className={`p-4 text-[13px] font-medium leading-relaxed transition-all duration-300 shadow-sm ${
                              isUser
                                ? "bg-slate-800 dark:bg-[#262626] text-white rounded-3xl rounded-br-sm border border-transparent dark:border-white/5"
                                : `bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 rounded-3xl rounded-tl-sm text-[13.5px] ${
                                    loading && i === messages.length - 1 ? "chat-streaming" : ""
                                  }`
                            }`}
                          >
                            {isUser ? (
                              m.content
                            ) : (
                              <ReactMarkdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                                components={{
                                  code({ className, children, ...props }: any) {
                                    const inline = !className;
                                    return !inline ? (
                                      <pre className="bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-white/10 rounded-xl p-3 my-3 overflow-x-auto text-[11px] font-mono leading-normal shadow-inner">
                                        <code className={className} {...props}>
                                          {children}
                                        </code>
                                      </pre>
                                    ) : (
                                      <code className="bg-slate-100 dark:bg-white/10 border border-slate-200/60 dark:border-white/10 rounded px-1.5 py-0.5 text-[11px] font-mono" {...props}>
                                        {children}
                                      </code>
                                    );
                                  },
                                  ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1.5 marker:text-purple-500">{children}</ul>,
                                  ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1.5 marker:text-purple-500 marker:font-bold">{children}</ol>,
                                  li: ({ children }) => <li className="text-[13.5px] font-medium text-[color:var(--text)] leading-relaxed">{children}</li>,
                                  p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-[13.5px]">{children}</p>,
                                  h1: ({ children }) => <h1 className="text-base font-bold mt-4 mb-2 text-slate-900 dark:text-slate-100">{children}</h1>,
                                  h2: ({ children }) => <h2 className="text-sm font-bold mt-3.5 mb-2 text-slate-800 dark:text-slate-200">{children}</h2>,
                                  h3: ({ children }) => <h3 className="text-[13.5px] font-bold mt-3 mb-1 text-slate-700 dark:text-slate-300">{children}</h3>,
                                }}
                              >
                                {m.content}
                              </ReactMarkdown>
                            )}
                          </div>
                        )}
                      </div>
                    {/* Thumbs up/down feedback tools under AI bubble */}
                    {!isUser && (
                      <div className="flex items-center gap-1 mt-1 px-1 text-[color:var(--muted)] relative select-none">
                        
                        {/* 1. Like rating */}
                        <button
                          onClick={() => submitFeedback(i, "up")}
                          className={`p-1 rounded-lg hover:bg-[color:var(--surface-soft)] hover:text-green-500 transition duration-150 active:scale-90 ${
                            m.feedback === "up" ? "text-green-500 bg-green-500/10" : ""
                          }`}
                          title="Correct/Helpful explanation"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill={m.feedback === "up" ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="h-3.5 w-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.421.068.848.068 1.285 0 1.839-.564 3.546-1.533 4.962-.486.709-1.284 1.138-2.147 1.138H13.5a3.375 3.375 0 01-3.375-3.375V10.5z" />
                          </svg>
                        </button>

                        {/* 2. Dislike rating */}
                        <button
                          onClick={() => submitFeedback(i, "down")}
                          className={`p-1 rounded-lg hover:bg-[color:var(--surface-soft)] hover:text-red-500 transition duration-150 active:scale-90 ${
                            m.feedback === "down" ? "text-red-500 bg-red-500/10" : ""
                          }`}
                          title="Incorrect/Bad explanation"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill={m.feedback === "down" ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="h-3.5 w-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.367 13.5c-.806 0-1.533.446-2.031 1.08a9.041 9.041 0 01-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.498 4.498 0 00-.322 1.672v.21a.75.75 0 01-.75.75 2.25 2.25 0 01-2.25-2.25c0-1.152.26-2.243.723-3.218.266-.558-.107-1.282-.725-1.282H4.374c-1.026 0-1.945-.694-2.054-1.715A12.137 12.137 0 012.25 12c0-1.839.564-3.546 1.533-4.962.486-.709 1.284-1.138 2.147-1.138H10.5a3.375 3.375 0 013.375 3.375V13.5h3.492z" />
                          </svg>
                        </button>

                        {/* 3. Regenerate button */}
                        <button
                          onClick={() => handleRegenerateMessage(i)}
                          className="p-1 rounded-lg hover:bg-[color:var(--surface-soft)] hover:text-purple-500 transition duration-150 active:scale-90"
                          title="Regenerate reply"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="h-3.5 w-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                          </svg>
                        </button>

                        {/* 4. Copy Message */}
                        <button
                          onClick={() => handleCopyMessage(i, m.content)}
                          className="p-1 rounded-lg hover:bg-[color:var(--surface-soft)] hover:text-purple-500 transition duration-150 active:scale-90"
                          title="Copy explanation"
                        >
                          {copiedIndex === i ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-3.5 w-3.5 text-green-500">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="h-3.5 w-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.875V18a2.25 2.25 0 002.25 2.25h5.25a2.25 2.25 0 002.25-2.25V7.875a2.25 2.25 0 00-2.25-2.25H9a2.25 2.25 0 00-2.25 2.25z" />
                            </svg>
                          )}
                        </button>

                        {/* 5. More optionsDropdown Trigger */}
                        <div className="relative inline-block">
                          <button
                            onClick={() => setActiveDropdownIndex(activeDropdownIndex === i ? null : i)}
                            className="p-1 rounded-lg hover:bg-[color:var(--surface-soft)] hover:text-purple-500 transition duration-150 active:scale-90"
                            title="More options"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-3.5 w-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                            </svg>
                          </button>

                          {/* Dropdown Menu Container */}
                          {activeDropdownIndex === i && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setActiveDropdownIndex(null)}
                              />
                              <div className="absolute left-0 mt-1 w-36 glass-card rounded-xl shadow-xl z-20 border border-[color:var(--border)]/45 bg-[color:var(--surface)] p-1.5 flex flex-col gap-1 text-[11px] font-bold">
                                <button
                                  onClick={() => {
                                    speakResponse(m.content);
                                    setActiveDropdownIndex(null);
                                  }}
                                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[color:var(--surface-soft)] text-[color:var(--text)] transition flex items-center gap-1.5"
                                >
                                  🔊 Read Aloud
                                </button>
                                <button
                                  onClick={() => {
                                    handleReportClick(i);
                                    setActiveDropdownIndex(null);
                                  }}
                                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[color:var(--surface-soft)] text-red-500 hover:text-red-600 transition flex items-center gap-1.5"
                                >
                                  ⚠️ Report Issue
                                </button>
                                <button
                                  onClick={() => {
                                    handleShareMessage(i, m.content);
                                    setActiveDropdownIndex(null);
                                  }}
                                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[color:var(--surface-soft)] text-[color:var(--text)] transition flex items-center gap-1.5"
                                >
                                  🔗 Share Link
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          )}

          {/* Real-time Waiting for response state */}
          {loading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
            <div className="self-start flex flex-col items-start max-w-[85%] sm:max-w-[80%] shrink-0 animate-pulse">
              <span className="text-[9px] font-black uppercase tracking-wider text-[color:var(--muted)] mb-1 px-1">
                AI Tutor
              </span>
              <div className="glass-card p-4 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0s]"></span>
                <span className="h-2 w-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="h-2 w-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}

          {/* Real-time Streaming indicator dot */}
          {loading && messages.length > 0 && messages[messages.length - 1].role === "assistant" && (
            <div className="flex items-center gap-1.5 text-2xs font-extrabold text-purple-600 animate-pulse ml-1 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-600"></span>
              Streaming response...
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* 3. Full-Screen Voice Mode Overlay (Gemini / ChatGPT Style Morphing Blob) */}
        {voiceMode && (
          <div className="fixed inset-0 bg-slate-950/85 dark:bg-slate-950/90 backdrop-blur-2xl flex flex-col items-center justify-between p-6 sm:p-8 z-50 animate-fade-in text-white select-none">
            
            {/* Header */}
            <div className="w-full flex items-center justify-between max-w-lg">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-purple-500 animate-ping"></span>
                <span className="text-[10px] font-extrabold tracking-widest uppercase text-purple-400">Tutor Session Active</span>
              </div>
              <button
                onClick={toggleVoiceMode}
                className="p-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 active:scale-95 transition text-xs font-bold flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-3.5 w-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Exit Voice</span>
              </button>
            </div>

            {/* Glowing Liquid Morphing Orb */}
            <div className="relative flex-1 flex flex-col items-center justify-center">
              {/* Outer pulsing ring 1 */}
              <div className={`absolute w-44 h-44 sm:w-60 sm:h-60 rounded-full bg-purple-500/10 blur-xl transition-transform duration-700 ${
                voiceState === 'listening' ? 'scale-110 opacity-70' : voiceState === 'speaking' ? 'scale-125 opacity-80' : 'scale-90 opacity-40'
              }`}></div>
              
              {/* Outer pulsing ring 2 */}
              <div className={`absolute w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-cyan-500/15 blur-lg transition-transform duration-500 delay-75 ${
                voiceState === 'listening' ? 'scale-120 opacity-80' : voiceState === 'speaking' ? 'scale-130 opacity-90' : 'scale-95 opacity-30'
              }`}></div>

              {/* Central Morphing Liquid Blob */}
              <button
                type="button"
                onClick={voiceState === 'idle' ? startVoiceListening : undefined}
                className={`relative w-28 h-28 sm:w-40 sm:h-40 rounded-full transition-all duration-700 animate-morph-blob voice-orb-glow flex items-center justify-center outline-none ${
                  voiceState === 'listening'
                    ? 'bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-500'
                    : voiceState === 'speaking'
                    ? 'bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 animate-pulse'
                    : voiceState === 'thinking'
                    ? 'bg-gradient-to-tr from-purple-500 via-indigo-600 to-pink-500 animate-spin-slow'
                    : 'bg-gradient-to-tr from-slate-600 via-slate-500 to-slate-400 cursor-pointer active:scale-98 hover:scale-102'
                }`}
                title={voiceState === 'idle' ? "Tap to speak" : undefined}
              >
                {/* Visual mic/indicator icon inside center if idle */}
                {voiceState === 'idle' && (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-8 w-8 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                )}
                {voiceState === 'listening' && (
                  <span className="absolute h-3 w-3 rounded-full bg-white animate-ping"></span>
                )}
              </button>
            </div>

            {/* Footer Text status */}
            <div className="w-full max-w-md text-center flex flex-col gap-2 pb-6">
              <h3 className="text-sm font-black tracking-widest uppercase">
                {voiceState === 'listening' && "🔴 Listening..."}
                {voiceState === 'speaking' && "🔊 Speaking..."}
                {voiceState === 'thinking' && "⚡ Thinking..."}
                {voiceState === 'idle' && "💤 Connection Idle"}
              </h3>
              <p className="text-3xs text-white/60 max-w-xs mx-auto leading-relaxed">
                {voiceState === 'listening' && "Speak clearly. The AI is listening to your question..."}
                {voiceState === 'speaking' && "Tutor is talking. Turn up your volume..."}
                {voiceState === 'thinking' && "Analyzing query context. Preparing step-by-step logic..."}
                {voiceState === 'idle' && "Speak mode is waiting. Tap the orb above to talk again."}
              </p>
            </div>
          </div>
        )}

        {/* Floating Input Area (ChatGPT Style) */}
        <div className="shrink-0 w-full max-w-2xl sm:max-w-3xl mx-auto px-4 pb-6 bg-transparent z-10 relative">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="hidden"
          />

          <div className="relative flex flex-col bg-slate-100 dark:bg-[#2f2f2f] border border-transparent focus-within:border-slate-300 dark:focus-within:border-slate-600 rounded-3xl shadow-lg transition duration-200 overflow-hidden p-2">
            
            {/* Image Preview Area */}
            {previewUrl && (
              <div className="px-3 pt-3 pb-1">
                <div className="relative inline-block group">
                  <img src={previewUrl} alt="Upload preview" className="h-16 w-16 object-cover rounded-2xl shadow-sm border border-slate-200/50 dark:border-white/10" />
                  <button
                    onClick={() => setImageFile(null)}
                    className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition shadow hover:bg-slate-700"
                    title="Remove image"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Input & Actions */}
            <div className="flex items-end gap-2 px-1 pb-1">
              
              {/* Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 mb-0.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition shrink-0 rounded-full hover:bg-slate-200 dark:hover:bg-white/10"
                title="Attach image"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>

              {/* Text Input */}
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={imageFile ? "Image details..." : "Ask your doubt..."}
                className="flex-1 bg-transparent border-none outline-none resize-none min-h-[40px] py-2.5 text-[color:var(--text)] placeholder-slate-500/80 text-sm font-medium"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!loading && (input.trim() || imageFile)) {
                      handleSend();
                    }
                  }
                }}
              />

              {/* Right Actions: Mic and Send */}
              <div className="flex items-center gap-1.5 mb-1 shrink-0">
                {voiceSupported && (
                  <button
                    type="button"
                    onClick={toggleVoiceMode}
                    className={`p-2 transition rounded-full shrink-0 ${
                      voiceMode 
                        ? "text-red-500 bg-red-100 dark:bg-red-900/30" 
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10"
                    }`}
                    title="Voice Mode"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                )}

                {/* Send Button */}
                <button
                  onClick={() => handleSend()}
                  disabled={loading || (!input.trim() && !imageFile)}
                  className="h-8 w-8 mr-1 flex items-center justify-center rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed bg-black text-white dark:bg-white dark:text-black hover:opacity-80 shadow-sm"
                  title="Send message"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Report Issue Modal Dialog Popup */}
      {feedbackModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-40">
          <div className="glass-card rounded-2xl max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4">
            <div>
              <h3 className="font-extrabold text-sm text-[color:var(--text)]">Report an Issue</h3>
              <p className="text-[10px] text-[color:var(--muted)] mt-1">Help improve the AI tutor. Tell us what is incorrect or could be improved about this explanation.</p>
            </div>
            
            <textarea
              placeholder="e.g. Typo in the math equation, incorrect step calculation, formatting is broken..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="w-full h-24 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-soft)]/50 px-3 py-2 text-xs outline-none focus:border-purple-500 focus:bg-[color:var(--surface)]"
            />

            <div className="flex gap-2 justify-end text-xs">
              <button
                onClick={() => setFeedbackModalOpen(false)}
                className="rounded-full border border-[color:var(--border)] px-4 py-1.5 font-bold hover:bg-[color:var(--surface-soft)]"
              >
                Cancel
              </button>
              <button
                onClick={handleFeedbackSubmit}
                className="rounded-full bg-purple-600 text-white px-4 py-1.5 font-bold hover:bg-purple-700"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
