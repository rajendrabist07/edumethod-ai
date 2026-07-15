import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { plan } = body;

    if (plan !== "free" && plan !== "pro") {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
    }

    // TODO: integrate real payment provider (e.g. Stripe) before any real monetization
    const { error } = await supabaseAdmin
      .from("user_profiles")
      .upsert({ user_id: userId, plan })
      .eq("user_id", userId);

    if (error) {
      console.error("Database plan upgrade error:", error);
      return NextResponse.json({ error: "Database transaction failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, plan });
  } catch (err) {
    console.error("Upgrade API exception:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
