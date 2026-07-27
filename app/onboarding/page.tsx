"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/app/components/ui/GlassCard";
import { useUser } from "@clerk/nextjs";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<"student" | "teacher">("student");

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center bg-prism-base text-prism-text">Loading...</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
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
      }
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-prism-base text-prism-text p-6">
      <GlassCard className="max-w-md w-full p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-display font-black text-white">Welcome to EduMethod!</h1>
          <p className="text-sm text-prism-muted mt-2">Let's get your account set up.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-semibold">How will you use this platform?</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`p-4 border rounded-xl flex flex-col items-center transition-all ${
                  role === "student" ? "border-prism-accent bg-prism-accent/10" : "border-prism-border hover:border-prism-text/30"
                }`}
              >
                <span className="text-2xl mb-2">🎓</span>
                <span className="text-sm font-medium">Student</span>
              </button>
              
              <button
                type="button"
                onClick={() => setRole("teacher")}
                className={`p-4 border rounded-xl flex flex-col items-center transition-all ${
                  role === "teacher" ? "border-prism-accent bg-prism-accent/10" : "border-prism-border hover:border-prism-text/30"
                }`}
              >
                <span className="text-2xl mb-2">👨‍🏫</span>
                <span className="text-sm font-medium">Teacher</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 px-4 rounded-full bg-prism-accent text-white font-bold hover:bg-opacity-90 disabled:opacity-50 transition-all"
          >
            {saving ? "Setting up..." : "Complete Setup"}
          </button>
        </form>
      </GlassCard>
    </main>
  );
}
