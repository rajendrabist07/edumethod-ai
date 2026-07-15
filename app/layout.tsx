import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  title: "EduMethod AI — Hyper-Accurate 7-Day Study Plans & AI Doubt Solver",
  description: "Transform raw syllabus text or snapshots into personalized study plans, active recall quizzes, and get step-by-step doubt-solving guide from our AI tutor.",
  keywords: ["Syllabus analyzer", "AI learning", "Adaptive study plan", "Active recall quiz", "Spaced repetition", "Doubt solving", "Multimodal scanner"],
  authors: [{ name: "Rajendra Bist" }],
  openGraph: {
    title: "EduMethod AI — Hyper-Accurate 7-Day Study Plans & AI Doubt Solver",
    description: "Transform raw syllabus text or snapshots into personalized study plans, active recall quizzes, and get step-by-step doubt-solving guide from our AI tutor.",
    url: "https://edumethod-ai.vercel.app",
    siteName: "EduMethod AI",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 675,
        alt: "EduMethod AI Social Preview Image",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EduMethod AI — Hyper-Accurate 7-Day Study Plans & AI Doubt Solver",
    description: "Transform raw syllabus text or snapshots into personalized study plans, active recall quizzes, and get step-by-step doubt-solving guide from our AI tutor.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] antialiased transition-colors duration-300">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
