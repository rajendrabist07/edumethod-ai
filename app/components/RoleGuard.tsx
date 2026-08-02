import React from "react";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface RoleGuardProps {
  allowedRoles: ("student" | "teacher" | "admin")[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export async function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { userId, sessionClaims } = await auth();
  if (!userId) return fallback;

  let role: any = null;

  try {
    // Try Clerk session claims first (instant)
    const sessionRole = (sessionClaims?.metadata as any)?.role || (sessionClaims?.publicMetadata as any)?.role;
    role = sessionRole;

    // Fallback to fetching directly from Clerk if session claims don't have it
    if (!role) {
      const { clerkClient } = await import('@clerk/nextjs/server');
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      role = user.publicMetadata?.role as string;
    }

    // Ultimate fallback to DB
    if (!role) {
      const { data } = await supabaseAdmin
        .from("user_profiles")
        .select("role")
        .eq("user_id", userId)
        .single();
      role = data?.role || "student";
    }
  } catch (err) {
    console.error("RoleGuard error:", err);
  }

  if (role && allowedRoles.includes(role as any)) {
    return <>{children}</>;
  }

  return fallback;
}
