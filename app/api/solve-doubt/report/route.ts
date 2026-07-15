import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";

const reportSchema = z.object({
  sessionId: z.string().uuid(),
  messageIndex: z.number().int().nonnegative(),
  messageContent: z.string().min(1),
  reportText: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = reportSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { sessionId, messageIndex, messageContent, reportText } = parseResult.data;

    // Save report in user_reports table
    const { error } = await supabaseAdmin
      .from("user_reports")
      .insert({
        user_id: userId,
        session_id: sessionId,
        message_index: messageIndex,
        message_content: messageContent,
        report_text: reportText,
      });

    if (error) {
      console.error("Supabase insert error in user_reports route:", error);
      return NextResponse.json({ error: "Failed to submit issue report." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Report route error:", err);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
