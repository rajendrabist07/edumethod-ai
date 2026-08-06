"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content leading-[1.7] text-[14px] text-prism-text tracking-normal ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-lg sm:text-xl font-bold mt-5 mb-3 tracking-tight text-purple-600 dark:text-purple-400 border-b border-purple-500/20 pb-1">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base sm:text-lg font-bold mt-4 mb-2.5 tracking-tight text-indigo-600 dark:text-indigo-400">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm sm:text-base font-semibold mt-3.5 mb-2 tracking-tight text-purple-500 dark:text-purple-300">
              {children}
            </h3>
          ),
          p: ({ children }) => {
            const textContent = typeof children === "string" ? children : "";
            const isKeyIdea = textContent.includes("💡") || textContent.includes("Key idea");
            const isMistake = textContent.includes("⚠️") || textContent.includes("Common mistake");
            const isCheck = textContent.includes("✅") || textContent.includes("Check");

            if (isKeyIdea || isMistake || isCheck) {
              const borderClass = isMistake
                ? "border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200"
                : isCheck
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                : "border-purple-500/50 bg-purple-500/10 text-purple-900 dark:text-purple-200";

              return (
                <div className={`my-3 p-3.5 rounded-xl border-l-4 ${borderClass} shadow-sm text-[13.5px] leading-relaxed`}>
                  {children}
                </div>
              );
            }

            return <p className="mb-3.5 last:mb-0 leading-[1.75] text-[14px] text-prism-text/90 font-normal">{children}</p>;
          },
          strong: ({ children }) => (
            <strong className="font-semibold text-purple-700 dark:text-purple-300 bg-purple-500/10 px-1 py-0.5 rounded">
              {children}
            </strong>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-3 space-y-2 marker:text-purple-500 text-[14px] leading-relaxed">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-3 space-y-2 marker:text-purple-500 marker:font-bold text-[14px] leading-relaxed">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-[14px] text-prism-text leading-relaxed">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-purple-500/50 bg-purple-500/5 dark:bg-white/5 rounded-r-xl p-3.5 my-3 italic text-prism-muted text-[13.5px]">
              {children}
            </blockquote>
          ),
          code({ className, children, ...props }: React.ComponentPropsWithoutRef<"code">) {
            const inline = !className && !String(children).includes("\n");
            return !inline ? (
              <div className="my-3.5 rounded-xl overflow-hidden border border-slate-700/40 dark:border-white/10 shadow-lg">
                <div className="bg-slate-900 dark:bg-[#0f1117] text-slate-400 px-3.5 py-1.5 text-[11px] font-mono border-b border-white/10 flex items-center justify-between">
                  <span>code / formula</span>
                </div>
                <pre className="bg-[#090a0f] p-4 overflow-x-auto text-[12.5px] font-mono leading-relaxed text-purple-200">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code className="bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 rounded px-1.5 py-0.5 text-[12px] font-mono font-medium" {...props}>
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
              <table className="w-full text-left border-collapse text-[13px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-purple-500/10 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 font-semibold text-purple-700 dark:text-purple-300">{children}</thead>
          ),
          th: ({ children }) => <th className="p-3 border-r last:border-0 border-slate-200/50 dark:border-white/10">{children}</th>,
          td: ({ children }) => <td className="p-3 border-t border-r last:border-0 border-slate-200/50 dark:border-white/10">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
