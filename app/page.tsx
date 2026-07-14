import Link from "next/link";
import { BrandMark, FeatureIcon } from "./components/brand-mark";
import { ThemeToggle } from "./components/theme-toggle";

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
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-between px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        
        {/* Navigation Header */}
        <header className="mb-12 flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]/70 px-6 py-4 shadow-lg shadow-blue-500/5 backdrop-blur-md transition-all duration-300 hover:border-blue-500/30">
          <BrandMark />
          <div className="flex items-center gap-4">
            <Link
              href="/upload"
              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/10 transition duration-300 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 active:scale-95"
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
            <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link
                href="/upload"
                className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/30 hover:translate-y-[-1px] active:scale-95"
              >
                Analyze Your Syllabus
              </Link>
              <a
                href="#features"
                className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)]/50 px-6 py-3.5 text-sm font-bold text-[color:var(--text)] backdrop-blur-sm transition-all duration-300 hover:border-blue-400/50 hover:bg-[color:var(--surface)] hover:text-blue-600 active:scale-95"
              >
                Explore Features
              </a>
            </div>
          </div>

          {/* Premium UI Mockup Preview */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-tr from-blue-500 to-indigo-500 opacity-20 blur-xl dark:opacity-30"></div>
            <div className="relative rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)]/85 p-6 shadow-2xl backdrop-blur-md dark:shadow-slate-950/40">
              
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
                    <FeatureIcon kind="spark" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-[color:var(--border)]/50 bg-[color:var(--surface)] p-3.5 shadow-sm transition-all duration-300 hover:border-emerald-400/30">
                    <div className="flex items-center justify-between text-xs text-[color:var(--muted)]">
                      <span>Topic 1</span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-3xs font-bold uppercase tracking-wider text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                        Easy
                      </span>
                    </div>
                    <p className="mt-1.5 font-semibold text-[color:var(--text)]">Wave-Particle Duality</p>
                  </div>

                  <div className="rounded-xl border border-[color:var(--border)]/50 bg-[color:var(--surface)] p-3.5 shadow-sm transition-all duration-300 hover:border-amber-400/30">
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

        {/* Feature Cards Grid */}
        <div id="features" className="mt-20 grid gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="glow-hover rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]/50 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-blue-500/20 hover:bg-[color:var(--surface)]"
            >
              <div className="mb-4 inline-flex rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/40">
                {feature.title.includes("Extraction") ? (
                  <FeatureIcon kind="spark" />
                ) : feature.title.includes("Difficulty") ? (
                  <FeatureIcon kind="target" />
                ) : (
                  <FeatureIcon kind="chart" />
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
