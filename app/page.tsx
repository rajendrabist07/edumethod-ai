import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "./components/brand-mark";
import { ThemeToggle } from "./components/theme-toggle";
import { DocumentPasteIcon } from "@/components/icons/DocumentPasteIcon";
import { GlassCard } from "./components/ui/GlassCard";
import { GlassButton } from "./components/ui/GlassButton";
import { StatBadge } from "./components/ui/StatBadge";
import { Brain, Sparkles, ShieldCheck, Zap, Layers, RefreshCw, BarChart3, Network } from "lucide-react";

export const metadata: Metadata = {
  title: "EduMethod AI — Education Strength as Identity | Learning Science & RAG Workspace",
  description: "Transform raw syllabus text or snapshots into personalized study paths, adaptive quizzes, and step-by-step doubt-solving guides built on 6 core cognitive science principles.",
  alternates: {
    canonical: "/",
  },
};

const pedagogicalPrinciples = [
  {
    icon: "🧩",
    title: "1. Struggle Before Solution",
    description: "Fresh doubt threads default to Socratic scaffolding (hints/questions) rather than giving away direct answers immediately.",
  },
  {
    icon: "🧠",
    title: "2. Retrieval Before Review",
    description: "Forces active text recall attempts before revealing stored flashcard back answers to maximize long-term retention.",
  },
  {
    icon: "🎯",
    title: "3. Confidence Calibration",
    description: "Captures confidence ratings before quiz answers are revealed and flags overconfidence (Illusion of Competence).",
  },
  {
    icon: "🔒",
    title: "4. Multi-Session Mastery Gating",
    description: "Holds topics in progress until N correct reviews are verified across at least 2 separate sessions spaced 24h apart.",
  },
  {
    icon: "🔀",
    title: "5. Interleaved Practice",
    description: "Round-robin alternates study items across multiple active topics rather than drilling in blocked single-topic sessions.",
  },
  {
    icon: "❌",
    title: "6. Misconception-Aware Correction",
    description: "Analyzes the specific wrong option chosen to explain the plausible misconception behind that specific answer.",
  },
];

const systemEngines = [
  {
    icon: <Brain className="h-5 w-5 text-purple-400" />,
    title: "Persistent Learner Memory Engine",
    description: "Maintains long-term student memory in Supabase tracking per-topic mastery scores, mistake patterns, and preferred explanation style.",
  },
  {
    icon: <Layers className="h-5 w-5 text-indigo-400" />,
    title: "RAG Material Grounding",
    description: "Uses Supabase pgvector HNSW vector search over uploaded syllabi & notes with explicit section citations.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5 text-emerald-400" />,
    title: "Verification & Audit Layer",
    description: "Independent AI verification audit pass and multi-step arithmetic code execution in sandboxed environments.",
  },
  {
    icon: <Zap className="h-5 w-5 text-amber-400" />,
    title: "Multi-Provider AI Gateway",
    description: "Groq (70B/8B) + Gemini 2.0 Flash with automatic provider failover and 35-second provider timeouts.",
  },
  {
    icon: <RefreshCw className="h-5 w-5 text-blue-400" />,
    title: "SM-2 Spaced Roadmaps",
    description: "Persistent 7-day study paths with SuperMemo-2 review schedules, streak tracking, and mastery badges.",
  },
  {
    icon: <BarChart3 className="h-5 w-5 text-rose-400" />,
    title: "Outcome Data Flywheel",
    description: "Logs quiz outcome telemetry to continually track which teaching strategy delivers highest correctness rate per topic.",
  },
];

