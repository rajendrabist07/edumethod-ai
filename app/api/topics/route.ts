import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { groq } from "@/lib/groq";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkUsageLimit } from "@/lib/usage";

// Step 1: Define what input we expect from frontend
const requestSchema = z.object({
  subject: z.string().min(1),
  rawText: z.string().min(5),
});

// Step 2: Define what shape AI response must match
const topicSchema = z.object({
  subject: z.string(),
  topics: z.array(
    z.object({
      name: z.string(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      estimatedHours: z.number(),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    // Step 3: Check user is logged in
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 3.5: Validate usage limit
    const usage = await checkUsageLimit(userId, "learning_path");
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Daily limit reached. Upgrade to Pro for unlimited access." },
        { status: 429 }
      );
    }

    // Step 4: Validate incoming request body
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { subject, rawText } = parsed.data;

    try {
      // Step 5: Call Groq with a structured prompt
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are an expert curriculum analyzer. Given raw syllabus text, extract topics as JSON only, no extra text. Format: { \"subject\": string, \"topics\": [{ \"name\": string, \"difficulty\": \"easy\"|\"medium\"|\"hard\", \"estimatedHours\": number }] }",
          },
          {
            role: "user",
            content: `Subject: ${subject}\n\nSyllabus text:\n${rawText}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const aiResponseText = completion.choices[0].message.content;

      // Step 6: Validate AI's response matches our expected shape
      let aiData;
      try {
        aiData = JSON.parse(aiResponseText || "{}");
      } catch {
        return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
      }

      const validated = topicSchema.safeParse(aiData);
      if (!validated.success) {
        return NextResponse.json({ error: "AI response format mismatch" }, { status: 500 });
      }

      // Step 7: Save to database
      const { data, error } = await supabaseAdmin
        .from("learning_paths")
        .insert({
          user_id: userId,
          subject: validated.data.subject,
          raw_input: rawText,
          input_type: "text",
          topics: validated.data.topics,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Step 8: Return result to frontend
      return NextResponse.json({ learningPathId: data.id, topics: validated.data.topics });
    } catch (groqError) {
      console.error("Groq error:", groqError);
      
      const err = groqError as { status?: number; message?: string };
      // Handle rate limiting
      if (err?.status === 429 || err?.message?.includes("429")) {
        return NextResponse.json(
          { error: "AI service is busy. Please try again in a moment." },
          { status: 429 }
        );
      }
      
      throw groqError;
    }
  } catch (error) {
    console.error("Topics extraction error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}