import Link from "next/link";
import { BrandMark } from "./components/brand-mark";
import { ThemeToggle } from "./components/theme-toggle";
import { DocumentPasteIcon } from "@/components/icons/DocumentPasteIcon";
import { QuizTargetIcon } from "@/components/icons/QuizTargetIcon";
import { PathProgressIcon } from "@/components/icons/PathProgressIcon";
import { ChatSparkIcon } from "@/components/icons/ChatSparkIcon";

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

export default function Home() {
  return (
    <main className="grid-bg min-h-screen text-[color:var(--text)] transition-colors duration-300">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "EduMethod AI",
            "operatingSystem": "All",
            "applicationCategory": "EducationalApplication",
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
        <header className="glass-card mb-12 flex items-center justify-between rounded-2xl px-6 py-4 transition-all duration-300 hover:border-blue-500/30">
          <BrandMark />
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/doubt-solver"
              className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)]/50 px-4 py-2 text-xs sm:text-sm font-semibold text-[color:var(--text)] transition hover:text-blue-600 active:scale-95"
            >
              Try Doubt Solver
            </Link>
            <Link
              href="/upload"
              className="rounded-full bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-md shadow-blue-600/10 transition duration-300 hover:bg-blue-700 hover:shadow-lg active:scale-95"
            >
              Get Started
            </Link>
            <ThemeToggle />
          </div>
        </header>

        {/* Hero Section */}
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
          <div className="space-y-8 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/50 px-4 py-1.5 text-xs font-semibold text-blue-600 shadow-sm backdrop-blur-sm dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500"></span>
              AI-Powered Learning Platform
            </span>
            <h1 className="bg-gradient-to-r from-[color:var(--text)] via-blue-600 to-indigo-600 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
              Turn any syllabus into a clearer study path.
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-[color:var(--muted)] sm:text-base lg:mx-0">
              EduMethod AI helps students and teachers break down chapters into
              structured topics, estimate study times, and generate interactive,
              spaced-repetition study roadmaps instantly.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 lg:justify-start w-full sm:w-auto">
              <Link
                href="/upload"
                className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/30 hover:translate-y-[-1px] active:scale-95 text-center min-h-[44px] flex items-center justify-center"
              >
                Analyze Your Syllabus
              </Link>
              <a
                href="#features"
                className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)]/50 px-6 py-3.5 text-sm font-bold text-[color:var(--text)] backdrop-blur-sm transition-all duration-300 hover:border-blue-400/50 hover:bg-[color:var(--surface)] hover:text-blue-600 active:scale-95 text-center min-h-[44px] flex items-center justify-center"
              >
                Explore Features
              </a>
            </div>

            {/* Social Proof badges */}
            <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 text-3xs font-black uppercase tracking-wider text-[color:var(--muted)]">
                ⚡ Powered by Groq + Gemini
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 text-3xs font-black uppercase tracking-wider text-[color:var(--muted)]">
                📅 7-Day Adaptive Plans
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 text-3xs font-black uppercase tracking-wider text-[color:var(--muted)]">
                👁️ Multimodal Input
              </span>
            </div>
          </div>

          {/* Premium UI Mockup Preview */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-tr from-blue-500 to-indigo-500 opacity-20 blur-xl dark:opacity-30"></div>
            <div className="glass-card relative rounded-[2rem] p-6 shadow-2xl dark:shadow-slate-950/40">
              
              {/* Window Controls */}
              <div className="mb-6 flex items-center justify-between border-b border-[color:var(--border)]/50 pb-4">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                  <div className="h-3 w-3 rounded-full bg-green-400"></div>
                </div>
                <div className="rounded-full border border-blue-200/50 bg-blue-50/50 px-3 py-1 text-2xs font-semibold text-blue-600 dark:border-sky-900/50 dark:bg-slate-900/60 dark:text-blue-400">
                  ⚡ Live AI Preview
                </div>
              </div>

              {/* Mock Content */}
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-soft)]/50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-2xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">Subject</p>
                    <p className="text-lg font-bold text-[color:var(--text)]">Quantum Physics</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                    <ChatSparkIcon size={18} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-[color:var(--border)]/50 bg-[color:var(--surface)] p-3.5 shadow-sm transition-all duration-300 hover:border-emerald-400/30 animate-pulse-emerald">
                    <div className="flex items-center justify-between text-xs text-[color:var(--muted)]">
                      <span>Topic 1</span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-3xs font-bold uppercase tracking-wider text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                        Easy
                      </span>
                    </div>
                    <p className="mt-1.5 font-semibold text-[color:var(--text)]">Wave-Particle Duality</p>
                  </div>

                  <div className="rounded-xl border border-[color:var(--border)]/50 bg-[color:var(--surface)] p-3.5 shadow-sm transition-all duration-300 hover:border-amber-400/30 animate-pulse-amber">
                    <div className="flex items-center justify-between text-xs text-[color:var(--muted)]">
                      <span>Topic 2</span>
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-3xs font-bold uppercase tracking-wider text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                        Medium
                      </span>
                    </div>
                    <p className="mt-1.5 font-semibold text-[color:var(--text)]">Schrödinger Equation</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mt-20 border-t border-[color:var(--border)]/20 pt-16">
          <div className="text-center max-w-lg mx-auto mb-10">
            <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 px-3.5 py-1 text-4xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Cognitive Progression Path
            </span>
            <h2 className="text-xl font-black mt-3 sm:text-2xl">How EduMethod AI Works</h2>
            <p className="text-2xs font-semibold text-[color:var(--muted)] leading-relaxed mt-1 uppercase tracking-wider">
              Three steps to structured academic mastery.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Step 1 */}
            <div className="glass-card rounded-2xl p-6 relative">
              <span className="absolute top-4 right-6 text-3xl font-black text-blue-600/10 dark:text-blue-500/5 select-none">01</span>
              <div className="mb-4 inline-flex rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/40">
                <DocumentPasteIcon size={20} />
              </div>
              <h3 className="text-sm font-bold text-[color:var(--text)] uppercase tracking-wider">1. Input Syllabus</h3>
              <p className="mt-2 text-2xs leading-relaxed text-[color:var(--muted)]">
                Paste raw lecture schedules, syllabus topics, outline notes, or upload structural snapshots.
              </p>
            </div>

            {/* Step 2 */}
            <div className="glass-card rounded-2xl p-6 relative">
              <span className="absolute top-4 right-6 text-3xl font-black text-purple-600/10 dark:text-purple-500/5 select-none">02</span>
              <div className="mb-4 inline-flex rounded-xl bg-purple-50 p-2.5 text-purple-600 dark:bg-purple-950/40">
                <ChatSparkIcon size={20} />
              </div>
              <h3 className="text-sm font-bold text-[color:var(--text)] uppercase tracking-wider">2. AI Decomposition</h3>
              <p className="mt-2 text-2xs leading-relaxed text-[color:var(--muted)]">
                AI analyzes topics, partitions them into modules, and assigns estimated hours and difficulty.
              </p>
            </div>

            {/* Step 3 */}
            <div className="glass-card rounded-2xl p-6 relative">
              <span className="absolute top-4 right-6 text-3xl font-black text-emerald-600/10 dark:text-emerald-500/5 select-none">03</span>
              <div className="mb-4 inline-flex rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-950/40">
                <PathProgressIcon size={20} />
              </div>
              <h3 className="text-sm font-bold text-[color:var(--text)] uppercase tracking-wider">3. Spaced Study Path</h3>
              <p className="mt-2 text-2xs leading-relaxed text-[color:var(--muted)]">
                Follow your structured 7-day adaptive plan and test recall weaknesses with active quizzes.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div id="features" className="mt-20 grid gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="glass-card glass-card-hover rounded-2xl p-6"
            >
              <div className="mb-4 inline-flex rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/40">
                {feature.title.includes("Extraction") ? (
                  <DocumentPasteIcon size={20} />
                ) : feature.title.includes("Difficulty") ? (
                  <QuizTargetIcon size={20} />
                ) : (
                  <PathProgressIcon size={20} />
                )}
              </div>
              <h2 className="text-base font-bold text-[color:var(--text)] sm:text-lg">
                {feature.title}
              </h2>
              <p className="mt-2 text-xs leading-6 text-[color:var(--muted)] sm:text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-16 border-t border-[color:var(--border)]/30 pt-8 text-center text-xs text-[color:var(--muted)]">
          <p>© {new Date().getFullYear()} EduMethod AI. Designed for visual and educational excellence.</p>
        </footer>

      </section>
    </main>
  );
}
