import React from "react";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface RoleGuardProps {
  allowedRoles: ("student" | "teacher" | "admin")[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export async function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { userId } = await auth();
  if (!userId) return fallback;

  try {
    const { data } = await supabaseAdmin
      .from("user_profiles")
      .select("role")
      .eq("user_id", userId)
      .single();

    const role = data?.role || "student";

    if (allowedRoles.includes(role)) {
      return <>{children}</>;
    }
  } catch (err) {
    console.error("RoleGuard error:", err);
  }

  return fallback;
}
