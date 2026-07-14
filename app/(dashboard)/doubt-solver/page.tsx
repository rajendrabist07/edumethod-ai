"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ThemeToggle } from "../../components/theme-toggle";

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
        } shrink-0 bg-[color:var(--surface)] border-r border-[color:var(--border)]/70 transition-all duration-300 overflow-hidden flex flex-col h-screen z-20 md:relative fixed inset-y-0 left-0 md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-4 border-b border-[color:var(--border)]/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold shadow-md">D</span>
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
            ➕ New Conversation
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
                className={`w-full text-left px-3 py-2.5 rounded-lg text-2xs font-semibold truncate block transition duration-200 ${
                  s.id === sessionId
                    ? "bg-purple-600/10 border border-purple-500/20 text-purple-700 dark:text-purple-300"
                    : "hover:bg-[color:var(--surface-soft)] text-[color:var(--muted)]"
                }`}
              >
                💬 {s.title}
              </button>
            ))
          )}
        </div>
      </aside>

      {/* 2. Main Chat Panel Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 relative">
        
        {/* Navigation Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-[color:var(--border)]/35 bg-[color:var(--surface)]/70 px-4 py-3.5 shadow-sm backdrop-blur-md z-10 sm:px-6">
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
              <span className="hidden sm:flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-red-500 text-xs font-bold text-white shadow-md">D</span>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-purple-600">Doubt Solver</p>
                <p className="text-[10px] text-[color:var(--muted)] font-semibold">ChatGPT/Claude Level</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/upload"
              className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4.5 py-2 text-2xs font-extrabold text-[color:var(--text)] transition hover:bg-[color:var(--surface-soft)] active:scale-95 sm:text-xs"
            >
              Back to Study
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
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 text-[color:var(--muted)] my-auto">
              <div className="mb-4 text-5xl animate-bounce">💬</div>
              <h2 className="font-black text-base text-[color:var(--text)] mb-2">Ask Your Doubts</h2>
              <p className="max-w-xs text-xs leading-5">Ask text questions, upload homework equations, or turn on the microphone to speak live like ChatGPT.</p>
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
                          : "bg-[color:var(--surface)] text-[color:var(--text)] border border-[color:var(--border)]/70 rounded-tl-none"
                      }`}
                    >
                      {m.content}
                    </div>

                    {/* Thumbs up/down feedback tools under AI bubble */}
                    {!isUser && (
                      <div className="flex items-center gap-2 mt-1.5 px-2 text-[10px] text-[color:var(--muted)]">
                        <button
                          onClick={() => submitFeedback(i, "like")}
                          className={`hover:text-green-500 transition duration-150 active:scale-90 font-bold flex items-center gap-1 ${
                            m.feedback === "like" ? "text-green-600 font-black" : ""
                          }`}
                        >
                          👍 Like
                        </button>
                        <span className="text-[color:var(--border)]">|</span>
                        <button
                          onClick={() => handleDislikeClick(i)}
                          className={`hover:text-red-500 transition duration-150 active:scale-90 font-bold flex items-center gap-1 ${
                            m.feedback === "dislike" ? "text-red-600 font-black" : ""
                          }`}
                        >
                          👎 Dislike {m.feedbackText && "• feedback saved"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
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

        {/* 3. Floating Voice Conversation Mode overlay card */}
        {voiceMode && (
          <div className="absolute right-4 bottom-24 bg-[color:var(--surface)] border border-purple-500/30 rounded-2xl p-4 shadow-xl w-60 z-30 backdrop-blur-md animate-fade-in flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[color:var(--border)]/40 pb-2">
              <span className="text-2xs font-bold text-purple-600 tracking-wide">🎙️ Voice Mode Active</span>
              <button
                onClick={toggleVoiceMode}
                className="text-2xs text-red-500 font-bold active:scale-90"
              >
                Close
              </button>
            </div>
            
            {/* Visual soundwave animation */}
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="flex items-end gap-1 h-8 mb-3">
                <span className={`w-1 rounded-full bg-purple-600 ${voiceState === 'listening' ? 'animate-pulse h-6' : voiceState === 'speaking' ? 'animate-bounce h-8' : 'h-2'}`}></span>
                <span className={`w-1 rounded-full bg-purple-600 ${voiceState === 'listening' ? 'animate-pulse h-4' : voiceState === 'speaking' ? 'animate-bounce h-6' : 'h-2'}`} style={{ animationDelay: "100ms" }}></span>
                <span className={`w-1 rounded-full bg-purple-600 ${voiceState === 'listening' ? 'animate-pulse h-7' : voiceState === 'speaking' ? 'animate-bounce h-7' : 'h-2'}`} style={{ animationDelay: "200ms" }}></span>
                <span className={`w-1 rounded-full bg-purple-600 ${voiceState === 'listening' ? 'animate-pulse h-5' : voiceState === 'speaking' ? 'animate-bounce h-5' : 'h-2'}`} style={{ animationDelay: "300ms" }}></span>
              </div>
              <p className="text-3xs font-extrabold text-[color:var(--text)] uppercase tracking-widest">
                {voiceState === 'listening' && "🔴 Listening..."}
                {voiceState === 'speaking' && "🔊 Speaking..."}
                {voiceState === 'thinking' && "⚡ Thinking..."}
                {voiceState === 'idle' && "💤 Tap microphone to talk"}
              </p>
            </div>

            {voiceState === 'idle' && (
              <button
                onClick={startVoiceListening}
                className="w-full bg-purple-600 text-white text-2xs font-bold py-2 rounded-xl hover:bg-purple-700 active:scale-95"
              >
                🎙️ Speak Now
              </button>
            )}
          </div>
        )}

        {/* Input box pinned to bottom */}
        <div className="shrink-0 p-4 bg-[color:var(--surface)]/50 border-t border-[color:var(--border)]/35 backdrop-blur-md flex flex-col gap-3">
          
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

          <div className="flex gap-2">
            
            {/* Image attachment trigger */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex shrink-0 h-12 w-12 items-center justify-center rounded-xl border border-[color:var(--border)] transition duration-200 active:scale-95 ${
                imageFile 
                  ? "bg-blue-100 text-blue-700 border-blue-400 dark:bg-blue-950/65 dark:text-blue-300"
                  : "bg-[color:var(--surface-soft)]/50 text-[color:var(--muted)] hover:border-purple-500/50 hover:text-purple-600"
              }`}
              title="Attach homework/syllabus screenshot"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="h-5.5 w-5.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </button>

            {/* Voice Conversation Activation microphone trigger */}
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleVoiceMode}
                className={`flex shrink-0 h-12 w-12 items-center justify-center rounded-xl border border-[color:var(--border)] transition duration-200 active:scale-95 ${
                  voiceMode 
                    ? "bg-purple-100 text-purple-700 border-purple-400 dark:bg-purple-950/65 dark:text-purple-300 animate-pulse"
                    : "bg-[color:var(--surface-soft)]/50 text-[color:var(--muted)] hover:border-purple-500/50 hover:text-purple-600"
                }`}
                title="Speak live like ChatGPT"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="h-5.5 w-5.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              </button>
            )}

            {/* Input field */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={imageFile ? "Add details or a question about this image..." : "Ask your step-by-step doubt..."}
              className="flex-1 border border-[color:var(--border)] rounded-xl px-4 py-3 text-xs sm:text-sm bg-[color:var(--surface-soft)]/50 text-[color:var(--text)] outline-none transition duration-200 focus:border-purple-500 focus:bg-[color:var(--surface)] focus:ring-4 focus:ring-purple-500/10"
              onKeyDown={(e) =>
                e.key === "Enter" && !loading && handleSend()
              }
            />

            {/* Send button */}
            <button
              onClick={() => handleSend()}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl px-5 py-3 text-xs sm:text-sm font-bold shadow-md shadow-purple-500/20 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition active:scale-95 shrink-0"
            >
              Send
            </button>
          </div>
        </div>

      </div>

      {/* 4. Feedback Modal Dialog Popup */}
      {feedbackModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-40">
          <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-2xl max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4">
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
