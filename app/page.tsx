import Link from "next/link";
import { BrandMark, FeatureIcon } from "./components/brand-mark";
import { ThemeToggle } from "./components/theme-toggle";

const features = [
  {
    title: "Smart topic extraction",
    description: "Turn messy syllabus text into clear learning modules.",
  },
  {
    title: "Difficulty mapping",
    description: "See which topics are easy, medium, or hard at a glance.",
  },
  {
    title: "Faster study planning",
    description:
      "Build a focused roadmap without spending hours organizing notes.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.22),_transparent_30%),linear-gradient(135deg,_var(--surface-soft)_0%,_var(--surface)_100%)] text-[color:var(--text)]">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16 lg:px-8">
        <header className="mb-10 flex items-center justify-between rounded-full border border-[color:var(--border)] bg-[color:var(--surface)]/80 px-4 py-3 shadow-sm backdrop-blur">
          <BrandMark />
          <ThemeToggle />
        </header>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-blue-200 bg-[color:var(--surface)]/85 px-3 py-1 text-sm font-medium text-blue-600 shadow-sm dark:border-sky-900 dark:bg-slate-900/70">
              AI-powered learning assistant
            </span>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Turn any syllabus into a clearer study path.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[color:var(--muted)]">
              EduMethod AI helps students and teachers break down chapters into
              digestible topics, difficulty levels, and estimated study hours.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/upload"
                className="rounded-full bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                Start with your syllabus
              </Link>
              <a
                href="#features"
                className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-3 font-semibold text-[color:var(--text)] transition hover:border-blue-300 hover:text-blue-600"
              >
                Explore features
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)]/80 p-6 shadow-xl shadow-slate-200/70 backdrop-blur dark:shadow-slate-950/40">
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[color:var(--muted)]">
                  Preview
                </p>
                <div className="rounded-full border border-blue-200 bg-white/70 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:border-sky-900 dark:bg-slate-900/70">
                  Live AI Route
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 p-4 text-white shadow-lg shadow-blue-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Physics</p>
                      <p className="mt-1 text-xl font-semibold">
                        Motion, Force, and Energy
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/30 bg-white/10 p-2">
                      <FeatureIcon kind="spark" />
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                  <div className="flex items-center justify-between text-sm text-[color:var(--muted)]">
                    <span>Topic 1</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-300">
                      Easy
                    </span>
                  </div>
                  <p className="mt-2 font-semibold text-[color:var(--text)]">
                    Speed and velocity
                  </p>
                </div>
                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                  <div className="flex items-center justify-between text-sm text-[color:var(--muted)]">
                    <span>Topic 2</span>
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700 dark:bg-amber-900/70 dark:text-amber-300">
                      Medium
                    </span>
                  </div>
                  <p className="mt-2 font-semibold text-[color:var(--text)]">
                    Newton&apos;s laws
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="features" className="mt-16 grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]/80 p-6 shadow-sm"
            >
              <div className="mb-3 inline-flex rounded-2xl bg-blue-50 p-2.5 dark:bg-slate-800">
                {feature.title.includes("topic") ? (
                  <FeatureIcon kind="spark" />
                ) : feature.title.includes("Difficulty") ? (
                  <FeatureIcon kind="target" />
                ) : (
                  <FeatureIcon kind="chart" />
                )}
              </div>
              <h2 className="text-lg font-semibold text-[color:var(--text)]">
                {feature.title}
              </h2>
              <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
