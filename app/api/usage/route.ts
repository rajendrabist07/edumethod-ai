import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkUsageLimit } from "@/lib/usage";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Call checkUsageLimit to retrieve status for all three action types
    const pathUsage = await checkUsageLimit(userId, "learning_path");
    const doubtUsage = await checkUsageLimit(userId, "doubt_message");
    const quizUsage = await checkUsageLimit(userId, "quiz");

    return NextResponse.json({
      plan: pathUsage.plan,
      usage: {
        learning_path: { current: pathUsage.current, limit: pathUsage.limit },
        doubt_message: { current: doubtUsage.current, limit: doubtUsage.limit },
        quiz: { current: quizUsage.current, limit: quizUsage.limit },
      },
    });
  } catch (err) {
    console.error("Usage fetch API error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
