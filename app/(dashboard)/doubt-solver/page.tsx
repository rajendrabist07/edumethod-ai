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
import { useLayout } from "@/components/layout/LayoutContext";
import { Moon, Radio, TriangleAlert, UserRound, Volume2, Zap } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  timestamp?: string;
  feedback?: "up" | "down";
  feedbackText?: string;
}

type TutorEffort = "low" | "medium" | "high" | "extra";

const effortOptions: Array<{ value: TutorEffort; label: string; hint: string }> = [
  { value: "low", label: "Low", hint: "Fast answer" },
  { value: "medium", label: "Medium", hint: "Balanced" },
  { value: "high", label: "High", hint: "Detailed" },
  { value: "extra", label: "Extra", hint: "Deep reasoning" },
];

export default function DoubtSolverPage() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get("sessionId");
  const { setMobileOpen } = useLayout();

  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [tutorEffort, setTutorEffort] = useState<TutorEffort>("medium");
  const [showEffortMenu, setShowEffortMenu] = useState(false);
  
  // Voice Selection states
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [preferredGender, setPreferredGender] = useState<"male" | "female">("female");

  // Feedback Modal states
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackIndex, setFeedbackIndex] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);

  // Edit Message states
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speechUtteranceRef = useRef<any>(null);
  const accumulatedTextRef = useRef("");
  const ttsBufferRef = useRef("");

  // Auto scroll to latest messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, voiceState]);

  // Handle image preview URL
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setTimeout(() => {
        setPreviewUrl(url);
      }, 0);
      return () => URL.revokeObjectURL(url);
    } else {
      setTimeout(() => {
        setPreviewUrl(null);
      }, 0);
    }
  }, [imageFile]);

  // Check speech support and load voices
  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const speechSupported = !!SpeechRecognition && !!window.speechSynthesis;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVoiceSupported(speechSupported);

      if (speechSupported) {
        const loadVoices = () => {
          const voices = window.speechSynthesis.getVoices();
          if (voices.length > 0) {
            const goodVoices = voices.filter(v => v.lang.startsWith("en") || v.lang.startsWith("hi") || v.lang.startsWith("ne"));
            setAvailableVoices(goodVoices);
          }
        };
        
        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = loadVoices;
        }
      }
    }
  }, []);

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

  // Sync with search parameter to resume conversations
  useEffect(() => {
    if (sessionIdParam) {
      setTimeout(() => {
        loadSession(sessionIdParam);
      }, 0);
    } else {
      setTimeout(() => {
        setSessionId("");
        setMessages([]);
        setInput("");
        setImageFile(null);
        setError("");
      }, 0);
    }
  }, [sessionIdParam]);

  // Helper to guess voice gender
  function getVoiceGender(voice: SpeechSynthesisVoice): "male" | "female" | "unknown" {
    const name = voice.name.toLowerCase();
    if (/(female|samantha|karen|veena|lekha|zira|victoria|kalpana|swara|aditi|raveena|moira|tessa|monica|melina|ava|susan)/i.test(name)) return "female";
    if (/(male|alex|daniel|rishi|david|george|hemant|madhur|amit|neil|brian|arthur|aaron|mark)/i.test(name)) return "male";
    return "unknown"; 
  }



  // Voice recognition activation logic (with interruption handling)
  function startVoiceListening() {
    if (!voiceSupported) return;
    
    // Explicitly cancel any ongoing speech to allow interruption
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setVoiceState("idle");

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
  function speakResponse(text: string, isStreamingChunk = false, isLastChunk = false) {
    if (!voiceSupported || !window.speechSynthesis) return;

    // Only cancel if this is a standalone explicit command, not part of a stream queue
    if (!isStreamingChunk) {
      window.speechSynthesis.cancel();
    }

    // Clean text
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/[*_#\-]/g, "")
      .trim();

    if (!cleanText) {
      if (isLastChunk) {
        setVoiceState("idle");
        if (voiceMode) setTimeout(() => startVoiceListening(), 400);
      }
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Dynamic Language Detection & Tone Matching
    // If the text contains Hindi/Nepali characters, we MUST use a hi/ne voice.
    const isDevanagari = /[\u0900-\u097F]/.test(cleanText);
    const targetLangPattern = isDevanagari ? /^(hi|ne)/ : /^en/;

    // 1. Try exact match: Language + Gender
    let bestVoice = availableVoices.find(v => targetLangPattern.test(v.lang) && getVoiceGender(v) === preferredGender);
    
    // 2. Try partial match: Language + Unknown Gender (Better to have correct language than wrong language with right gender)
    if (!bestVoice) bestVoice = availableVoices.find(v => targetLangPattern.test(v.lang) && getVoiceGender(v) === "unknown");
    
    // 3. Try partial match: Any voice matching Language
    if (!bestVoice) bestVoice = availableVoices.find(v => targetLangPattern.test(v.lang));
    
    // 4. Fallback: If no language matched, just match gender
    if (!bestVoice) bestVoice = availableVoices.find(v => getVoiceGender(v) === preferredGender);

    if (bestVoice) {
      utterance.voice = bestVoice;
    } else {
      utterance.lang = isDevanagari ? "hi-IN" : "en-US";
    }
    
    utterance.rate = 1.05;

    utterance.onstart = () => {
      setVoiceState("speaking");
    };

    utterance.onend = () => {
      if (!isStreamingChunk || isLastChunk) {
        setVoiceState("idle");
        if (voiceMode) {
          setTimeout(() => startVoiceListening(), 400);
        }
      }
    };

    utterance.onerror = (e) => {
      console.error("Speech synthesis error:", e);
      if (!isStreamingChunk || isLastChunk) {
        setVoiceState("idle");
      }
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

  const handleDownloadImage = (url: string, filename: string = "download.jpg") => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Message Send & Stream response logic
  async function handleSend(forcedInput?: string, isRegenerate = false, truncateHistoryAtIndex?: number) {
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
    
    setMessages((prev) => {
      if (truncateHistoryAtIndex !== undefined) {
        return [...prev.slice(0, truncateHistoryAtIndex), userMessage];
      }
      return [...prev, userMessage];
    });
    
    setInput("");

    try {
      const payload: {
        sessionId?: string;
        message: string;
        imageBase64?: string;
        mimeType?: string;
        regenerate?: boolean;
        truncateHistoryAtIndex?: number;
        isVoiceMode?: boolean;
        effort?: TutorEffort;
      } = { message: textToSend || "Analyze the attached image." };

      if (sessionId) payload.sessionId = sessionId;
      if (isRegenerate) payload.regenerate = true;
      if (truncateHistoryAtIndex !== undefined) payload.truncateHistoryAtIndex = truncateHistoryAtIndex;
      if (voiceMode) payload.isVoiceMode = true;
      payload.effort = tutorEffort;

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

      accumulatedTextRef.current = "";
      ttsBufferRef.current = "";

      while (true) {
        const { value, done } = await reader.read();
        
        if (done) {
          // Speak remainder if any
          if (voiceMode && ttsBufferRef.current.trim()) {
            speakResponse(ttsBufferRef.current, true, true);
          } else if (voiceMode) {
            // Trigger loopback if we just finished streaming and buffer was empty
            speakResponse("", true, true);
          }
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        accumulatedTextRef.current += chunk;

        if (voiceMode) {
          ttsBufferRef.current += chunk;
          // Split by punctuation or newline to dispatch sentences
          if (/[.?!]\s|\n/.test(ttsBufferRef.current)) {
            const sentences = ttsBufferRef.current.split(/(?<=[.?!]\s|\n)/);
            for (let i = 0; i < sentences.length - 1; i++) {
              if (sentences[i].trim()) {
                speakResponse(sentences[i], true, false);
              }
            }
            ttsBufferRef.current = sentences[sentences.length - 1]; // keep remainder
          }
        }

        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.role === "assistant") {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...lastMsg,
              content: accumulatedTextRef.current,
            };
            return updated;
          } else {
            return [...prev, { role: "assistant", content: accumulatedTextRef.current }];
          }
        });
      }

      if (!voiceMode) {
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
    <main className="relative h-full flex flex-col text-prism-text overflow-hidden bg-slate-50 dark:bg-[#0a0a0a]">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:42px_42px] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.10),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.72),rgba(248,250,252,0.92))] dark:bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.16),transparent_40%),linear-gradient(180deg,rgba(10,10,10,0.84),rgba(10,10,10,0.96))]" />
      </div>
      
      {/* Main Chat Panel Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative z-10">
        
        {/* Navigation Header */}
        <header className="flex shrink-0 items-center justify-between px-3 sm:px-5 py-2.5 sm:py-4 bg-prism-surface border-b border-prism-border z-20 transition-colors">
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Mobile Hamburger Drawer Toggle */}
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 mr-1 rounded-xl border border-prism-border hover:bg-prism-surface/70 text-prism-text transition active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-accent lg:hidden shrink-0"
              aria-label="Open Workspace Navigation Drawer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            {/* Logo and title */}
            <div className="flex items-center gap-2">
              <Logo size={24} className="sm:w-[26px] sm:h-[26px]" />
              <div>
                <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.2em] text-prism-accent leading-none">Doubt Solver</p>
                <p className="text-[9px] sm:text-[10px] text-prism-muted font-bold uppercase tracking-wider mt-0.5 leading-none">Active Cognition</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className="rounded-full border border-prism-border bg-prism-surface p-1.5 sm:px-4.5 sm:py-2 text-prism-text transition hover:bg-prism-surface/70 active:scale-95 flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-accent"
              title="Back to study dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="h-4 w-4 sm:h-4.5 sm:w-4.5">
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
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-700 dark:border-red-950/40 dark:bg-red-950/45 dark:text-red-400 shrink-0">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-6 my-auto max-w-xl mx-auto w-full select-none animate-in fade-in zoom-in-95 duration-500">
              {/* Pulsing neural cognition graphics icon */}
              <div className="mb-8 relative">
                <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-2xl animate-pulse" />
                <div className="relative p-5 rounded-3xl bg-prism-surface border border-prism-border shadow-md text-purple-600 dark:text-purple-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-10 h-10 animate-spin-slow">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.467 5.99 5.99 0 0 0-1.925 3.546 5.974 5.974 0 0 1-2.133-1A3.75 3.75 0 0 0 12 18Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75a3.75 3.75 0 1 1 0-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
              </div>
              
              <h2 className="font-black text-lg tracking-tight text-prism-text mb-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
                Start with any doubt
              </h2>
              <p className="text-2xs font-semibold text-prism-muted leading-relaxed max-w-sm mb-8">
                Ask any question, paste a syllabus topic, or scan a complex diagram. Your tutor will match your language and concept depth automatically.
              </p>

              {/* Quick action prompt badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full">
                {[
                  {
                    title: "Solve Calculus Limit",
                    desc: "Calculate lim x->0 sin(x)/x step-by-step",
                    prompt: "Solve the limit equation: \\lim_{x \\to 0} \\frac{\\sin x}{x} = 1 step-by-step."
                  },
                  {
                    title: "Biology Processes",
                    desc: "Explain the cellular respiration cycle",
                    prompt: "Explain the process of cellular respiration in clear, simplified biology terms."
                  },
                  {
                    title: "Physics Equation",
                    desc: "Explain the force formula F = ma",
                    prompt: "Explain Newton's second law of motion and explain its equation $F = ma$ with examples."
                  }
                ].map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(action.prompt)}
                    className="p-4 rounded-2xl border border-prism-border/50 bg-prism-surface/40 hover:bg-prism-surface/80 text-left transition-all duration-300 hover:border-prism-accent/30 hover:-translate-y-0.5 hover:shadow-sm active:scale-98 cursor-pointer group"
                  >
                    <p className="text-[10px] font-black text-prism-text uppercase tracking-wider mb-1.5 transition-colors group-hover:text-prism-accent">{action.title}</p>
                    <p className="text-4xs font-semibold text-prism-muted leading-relaxed">{action.desc}</p>
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
                        <div className="flex items-center gap-2.5 mb-2.5 px-1">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-md text-white border border-white/10">
                            <ChatSparkIcon size={13} />
                          </div>
                          <span className="text-[11px] font-black tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-indigo-500">AI Tutor</span>
                        </div>
                      )}
                      
                      {/* Message Bubble Container */}
                      <div className="flex flex-col gap-2 w-full">
                        {/* If User Image exists, render it elegantly like the first image */}
                        {isUser && m.imageUrl && (
                          <div className="flex justify-end gap-2 mb-1">
                            <img 
                              src={m.imageUrl} 
                              alt="Uploaded attachment" 
                              onClick={() => handleDownloadImage(m.imageUrl as string, "edumethod_image.jpg")}
                              className="h-36 w-auto max-w-[220px] object-cover rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm cursor-pointer hover:opacity-90 hover:shadow-md transition active:scale-95" 
                            />
                          </div>
                        )}
                        
                        {/* Text Bubble & Edit Inline Input */}
                        {editingMessageIndex === i ? (
                          <div className="flex flex-col gap-3 w-full bg-slate-800 dark:bg-[#262626] rounded-3xl p-4 border border-white/10 shadow-sm mt-1">
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="w-full bg-transparent text-white resize-none outline-none text-[13.5px] font-medium placeholder-slate-400"
                              rows={3}
                              autoFocus
                            />
                            <div className="flex justify-end gap-2.5 mt-1">
                              <button 
                                onClick={() => setEditingMessageIndex(null)}
                                className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold tracking-wide transition active:scale-95"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={() => {
                                  if (editingText.trim() === m.content.trim()) {
                                    setEditingMessageIndex(null);
                                    return;
                                  }
                                  setEditingMessageIndex(null);
                                  handleSend(editingText, false, i);
                                }}
                                className="px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-bold tracking-wide transition shadow-sm active:scale-95"
                              >
                                Save & Submit
                              </button>
                            </div>
                          </div>
                        ) : m.content ? (
                          <div
                            className={`p-4.5 text-[13.5px] font-medium leading-relaxed transition-all duration-300 shadow-sm ${
                              isUser
                                ? "bg-gradient-to-br from-slate-800 to-slate-900 dark:from-[#2a2a2a] dark:to-[#1f1f1f] text-white rounded-[24px] rounded-br-sm shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-700/50 dark:border-white/5"
                                : `bg-prism-surface backdrop-blur border border-prism-border text-prism-text rounded-[24px] rounded-tl-sm shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${
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
                                  code({ className, children, ...props }: React.ComponentPropsWithoutRef<"code">) {
                                    const inline = !className;
                                    return !inline ? (
                                      <pre className="bg-slate-50 dark:bg-[#0d0d0d] border border-slate-200 dark:border-white/10 rounded-xl p-3.5 my-3 overflow-x-auto text-[11px] font-mono leading-normal shadow-inner">
                                        <code className={className} {...props}>
                                          {children}
                                        </code>
                                      </pre>
                                    ) : (
                                      <code className="bg-slate-100 dark:bg-white/10 border border-slate-200/60 dark:border-white/10 rounded px-1.5 py-0.5 text-[11px] font-mono tracking-tight" {...props}>
                                        {children}
                                      </code>
                                    );
                                  },
                                  ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1.5 marker:text-purple-500">{children}</ul>,
                                  ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1.5 marker:text-purple-500 marker:font-bold">{children}</ol>,
                                  li: ({ children }) => <li className="text-[14px] font-medium text-prism-text leading-relaxed tracking-tight">{children}</li>,
                                  p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-[14px] tracking-tight">{children}</p>,
                                  h1: ({ children }) => <h1 className="text-base font-extrabold mt-5 mb-2.5 uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">{children}</h1>,
                                  h2: ({ children }) => <h2 className="text-[14px] font-bold mt-4 mb-2 uppercase tracking-widest text-indigo-600 dark:text-indigo-400">{children}</h2>,
                                  h3: ({ children }) => <h3 className="text-[13px] font-bold mt-3 mb-1 uppercase tracking-widest text-purple-600 dark:text-purple-400">{children}</h3>,
                                }}
                              >
                                {m.content}
                              </ReactMarkdown>
                            )}
                          </div>
                        ) : null}
                        
                        {/* Copy & Edit tools for User Bubble */}
                        {isUser && m.content && (
                          <div className="flex items-center justify-end gap-1 mt-0.5 px-1 opacity-60 hover:opacity-100 transition-opacity duration-200 select-none">
                            <button
                              onClick={() => handleCopyMessage(i, m.content)}
                              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition active:scale-95"
                              title="Copy"
                            >
                              {copiedIndex === i ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4 text-green-500">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="w-3.5 h-3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.875V18a2.25 2.25 0 002.25 2.25h5.25a2.25 2.25 0 002.25-2.25V7.875a2.25 2.25 0 00-2.25-2.25H9a2.25 2.25 0 00-2.25 2.25z" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setEditingMessageIndex(i);
                                setEditingText(m.content);
                              }}
                              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition active:scale-95"
                              title="Edit"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.89 1.12l-2.827.94a.75.75 0 01-.95-.95l.94-2.827a4.5 4.5 0 011.12-1.89l13.637-13.637zM16.862 4.487L19.5 7.125" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    {/* Thumbs up/down feedback tools under AI bubble */}
                    {!isUser && (
                      <div className="flex items-center gap-1 mt-1 px-1 text-prism-muted relative select-none">
                        
                        {/* 1. Like rating - Circle Checkmark (Green Glow) */}
                        <button
                          onClick={() => submitFeedback(i, "up")}
                          className={`p-1 rounded-lg border border-transparent transition duration-150 active:scale-90 ${
                            m.feedback === "up" 
                              ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.25)]" 
                              : "text-prism-muted hover:bg-prism-surface/70 hover:text-emerald-500"
                          }`}
                          title="Correct/Helpful explanation"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-3.5 w-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>

                        {/* 2. Dislike rating - Circle Cross (Red Glow) */}
                        <button
                          onClick={() => submitFeedback(i, "down")}
                          className={`p-1 rounded-lg border border-transparent transition duration-150 active:scale-90 ${
                            m.feedback === "down" 
                              ? "text-rose-500 bg-rose-500/10 border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.25)]" 
                              : "text-prism-muted hover:bg-prism-surface/70 hover:text-rose-500"
                          }`}
                          title="Incorrect/Bad explanation"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-3.5 w-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                          </svg>
                        </button>

                        {/* 3. Regenerate button */}
                        <button
                          onClick={() => handleRegenerateMessage(i)}
                          className="p-1 rounded-lg hover:bg-prism-surface/70 hover:text-purple-500 transition duration-150 active:scale-90"
                          title="Regenerate reply"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="h-3.5 w-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                          </svg>
                        </button>

                        {/* 4. Copy Message */}
                        <button
                          onClick={() => handleCopyMessage(i, m.content)}
                          className="p-1 rounded-lg hover:bg-prism-surface/70 hover:text-purple-500 transition duration-150 active:scale-90"
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
                            className="p-1 rounded-lg hover:bg-prism-surface/70 hover:text-purple-500 transition duration-150 active:scale-90"
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
                              <div className="absolute left-0 mt-1 w-36 glass-card rounded-xl shadow-xl z-20 border border-prism-border/45 bg-prism-surface p-1.5 flex flex-col gap-1 text-[11px] font-bold">
                                <button
                                  onClick={() => {
                                    speakResponse(m.content);
                                    setActiveDropdownIndex(null);
                                  }}
                                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-prism-surface/70 text-prism-text transition flex items-center gap-1.5"
                                >
                                  <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                                  Read Aloud
                                </button>
                                <button
                                  onClick={() => {
                                    handleReportClick(i);
                                    setActiveDropdownIndex(null);
                                  }}
                                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-prism-surface/70 text-red-500 hover:text-red-600 transition flex items-center gap-1.5"
                                >
                                  <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
                                  Report Issue
                                </button>
                                <button
                                  onClick={() => {
                                    handleShareMessage(i, m.content);
                                    setActiveDropdownIndex(null);
                                  }}
                                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-prism-surface/70 text-prism-text transition flex items-center gap-1.5"
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
              <span className="text-[9px] font-black uppercase tracking-wider text-prism-muted mb-1 px-1">
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
            
            {/* Header with Voice Selection */}
            <div className="w-full flex items-center justify-between max-w-lg">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-500 animate-ping"></span>
                  <span className="text-[10px] font-extrabold tracking-widest uppercase text-purple-400">Tutor Active</span>
                </div>
                <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-1 shadow-inner overflow-hidden">
                  <button
                    onClick={() => setPreferredGender("male")}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-full transition-all duration-300 ${
                      preferredGender === "male" 
                        ? "bg-purple-500 text-white shadow-md shadow-purple-500/20" 
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      <UserRound className="h-3 w-3" aria-hidden="true" />
                      Male
                    </span>
                  </button>
                  <button
                    onClick={() => setPreferredGender("female")}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-full transition-all duration-300 ${
                      preferredGender === "female" 
                        ? "bg-purple-500 text-white shadow-md shadow-purple-500/20" 
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      <UserRound className="h-3 w-3" aria-hidden="true" />
                      Female
                    </span>
                  </button>
                </div>
              </div>
              <button
                onClick={toggleVoiceMode}
                className="p-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 active:scale-95 transition text-xs font-bold flex items-center gap-1.5 shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-3.5 w-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="hidden sm:inline">Exit Voice</span>
              </button>
            </div>

            {/* Glowing Liquid Morphing Orb */}
            <div className="relative flex-1 flex flex-col items-center justify-center">
              {/* Outer concentric pulsing glow rings */}
              <div className={`absolute w-48 h-48 sm:w-64 sm:h-64 rounded-full transition-all duration-1000 blur-2xl ${
                voiceState === 'listening' ? 'bg-cyan-500/30 scale-125 opacity-100' :
                voiceState === 'speaking' ? 'bg-indigo-500/25 scale-135 opacity-90 animate-pulse' :
                voiceState === 'thinking' ? 'bg-purple-500/20 scale-110 opacity-80' :
                'bg-slate-500/10 scale-95 opacity-40'
              }`} />
              <div className={`absolute w-36 h-36 sm:w-48 sm:h-48 rounded-full transition-all duration-1000 blur-xl ${
                voiceState === 'listening' ? 'bg-blue-600/20 scale-115 opacity-100' :
                voiceState === 'speaking' ? 'bg-pink-500/20 scale-120 opacity-95' :
                voiceState === 'thinking' ? 'bg-cyan-500/15 scale-105 opacity-85 animate-pulse' :
                'bg-slate-600/10 scale-90 opacity-30'
              }`} />

              {/* Central Multi-Layered Morphing Liquid Blob */}
              <button
                type="button"
                onClick={voiceState === 'idle' ? startVoiceListening : undefined}
                className="relative w-32 h-32 sm:w-44 sm:h-44 rounded-full flex items-center justify-center outline-none cursor-pointer focus:outline-none z-10 active:scale-95 transition-transform"
                title={voiceState === 'idle' ? "Tap to speak" : undefined}
              >
                {/* Layer 1: Base Morphing Blob */}
                <div className={`absolute inset-0 rounded-full transition-all duration-1000 opacity-80 blur-xs animate-morph-blob ${
                  voiceState === 'listening' ? 'bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 [animation-duration:6s] shadow-[0_0_50px_rgba(6,182,212,0.5)]' :
                  voiceState === 'speaking' ? 'bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-700 [animation-duration:5s] shadow-[0_0_50px_rgba(236,72,153,0.5)] animate-pulse' :
                  voiceState === 'thinking' ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 [animation-duration:8s] animate-spin-slow shadow-[0_0_40px_rgba(139,92,246,0.4)]' :
                  'bg-gradient-to-tr from-slate-700 via-slate-600 to-slate-500 [animation-duration:12s]'
                }`} />

                {/* Layer 2: Second Morphing Blob (Rotating, Offset Delay, Translucent) */}
                <div className={`absolute inset-1.5 rounded-full transition-all duration-1000 opacity-70 blur-xs animate-morph-blob [animation-delay:2s] [animation-duration:9s] ${
                  voiceState === 'listening' ? 'bg-gradient-to-br from-teal-300 via-cyan-400 to-blue-600' :
                  voiceState === 'speaking' ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-amber-400' :
                  voiceState === 'thinking' ? 'bg-gradient-to-br from-indigo-500 via-cyan-400 to-pink-500 [animation-duration:10s]' :
                  'bg-gradient-to-br from-slate-600 via-slate-500 to-slate-400 [animation-duration:15s]'
                }`} />

                {/* Layer 3: Core Inner Glowing Orb */}
                <div className={`absolute inset-3 rounded-full transition-all duration-1000 opacity-95 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_8px_24px_rgba(0,0,0,0.2)] flex items-center justify-center ${
                  voiceState === 'listening' ? 'bg-gradient-to-tr from-cyan-400 to-blue-500' :
                  voiceState === 'speaking' ? 'bg-gradient-to-tr from-rose-400 to-purple-600' :
                  voiceState === 'thinking' ? 'bg-gradient-to-tr from-purple-500 to-cyan-400' :
                  'bg-gradient-to-tr from-slate-500 to-slate-400'
                }`}>
                  {/* Visual indicators based on state */}
                  {voiceState === 'idle' && (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-8 w-8 text-white drop-shadow-md">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                  )}
                  {voiceState === 'listening' && (
                    <div className="flex gap-1 items-center justify-center">
                      <span className="w-1 bg-white h-4 rounded-full animate-bounce [animation-delay:0s] [animation-duration:0.6s]"></span>
                      <span className="w-1 bg-white h-6 rounded-full animate-bounce [animation-delay:0.15s] [animation-duration:0.6s]"></span>
                      <span className="w-1 bg-white h-4 rounded-full animate-bounce [animation-delay:0.3s] [animation-duration:0.6s]"></span>
                    </div>
                  )}
                  {voiceState === 'speaking' && (
                    <div className="flex gap-1.5 items-center justify-center">
                      <span className="w-1 bg-white h-3 rounded-full animate-pulse [animation-duration:0.5s]"></span>
                      <span className="w-1 bg-white h-6 rounded-full animate-pulse [animation-duration:0.3s]"></span>
                      <span className="w-1 bg-white h-8 rounded-full animate-pulse [animation-duration:0.4s]"></span>
                      <span className="w-1 bg-white h-6 rounded-full animate-pulse [animation-duration:0.3s]"></span>
                      <span className="w-1 bg-white h-3 rounded-full animate-pulse [animation-duration:0.5s]"></span>
                    </div>
                  )}
                  {voiceState === 'thinking' && (
                    <span className="h-6 w-6 rounded-full border-2 border-t-white border-r-transparent animate-spin"></span>
                  )}
                </div>
              </button>
            </div>

            {/* Footer Text status */}
            <div className="w-full max-w-md text-center flex flex-col gap-2 pb-6">
              <h3 className="inline-flex items-center justify-center gap-2 text-sm font-black tracking-widest uppercase">
                {voiceState === 'listening' && (
                  <>
                    <Radio className="h-4 w-4 text-red-300" aria-hidden="true" />
                    Listening...
                  </>
                )}
                {voiceState === 'speaking' && (
                  <>
                    <Volume2 className="h-4 w-4 text-cyan-200" aria-hidden="true" />
                    Speaking...
                  </>
                )}
                {voiceState === 'thinking' && (
                  <>
                    <Zap className="h-4 w-4 text-amber-200" aria-hidden="true" />
                    Thinking...
                  </>
                )}
                {voiceState === 'idle' && (
                  <>
                    <Moon className="h-4 w-4 text-white/70" aria-hidden="true" />
                    Connection Idle
                  </>
                )}
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
        <div className="shrink-0 w-full max-w-2xl sm:max-w-3xl mx-auto px-4 pb-6 bg-transparent z-30 relative">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="hidden"
          />

          <div className="relative flex flex-col bg-prism-surface backdrop-blur-xl border border-prism-border rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] transition-all duration-300 overflow-visible p-2.5">
            
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
                className="flex-1 bg-transparent border-0 !ring-0 focus:!ring-0 focus:!border-0 outline-none resize-none min-h-[40px] py-2.5 text-prism-text placeholder-slate-500/80 text-sm font-medium shadow-none focus:shadow-none"
                style={{ outline: "none", boxShadow: "none", borderColor: "transparent" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!loading && (input.trim() || imageFile)) {
                      handleSend();
                    }
                  }
                }}
              />

              {/* Right Actions: Popover Menu, Mic, and Send */}
              <div className="flex items-center gap-1.5 mb-1 shrink-0 relative">
                
                {/* Effort Selection Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEffortMenu(!showEffortMenu)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-prism-surface border border-prism-border hover:border-prism-accent/50 text-prism-text transition duration-200 cursor-pointer active:scale-95 shrink-0 select-none shadow-sm"
                    title="Configure tutor cognitive effort depth"
                  >
                    <span>Effort: {tutorEffort.charAt(0).toUpperCase() + tutorEffort.slice(1)}</span>
                    <svg
                      className={`w-3 h-3 opacity-70 transition-transform duration-200 ${showEffortMenu ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {showEffortMenu && (
                    <>
                      {/* Backdrop for closing popover */}
                      <div className="fixed inset-0 z-40" onClick={() => setShowEffortMenu(false)} />
                      <div className="absolute right-0 bottom-full mb-2 w-56 rounded-2xl border border-prism-border bg-white dark:bg-zinc-950 shadow-2xl p-2 z-[60] animate-in fade-in slide-in-from-bottom-2 duration-150">
                        {/* Model header option */}
                        <div className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-prism-accent/5 border border-prism-accent/15 select-none mb-1.5">
                          <div className="flex flex-col text-left">
                            <span className="text-[10px] font-black text-prism-accent tracking-wide uppercase">Tutor Mode</span>
                            <span className="text-xs font-extrabold text-prism-text mt-0.5">Active Cognition</span>
                          </div>
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-prism-accent/10 text-prism-accent">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          </div>
                        </div>

                        <div className="h-px bg-prism-border/40 my-1" />

                        {/* Effort Options List */}
                        <div className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-prism-muted/65 mb-1.5">
                          Cognitive Effort Depth
                        </div>

                        <div className="flex flex-col gap-0.5">
                          {effortOptions.map((option) => {
                            const isSelected = tutorEffort === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                  setTutorEffort(option.value);
                                  setShowEffortMenu(false);
                                }}
                                className={`flex items-start justify-between w-full px-2.5 py-1.5 rounded-xl text-xs text-left font-bold transition duration-150 active:scale-[0.98] ${
                                  isSelected
                                    ? "bg-prism-accent text-white shadow-sm"
                                    : "text-prism-muted hover:text-prism-text hover:bg-prism-base/50"
                                }`}
                              >
                                <div className="flex flex-col">
                                  <span>{option.label}</span>
                                  <span className={`text-[9px] font-medium leading-tight mt-0.5 ${isSelected ? "text-white/80" : "text-prism-muted"}`}>
                                    {option.hint}
                                  </span>
                                </div>
                                {isSelected && (
                                  <svg className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                  </svg>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>

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
                  className="h-8 w-8 mr-1 flex items-center justify-center rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed bg-black text-white dark:bg-white dark:text-black hover:opacity-80 shadow-sm cursor-pointer"
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
              <h3 className="font-extrabold text-sm text-prism-text">Report an Issue</h3>
              <p className="text-[10px] text-prism-muted mt-1">Help improve the AI tutor. Tell us what is incorrect or could be improved about this explanation.</p>
            </div>
            
            <textarea
              placeholder="e.g. Typo in the math equation, incorrect step calculation, formatting is broken..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="w-full h-24 rounded-xl border border-prism-border bg-prism-surface/70/50 px-3 py-2 text-xs outline-none focus:border-purple-500 focus:bg-prism-surface"
            />

            <div className="flex gap-2 justify-end text-xs">
              <button
                onClick={() => setFeedbackModalOpen(false)}
                className="rounded-full border border-prism-border px-4 py-1.5 font-bold hover:bg-prism-surface/70"
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
