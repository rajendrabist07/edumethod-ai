import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkUsageLimit } from "@/lib/usage";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [learningPathUsage, quizUsage, doubtUsage] = await Promise.all([
      checkUsageLimit(userId, "learning_path"),
      checkUsageLimit(userId, "quiz"),
      checkUsageLimit(userId, "doubt_message"),
    ]);

    return NextResponse.json({
      plan: learningPathUsage.plan,
      usage: {
        learning_path: learningPathUsage,
        quiz: quizUsage,
        doubt_message: doubtUsage,
      },
    });
  } catch (error) {
    console.error("Usage endpoint error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage statistics" },
      { status: 500 }
    );
  }
}
