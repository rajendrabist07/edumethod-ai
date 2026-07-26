import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", axes: ["opsz"] });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://edumethod-ai.vercel.app"),
  title: "EduMethod AI — Hyper-Accurate 7-Day Study Plans & AI Doubt Solver",
  description: "Transform raw syllabus text or snapshots into personalized study plans, active recall quizzes, and get step-by-step doubt-solving guide from our AI tutor.",
  keywords: ["Syllabus analyzer", "AI learning", "Adaptive study plan", "Active recall quiz", "Spaced repetition", "Doubt solving", "Multimodal scanner"],
  authors: [{ name: "Rajendra Bist" }],
  openGraph: {
    title: "EduMethod AI — Hyper-Accurate 7-Day Study Plans & AI Doubt Solver",
    description: "Transform raw syllabus text or snapshots into personalized study plans, active recall quizzes, and get step-by-step doubt-solving guide from our AI tutor.",
    url: "https://edumethod-ai.vercel.app",
    siteName: "EduMethod AI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EduMethod AI — Hyper-Accurate 7-Day Study Plans & AI Doubt Solver",
    description: "Transform raw syllabus text or snapshots into personalized study plans, active recall quizzes, and get step-by-step doubt-solving guide from our AI tutor.",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className={`${inter.variable} ${fraunces.variable} ${jetBrainsMono.variable}`}>
        <body className="font-sans min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] antialiased transition-colors duration-300">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
