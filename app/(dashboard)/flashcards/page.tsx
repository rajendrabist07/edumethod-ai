"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "../../components/theme-toggle";
import { BrandMark } from "../../components/brand-mark";
import { SpacedRepetitionIcon } from "@/components/icons/SpacedRepetitionIcon";
import { Trash2, Play, Sparkles, BookOpen, AlertCircle, Search } from "lucide-react";
import { toast } from "sonner";

interface FlashcardDeck {
  id: string;
  subject: string;
  topic: string;
  createdAt: string;
  totalCards: number;
  dueCards: number;
}

export default function FlashcardsDashboardPage() {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDecks();
  }, []);

  async function fetchDecks() {
    try {
      const res = await fetch("/api/flashcards/decks");
      if (res.ok) {
        const data = await res.json();
        setDecks(data.decks || []);
      } else {
        toast.error("Failed to load flashcard decks");
      }
    } catch (err) {
      console.error("Fetch decks error:", err);
      toast.error("Network error, please check connection.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteDeck(deckId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this deck? This action cannot be undone.")) {
      return;
    }

    setDeletingId(deckId);
    try {
      const res = await fetch(`/api/flashcards/decks/${deckId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDecks((prev) => prev.filter((d) => d.id !== deckId));
        toast.success("Flashcard deck deleted successfully");
        // Dispatch event to refresh the global sidebar history
        window.dispatchEvent(new Event("popstate"));
      } else {
        toast.error("Failed to delete flashcard deck");
      }
    } catch (err) {
      console.error("Delete deck error:", err);
      toast.error("Network error while deleting deck");
    } finally {
      setDeletingId(null);
    }
  }

  const filteredDecks = decks.filter(
    (deck) =>
      deck.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalDue = decks.reduce((acc, curr) => acc + curr.dueCards, 0);

  return (
    <main className="grid-bg h-full overflow-y-auto px-4 py-8 text-[color:var(--text)] transition-colors duration-300 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        
        {/* Header Bar */}
        <header className="glass-card flex items-center justify-between rounded-2xl px-6 py-4 transition-all duration-300">
          <div className="flex items-center gap-2 pl-12 lg:pl-0">
            <BrandMark />
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-xs font-bold text-[color:var(--text)] transition hover:bg-[color:var(--surface-soft)] active:scale-95 flex items-center justify-center gap-1.5"
            >
              Dashboard
            </Link>
            <ThemeToggle />
          </div>
        </header>

        {/* Hero Banner Card */}
        <div className="glass-card rounded-3xl p-6 shadow-sm sm:p-8 relative overflow-hidden">
          <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-2xs font-bold uppercase tracking-wider text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <SpacedRepetitionIcon size={12} className="text-blue-500" /> Spaced Repetition Engine
            </span>
            {totalDue > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-2xs font-extrabold uppercase tracking-wide text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 animate-pulse">
                ⚠️ {totalDue} reviews due
              </span>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-black sm:text-3xl lg:text-4xl">
            Study smart with active recall.
          </h1>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)] sm:text-base max-w-2xl">
            Review conceptual flashcards powered by the SM-2 algorithm. The system schedules reviews at optimal mathematical intervals to double your memory retention.
          </p>
        </div>

        {/* Search and Filters */}
        {decks.length > 0 && (
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-[color:var(--muted)]" />
            <input
              type="text"
              placeholder="Search your decks by subject or topic name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] pl-11 pr-4 py-3 text-sm outline-none transition duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card rounded-2xl p-5 animate-pulse h-40 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                </div>
                <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : decks.length === 0 ? (
          // Empty State
          <div className="glass-card rounded-3xl p-10 text-center flex flex-col items-center gap-5 justify-center">
            <div className="p-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <SpacedRepetitionIcon size={40} className="text-blue-500" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[color:var(--text)]">Your Flashcards Library is Empty</h3>
              <p className="text-2xs font-semibold leading-relaxed max-w-sm mt-1 mx-auto text-[color:var(--muted)]">
                You haven't generated any study decks yet. Head to your study roadmap and click "Generate Flashcards" on any topic or weak area to begin.
              </p>
            </div>
            <Link
              href="/upload"
              className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-md hover:shadow-lg transition duration-200"
            >
              Analyze a Syllabus
            </Link>
          </div>
        ) : filteredDecks.length === 0 ? (
          // Search Empty State
          <div className="text-center py-12 text-[color:var(--muted)]">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-bold">No matching decks found</p>
            <p className="text-2xs mt-1">Try adjusting your search criteria.</p>
          </div>
        ) : (
          // Decks Grid Listing
          <div className="grid gap-5 sm:grid-cols-2">
            {filteredDecks.map((deck) => (
              <div
                key={deck.id}
                className="glass-card glass-card-hover rounded-3xl p-6 shadow-sm border border-[color:var(--border)]/40 flex flex-col justify-between h-48 relative group"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-500 truncate max-w-[70%]">
                      {deck.subject}
                    </span>
                    
                    {deck.dueCards > 0 ? (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 shrink-0 select-none animate-pulse">
                        {deck.dueCards} Due
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 shrink-0 select-none">
                        Completed
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-base font-black text-[color:var(--text)] mt-2 line-clamp-2 leading-snug">
                    {deck.topic}
                  </h3>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[color:var(--border)]/30">
                  <div className="flex items-center gap-1.5 text-xs text-[color:var(--muted)] font-semibold">
                    <BookOpen size={13} className="text-[color:var(--muted)]" />
                    <span>{deck.totalCards} cards</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleDeleteDeck(deck.id, e)}
                      disabled={deletingId === deck.id}
                      className="p-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] hover:text-red-500 hover:border-red-500/30 transition disabled:opacity-50"
                      title="Delete deck"
                    >
                      <Trash2 size={14} />
                    </button>
                    <Link
                      href={`/flashcards/${deck.id}`}
                      className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-2xs font-extrabold text-white shadow-md hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg transition duration-200 flex items-center gap-1"
                    >
                      <Play size={10} fill="currentColor" /> Study
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
