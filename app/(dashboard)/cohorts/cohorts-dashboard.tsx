"use client";

import React, { useEffect, useState } from "react";
import { GlassCard } from "@/app/components/ui/GlassCard";
import { toast } from "sonner";
import { School, Sparkles } from "lucide-react";

interface Cohort {
  id: string;
  name: string;
  created_at: string;
  memberCount: number;
}

interface Student {
  studentId: string;
  name: string;
  email: string;
  avatarUrl: string;
  pathsCount: number;
  quizzesCount: number;
  doubtsCount: number;
  averageScore: number;
}

interface CohortDetails {
  cohortName: string;
  createdAt: string;
  roster: Student[];
  stats: {
    totalStudents: number;
    avgMastery: number;
    totalPaths: number;
    totalQuizzes: number;
    totalDoubts: number;
  };
}

export function CohortsDashboard() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);
  const [details, setDetails] = useState<CohortDetails | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCohortName, setNewCohortName] = useState("");
  const [creatingCohort, setCreatingCohort] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    fetchCohorts();
  }, []);

  async function fetchCohorts() {
    try {
      setLoadingList(true);
      const res = await fetch("/api/cohorts");
      if (res.status === 403) {
        setAccessDenied(true);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setCohorts(data.cohorts || []);
      } else {
        toast.error("Failed to load classrooms");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error loading classrooms");
    } finally {
      setLoadingList(false);
    }
  }

  async function handleSelectCohort(cohortId: string) {
    setSelectedCohortId(cohortId);
    setDetails(null);
    setInsights(null);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/cohorts/${cohortId}`);
      if (res.ok) {
        const data = await res.json();
        setDetails(data);
      } else {
        toast.error("Failed to load classroom details");
        setSelectedCohortId(null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error loading details");
      setSelectedCohortId(null);
    } finally {
      setLoadingDetails(false);
    }
  }

  async function handleCreateCohort(e: React.FormEvent) {
    e.preventDefault();
    if (!newCohortName.trim()) return;
    setCreatingCohort(true);
    try {
      const res = await fetch("/api/cohorts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCohortName }),
      });
      if (res.ok) {
        toast.success("Classroom created successfully!");
        setNewCohortName("");
        setShowCreateModal(false);
        fetchCohorts();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to create classroom");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error creating classroom");
    } finally {
      setCreatingCohort(false);
    }
  }

  async function generateAIInsights() {
    if (!selectedCohortId) return;
    setGeneratingInsights(true);
    setInsights(null);
    try {
      const res = await fetch(`/api/cohorts/${selectedCohortId}/insights`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setInsights(data.insights);
        toast.success("Pedagogical Action Plan generated!");
      } else {
        toast.error(data.error || "Failed to generate AI insights");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error requesting insights");
    } finally {
      setGeneratingInsights(false);
    }
  }

  function copyCohortId(id: string) {
    navigator.clipboard.writeText(id);
    toast.success("Classroom Join ID copied to clipboard!");
  }

  if (accessDenied) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)] text-prism-text">
        <GlassCard className="p-8 text-center max-w-md border border-red-500/20">
          <span className="text-4xl mb-4 block">🚫</span>
          <h2 className="text-xl font-bold text-red-400">Access Denied</h2>
          <p className="text-sm text-prism-muted mt-2">
            The Cohort view is restricted to verified Teachers only.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 text-prism-text max-w-6xl mx-auto w-full min-h-[calc(100vh-64px)] flex flex-col">
      {/* Overview/List Mode */}
      {!selectedCohortId ? (
        <div className="flex-grow flex flex-col">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 border-b border-prism-border/40 pb-5">
            <div>
              <h1 className="text-3xl font-display font-black tracking-tight">Classroom Cohorts</h1>
              <p className="text-sm text-prism-muted mt-1">
                Monitor student rosters, track aggregate metrics, and generate AI insights.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="self-start sm:self-auto px-5 py-2.5 bg-prism-accent text-white font-bold rounded-xl hover:bg-opacity-95 transition-all shadow-md shadow-prism-accent/15 text-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              + Create Classroom
            </button>
          </div>

          {loadingList ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card h-40 rounded-2xl border border-prism-border/20 opacity-60"></div>
              ))}
            </div>
          ) : cohorts.length === 0 ? (
            <GlassCard className="flex-grow flex flex-col items-center justify-center py-20 text-center border border-prism-border/40">
              <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-prism-accent/20 bg-prism-accent/10 text-prism-accent">
                <School className="h-8 w-8" aria-hidden="true" />
              </span>
              <h3 className="text-lg font-bold">No Classrooms Yet</h3>
              <p className="text-sm text-prism-muted mt-2 max-w-sm">
                Create a classroom to share with your students, inspect their study metrics, and generate AI teaching insights.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-6 px-4 py-2 border border-prism-accent text-prism-accent font-bold rounded-lg hover:bg-prism-accent hover:text-white transition-all text-sm"
              >
                Create your first Class
              </button>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cohorts.map((c) => (
                <GlassCard
                  key={c.id}
                  onClick={() => handleSelectCohort(c.id)}
                  className="p-6 border border-prism-border/40 hover:border-prism-accent/50 hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
                >
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-bold text-lg text-prism-text group-hover:text-prism-accent truncate">{c.name}</h3>
                    <span className="shrink-0 bg-prism-surface/80 px-2 py-1 rounded text-[10px] text-prism-muted font-mono">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <div>
                      <span className="text-prism-text font-black text-2xl">{c.memberCount}</span>
                      <span className="text-xs text-prism-muted ml-1.5">students enrolled</span>
                    </div>
                    <div className="text-right">
                      <span className="text-prism-accent font-bold text-sm hover:underline">View Roster →</span>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Dynamic Drilldown Roster/Statistics Mode */
        <div className="flex-grow flex flex-col gap-6">
          <div className="flex items-center gap-2 text-sm text-prism-muted">
            <button
              onClick={() => setSelectedCohortId(null)}
              className="hover:text-prism-text transition-colors font-bold"
            >
              Classrooms
            </button>
            <span>/</span>
            <span className="text-prism-text truncate">{details?.cohortName || "Loading..."}</span>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-prism-border/40 pb-5">
            <div>
              <h1 className="text-3xl font-display font-black tracking-tight">
                {details?.cohortName || "Loading Classroom..."}
              </h1>
              <p className="text-xs text-prism-muted mt-1.5 font-mono">
                Classroom Join ID:{" "}
                <span className="text-prism-text font-bold bg-prism-surface px-1.5 py-0.5 rounded mr-2">
                  {selectedCohortId}
                </span>
                <button
                  onClick={() => copyCohortId(selectedCohortId)}
                  className="text-prism-accent hover:underline font-bold text-xs"
                >
                  Copy ID
                </button>
              </p>
            </div>
            <button
              onClick={() => setSelectedCohortId(null)}
              className="px-4 py-2 border border-prism-border hover:bg-prism-surface rounded-xl text-sm transition-colors"
            >
              ← Back to List
            </button>
          </div>

          {loadingDetails || !details ? (
            <div className="space-y-6 animate-pulse">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="glass-card h-24 rounded-xl opacity-60"></div>
                ))}
              </div>
              <div className="glass-card h-64 rounded-xl opacity-60"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Columns: Stats & Student Roster */}
              <div className="lg:col-span-2 space-y-6">
                {/* Micro Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <GlassCard className="p-4 border border-prism-border/30 text-center">
                    <span className="text-xs text-prism-muted uppercase tracking-wider font-bold">Students</span>
                    <span className="block text-2xl font-black text-prism-text mt-1">{details.stats.totalStudents}</span>
                  </GlassCard>
                  <GlassCard className="p-4 border border-prism-border/30 text-center">
                    <span className="text-xs text-prism-muted uppercase tracking-wider font-bold">Avg Mastery</span>
                    <span className="block text-2xl font-black text-prism-accent mt-1">{details.stats.avgMastery}%</span>
                  </GlassCard>
                  <GlassCard className="p-4 border border-prism-border/30 text-center">
                    <span className="text-xs text-prism-muted uppercase tracking-wider font-bold">Quizzes Taken</span>
                    <span className="block text-2xl font-black text-prism-text mt-1">{details.stats.totalQuizzes}</span>
                  </GlassCard>
                  <GlassCard className="p-4 border border-prism-border/30 text-center">
                    <span className="text-xs text-prism-muted uppercase tracking-wider font-bold">Doubts Solved</span>
                    <span className="block text-2xl font-black text-prism-text mt-1">{details.stats.totalDoubts}</span>
                  </GlassCard>
                </div>

                {/* Class Student Roster List */}
                <GlassCard className="p-5 border border-prism-border/40 overflow-hidden">
                  <h3 className="font-bold text-lg mb-4">Student Roster</h3>
                  {details.roster.length === 0 ? (
                    <div className="text-center py-8 text-prism-muted text-sm">
                      No students have joined this classroom code yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-prism-border/30 text-prism-muted">
                            <th className="pb-3 font-bold">Name</th>
                            <th className="pb-3 font-bold text-center">Paths</th>
                            <th className="pb-3 font-bold text-center">Quizzes</th>
                            <th className="pb-3 font-bold text-center">Doubts</th>
                            <th className="pb-3 font-bold text-right">Avg Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-prism-border/20">
                          {details.roster.map((student) => (
                            <tr key={student.studentId} className="hover:bg-prism-surface/20 transition-colors">
                              <td className="py-3 flex items-center gap-3">
                                {student.avatarUrl ? (
                                  <img
                                    src={student.avatarUrl}
                                    alt={student.name}
                                    className="w-8 h-8 rounded-full border border-prism-border"
                                  />
                                ) : (
                                  <span className="w-8 h-8 rounded-full bg-prism-surface flex items-center justify-center text-xs font-bold text-prism-accent">
                                    {student.name.slice(0, 2).toUpperCase()}
                                  </span>
                                )}
                                <div>
                                  <span className="font-semibold block">{student.name}</span>
                                  <span className="text-[10px] text-prism-muted font-mono">{student.email}</span>
                                </div>
                              </td>
                              <td className="py-3 text-center font-mono">{student.pathsCount}</td>
                              <td className="py-3 text-center font-mono">{student.quizzesCount}</td>
                              <td className="py-3 text-center font-mono">{student.doubtsCount}</td>
                              <td className="py-3 text-right font-bold text-prism-accent font-mono">
                                {student.averageScore}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </GlassCard>
              </div>

              {/* Right Column: AI Pedagogical Action Plan Coach */}
              <div className="space-y-6">
                <GlassCard className="p-5 border border-prism-border/40 flex flex-col h-full bg-gradient-to-br from-prism-surface/60 via-prism-base to-prism-surface/20">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-prism-accent/20 bg-prism-accent/10 text-prism-accent">
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <h3 className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                      AI Pedagogical Coach
                    </h3>
                  </div>
                  <p className="text-xs text-prism-muted leading-relaxed">
                    Generate an AI teaching analysis report and pedagogical action plan targeting weak spots in the classroom.
                  </p>

                  <button
                    onClick={generateAIInsights}
                    disabled={generatingInsights || details.roster.length === 0}
                    className="mt-4 w-full py-2.5 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-500/10 disabled:opacity-50 text-sm"
                  >
                    {generatingInsights ? "Analyzing Roster Performance..." : "Generate Action Plan"}
                  </button>

                  <div className="mt-5 border-t border-prism-border/30 pt-4 flex-grow overflow-y-auto max-h-[360px] text-sm text-prism-text leading-relaxed font-sans">
                    {generatingInsights ? (
                      <div className="space-y-4">
                        <div className="h-4 bg-prism-surface/50 rounded animate-pulse w-3/4"></div>
                        <div className="h-4 bg-prism-surface/50 rounded animate-pulse w-5/6"></div>
                        <div className="h-4 bg-prism-surface/50 rounded animate-pulse w-2/3"></div>
                      </div>
                    ) : insights ? (
                      <div className="prose prose-invert prose-sm text-prism-text whitespace-pre-wrap">
                        {insights}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-prism-muted text-xs">
                        Click the button above to generate aggregate tutoring insights.
                      </div>
                    )}
                  </div>
                </GlassCard>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal - Create Classroom */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <GlassCard className="w-full max-w-md p-6 border border-prism-border/40 shadow-2xl relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-prism-muted hover:text-prism-text font-bold text-lg"
            >
              ×
            </button>
            <h3 className="font-bold text-xl mb-4">Create New Classroom</h3>
            <form onSubmit={handleCreateCohort} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-prism-muted uppercase tracking-wider mb-2">
                  Classroom / Course Name
                </label>
                <input
                  type="text"
                  required
                  value={newCohortName}
                  onChange={(e) => setNewCohortName(e.target.value)}
                  placeholder="e.g., Physics II, Advanced Calculus"
                  className="w-full bg-prism-base border border-prism-border/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-prism-accent transition-colors"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-prism-border rounded-xl text-sm hover:bg-prism-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCohort || !newCohortName.trim()}
                  className="px-5 py-2 bg-prism-accent text-white font-bold rounded-xl hover:bg-opacity-95 transition-all text-sm disabled:opacity-50"
                >
                  {creatingCohort ? "Creating Class..." : "Create"}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </main>
  );
}
