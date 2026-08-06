import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateLearnerProfile, updateLearnerProfile, ExplanationStyle } from "@/lib/learner-profile";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const updateSchema = z.object({
  preferred_explanation_style: z
    .enum(["socratic", "concise", "detailed", "conversational", "balanced"])
    .optional(),
  mastery_scores: z.record(z.string(), z.number()).optional(),
  study_times: z.record(z.string(), z.number()).optional(),
});

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

    const rateLimit = await checkRateLimit(`rate-limit:${userId}:get-learner-profile`, 60, "60 s");
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a moment." },
        { status: 429 }
      );
    }

    const profile = await getOrCreateLearnerProfile(userId);
    return NextResponse.json({ profile });
  } catch (error: any) {
    console.error("GET /api/learner-profile error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve learner profile" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const updated = await updateLearnerProfile(userId, parsed.data as any);
    return NextResponse.json({ success: true, profile: updated });
  } catch (error: any) {
    console.error("POST /api/learner-profile error:", error);
    return NextResponse.json(
      { error: "Failed to update learner profile" },
      { status: 500 }
    );
  }
}
