"use client";

import React, { useState } from "react";
import { Info, ShieldCheck, AlertTriangle, BookOpen, Brain, ChevronDown, ChevronUp } from "lucide-react";

export interface TransparencyMeta {
  grounding: string;
  strategy: string;
  verification: string;
  isDowngraded?: boolean;
}

export function TransparencyBadge({ meta }: { meta: TransparencyMeta }) {
  const [open, setOpen] = useState(false);

  if (!meta || (!meta.grounding && !meta.strategy && !meta.verification)) {
    return null;
  }

  return (
    <div className="mt-2.5 rounded-xl border border-prism-border/60 bg-prism-accent/5 p-2.5 text-xs transition-all duration-200">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between font-mono text-[11px] font-bold text-prism-accent hover:opacity-90 transition cursor-pointer"
      >
        <span className="flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>Why this answer? (System Transparency & Grounding)</span>
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
      </button>

      {open && (
        <div className="mt-2.5 flex flex-col gap-2 border-t border-prism-border/40 pt-2.5 font-sans text-[11px] text-prism-muted animate-fadeIn">
          <div className="flex items-start gap-2">
            <BookOpen className="h-3.5 w-3.5 shrink-0 text-blue-500 mt-0.5" />
            <div>
              <span className="font-bold text-prism-text">Source Grounding: </span>
              <span>{meta.grounding || "Answered from general knowledge"}</span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Brain className="h-3.5 w-3.5 shrink-0 text-purple-500 mt-0.5" />
            <div>
              <span className="font-bold text-prism-text">Adaptive Strategy: </span>
              <span>{meta.strategy || "Standard explanation"}</span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            {meta.isDowngraded ? (
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5 animate-pulse" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
            )}
            <div>
              <span className="font-bold text-prism-text">Verification Audit: </span>
              <span className={meta.isDowngraded ? "text-amber-600 dark:text-amber-400 font-semibold" : ""}>
                {meta.verification || "Verified by System Auditor"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
