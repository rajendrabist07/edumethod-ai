"use client";

import React, { useState, useEffect } from "react";
import { ThemeToggle } from "../../components/theme-toggle";
import { BrandMark } from "../../components/brand-mark";
import { RefreshCw, CheckCircle2, ChevronRight, HelpCircle, Eye, GraduationCap, Award, Brain } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface LearningPath {
  id: string;
  subject: string;
  created_at: string;
}

export default function FeynmanPlaygroundPage() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [selectedPathId, setSelectedPathId] = useState("");
  const [topicName, setTopicName] = useState("");
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<{
    clarityScore: number;
    gaps: string[];
    suggestions: string[];
  } | null>(null);

  useEffect(() => {
    fetchLearningPaths();
  }, []);

  async function fetchLearningPaths() {
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        const pathItems = (data.history || [])
          .filter((item: any) => item.type === "path")
          .map((item: any) => ({
            id: item.id,
            subject: item.title,
            created_at: item.date,
          }));
        setPaths(pathItems);
        if (pathItems.length > 0) {
          setSelectedPathId(pathItems[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load textbooks", err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPathId || !topicName.trim() || !explanation.trim() || loading) return;

    setLoading(true);
    setEvaluation(null);

    try {
      const res = await fetch("/api/feynman/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learningPathId: selectedPathId,
          topicName: topicName.trim(),
          userExplanation: explanation.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to evaluate explanation");
      }

      const evalData = await res.json();
      setEvaluation(evalData);
      toast.success("Explanation evaluated successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to parse evaluation report");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setTopicName("");
    setExplanation("");
    setEvaluation(null);
  }

  return (
    <main className="grid-bg h-full overflow-y-auto px-4 py-8 text-prism-text sm:px-6 sm:py-10 lg:px-8 bg-prism-base font-sans flex flex-col">
      <div className="mx-auto flex max-w-3xl w-full flex-col gap-6 h-full flex-grow animate-focus-lens">
        
        {/* Header Bar */}
        <header className="glass-prism flex items-center justify-between rounded-2xl px-6 py-4 transition-all duration-300">
          <div className="flex items-center gap-2 pl-12 lg:pl-0">
            <BrandMark />
            <span className="text-2xs font-extrabold uppercase tracking-widest text-prism-accent font-mono ml-2 border-l border-prism-border pl-3 hidden sm:inline">
              Feynman Technique Playground
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>

        {/* Info Banner */}
        <div className="glass-prism rounded-3xl p-5 border border-prism-border space-y-2">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-prism-accent" />
            <h2 className="text-xs font-black uppercase tracking-widest font-display">The Feynman Technique</h2>
          </div>
          <p className="text-3xs font-semibold text-prism-muted leading-relaxed">
            Richard Feynman's core thesis: "If you cannot explain it to a 5-year-old child in simple terms, you do not truly understand it."
            Write a simple description of your chosen topic below. The AI will evaluate logical gaps against your uploaded syllabus text context.
          </p>
        </div>

        {/* Work Area Layout */}
        <div className="grid gap-6 md:grid-cols-12 items-stretch flex-grow">
          {/* Input Panel */}
          <div className={`glass-prism rounded-3xl p-5 border border-prism-border flex flex-col justify-between ${evaluation ? "md:col-span-6" : "md:col-span-12"}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Select Path */}
              <div className="space-y-1.5">
                <label className="text-4xs font-black text-prism-muted uppercase tracking-wider font-mono">
                  Syllabus Context Roadmap
                </label>
                <select
                  value={selectedPathId}
                  onChange={(e) => setSelectedPathId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-prism-surface border border-prism-border text-prism-text text-3xs font-bold outline-none cursor-pointer focus:border-prism-accent/50"
                >
                  <option value="" disabled>-- Select textbook --</option>
                  {paths.map((p) => (
                    <option key={p.id} value={p.id}>{p.subject}</option>
                  ))}
                </select>
              </div>

              {/* Topic Input */}
              <div className="space-y-1.5">
                <label className="text-4xs font-black text-prism-muted uppercase tracking-wider font-mono">
                  Topic Concept Name
                </label>
                <input
                  type="text"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  placeholder="e.g., Mitosis cell division, Newton's 2nd Law..."
                  required
                  disabled={loading || !!evaluation}
                  className="w-full px-3 py-2 rounded-xl bg-prism-surface border border-prism-border text-prism-text text-3xs font-semibold outline-none focus:border-prism-accent/50"
                />
              </div>

              {/* Explanation Textarea */}
              <div className="space-y-1.5">
                <label className="text-4xs font-black text-prism-muted uppercase tracking-wider font-mono">
                  Your Explanation (Explain simply to a 5-year-old)
                </label>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Write your explanation here (minimum 10 characters)..."
                  required
                  rows={8}
                  disabled={loading || !!evaluation}
                  className="w-full px-3 py-2 rounded-xl bg-prism-surface border border-prism-border text-prism-text text-3xs font-medium outline-none focus:border-prism-accent/50 resize-none leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                {!evaluation ? (
                  <button
                    type="submit"
                    disabled={loading || !topicName.trim() || !explanation.trim() || !selectedPathId}
                    className="flex-1 rounded-full bg-gradient-to-r from-prism-accent to-blue-500 py-3 text-2xs font-extrabold uppercase tracking-widest text-prism-base hover:shadow-lg transition font-mono flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" /> Evaluating...
                      </>
                    ) : (
                      <>
                        <GraduationCap size={14} /> Submit Explanation
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 rounded-full border border-prism-border bg-prism-surface py-3 text-2xs font-extrabold uppercase tracking-widest text-prism-text hover:bg-white/5 transition font-mono flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw size={12} /> Test New Concept
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Evaluation Report Panel */}
          <AnimatePresence>
            {evaluation && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="md:col-span-6 glass-prism rounded-3xl p-5 border border-prism-border flex flex-col justify-between"
              >
                <div className="space-y-5">
                  {/* Score circle */}
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-full border-2 border-prism-border flex items-center justify-center font-mono font-black text-lg bg-prism-accent/5">
                      <span className="text-prism-accent">{evaluation.clarityScore}%</span>
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider font-display">Clarity Score</h3>
                      <p className="text-[10px] text-prism-muted font-mono uppercase tracking-wide">
                        {evaluation.clarityScore >= 80
                          ? "Excellent Simplicity!"
                          : evaluation.clarityScore >= 50
                            ? "Good foundation, review suggestions"
                            : "Needs more simplification"}
                      </p>
                    </div>
                  </div>

                  {/* Logic Gaps */}
                  <div className="space-y-2">
                    <h4 className="text-3xs font-black uppercase tracking-wider text-prism-muted font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Logical Gaps / Missing Points
                    </h4>
                    {evaluation.gaps.length === 0 ? (
                      <p className="text-[10px] font-semibold text-prism-accent font-sans leading-relaxed pl-3">
                        ✓ No critical logic gaps detected! You nailed the core terms.
                      </p>
                    ) : (
                      <ul className="list-disc pl-5 space-y-1">
                        {evaluation.gaps.map((gap, idx) => (
                          <li key={idx} className="text-[10px] text-prism-muted leading-relaxed">
                            {gap}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Suggestions */}
                  <div className="space-y-2">
                    <h4 className="text-3xs font-black uppercase tracking-wider text-prism-muted font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-prism-accent" /> Socratic Suggestions
                    </h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {evaluation.suggestions.map((sug, idx) => (
                        <li key={idx} className="text-[10px] text-prism-muted leading-relaxed">
                          {sug}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="border-t border-prism-border/40 pt-3 mt-4 text-center">
                  <span className="text-4xs font-bold text-prism-muted uppercase tracking-widest font-mono flex items-center justify-center gap-1">
                    <Award size={10} className="text-prism-accent" /> mastery score will update automatically
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
