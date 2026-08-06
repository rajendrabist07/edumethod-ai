import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserJourneyOverview } from "@/lib/journey";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    let userId: string | null = null;
    if (process.env.ENABLE_E2E_MOCK === "true" && req.headers.get("x-mock-user-id")) {
      userId = req.headers.get("x-mock-user-id");
    } else {
      userId = (await auth()).userId;
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await checkRateLimit(`rate-limit:${userId}:journey`, 60, "60 s");
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a moment." },
        { status: 429 }
      );
    }

    const overview = await getUserJourneyOverview(userId);
    return NextResponse.json({ journey: overview });
  } catch (error: any) {
    console.error("GET /api/journey error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve learning journey" },
      { status: 500 }
    );
  }
}
