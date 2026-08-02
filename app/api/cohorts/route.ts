import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";

const createCohortSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user profile to verify role (Teacher or Admin)
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (profile?.role === "student" || !profile?.role) {
      // Fetch cohorts where this student is a member
      const { data: memberships, error } = await supabaseAdmin
        .from("cohort_members")
        .select(`
          cohorts (
            id,
            name,
            created_at,
            teacher_id
          )
        `)
        .eq("student_id", userId);

      if (error) {
        console.error("Error fetching student memberships:", error);
        return NextResponse.json({ error: "Database error fetching memberships" }, { status: 500 });
      }

      const joinedCohorts = (memberships || [])
        .filter((m: any) => m.cohorts)
        .map((m: any) => ({
          id: m.cohorts.id,
          name: m.cohorts.name,
          created_at: m.cohorts.created_at,
          teacher_id: m.cohorts.teacher_id,
          memberCount: 0, // Not applicable for student membership list
        }));

      return NextResponse.json({ cohorts: joinedCohorts });
    }

    // Fetch cohorts owned by this teacher and aggregate student counts
    const { data: cohorts, error } = await supabaseAdmin
      .from("cohorts")
      .select(`
        id,
        name,
        created_at,
        cohort_members (
          student_id
        )
      `)
      .eq("teacher_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching cohorts:", error);
      return NextResponse.json({ error: "Database error fetching cohorts" }, { status: 500 });
    }

    // Map to include member counts
    const formattedCohorts = (cohorts || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      created_at: c.created_at,
      memberCount: c.cohort_members?.length || 0,
    }));

    return NextResponse.json({ cohorts: formattedCohorts });
  } catch (err: any) {
    console.error("Cohorts GET Exception:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user profile to verify role
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (profile?.role !== "teacher" && profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Restricted to Teachers" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createCohortSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid cohort name" }, { status: 400 });
    }

    // Insert new cohort
    const { data: cohort, error } = await supabaseAdmin
      .from("cohorts")
      .insert({
        name: parsed.data.name,
        teacher_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating cohort:", error);
      return NextResponse.json({ error: "Database error creating cohort" }, { status: 500 });
    }

    return NextResponse.json({ cohort, message: "Cohort created successfully" });
  } catch (err: any) {
    console.error("Cohorts POST Exception:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
