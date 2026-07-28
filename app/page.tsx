import type { Metadata } from "next";
import { BrandMark } from "./components/brand-mark";
import { ThemeToggle } from "./components/theme-toggle";
import { DocumentPasteIcon } from "@/components/icons/DocumentPasteIcon";
import { QuizTargetIcon } from "@/components/icons/QuizTargetIcon";
import { PathProgressIcon } from "@/components/icons/PathProgressIcon";
import { ChatSparkIcon } from "@/components/icons/ChatSparkIcon";
import { GlassCard } from "./components/ui/GlassCard";
import { GlassButton } from "./components/ui/GlassButton";
import { StatBadge } from "./components/ui/StatBadge";

const features = [
  {
    title: "Smart Topic Extraction",
    description: "Turn messy syllabus text into clear, organized learning modules with a single paste.",
  },
  {
    title: "Difficulty Mapping",
    description: "Instantly see which topics are easy, medium, or hard at a glance to prioritize study.",
  },
  {
    title: "Faster Study Planning",
    description: "Build an interleaving, spaced-repetition 7-day study path tailored to your syllabus.",
  },
];

export const metadata: Metadata = {
  title: "EduMethod AI — Hyper-Accurate 7-Day Study Plans & AI Doubt Solver",
  description: "Transform raw syllabus text or snapshots into personalized study paths, adaptive quizzes, and step-by-step doubt-solving guides instantly.",
  alternates: {
    canonical: "/",
  },
};

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
            "description": "An intelligent learning assistant that transforms raw syllabus text or images into structured 7-day study paths, adaptive quizzes, and step-by-step problem solutions.",
            "creator": {
              "@type": "Person",
              "name": "Rajendra Bist"
            }
          })
        }}
      />
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-between px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        
        {/* Navigation Header */}
        <header className="glass-card mb-12 flex items-center justify-between rounded-2xl px-6 py-4 transition-all duration-300 hover:border-prism-accent/30 focus-within:ring-2 focus-within:ring-prism-accent">
          <BrandMark />
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
              Learning Intelligence Workspace
            </span>
            <h1 className="edu-brand-text text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl font-display">
              Turn any syllabus into a clearer study path.
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-prism-muted sm:text-base lg:mx-0">
              EduMethod AI helps students and teachers break down chapters into
              structured topics, estimate study times, and generate interactive,
              spaced-repetition study roadmaps instantly.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 lg:justify-start w-full sm:w-auto">
              <GlassButton href="/upload" variant="primary" className="px-6 py-3.5 min-h-[44px]">
                Analyze Your Syllabus
              </GlassButton>
              <GlassButton href="#features" variant="secondary" className="px-6 py-3.5 min-h-[44px]">
                Explore Features
              </GlassButton>
            </div>

            {/* Social Proof badges */}
            <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-2.5">
              <StatBadge label="Groq + Gemini Gateway" value="" />
              <StatBadge label="Adaptive 7-Day Plans" value="" />
              <StatBadge label="Multimodal Tutor" value="" />
            </div>
          </div>

          {/* UI Mockup Preview */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            {/* LCP Optimization: Heavy CSS blur removed in favor of faster shadow composition */}
            <div className="edu-card relative p-6">
              
              {/* Window Controls */}
              <div className="mb-6 flex items-center justify-between border-b border-prism-border/50 pb-4">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                  <div className="h-3 w-3 rounded-full bg-green-400"></div>
                </div>
                <StatBadge label="Live AI Preview" value="" variant="accent" />
              </div>

              {/* Mock Content */}
              <div className="rounded-2xl border border-prism-border bg-prism-surface p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-2xs font-semibold uppercase tracking-[0.2em] text-prism-muted">Subject</p>
                    <p className="text-lg font-bold text-prism-text">Quantum Physics</p>
                  </div>
                  <div className="edu-icon-tile h-10 w-10">
                    <ChatSparkIcon size={18} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-prism-border/50 bg-prism-surface p-3.5 shadow-sm transition-all duration-300 hover:border-emerald-400/30 animate-pulse-emerald">
                    <div className="flex items-center justify-between text-xs text-prism-muted">
                      <span>Topic 1</span>
                      <StatBadge label="Easy" value="" variant="success" className="py-0.5 px-2" />
                    </div>
                    <p className="mt-1.5 font-semibold text-prism-text">Wave-Particle Duality</p>
                  </div>

                  <div className="rounded-xl border border-prism-border/50 bg-prism-surface p-3.5 shadow-sm transition-all duration-300 hover:border-amber-400/30 animate-pulse-amber">
                    <div className="flex items-center justify-between text-xs text-prism-muted">
                      <span>Topic 2</span>
                      <StatBadge label="Medium" value="" variant="warning" className="py-0.5 px-2" />
                    </div>
                    <p className="mt-1.5 font-semibold text-prism-text">Schrödinger Equation</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mt-20 border-t border-prism-border/20 pt-16">
          <div className="text-center max-w-lg mx-auto mb-10">
            <StatBadge label="Cognitive Progression Path" value="" variant="accent" className="mx-auto w-max" />
            <h2 className="text-xl font-display font-black mt-3 sm:text-2xl text-prism-text">How EduMethod AI Works</h2>
            <p className="text-2xs font-semibold text-prism-muted leading-relaxed mt-1 uppercase tracking-wider">
              Three steps to structured academic mastery.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Step 1 */}
            <GlassCard hoverEffect className="rounded-2xl p-6 relative">
              <span className="absolute top-4 right-6 text-3xl font-black text-prism-text/5 select-none">01</span>
              <div className="mb-4 inline-flex rounded-xl bg-prism-accent/10 p-2.5 text-prism-accent">
                <DocumentPasteIcon size={20} />
              </div>
              <h3 className="text-sm font-bold text-prism-text uppercase tracking-wider">1. Input Syllabus</h3>
              <p className="mt-2 text-2xs leading-relaxed text-prism-muted">
                Paste raw lecture schedules, syllabus topics, outline notes, or upload structural snapshots.
              </p>
            </GlassCard>

            {/* Step 2 */}
            <GlassCard hoverEffect className="rounded-2xl p-6 relative">
              <span className="absolute top-4 right-6 text-3xl font-black text-prism-text/5 select-none">02</span>
              <div className="mb-4 inline-flex rounded-xl bg-prism-accent/10 p-2.5 text-prism-accent">
                <ChatSparkIcon size={20} />
              </div>
              <h3 className="text-sm font-bold text-prism-text uppercase tracking-wider">2. AI Decomposition</h3>
              <p className="mt-2 text-2xs leading-relaxed text-prism-muted">
                AI analyzes topics, partitions them into modules, and assigns estimated hours and difficulty.
              </p>
            </GlassCard>

            {/* Step 3 */}
            <GlassCard hoverEffect className="rounded-2xl p-6 relative">
              <span className="absolute top-4 right-6 text-3xl font-black text-prism-text/5 select-none">03</span>
              <div className="mb-4 inline-flex rounded-xl bg-prism-accent/10 p-2.5 text-prism-accent">
                <PathProgressIcon size={20} />
              </div>
              <h3 className="text-sm font-bold text-prism-text uppercase tracking-wider">3. Spaced Study Path</h3>
              <p className="mt-2 text-2xs leading-relaxed text-prism-muted">
                Follow your structured 7-day adaptive plan and test recall weaknesses with active quizzes.
              </p>
            </GlassCard>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div id="features" className="mt-20 grid gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <GlassCard
              key={feature.title}
              hoverEffect
              className="rounded-2xl p-6"
            >
              <div className="mb-4 inline-flex rounded-xl bg-prism-accent/10 p-3 text-prism-accent">
                {feature.title.includes("Extraction") ? (
                  <DocumentPasteIcon size={20} />
                ) : feature.title.includes("Difficulty") ? (
                  <QuizTargetIcon size={20} />
                ) : (
                  <PathProgressIcon size={20} />
                )}
              </div>
              <h2 className="text-base font-bold text-prism-text sm:text-lg">
                {feature.title}
              </h2>
              <p className="mt-2 text-xs leading-6 text-prism-muted sm:text-sm">
                {feature.description}
              </p>
            </GlassCard>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-16 border-t border-prism-border/30 pt-8 text-center text-xs text-prism-muted">
          <p>© {new Date().getFullYear()} EduMethod AI. Designed for visual and educational excellence.</p>
        </footer>

      </section>
    </main>
  );
}
