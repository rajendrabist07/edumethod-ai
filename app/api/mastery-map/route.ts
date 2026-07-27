import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Fetch user's topics and mastery (simplified: use learning_paths as topics)
    const { data: paths } = await supabaseAdmin
      .from("learning_paths")
      .select("subject, topics")
      .eq("user_id", userId);

    if (!paths) return NextResponse.json({ nodes: [], links: [] });

    // Deduplicate topics
    const topicsSet = new Set<string>();
    paths.forEach(p => {
      p.topics.forEach((t: string) => topicsSet.add(t));
    });

    const nodes = Array.from(topicsSet).map(t => ({
      id: t,
      name: t,
      val: Math.random() * 100, // In a real app, calculate true mastery from flashcard scores
    }));

    // 2. Fetch prerequisite links
    const { data: prereqs } = await supabaseAdmin
      .from("topic_prerequisites")
      .select("topic, prerequisite_topic");

    const links: any[] = [];
    if (prereqs) {
      prereqs.forEach(p => {
        if (topicsSet.has(p.topic) && topicsSet.has(p.prerequisite_topic)) {
          links.push({ source: p.prerequisite_topic, target: p.topic });
        }
      });
    }

    return NextResponse.json({ nodes, links });
  } catch (error) {
    console.error("Mastery map API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
