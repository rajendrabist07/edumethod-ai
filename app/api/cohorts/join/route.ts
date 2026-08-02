import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";

const joinCohortSchema = z.object({
  cohortId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = joinCohortSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid Cohort ID format" }, { status: 400 });
    }

    const { cohortId } = parsed.data;

    // 1. Verify cohort exists
    const { data: cohort, error: cohortError } = await supabaseAdmin
      .from("cohorts")
      .select("id, name")
      .eq("id", cohortId)
      .single();

    if (cohortError || !cohort) {
      return NextResponse.json({ error: "Classroom not found. Verify the ID is correct." }, { status: 404 });
    }

    // 2. Check if already joined
    const { data: existingMember } = await supabaseAdmin
      .from("cohort_members")
      .select("cohort_id")
      .eq("cohort_id", cohortId)
      .eq("student_id", userId)
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json({ message: "You are already a member of this classroom", cohort });
    }

    // 3. Insert membership
    const { error: joinError } = await supabaseAdmin
      .from("cohort_members")
      .insert({
        cohort_id: cohortId,
        student_id: userId,
      });

    if (joinError) {
      console.error("Error joining cohort:", joinError);
      return NextResponse.json({ error: "Database error joining classroom" }, { status: 500 });
    }

    return NextResponse.json({ cohort, message: `Successfully joined ${cohort.name}!` });
  } catch (err: any) {
    console.error("Cohorts Join POST Exception:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
