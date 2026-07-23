"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { useLayout } from "./LayoutContext";
import { Logo } from "@/components/ui/Logo";

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

export function SidebarAside() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isSignedIn, user } = useUser();
  const { collapsed, setCollapsed, setMobileOpen } = useLayout();

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<UsageLimits | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showUsageModal, setShowUsageModal] = useState(false);

  // Group history items by relative dates
  const getGroupedHistory = (items: HistoryItem[]) => {
    const today: HistoryItem[] = [];
    const yesterday: HistoryItem[] = [];
    const sevenDays: HistoryItem[] = [];
    const older: HistoryItem[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;

    items.forEach((item) => {
      const time = new Date(item.date).getTime();
      if (time >= todayStart) {
        today.push(item);
      } else if (time >= yesterdayStart) {
        yesterday.push(item);
      } else if (time >= sevenDaysAgo) {
        sevenDays.push(item);
      } else {
        older.push(item);
      }
    });

    return [
      { title: "Today", items: today },
      { title: "Yesterday", items: yesterday },
      { title: "Previous 7 Days", items: sevenDays },
      { title: "Older", items: older },
    ].filter((group) => group.items.length > 0);
  };

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

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (deletingId) return;
    setDeletingId(id);

    try {
      const res = await fetch(`/api/history/${id}`, { method: "DELETE" });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));

        const currentPathId = searchParams.get("pathId");
        const currentSessionId = searchParams.get("sessionId");

        if (id === currentPathId) {
          router.push("/upload");
        } else if (id === currentSessionId) {
          router.push("/doubt-solver");
        }

        fetchUsage();
      }
    } catch (err) {
      console.error("Error deleting history item:", err);
    } finally {
      setDeletingId(null);
    }
  }

  // Keyboard shortcut listener to collapse sidebar (Cmd + \ or Ctrl + \)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        setCollapsed(!collapsed);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [collapsed, setCollapsed]);

  const activePathId = searchParams.get("pathId");
  const activeSessionId = searchParams.get("sessionId");
  const groupedHistory = getGroupedHistory(history);

  const handleLinkClick = () => {
    // Automatically close drawer on mobile navigation
    setMobileOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-[color:var(--sidebar-bg)] border-r border-[color:var(--sidebar-border)] w-[260px] text-[color:var(--sidebar-text)] select-none">
      {/* 1. Header (Logo & Collapse toggle) */}
      <div className="flex items-center justify-between px-4.5 py-4 border-b border-[color:var(--sidebar-border)]/50 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={handleLinkClick}>
          <Logo size={26} />
          <div className="flex flex-col">
            <span className="text-2xs font-extrabold uppercase tracking-[0.18em] text-[color:var(--sidebar-accent)]">
              EduMethod AI
            </span>
            <span className="text-[9px] font-bold text-[color:var(--sidebar-muted)] tracking-wider">
              WORKSPACE
            </span>
          </div>
        </Link>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1.5 rounded-lg border border-[color:var(--sidebar-border)] hover:bg-[color:var(--sidebar-hover)] hover:text-red-500 transition active:scale-95 cursor-pointer hidden lg:inline-flex"
          title="Collapse Sidebar (Ctrl + \)"
          aria-label="Collapse Sidebar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      </div>

      {/* 2. Action Links (New chat button + Quick Nav Grid) */}
      <div className="p-3 border-b border-[color:var(--sidebar-border)]/50 shrink-0 flex flex-col gap-2">
        <Link
          href="/doubt-solver"
          className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition duration-150 bg-[color:var(--sidebar-accent)] hover:bg-[color:var(--sidebar-accent-hover)] text-white shadow-xs active:scale-98 border border-white/5"
          onClick={handleLinkClick}
        >
          <span className="flex items-center gap-2">
            <span>💬</span> New Doubt Solver
          </span>
          <span className="text-[9px] opacity-75 uppercase tracking-wider bg-white/15 px-1.5 py-0.5 rounded font-mono">
            ⌘N
          </span>
        </Link>

        <div className="grid grid-cols-3 gap-1.5">
          <Link
            href="/dashboard"
            className={`flex items-center justify-center p-2 rounded-xl border border-[color:var(--sidebar-border)] hover:bg-[color:var(--sidebar-hover)] transition text-[10px] font-bold gap-0.5 ${
              pathname === "/dashboard"
                ? "bg-[color:var(--sidebar-active)] text-[color:var(--sidebar-text)]"
                : "text-[color:var(--sidebar-muted)] hover:text-[color:var(--sidebar-text)]"
            }`}
            onClick={handleLinkClick}
          >
            <span>🏡</span> Home
          </Link>
          <Link
            href="/upload"
            className={`flex items-center justify-center p-2 rounded-xl border border-[color:var(--sidebar-border)] hover:bg-[color:var(--sidebar-hover)] transition text-[10px] font-bold gap-0.5 ${
              pathname === "/upload"
                ? "bg-[color:var(--sidebar-active)] text-[color:var(--sidebar-text)]"
                : "text-[color:var(--sidebar-muted)] hover:text-[color:var(--sidebar-text)]"
            }`}
            onClick={handleLinkClick}
          >
            <span>📚</span> Path
          </Link>
          <Link
            href="/flashcards"
            className={`flex items-center justify-center p-2 rounded-xl border border-[color:var(--sidebar-border)] hover:bg-[color:var(--sidebar-hover)] transition text-[10px] font-bold gap-0.5 ${
              pathname.startsWith("/flashcards")
                ? "bg-[color:var(--sidebar-active)] text-[color:var(--sidebar-text)]"
                : "text-[color:var(--sidebar-muted)] hover:text-[color:var(--sidebar-text)]"
            }`}
            onClick={handleLinkClick}
          >
            <span>🗂️</span> Cards
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <Link
            href="/textbook-chat"
            className={`flex items-center justify-center p-2 rounded-xl border border-[color:var(--sidebar-border)] hover:bg-[color:var(--sidebar-hover)] transition text-[10px] font-bold gap-1 ${
              pathname === "/textbook-chat"
                ? "bg-[color:var(--sidebar-active)] text-[color:var(--sidebar-text)]"
                : "text-[color:var(--sidebar-muted)] hover:text-[color:var(--sidebar-text)]"
            }`}
            onClick={handleLinkClick}
          >
            <span>📖</span> RAG Chat
          </Link>
          <Link
            href="/feynman"
            className={`flex items-center justify-center p-2 rounded-xl border border-[color:var(--sidebar-border)] hover:bg-[color:var(--sidebar-hover)] transition text-[10px] font-bold gap-1 ${
              pathname === "/feynman"
                ? "bg-[color:var(--sidebar-active)] text-[color:var(--sidebar-text)]"
                : "text-[color:var(--sidebar-muted)] hover:text-[color:var(--sidebar-text)]"
            }`}
            onClick={handleLinkClick}
          >
            <span>💡</span> Feynman
          </Link>
        </div>
      </div>

      {/* 3. History Scroll Pane */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {loading ? (
          <div className="space-y-4 animate-pulse px-1.5 py-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2 px-2 rounded-xl">
                <div className="h-4 w-4 bg-slate-200/60 dark:bg-slate-800/60 rounded shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="h-3 bg-slate-200/50 dark:bg-slate-800/50 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="py-8 px-4 text-center">
            <span className="inline-block text-xl mb-2 text-slate-400">🔍</span>
            <p className="text-[11px] font-extrabold text-[color:var(--sidebar-text)] uppercase tracking-wider">
              No history found
            </p>
            <p className="text-4xs font-semibold text-[color:var(--sidebar-muted)] leading-relaxed mt-1">
              Create a study roadmap or start a conversation to view records here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {groupedHistory.map((group) => (
              <div key={group.title} className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-[color:var(--sidebar-muted)]/50 px-2.5 mb-1.5">
                  {group.title}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
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
                        className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl transition duration-150 text-2xs font-semibold ${
                          isActive
                            ? "bg-[color:var(--sidebar-hover)] text-[color:var(--sidebar-text)] font-bold border border-[color:var(--sidebar-border)]/50"
                            : "hover:bg-[color:var(--sidebar-hover)]/70 text-[color:var(--sidebar-muted)] hover:text-[color:var(--sidebar-text)] border border-transparent"
                        }`}
                        onClick={handleLinkClick}
                      >
                        <span className="truncate flex-1 pr-3 text-left">
                          {item.title}
                        </span>

                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          disabled={deletingId === item.id}
                          className="opacity-0 group-hover:opacity-100 flex items-center justify-center h-5 w-5 rounded-md text-[color:var(--sidebar-muted)] hover:text-red-500 hover:bg-red-500/10 transition shrink-0 cursor-pointer"
                          title="Delete conversation history"
                          aria-label="Delete history entry"
                        >
                          {deletingId === item.id ? (
                            <span className="h-2.5 w-2.5 rounded-full border border-t-red-500 border-r-transparent animate-spin"></span>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="2.2"
                              stroke="currentColor"
                              className="w-3 h-3"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                              />
                            </svg>
                          )}
                        </button>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Telemetry Usage Popover Modal */}
      {showUsageModal && usage && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setShowUsageModal(false)}
            role="presentation"
          />
          <div className="mx-3 mb-2 p-4 rounded-xl border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-hover)] shadow-2xl flex flex-col gap-3.5 z-30 relative animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between border-b border-[color:var(--sidebar-border)]/50 pb-2">
              <span className="text-3xs font-extrabold uppercase tracking-widest text-[color:var(--sidebar-muted)]">
                Usage Limits
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-4xs font-black uppercase tracking-wider ${
                  usage.plan === "pro"
                    ? "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/65 dark:text-purple-300"
                    : "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/65 dark:text-blue-300"
                }`}
              >
                {usage.plan === "pro" ? "💎 Pro" : "🌱 Free"}
              </span>
            </div>

            {usage.plan === "free" ? (
              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-4xs font-bold text-[color:var(--sidebar-muted)] mb-1 uppercase tracking-wider">
                    <span>Study Paths</span>
                    <span>
                      {usage.usage.learning_path.current} / {usage.usage.learning_path.limit}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (usage.usage.learning_path.current / usage.usage.learning_path.limit) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-4xs font-bold text-[color:var(--sidebar-muted)] mb-1 uppercase tracking-wider">
                    <span>Doubt Solver</span>
                    <span>
                      {usage.usage.doubt_message.current} / {usage.usage.doubt_message.limit}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (usage.usage.doubt_message.current / usage.usage.doubt_message.limit) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <Link
                  href="/pricing"
                  className="block text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white text-4xs font-black py-2.5 px-3 rounded-lg shadow-xs hover:shadow-sm transition duration-150 uppercase tracking-widest mt-1"
                  onClick={handleLinkClick}
                >
                  Upgrade to Pro
                </Link>
              </div>
            ) : (
              <p className="text-4xs font-bold text-center text-emerald-500 italic">
                You have unlimited cognitive access!
              </p>
            )}
          </div>
        </>
      )}

      {/* 5. Footer Account Widgets */}
      <div className="px-4.5 py-3.5 border-t border-[color:var(--sidebar-border)]/50 bg-[color:var(--sidebar-hover)]/30 shrink-0 flex items-center justify-between gap-3 z-30 relative select-none">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <UserButton />
          <div className="min-w-0 flex flex-col flex-1">
            <span className="text-[10px] font-bold truncate text-[color:var(--sidebar-text)] leading-snug">
              {user?.fullName || "My Workspace"}
            </span>
            <span className="text-4xs font-semibold text-[color:var(--sidebar-muted)] uppercase tracking-wider">
              Settings & Billing
            </span>
          </div>
        </div>

        {usage && (
          <button
            onClick={() => setShowUsageModal(!showUsageModal)}
            className={`px-2 py-0.5 rounded-full text-4xs font-black uppercase tracking-wider border cursor-pointer transition active:scale-95 shrink-0 ${
              usage.plan === "pro"
                ? "bg-purple-500/10 text-purple-600 border-purple-500/25 hover:bg-purple-500/20"
                : "bg-blue-500/10 text-blue-600 border-blue-500/25 hover:bg-blue-500/20"
            }`}
          >
            {usage.plan === "pro" ? "Pro" : "Limits"}
          </button>
        )}
      </div>
    </div>
  );
}
