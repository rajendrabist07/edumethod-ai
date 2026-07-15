"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { PathProgressIcon } from "@/components/icons/PathProgressIcon";
import { ChatSparkIcon } from "@/components/icons/ChatSparkIcon";
import { QuizTargetIcon } from "@/components/icons/QuizTargetIcon";
import { UserButton, useUser } from "@clerk/nextjs";

interface HistoryItem {
  id: string;
  type: "path" | "doubt";
  title: string;
  date: string;
}

interface UsageLimits {
  plan: "free" | "pro";
  usage: {
    learning_path: { current: number; limit: number };
    doubt_message: { current: number; limit: number };
    quiz: { current: number; limit: number };
  };
}

function formatRelativeTime(dateString: string) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

export function HistorySidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isSignedIn } = useUser();

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<UsageLimits | null>(null);
  
  // Sidebar state: open by default on desktop, hidden on mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sync sidebar defaults
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLarge = window.innerWidth >= 1024;
      setSidebarOpen(isLarge);
    }
  }, []);

  // Fetch combined history & usage limits
  useEffect(() => {
    if (isSignedIn) {
      fetchHistory();
      fetchUsage();
    }
  }, [pathname, searchParams, isSignedIn]);

  async function fetchHistory() {
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error("Failed to load history list:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsage() {
    try {
      const res = await fetch("/api/usage");
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch (err) {
      console.error("Failed to load limits info:", err);
    }
  }

  // Delete an item from history
  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    
    if (deletingId) return;
    setDeletingId(id);

    try {
      const res = await fetch(`/api/history/${id}`, { method: "DELETE" });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
        
        // If they deleted the active path or session, route to the fresh state
        const currentPathId = searchParams.get("pathId");
        const currentSessionId = searchParams.get("sessionId");
        
        if (id === currentPathId) {
          router.push("/upload");
        } else if (id === currentSessionId) {
          router.push("/doubt-solver");
        }
        
        fetchUsage(); // Refresh usage numbers
      } else {
        alert("Failed to delete the item");
      }
    } catch (err) {
      console.error("Error deleting history item:", err);
    } finally {
      setDeletingId(null);
    }
  }

  const activePathId = searchParams.get("pathId");
  const activeSessionId = searchParams.get("sessionId");

  return (
    <>
      {/* Mobile Toggle Button (Sticky floating header trigger) */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2.5 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]/90 backdrop-blur-md text-[color:var(--text)] shadow-md hover:border-blue-500/50 active:scale-95 transition"
        aria-label="Open Workspace History"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Backdrop for Mobile Drawer */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-45 flex flex-col h-screen bg-[color:var(--surface)]/95 border-r border-[color:var(--border)]/45 backdrop-blur-xl transition-all duration-300 overflow-hidden shadow-2xl lg:shadow-none lg:relative ${
          sidebarOpen ? "w-[280px]" : "w-0 lg:w-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--border)]/35 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}>
            <Logo size={28} />
            <div>
              <p className="text-2xs font-extrabold uppercase tracking-[0.2em] text-blue-600">EduMethod AI</p>
              <p className="text-4xs font-semibold text-[color:var(--muted)] tracking-wider">WORKSPACE HUB</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg border border-[color:var(--border)] hover:bg-[color:var(--surface-soft)] hover:text-red-500 transition active:scale-95"
            title="Collapse Sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        </div>

        {/* Workspace Quick Links */}
        <div className="p-3 border-b border-[color:var(--border)]/30 shrink-0 flex flex-col gap-1.5">
          <Link
            href="/dashboard"
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
              pathname === "/dashboard"
                ? "bg-blue-600/10 text-blue-600 border border-blue-500/20"
                : "text-[color:var(--text)] hover:bg-[color:var(--surface-soft)]/50 border border-transparent"
            }`}
            onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
          >
            <span className="text-base">🏡</span> Dashboard Home
          </Link>
          <div className="grid grid-cols-2 gap-1.5">
            <Link
              href="/upload"
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition duration-200 text-center gap-1 ${
                pathname === "/upload" && !activePathId
                  ? "bg-blue-600/10 text-blue-600 border-blue-500/30"
                  : "bg-[color:var(--surface-soft)]/30 border-[color:var(--border)]/40 hover:border-blue-500/40 text-[color:var(--text)]"
              }`}
              onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
            >
              <span className="text-sm">📚</span>
              <span className="text-[10px] font-extrabold uppercase">New Path</span>
            </Link>
            <Link
              href="/doubt-solver"
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition duration-200 text-center gap-1 ${
                pathname === "/doubt-solver" && !activeSessionId
                  ? "bg-purple-600/10 text-purple-600 border-purple-500/30"
                  : "bg-[color:var(--surface-soft)]/30 border-[color:var(--border)]/40 hover:border-purple-500/40 text-[color:var(--text)]"
              }`}
              onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
            >
              <span className="text-sm">💬</span>
              <span className="text-[10px] font-extrabold uppercase">New Doubt</span>
            </Link>
          </div>
        </div>

        {/* Scrollable History List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {loading ? (
            <div className="space-y-4 animate-pulse px-1.5 py-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-2 rounded-xl">
                  <div className="h-5 w-5 bg-slate-200/60 dark:bg-slate-800/65 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="h-3 bg-slate-200/50 dark:bg-slate-800/55 rounded w-3/4" />
                    <div className="h-2 bg-slate-200/50 dark:bg-slate-800/55 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="py-8 px-4 text-center">
              <span className="inline-block text-xl mb-2 text-slate-400">🔍</span>
              <p className="text-[11px] font-extrabold text-[color:var(--text)] uppercase tracking-wider">No conversations yet</p>
              <p className="text-4xs font-semibold text-[color:var(--muted)] leading-relaxed mt-1">
                Generate a study plan or ask the Doubt Solver a question to save records.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-[color:var(--muted)] px-2.5 mb-1.5">
                  Recent Workspace History
                </p>
                <div className="space-y-1">
                  {history.map((item) => {
                    const isPath = item.type === "path";
                    const isActive = isPath 
                      ? activePathId === item.id 
                      : activeSessionId === item.id;

                    const itemUrl = isPath 
                      ? `/upload?pathId=${item.id}` 
                      : `/doubt-solver?sessionId=${item.id}`;

                    return (
                      <Link
                        key={item.id}
                        href={itemUrl}
                        className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl transition duration-150 border ${
                          isActive
                            ? "bg-slate-100/70 border-[color:var(--border)]/80 text-[color:var(--text)] dark:bg-slate-900/60"
                            : "hover:bg-[color:var(--surface-soft)]/50 border-transparent text-[color:var(--muted)] hover:text-[color:var(--text)]"
                        }`}
                        onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span className="shrink-0 flex items-center justify-center">
                            {isPath ? (
                              <PathProgressIcon size={14} className={isActive ? "text-blue-500" : "text-slate-400"} />
                            ) : (
                              <ChatSparkIcon size={14} className={isActive ? "text-purple-500" : "text-slate-400"} />
                            )}
                          </span>
                          <div className="min-w-0 flex flex-col">
                            <span className="text-[11px] font-bold truncate leading-tight">
                              {item.title}
                            </span>
                            <span className="text-4xs font-medium text-[color:var(--muted)] mt-0.5 uppercase tracking-wider">
                              {isPath ? "Study Path" : "Doubt Solver"} • {formatRelativeTime(item.date)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          disabled={deletingId === item.id}
                          className="opacity-0 group-hover:opacity-100 flex items-center justify-center h-6 w-6 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition shrink-0"
                          title="Delete History Item"
                        >
                          {deletingId === item.id ? (
                            <span className="h-3 w-3 rounded-full border border-t-red-500 border-r-transparent animate-spin"></span>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          )}
                        </button>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Plan & Usage indicator bottom section */}
        {usage && (
          <div className="p-4 border-t border-[color:var(--border)]/30 bg-[color:var(--surface-soft)]/20 shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-4xs font-black uppercase tracking-wider text-[color:var(--muted)]">
                Subscription Tier
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-4xs font-extrabold uppercase tracking-wide ${
                usage.plan === "pro"
                  ? "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/65 dark:text-purple-300 dark:border-purple-900/50"
                  : "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/65 dark:text-blue-300 dark:border-blue-900/50"
              }`}>
                {usage.plan === "pro" ? "💎 Pro" : "🌱 Free"}
              </span>
            </div>

            {usage.plan === "free" && (
              <div className="space-y-1.5">
                {/* Paths limit bar */}
                <div>
                  <div className="flex justify-between text-4xs font-bold text-[color:var(--muted)] mb-0.5 uppercase">
                    <span>Study Paths</span>
                    <span>{usage.usage.learning_path.current} / {usage.usage.learning_path.limit}</span>
                  </div>
                  <div className="h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${(usage.usage.learning_path.current / usage.usage.learning_path.limit) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Chat limit bar */}
                <div>
                  <div className="flex justify-between text-4xs font-bold text-[color:var(--muted)] mb-0.5 uppercase">
                    <span>Doubt Solver</span>
                    <span>{usage.usage.doubt_message.current} / {usage.usage.doubt_message.limit}</span>
                  </div>
                  <div className="h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${(usage.usage.doubt_message.current / usage.usage.doubt_message.limit) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {usage.plan === "free" ? (
              <Link
                href="/pricing"
                className="block text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white text-3xs font-extrabold py-2 px-3 rounded-lg shadow-sm hover:from-blue-700 hover:to-purple-700 hover:shadow-md transition duration-200 active:scale-97 uppercase tracking-wider"
                onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
              >
                Upgrade to Pro
              </Link>
            ) : (
              <p className="text-4xs font-semibold text-center text-emerald-500 dark:text-emerald-400 italic">
                You have unlimited cognitive API access!
              </p>
            )}
          </div>
        )}

        {/* User Account Controls */}
        <div className="px-5 py-4 border-t border-[color:var(--border)]/30 bg-[color:var(--surface)] shrink-0 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <UserButton />
            <div className="min-w-0 flex flex-col">
              <span className="text-[10px] font-bold truncate text-[color:var(--text)] leading-snug">
                My Workspace
              </span>
              <span className="text-4xs font-semibold text-[color:var(--muted)] uppercase tracking-wider">
                Settings / Profile
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
