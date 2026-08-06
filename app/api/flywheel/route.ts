import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOutcomeFlywheelMetrics } from "@/lib/flywheel";
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

    const rateLimit = await checkRateLimit(`rate-limit:${userId}:flywheel`, 60, "60 s");
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a moment." },
        { status: 429 }
      );
    }

    // Pass undefined to get global flywheel metrics across all students, or userId for student-level
    const scope = req.nextUrl.searchParams.get("scope");
    const metrics = await getOutcomeFlywheelMetrics(scope === "user" ? userId : undefined);

    return NextResponse.json({ flywheel: metrics });
  } catch (error: any) {
    console.error("GET /api/flywheel error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve flywheel metrics" },
      { status: 500 }
    );
  }
}
