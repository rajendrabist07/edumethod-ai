"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "../../../components/theme-toggle";
import { Logo } from "@/components/ui/Logo";
import { SpacedRepetitionIcon } from "@/components/icons/SpacedRepetitionIcon";
import { ArrowLeft, RefreshCw, CheckCircle2, ChevronRight, HelpCircle, Eye } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Card {
  id: string;
  front: string;
  back: string;
  isDue: boolean;
  interval: number;
}

interface Deck {
  id: string;
  subject: string;
  topic: string;
}

type PageParams = {
  deckId: string;
};

export default function FlashcardsReviewPage({ params }: { params: Promise<PageParams> }) {
  const router = useRouter();
  const { deckId } = use(params);

  const [deck, setDeck] = useState<Deck | null>(null);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [studySessionCards, setStudySessionCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [onlyDue, setOnlyDue] = useState(true);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [reviewsDone, setReviewsDone] = useState(0);

  // Statistics for session summary
  const [sessionStats, setSessionStats] = useState<Record<string, number>>({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });

  useEffect(() => {
    fetchDeckDetails();
  }, [deckId]);

  async function fetchDeckDetails() {
    try {
      const res = await fetch(`/api/flashcards/decks/${deckId}`);
      if (res.ok) {
        const data = await res.json();
        setDeck(data.deck);
        setAllCards(data.cards || []);
        
        // Filter cards initially
        const due = (data.cards || []).filter((c: Card) => c.isDue);
        if (due.length > 0) {
          setStudySessionCards(due);
          setOnlyDue(true);
        } else {
          setStudySessionCards(data.cards || []);
          setOnlyDue(false);
        }
      } else {
        toast.error("Failed to load flashcard deck");
        router.push("/flashcards");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error while loading deck");
    } finally {
      setLoading(false);
    }
  }

  function handleModeToggle() {
    setIsFlipped(false);
    setCurrentIndex(0);
    setSessionFinished(false);
    if (onlyDue) {
      // Switch to study all
      setStudySessionCards(allCards);
      setOnlyDue(false);
    } else {
      // Switch to study due only
      const due = allCards.filter((c) => c.isDue);
      if (due.length === 0) {
        toast.info("No cards are currently due for review. Showing all cards.");
        setStudySessionCards(allCards);
        setOnlyDue(false);
      } else {
        setStudySessionCards(due);
        setOnlyDue(true);
      }
    }
  }

  async function handleGrade(rating: "again" | "hard" | "good" | "easy") {
    if (studySessionCards.length === 0) return;

    const currentCard = studySessionCards[currentIndex];

    // Optimistically track stats
    setReviewsDone((prev) => prev + 1);
    setSessionStats((prev) => ({
      ...prev,
      [rating]: prev[rating] + 1,
    }));

    try {
      const res = await fetch("/api/flashcards/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: currentCard.id,
          rating,
        }),
      });

      if (!res.ok) {
        console.error("Failed to submit review rating to server");
      }
    } catch (err) {
      console.error("API error while submitting review:", err);
    }

    // Move to next card or finish session
    if (currentIndex < studySessionCards.length - 1) {
      setIsFlipped(false);
      // Wait for flip transition to reset before moving index to avoid seeing back of next card
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 250);
    } else {
      setSessionFinished(true);
    }
  }

  function handleRestart() {
    setIsFlipped(false);
    setCurrentIndex(0);
    setSessionFinished(false);
    setReviewsDone(0);
    setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });
    fetchDeckDetails(); // reload freshness
  }

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center h-screen bg-[color:var(--bg)]">
        <span className="h-6 w-6 rounded-full border-2 border-t-blue-500 border-r-transparent animate-spin"></span>
      </div>
    );
  }

  const activeCard = studySessionCards[currentIndex];
  const progressPercent = studySessionCards.length > 0 
    ? (currentIndex / studySessionCards.length) * 100 
    : 0;

  return (
    <main className="grid-bg h-full overflow-y-auto px-4 py-8 text-prism-text transition-colors duration-300 sm:px-6 sm:py-10 lg:px-8 bg-prism-base font-sans">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 h-full min-h-[80vh] justify-between animate-focus-lens">
        
        {/* Header Section */}
        <div className="space-y-4">
          <header className="glass-prism flex shrink-0 items-center justify-between px-4 py-3 rounded-2xl shadow-sm z-10">
            <div className="flex items-center gap-2 pl-12 lg:pl-0">
              <Logo size={24} />
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-prism-accent truncate max-w-[120px] font-mono">
                  {deck?.subject}
                </p>
                <p className="text-[9px] text-prism-muted font-bold uppercase tracking-wider font-mono">Flashcard Study</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Link
                href="/flashcards"
                className="rounded-full border border-prism-border bg-prism-surface p-2 text-prism-text hover:bg-white/5 active:scale-95 transition"
                title="Back to library"
              >
                <ArrowLeft size={14} />
              </Link>
              <ThemeToggle />
            </div>
          </header>

          {/* Session Progress Bar */}
          {!sessionFinished && studySessionCards.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-prism-muted font-mono">
                <span>
                  Studying: {onlyDue ? "Due reviews only" : "All cards"}
                </span>
                <span>
                  {currentIndex + 1} / {studySessionCards.length} Cards
                </span>
              </div>
              <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-prism-accent rounded-full" 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Active Study Area */}
        <div className="flex-1 flex flex-col justify-center py-6">
          {sessionFinished ? (
            /* Session Completed Screen */
            <motion.div 
              className="glass-prism rounded-3xl p-8 shadow-lg text-center space-y-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-16 h-16 bg-prism-accent/10 text-prism-accent rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-black text-prism-text font-display">Session Completed!</h2>
                <p className="text-2xs font-semibold text-prism-muted uppercase tracking-wider font-mono">
                  You reviewed {reviewsDone} flashcards on "{deck?.topic}"
                </p>
              </div>

              {/* Session Stats Breakdown */}
              <div className="grid grid-cols-4 gap-2 bg-white/5 rounded-2xl p-4 border border-prism-border">
                {[
                  { label: "Again", count: sessionStats.again, color: "text-red-400 bg-red-500/5 border-red-500/15" },
                  { label: "Hard", count: sessionStats.hard, color: "text-prism-warm bg-prism-warm/5 border-prism-warm/15" },
                  { label: "Good", count: sessionStats.good, color: "text-blue-400 bg-blue-500/5 border-blue-500/15" },
                  { label: "Easy", count: sessionStats.easy, color: "text-prism-accent bg-prism-accent/5 border-prism-accent/15" },
                ].map((stat, i) => (
                  <div key={i} className={`flex flex-col items-center justify-center p-2 rounded-xl border font-mono ${stat.color}`}>
                    <span className="text-[9px] font-black uppercase tracking-wider">{stat.label}</span>
                    <span className="text-lg font-black mt-1">{stat.count}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  onClick={handleRestart}
                  className="rounded-full border border-prism-border bg-prism-surface px-6 py-3.5 text-xs font-bold text-prism-text transition hover:bg-white/5 active:scale-95 flex items-center justify-center gap-1.5 font-mono"
                >
                  <RefreshCw size={12} /> Restart Session
                </button>
                <Link
                  href="/flashcards"
                  className="rounded-full bg-gradient-to-r from-prism-accent to-blue-500 px-6 py-3.5 text-xs font-bold text-prism-base shadow-md hover:shadow-lg transition duration-200 text-center font-mono"
                >
                  Back to Library
                </Link>
              </div>
            </motion.div>
          ) : studySessionCards.length === 0 ? (
            /* No Cards Available */
            <div className="glass-prism rounded-3xl p-8 text-center space-y-4">
              <SpacedRepetitionIcon size={36} className="mx-auto text-prism-accent" />
              <h2 className="text-lg font-bold font-display">No cards due for review</h2>
              <p className="text-xs text-prism-muted">
                Congratulations! You are all caught up on reviews for this deck. Would you like to study all cards to preview or cram them?
              </p>
              <button
                onClick={handleModeToggle}
                className="rounded-full bg-prism-accent text-prism-base px-6 py-3 text-xs font-bold transition hover:bg-prism-accent/80 active:scale-95 font-mono"
              >
                Study All Cards
              </button>
            </div>
          ) : (
            /* Active Flip Flashcard */
            <div className="flex flex-col items-center gap-6">
              {/* 3D Flip Card Container */}
              <div 
                className="w-full h-80 sm:h-96 [perspective:1000px] cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div 
                  className={`w-full h-full relative transition-transform duration-500 [transform-style:preserve-3d] ${
                    isFlipped ? "[transform:rotateY(180deg)]" : ""
                  }`}
                >
                  {/* Front Side */}
                  <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] glass-prism rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between border-prism-border shadow-md">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-prism-accent/70 border-b border-prism-border pb-2 shrink-0 select-none font-mono">
                      <span>Concept Question</span>
                      <span className="flex items-center gap-1">
                        <HelpCircle size={10} /> Active Recall
                      </span>
                    </div>

                    <div className="flex-1 flex items-center justify-center overflow-y-auto py-4 text-center">
                      <ReactMarkdown 
                        remarkPlugins={[remarkMath]} 
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          p: ({ children }) => <p className="text-sm font-extrabold sm:text-base leading-relaxed text-prism-text font-display">{children}</p>
                        }}
                      >
                        {activeCard.front}
                      </ReactMarkdown>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-prism-muted shrink-0 select-none font-mono">
                      <Eye size={11} /> Tap Card or Spacebar to reveal answer
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] glass-prism rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between border-prism-accent/30 bg-prism-accent/[0.01] shadow-lg">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-indigo-300/75 border-b border-prism-border pb-2 shrink-0 select-none font-mono">
                      <span>Detailed Answer</span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={10} /> Explaining Logic
                      </span>
                    </div>

                    <div className="flex-1 flex items-center justify-center overflow-y-auto py-4 text-center">
                      <ReactMarkdown 
                        remarkPlugins={[remarkMath]} 
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          p: ({ children }) => <p className="text-2xs font-semibold sm:text-xs leading-relaxed text-prism-text">{children}</p>
                        }}
                      >
                        {activeCard.back}
                      </ReactMarkdown>
                    </div>

                    <div className="text-[9px] font-black uppercase tracking-wider text-prism-muted shrink-0 select-none text-center font-mono">
                      Evaluate your recall confidence below:
                    </div>
                  </div>
                </div>
              </div>

              {/* Mode switch helper below card */}
              <button
                onClick={handleModeToggle}
                className="text-[10px] font-extrabold uppercase tracking-widest text-prism-muted hover:text-prism-accent transition hover:underline font-mono"
              >
                {onlyDue ? "Switch to study all cards" : "Filter due reviews only"}
              </button>
            </div>
          )}
        </div>

        {/* Rating Controls Section */}
        {!sessionFinished && studySessionCards.length > 0 && (
          <div className="h-24 shrink-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {!isFlipped ? (
                /* Before flip controls */
                <motion.button
                  key="reveal"
                  onClick={() => setIsFlipped(true)}
                  className="w-full max-w-xs rounded-full bg-gradient-to-r from-prism-accent to-blue-500 py-3.5 text-xs font-bold text-prism-base shadow-lg hover:shadow-xl transition-all duration-200 active:scale-97 flex items-center justify-center gap-1.5 font-mono"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  Reveal Explanation <ChevronRight size={14} />
                </motion.button>
              ) : (
                /* Rating buttons (SM-2 confidence grades) */
                <motion.div
                  key="ratings"
                  className="grid grid-cols-4 gap-2 w-full font-mono"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {[
                    {
                      label: "Again",
                      desc: "Forgot",
                      rating: "again" as const,
                      className: "bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border-red-500/30",
                    },
                    {
                      label: "Hard",
                      desc: "Hesitant",
                      rating: "hard" as const,
                      className: "bg-prism-warm/10 hover:bg-prism-warm text-prism-warm hover:text-prism-base border-prism-warm/30",
                    },
                    {
                      label: "Good",
                      desc: "Correct",
                      rating: "good" as const,
                      className: "bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border-blue-500/30",
                    },
                    {
                      label: "Easy",
                      desc: "Perfect",
                      rating: "easy" as const,
                      className: "bg-prism-accent/10 hover:bg-prism-accent text-prism-accent hover:text-prism-base border-prism-accent/30",
                    },
                  ].map((btn) => (
                    <button
                      key={btn.rating}
                      onClick={() => handleGrade(btn.rating)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition duration-200 active:scale-95 cursor-pointer ${btn.className}`}
                    >
                      <span className="text-2xs font-extrabold tracking-wider">{btn.label}</span>
                      <span className="text-[8px] opacity-75 mt-0.5 select-none font-semibold uppercase">{btn.desc}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </div>
    </main>
  );
}