export default function Home() {
  return (
    <main className="grid-bg min-h-screen text-prism-text transition-colors duration-300">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "EduMethod AI",
            "operatingSystem": "All",
            "applicationCategory": "EducationalApplication",
            "url": "https://edumethod-ai.vercel.app",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "An intelligent learning assistant built on 6 cognitive learning science principles that transforms raw syllabus text into structured study paths, adaptive quizzes, and doubt-solving guides.",
            "creator": {
              "@type": "Person",
              "name": "Rajendra Bist"
            }
          })
        }}
      />
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-between px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        
        {/* Navigation Header */}
        <header className="glass-card mb-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl px-6 py-4 transition-all duration-300 hover:border-prism-accent/30 focus-within:ring-2 focus-within:ring-prism-accent">
          <BrandMark />
          
          <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-prism-muted">
            <Link href="/doubt-solver" className="hover:text-prism-text transition-colors">Doubt Solver</Link>
            <Link href="/textbook-chat" className="hover:text-prism-text transition-colors">Textbook Chat</Link>
            <Link href="/feynman" className="hover:text-prism-text transition-colors">Feynman Tutor</Link>
            <Link href="/flashcards" className="hover:text-prism-text transition-colors">Flashcards</Link>
            <Link href="/mastery-map" className="hover:text-prism-text transition-colors">Mastery Map</Link>
            <Link href="/flywheel" className="hover:text-prism-text transition-colors">Data Flywheel</Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <GlassButton href="/doubt-solver" variant="secondary" className="px-4 py-2 text-xs sm:text-sm hidden sm:inline-flex">
              Try Doubt Solver
            </GlassButton>
            <GlassButton href="/upload" variant="primary" className="px-4 py-2 text-xs sm:text-sm">
              Get Started
            </GlassButton>
            <ThemeToggle />
          </div>
        </header>

        {/* Hero Section */}
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
          <div className="space-y-8 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-prism-border bg-prism-surface/70 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-prism-accent shadow-sm backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--scholar-leaf)]"></span>
              The Pedagogical Core (v12) Enabled
            </span>
            <h1 className="edu-brand-text text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl font-display leading-[1.15]">
              Education Strength as Identity.
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-prism-muted sm:text-base lg:mx-0">
              Built on 6 cognitive learning-science principles: struggle before solution, active retrieval, confidence calibration, spaced mastery gating, interleaved practice, and misconception diagnosis.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 lg:justify-start w-full sm:w-auto">
              <GlassButton href="/upload" variant="primary" className="px-6 py-3.5 min-h-[44px]">
                Analyze Your Syllabus
              </GlassButton>
              <GlassButton href="#pedagogy" variant="secondary" className="px-6 py-3.5 min-h-[44px]">
                Explore Pedagogical Core
              </GlassButton>
            </div>

            {/* Social Proof badges */}
            <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-2.5">
              <StatBadge label="Groq + Gemini Gateway" value="35s Timeout" variant="accent" />
              <StatBadge label="50 Unit Tests" value="100% Passed" variant="success" />
              <StatBadge label="Supabase pgvector" value="HNSW Index" variant="default" />
            </div>
          </div>

          {/* UI Mockup Preview */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="edu-card relative p-6">
              
              {/* Window Controls */}
              <div className="mb-6 flex items-center justify-between border-b border-prism-border/50 pb-4">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                  <div className="h-3 w-3 rounded-full bg-green-400"></div>
                </div>
                <StatBadge label="Pedagogical Engine Active" value="" variant="accent" />
              </div>

              {/* Mock Content */}
              <div className="rounded-2xl border border-prism-border bg-prism-surface p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-prism-border/30 pb-3">
                  <div>
                    <p className="text-2xs font-semibold uppercase tracking-[0.2em] text-prism-muted">Topic Mastery</p>
                    <p className="text-sm font-bold text-prism-text">Quantum Mechanics</p>
                  </div>
                  <StatBadge label="Streak" value="🔥 5 Days" variant="warning" />
                </div>

                <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 text-xs leading-relaxed">
                  <span className="font-bold text-purple-400">💡 Principle 1 (Struggle First):</span> What mathematical operation isolates acceleration when mass is multiplied by acceleration?
                </div>

                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs leading-relaxed">
                  <span className="font-bold text-emerald-400">🔒 Principle 4 (Mastery Gated):</span> 85% score in session 1! 1 more review needed spaced 24h apart.
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Pedagogical Core Section */}
        <div id="pedagogy" className="mt-20 border-t border-prism-border/20 pt-16">
          <div className="text-center max-w-xl mx-auto mb-12">
            <StatBadge label="Cognitive Science Core" value="v12 Standard" variant="accent" className="mx-auto w-max" />
            <h2 className="text-2xl font-display font-black mt-3 sm:text-3xl text-prism-text">The 6 Pedagogical Principles</h2>
            <p className="text-xs font-semibold text-prism-muted leading-relaxed mt-2 uppercase tracking-wider">
              Designed around how human memory works, not just how AI generates text.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pedagogicalPrinciples.map((item) => (
              <GlassCard key={item.title} hoverEffect className="rounded-2xl p-6 relative">
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="text-sm font-bold text-prism-text uppercase tracking-wider">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-prism-muted">
                  {item.description}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* 7 System Engines Section */}
        <div className="mt-20 border-t border-prism-border/20 pt-16">
          <div className="text-center max-w-xl mx-auto mb-12">
            <StatBadge label="System Architecture" value="7 Core Engines" variant="success" className="mx-auto w-max" />
            <h2 className="text-2xl font-display font-black mt-3 sm:text-3xl text-prism-text">Enterprise System Architecture</h2>
            <p className="text-xs font-semibold text-prism-muted leading-relaxed mt-2 uppercase tracking-wider">
              Built on Next.js 16, Supabase pgvector, Groq, and Upstash Redis.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {systemEngines.map((engine) => (
              <GlassCard key={engine.title} hoverEffect className="rounded-2xl p-6">
                <div className="mb-3 inline-flex rounded-xl bg-prism-surface p-2.5 border border-prism-border">
                  {engine.icon}
                </div>
                <h3 className="text-sm font-bold text-prism-text">{engine.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-prism-muted">
                  {engine.description}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Interactive Workspace Navigation Grid */}
        <div className="mt-20 border-t border-prism-border/20 pt-16">
          <div className="text-center max-w-xl mx-auto mb-12">
            <StatBadge label="Interactive Tools" value="Workspace Suite" variant="warning" className="mx-auto w-max" />
            <h2 className="text-2xl font-display font-black mt-3 sm:text-3xl text-prism-text">Interactive Learning Suite</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/doubt-solver" className="glass-card hover:border-purple-500/40 rounded-2xl p-5 transition-all">
              <Sparkles className="h-6 w-6 text-purple-400 mb-2" />
              <h3 className="text-sm font-bold text-prism-text">Doubt Solver</h3>
              <p className="mt-1 text-xs text-prism-muted">3-stage cognitive pipeline with strategy metadata.</p>
            </Link>

            <Link href="/textbook-chat" className="glass-card hover:border-indigo-500/40 rounded-2xl p-5 transition-all">
              <DocumentPasteIcon size={24} className="text-indigo-400 mb-2" />
              <h3 className="text-sm font-bold text-prism-text">Textbook Chat</h3>
              <p className="mt-1 text-xs text-prism-muted">RAG search over uploaded syllabus materials.</p>
            </Link>

            <Link href="/feynman" className="glass-card hover:border-emerald-500/40 rounded-2xl p-5 transition-all">
              <Brain className="h-6 w-6 text-emerald-400 mb-2" />
              <h3 className="text-sm font-bold text-prism-text">Feynman Tutor</h3>
              <p className="mt-1 text-xs text-prism-muted">Explain concepts in simple terms for AI grading.</p>
            </Link>

            <Link href="/mastery-map" className="glass-card hover:border-blue-500/40 rounded-2xl p-5 transition-all">
              <Network className="h-6 w-6 text-blue-400 mb-2" />
              <h3 className="text-sm font-bold text-prism-text">Mastery Map</h3>
              <p className="mt-1 text-xs text-prism-muted">Interactive 2D graph of knowledge nodes.</p>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 border-t border-prism-border/30 pt-8 text-center text-xs text-prism-muted">
          <p>© {new Date().getFullYear()} EduMethod AI. Education Strength as Identity.</p>
        </footer>

      </section>
    </main>
  );
}
