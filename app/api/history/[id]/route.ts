import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

type DynamicParams = {
  params: Promise<{ id: string }>;
};

const paramSchema = z.string().uuid();

export async function GET(req: NextRequest, { params }: DynamicParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const validation = paramSchema.safeParse(id);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid resource ID format" }, { status: 400 });
    }

    // Rate Limit: 30 requests per minute
    const rateLimit = await checkRateLimit(`rate-limit:${userId}:history-detail`, 30, "60 s");
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a moment." },
        { status: 429 }
      );
    }

    // 1. Check if the resource exists in doubt_sessions
    const { data: session } = await supabaseAdmin
      .from("doubt_sessions")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (session) {
      return NextResponse.json({
        type: "doubt",
        session: {
          id: session.id,
          messages: session.messages || [],
          updatedAt: session.updated_at,
        },
      });
    }

    // 2. Check if the resource exists in learning_paths
    const { data: path } = await supabaseAdmin
      .from("learning_paths")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (path) {
      // Also fetch any quizzes associated with this learning path
      const { data: quizzes } = await supabaseAdmin
        .from("quizzes")
        .select("id, questions")
        .eq("learning_path_id", path.id);

      // Also fetch any flashcard decks associated with this learning path
      const { data: decks } = await supabaseAdmin
        .from("flashcard_decks")
        .select("id, topic")
        .eq("learning_path_id", path.id);

      return NextResponse.json({
        type: "path",
        path: {
          id: path.id,
          subject: path.subject,
          topics: path.topics || [],
          learningPlan: path.learning_plan || null,
          createdAt: path.created_at,
          quizzes: quizzes || [],
          decks: decks || [],
        },
      });
    }

    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  } catch (err) {
    console.error("Fetch history detail error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: DynamicParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const validation = paramSchema.safeParse(id);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid resource ID format" }, { status: 400 });
    }

    // Rate Limit: 30 requests per minute
    const rateLimit = await checkRateLimit(`rate-limit:${userId}:history-delete`, 30, "60 s");
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a moment." },
        { status: 429 }
      );
    }

    // 1. Check if session exists in doubt_sessions
    const { data: session } = await supabaseAdmin
      .from("doubt_sessions")
      .select("user_id")
      .eq("id", id)
      .single();

    if (session) {
      // Security Check: Return 403 Forbidden if user doesn't own this session
      if (session.user_id !== userId) {
        return NextResponse.json(
          { error: "Forbidden: You do not own this resource" },
          { status: 403 }
        );
      }

      const { error } = await supabaseAdmin
        .from("doubt_sessions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return NextResponse.json({ success: true, message: "Doubt session deleted" });
    }

    // 2. Check if learning path exists in learning_paths
    const { data: path } = await supabaseAdmin
      .from("learning_paths")
      .select("user_id")
      .eq("id", id)
      .single();

    if (path) {
      // Security Check: Return 403 Forbidden if user doesn't own this path
      if (path.user_id !== userId) {
        return NextResponse.json(
          { error: "Forbidden: You do not own this resource" },
          { status: 403 }
        );
      }

      // Also clean up any associated quizzes to prevent orphan records
      await supabaseAdmin
        .from("quizzes")
        .delete()
        .eq("learning_path_id", id);

      const { error } = await supabaseAdmin
        .from("learning_paths")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return NextResponse.json({ success: true, message: "Learning path deleted" });
    }

    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  } catch (err) {
    console.error("Delete history error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
