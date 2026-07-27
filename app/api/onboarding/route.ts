import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = await req.json();

    if (!["student", "teacher"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // 1. Update Clerk publicMetadata
    await clerkClient().users.updateUserMetadata(userId, {
      publicMetadata: {
        onboarded: true,
        role,
      },
    });

    // 2. Upsert Supabase user_profile with the role
    const { error } = await supabaseAdmin
      .from("user_profiles")
      .upsert({ user_id: userId, role, plan: "free" }, { onConflict: "user_id" });

    if (error) {
      console.error("Supabase upsert error:", error);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Onboarding endpoint error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
