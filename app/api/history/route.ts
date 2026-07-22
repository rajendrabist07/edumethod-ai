import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limit: 30 requests per minute
    const rateLimit = await checkRateLimit(`rate-limit:${userId}:history`, 30, "60 s");
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a moment." },
        { status: 429 }
      );
    }

    // Clerk security check: Explicitly filter by the authenticated userId.
    // This forms a defense-in-depth layer along with Supabase RLS policies
    // to guarantee one user can NEVER see another user's database records.

    // 1. Fetch learning paths (lightweight columns)
    const { data: paths, error: pathError } = await supabaseAdmin
      .from("learning_paths")
      .select("id, subject, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (pathError) {
      console.error("Error querying learning paths history:", pathError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // 2. Fetch doubt solver sessions (lightweight columns)
    const { data: sessions, error: sessionError } = await supabaseAdmin
      .from("doubt_sessions")
      .select("id, created_at, messages")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (sessionError) {
      console.error("Error querying doubt sessions history:", sessionError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // 3. Format learning paths
    const formattedPaths = (paths || []).map((p) => ({
      id: p.id,
      type: "path",
      title: p.subject || "Untitled Path",
      date: p.created_at,
    }));

    // 4. Format doubt sessions
    const formattedSessions = (sessions || []).map((s) => {
      const messages = s.messages || [];
      const firstUserMessage = messages.find((m: { role: string; content: string }) => m.role === "user")?.content || "New Conversation";
      
      // Clean up title (remove brackets/image markers if present)
      let title = firstUserMessage.replace(/^\[Image Attached:[^\]]+\]\s*/, "");
      title = title.substring(0, 40) + (title.length > 40 ? "..." : "");

      return {
        id: s.id,
        type: "doubt",
        title: title || "New Conversation",
        date: s.created_at,
      };
    });

    // 5. Combine and sort by date descending
    const combinedHistory = [...formattedPaths, ...formattedSessions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({ history: combinedHistory });
  } catch (err) {
    console.error("Combined history API error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
