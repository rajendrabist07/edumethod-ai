import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduMethod AI",
  description: "Learn any subject 70% faster with AI-powered methodology",
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
