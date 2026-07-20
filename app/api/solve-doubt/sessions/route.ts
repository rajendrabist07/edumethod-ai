import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
      // Fetch details of a single session
      const { data: session, error } = await supabaseAdmin
        .from("doubt_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", userId)
        .single();

      if (error || !session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      return NextResponse.json({ messages: session.messages || [] });
    }

    // Otherwise, list all sessions
    const { data: sessions, error } = await supabaseAdmin
      .from("doubt_sessions")
      .select("id, created_at, messages")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database fetch error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Format list for history sidebar: session ID and a title from the first question
    const formattedSessions = sessions.map((s) => {
      const messages = s.messages || [];
      const firstUserMessage = messages.find((m: { role: string; content: string }) => m.role === "user")?.content || "New Conversation";
      
      // Clean up title if it starts with image attachment marker
      let title = firstUserMessage.replace(/^\[Image Attached:[^\]]+\]\s*/, "");
      title = title.substring(0, 24) + (title.length > 24 ? "..." : "");
      
      return {
        id: s.id,
        title: title || "New Conversation",
        updatedAt: s.created_at,
      };
    });

    return NextResponse.json({ sessions: formattedSessions });
  } catch (error) {
    console.error("Fetch sessions error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
