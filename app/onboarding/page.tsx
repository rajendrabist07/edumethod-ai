"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/app/components/ui/GlassCard";
import { GlassButton } from "@/app/components/ui/GlassButton";
import { useUser } from "@clerk/nextjs";
import { GraduationCap, Presentation } from "lucide-react";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [role, setRole] = useState<"student" | "teacher">("student");

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center bg-prism-base text-prism-text">Loading...</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        // Force Clerk user to reload to get new publicMetadata
        await user?.reload();
        router.push("/dashboard");
      } else {
        const errData = await res.json().catch(() => null);
        setErrorMsg(errData?.error || "Failed to update profile. Did you run the SQL migration?");
        setSaving(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("A network error occurred. Please try again.");
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-prism-base text-prism-text p-6">
      <GlassCard className="max-w-md w-full rounded-3xl p-6 sm:p-8 space-y-6 border border-prism-border">
        <div className="text-center">
          <h1 className="text-2xl font-display font-black text-prism-text">Welcome to EduMethod!</h1>
          <p className="text-sm text-prism-muted mt-2">Let's get your account set up.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-semibold">How will you use this platform?</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`min-h-28 p-4 border rounded-2xl flex flex-col items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-accent ${
                  role === "student" ? "border-prism-accent bg-prism-accent/10 text-prism-accent" : "border-prism-border hover:border-prism-accent/40 text-prism-text"
                }`}
              >
                <GraduationCap className="h-7 w-7" strokeWidth={2.2} aria-hidden="true" />
                <span className="text-sm font-medium">Student</span>
              </button>
              
              <button
                type="button"
                onClick={() => setRole("teacher")}
                className={`min-h-28 p-4 border rounded-2xl flex flex-col items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-accent ${
                  role === "teacher" ? "border-prism-accent bg-prism-accent/10 text-prism-accent" : "border-prism-border hover:border-prism-accent/40 text-prism-text"
                }`}
              >
                <Presentation className="h-7 w-7" strokeWidth={2.2} aria-hidden="true" />
                <span className="text-sm font-medium">Teacher</span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 text-red-500 text-sm font-semibold p-3 rounded-lg border border-red-500/20">
              {errorMsg}
            </div>
          )}

          <GlassButton
            type="submit"
            disabled={saving}
            variant="primary"
            className="w-full min-h-11"
          >
            {saving ? "Setting up..." : "Complete Setup"}
          </GlassButton>
        </form>
      </GlassCard>
    </main>
  );
}
