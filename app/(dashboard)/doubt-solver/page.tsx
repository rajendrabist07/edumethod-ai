"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ThemeToggle } from "../../components/theme-toggle";
import { BrandMark } from "../../components/brand-mark";
import { Logo } from "@/components/ui/Logo";
import { ChatSparkIcon } from "@/components/icons/ChatSparkIcon";
import { CameraScanIcon } from "@/components/icons/CameraScanIcon";
import { SpacedRepetitionIcon } from "@/components/icons/SpacedRepetitionIcon";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  feedback?: "like" | "dislike";
  feedbackText?: string;
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
}

export default function DoubtSolverPage() {
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sidebar & Sessions history states
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Voice Interaction Mode states
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [voiceSupported, setVoiceSupported] = useState(false);

  // Feedback Modal states
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackIndex, setFeedbackIndex] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

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

  // Fetch list of user doubt sessions on load
  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    setLoadingSessions(true);
    try {
      const res = await fetch("/api/solve-doubt/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  }

  // Load a specific session
  async function loadSession(id: string) {
    if (loading) return;
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
    setSessionId("");
    setMessages([]);
    setInput("");
    setImageFile(null);
    setError("");
    
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setVoiceState("idle");
    }
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
  async function handleSend(forcedInput?: string) {
    const textToSend = forcedInput !== undefined ? forcedInput : input;
    if (!textToSend.trim() && !imageFile) return;

    setLoading(true);
    setError("");
    setVoiceState("thinking");

    const displayContent = imageFile 
      ? `[Image Attached: ${imageFile.name}]\n\n${textToSend}`
      : textToSend;

    const userMessage: ChatMessage = { role: "user", content: displayContent };
    setMessages((prev) => [...prev, userMessage]);
    
    setInput("");

    try {
      const payload: {
        sessionId?: string;
        message: string;
        imageBase64?: string;
        mimeType?: string;
      } = { message: textToSend || "Analyze the attached image." };

      if (sessionId) payload.sessionId = sessionId;

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
        // Refresh sidebar
        fetchSessions();
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

      // Append blank assistant block to begin stream writing
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      let accumulatedText = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: accumulatedText,
            };
          }
          return updated;
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

  // Message feedback thumbs up/down updates
  async function submitFeedback(index: number, feedback: "like" | "dislike", customText?: string) {
    if (!sessionId) return;

    try {
      const res = await fetch("/api/solve-doubt/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          messageIndex: index,
          feedback,
          feedbackText: customText,
        }),
      });

      if (res.ok) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            feedback,
            feedbackText: customText,
          };
          return updated;
        });
      }
    } catch (err) {
      console.error("Feedback submit error:", err);
    }
  }

  function handleDislikeClick(index: number) {
    setFeedbackIndex(index);
    setFeedbackText("");
    setFeedbackModalOpen(true);
  }

  function handleFeedbackSubmit() {
    if (feedbackIndex !== null) {
      submitFeedback(feedbackIndex, "dislike", feedbackText);
    }
    setFeedbackModalOpen(false);
    setFeedbackIndex(null);
  }

  return (
    <main className="grid-bg min-h-screen flex text-[color:var(--text)] transition-colors duration-300">
      
      {/* 1. Sidebar Panel (ChatGPT/Claude History) */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } shrink-0 bg-[color:var(--surface)]/90 backdrop-blur-xl border-r border-[color:var(--border)]/40 transition-all duration-300 overflow-hidden flex flex-col h-screen z-20 md:relative fixed inset-y-0 left-0 md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-4 border-b border-[color:var(--border)]/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Logo size={20} />
            <span className="font-extrabold text-xs tracking-wider uppercase text-purple-600">History</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-[color:var(--muted)] hover:text-purple-600 active:scale-90"
          >
            ✕
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3 shrink-0">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-purple-500/40 bg-purple-500/5 py-2.5 text-xs font-bold text-purple-600 hover:bg-purple-500/10 active:scale-98 transition duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Conversation
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 py-2">
          {loadingSessions ? (
            <div className="text-center text-3xs text-[color:var(--muted)] py-4 animate-pulse">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center text-3xs text-[color:var(--muted)] py-8">No previous doubts</div>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => loadSession(s.id)}
                className={`w-full flex items-center gap-2 text-left px-3 py-2.5 rounded-lg text-2xs font-semibold transition duration-200 ${
                  s.id === sessionId
                    ? "bg-purple-600/10 border border-purple-500/20 text-purple-700 dark:text-purple-300"
                    : "hover:bg-[color:var(--surface-soft)] text-[color:var(--muted)]"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-3.5 w-3.5 shrink-0 opacity-70">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025 10.386 10.386 0 0 1-2.164-3.13C2.662 14.302 2.25 13.181 2.25 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
                <span className="truncate">{s.title}</span>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* 2. Main Chat Panel Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 relative">
        
        {/* Navigation Header */}
        <header className="glass-card flex shrink-0 items-center justify-between px-4 py-3.5 shadow-sm z-10 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 border border-[color:var(--border)] rounded-xl bg-[color:var(--surface)] text-[color:var(--muted)] hover:border-purple-500/50 hover:text-purple-600 transition active:scale-95"
              aria-label="Toggle Sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-4.5 w-4.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            
            <div className="flex items-center gap-2">
              <Logo size={26} />
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-purple-600">Doubt Solver</p>
                <p className="text-[10px] text-[color:var(--muted)] font-bold uppercase tracking-wider">Active Cognition</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/upload"
              className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] p-2 sm:px-4.5 sm:py-2 text-[color:var(--text)] transition hover:bg-[color:var(--surface-soft)] active:scale-95 flex items-center justify-center gap-1.5"
              title="Back to study dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="h-4.5 w-4.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span className="hidden sm:inline text-xs font-bold">Back to Study</span>
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
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 text-[color:var(--muted)] my-auto max-w-sm mx-auto">
              <div className="mb-6 p-4.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 animate-pulse animate-duration-1000">
                <ChatSparkIcon size={36} />
              </div>
              <h2 className="font-extrabold text-sm tracking-wide uppercase text-[color:var(--text)] mb-2">Ask Your Doubts</h2>
              <p className="text-2xs font-semibold leading-relaxed">Submit homework equations, upload screenshots, or activate Voice mode to speak live with the tutor.</p>
            </div>
          ) : (
            <div className="space-y-6 flex-grow">
              {messages.map((m, i) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={i}
                    className={`flex flex-col max-w-[85%] sm:max-w-[80%] ${
                      isUser ? "self-end items-end ml-auto" : "self-start items-start mr-auto"
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider text-[color:var(--muted)] mb-1 px-1">
                      {isUser ? "You" : "AI Tutor"}
                    </span>
                    <div
                      className={`p-4 rounded-2xl text-xs font-semibold leading-relaxed whitespace-pre-wrap shadow-sm transition-all duration-300 ${
                        isUser
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-blue-500/5"
                          : "glass-card text-[color:var(--text)] rounded-tl-none"
                      }`}
                    >
                      {m.content}
                    </div>

                    {/* Thumbs up/down feedback tools under AI bubble */}
                    {!isUser && (
                      <div className="flex items-center gap-1.5 mt-1.5 px-1 text-[color:var(--muted)]">
                        <button
                          onClick={() => submitFeedback(i, "like")}
                          className={`p-1.5 rounded-lg hover:bg-[color:var(--surface-soft)] hover:text-green-500 transition duration-150 active:scale-90 ${
                            m.feedback === "like" ? "text-green-500 bg-green-500/10" : ""
                          }`}
                          title="Correct/Helpful explanation"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="h-4.5 w-4.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDislikeClick(i)}
                          className={`p-1.5 rounded-lg hover:bg-[color:var(--surface-soft)] hover:text-red-500 transition duration-150 active:scale-90 ${
                            m.feedback === "dislike" ? "text-red-500 bg-red-500/10" : ""
                          }`}
                          title="Incorrect/Bad explanation"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="h-4.5 w-4.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        {m.feedback === "dislike" && (
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full font-bold ml-1">
                            Feedback saved
                          </span>
                        )}
                      </div>
                    )}
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

        {/* Input box pinned to bottom */}
        <div className="shrink-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-[color:var(--surface)]/50 border-t border-[color:var(--border)]/35 backdrop-blur-md flex flex-col gap-3">
          
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="hidden"
          />

          {imageFile && (
            <div className="flex items-center justify-between rounded-xl bg-blue-50/70 border border-blue-200 px-4 py-2 text-2xs font-bold text-blue-700 dark:bg-blue-950/20 dark:border-blue-900/30">
              <span className="truncate max-w-[80%]">📎 File: {imageFile.name}</span>
              <button
                type="button"
                onClick={() => setImageFile(null)}
                className="text-red-500 hover:text-red-700 font-extrabold active:scale-90"
              >
                ✕ Remove
              </button>
            </div>
          )}

          <div className="flex gap-1.5 sm:gap-2">
            
            {/* Image attachment trigger */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex shrink-0 h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl border border-[color:var(--border)] transition duration-200 active:scale-95 ${
                imageFile 
                  ? "bg-blue-100 text-blue-700 border-blue-400 dark:bg-blue-950/65 dark:text-blue-300"
                  : "bg-[color:var(--surface-soft)]/50 text-[color:var(--muted)] hover:border-purple-500/50 hover:text-purple-600"
              }`}
              title="Attach homework or syllabus image"
            >
              <CameraScanIcon size={18} />
            </button>

            {/* Voice Conversation Activation microphone trigger */}
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleVoiceMode}
                className={`flex shrink-0 h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl border border-[color:var(--border)] transition duration-200 active:scale-95 ${
                  voiceMode 
                    ? "bg-purple-100 text-purple-700 border-purple-400 dark:bg-purple-950/65 dark:text-purple-300 animate-pulse"
                    : "bg-[color:var(--surface-soft)]/50 text-[color:var(--muted)] hover:border-purple-500/50 hover:text-purple-600"
                }`}
                title="Speak live using voice conversation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-4.5 w-4.5 sm:h-5.5 sm:w-5.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              </button>
            )}

            {/* Input field */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={imageFile ? "Image details..." : "Ask your step-by-step doubt..."}
              className="flex-1 border border-[color:var(--border)] rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-2xs sm:text-xs h-11 sm:h-12 bg-[color:var(--surface-soft)]/50 text-[color:var(--text)] outline-none transition duration-200 focus:border-purple-500 focus:bg-[color:var(--surface)] focus:ring-4 focus:ring-purple-500/10"
              onKeyDown={(e) =>
                e.key === "Enter" && !loading && handleSend()
              }
            />

            {/* Send button */}
            <button
              onClick={() => handleSend()}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl h-11 w-11 sm:h-12 sm:w-auto p-0 sm:px-5 sm:py-3 font-bold shadow-md shadow-purple-500/20 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition active:scale-95 shrink-0 flex items-center justify-center gap-1.5"
              title="Send question"
            >
              <span className="hidden sm:inline text-xs font-bold">Send</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-3.5 w-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>

      </div>

      {/* 4. Feedback Modal Dialog Popup */}
      {feedbackModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-40">
          <div className="glass-card rounded-2xl max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4">
            <div>
              <h3 className="font-extrabold text-sm text-[color:var(--text)]">Provide Feedback</h3>
              <p className="text-[10px] text-[color:var(--muted)] mt-1">Help improve the AI tutor. Tell us what could be improved about this explanation.</p>
            </div>
            
            <textarea
              placeholder="e.g. The math equation has a typo, too brief explanation, slow completion response..."
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
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
