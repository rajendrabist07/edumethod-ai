"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "../../components/theme-toggle";
import { BrandMark } from "../../components/brand-mark";

interface PlanUsage {
  plan: "free" | "pro";
}

export default function PricingPage() {
  const [currentPlan, setCurrentPlan] = useState<"free" | "pro">("free");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPlan();
  }, []);

  async function fetchPlan() {
    try {
      const res = await fetch("/api/usage");
      if (res.ok) {
        const data = await res.json();
        setCurrentPlan(data.plan || "free");
      }
    } catch (err) {
      console.error("Failed to load user plan:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePlanUpgrade(targetPlan: "free" | "pro") {
    if (actionLoading) return;
    setActionLoading(true);

    try {
      const res = await fetch("/api/usage/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: targetPlan }),
      });

      if (res.ok) {
        setCurrentPlan(targetPlan);
        alert(`Successfully transitioned to the ${targetPlan.toUpperCase()} tier!`);
      } else {
        alert("Transaction failed. Please check backend connections.");
      }
    } catch (err) {
      console.error("Upgrade request error:", err);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <main className="grid-bg min-h-screen px-4 py-8 text-[color:var(--text)] transition-colors duration-300 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        
        {/* Header Bar */}
        <header className="glass-card flex items-center justify-between rounded-2xl px-6 py-4 transition-all duration-300">
          <div className="flex items-center gap-2 pl-12 lg:pl-0">
            <BrandMark />
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-xs font-bold text-[color:var(--text)] transition hover:bg-[color:var(--surface-soft)] active:scale-95 flex items-center justify-center gap-1.5"
            >
              Dashboard
            </Link>
            <ThemeToggle />
          </div>
        </header>

        {/* Title */}
        <div className="text-center max-w-xl mx-auto mt-4">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
            Flexible Plan Architecture
          </h1>
          <p className="mt-3 text-xs font-semibold text-[color:var(--muted)] leading-relaxed uppercase tracking-wider">
            Select the tier that matches your cognitive pace.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 mt-4">
          
          {/* Free Tier Card */}
          <div className={`glass-card rounded-3xl p-6 shadow-md flex flex-col justify-between relative border transition-all duration-300 ${
            currentPlan === "free" ? "border-blue-500/55 shadow-blue-500/5 ring-1 ring-blue-500/35" : "border-[color:var(--border)]/40"
          }`}>
            {currentPlan === "free" && (
              <span className="absolute -top-3 right-6 rounded-full bg-blue-500 text-white px-3 py-0.5 text-4xs font-black uppercase tracking-wider shadow-sm">
                Active Plan
              </span>
            )}
            <div>
              <div className="flex items-center justify-between border-b border-[color:var(--border)]/35 pb-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold">🌱 Seedling Tier</h2>
                  <p className="text-4xs font-semibold text-[color:var(--muted)] uppercase tracking-wider">Free Plan</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black">$0</p>
                  <p className="text-4xs font-semibold text-[color:var(--muted)]">FOREVER FREE</p>
                </div>
              </div>
              
              <ul className="space-y-3.5 text-2xs font-semibold text-[color:var(--text)]">
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">✓</span> 3 Syllabus Roadmaps per day
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">✓</span> 10 Doubt solver messages per day
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">✓</span> 3 Concept check quizzes per day
                </li>
                <li className="flex items-center gap-2 text-[color:var(--muted)] line-through">
                  <span>✕</span> Direct priority GPU streaming
                </li>
                <li className="flex items-center gap-2 text-[color:var(--muted)] line-through">
                  <span>✕</span> Multimodal high-resolution scanning
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <button
                disabled={loading || actionLoading || currentPlan === "free"}
                onClick={() => handlePlanUpgrade("free")}
                className={`w-full rounded-full py-3.5 text-xs font-bold transition duration-300 ${
                  currentPlan === "free"
                    ? "bg-[color:var(--surface-soft)] text-[color:var(--muted)] border border-[color:var(--border)]/50 cursor-default"
                    : "bg-[color:var(--surface)] text-[color:var(--text)] border border-[color:var(--border)] hover:bg-[color:var(--surface-soft)] active:scale-97"
                }`}
              >
                {currentPlan === "free" ? "Default Plan Active" : "Downgrade to Free"}
              </button>
            </div>
          </div>

          {/* Pro Tier Card */}
          <div className={`glass-card rounded-3xl p-6 shadow-md flex flex-col justify-between relative border transition-all duration-300 ${
            currentPlan === "pro" ? "border-purple-500/55 shadow-purple-500/5 ring-1 ring-purple-500/35" : "border-[color:var(--border)]/45"
          }`}>
            {currentPlan === "pro" && (
              <span className="absolute -top-3 right-6 rounded-full bg-purple-500 text-white px-3 py-0.5 text-4xs font-black uppercase tracking-wider shadow-sm">
                Active Plan
              </span>
            )}
            <div>
              <div className="flex items-center justify-between border-b border-[color:var(--border)]/35 pb-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold">💎 Cognitive Titan</h2>
                  <p className="text-4xs font-semibold text-[color:var(--muted)] uppercase tracking-wider">Pro Plan</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black">$19</p>
                  <p className="text-4xs font-semibold text-[color:var(--muted)]">MONTHLY</p>
                </div>
              </div>
              
              <ul className="space-y-3.5 text-2xs font-semibold text-[color:var(--text)]">
                <li className="flex items-center gap-2">
                  <span className="text-purple-500">✓</span> 50 Syllabus Roadmaps per day
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-500">✓</span> 100 Doubt solver messages per day
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-500">✓</span> 50 Concept check quizzes per day
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-500">✓</span> Direct priority GPU streaming
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-500">✓</span> High-fidelity vision scanner enabled
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <button
                disabled={loading || actionLoading || currentPlan === "pro"}
                onClick={() => handlePlanUpgrade("pro")}
                className={`w-full rounded-full py-3.5 text-xs font-bold transition duration-300 ${
                  currentPlan === "pro"
                    ? "bg-[color:var(--surface-soft)] text-[color:var(--muted)] border border-[color:var(--border)]/50 cursor-default"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/10 hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg active:scale-97"
                }`}
              >
                {currentPlan === "pro" ? "Pro Subscription Active" : "Upgrade to Pro"}
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Footer Disclaimer */}
        <p className="text-center text-4xs font-semibold text-[color:var(--muted)] uppercase tracking-widest leading-relaxed max-w-md mx-auto">
          ⚠️ This is a portfolio preview build. Upgrades update your database profile state instantly. Stripe gateway integration is marked as TODO.
        </p>
      </div>
    </main>
  );
}
