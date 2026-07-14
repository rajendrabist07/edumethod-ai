import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";

const feedbackSchema = z.object({
  sessionId: z.string().uuid(),
  messageIndex: z.number().min(0),
  feedback: z.enum(["like", "dislike"]),
  feedbackText: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { sessionId, messageIndex, feedback, feedbackText } = parsed.data;

    // Fetch existing session
    const { data: session, error: fetchError } = await supabaseAdmin
      .from("doubt_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const messages = [...(session.messages || [])];
    
    if (messageIndex >= messages.length) {
      return NextResponse.json({ error: "Message index out of bounds" }, { status: 400 });
    }

    // Update message with feedback
    messages[messageIndex] = {
      ...messages[messageIndex],
      feedback,
      feedbackText: feedbackText || null,
    };

    // Save back to DB
    const { error: updateError } = await supabaseAdmin
      .from("doubt_sessions")
      .update({ messages })
      .eq("id", sessionId);

    if (updateError) {
      console.error("Failed to update feedback in DB:", updateError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback submission error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
