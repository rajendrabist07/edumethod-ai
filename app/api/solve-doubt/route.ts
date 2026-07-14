import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { groq } from "@/lib/groq";
import { geminiVisionModel as gemini } from "@/lib/gemini";
import { supabaseAdmin } from "@/lib/supabase-admin";

const requestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  message: z.string().min(1),
  imageBase64: z.string().optional(),
  mimeType: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { sessionId, message, imageBase64, mimeType } = parsed.data;

    let session;
    if (sessionId) {
      const { data } = await supabaseAdmin
        .from("doubt_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", userId)
        .single();
      session = data;
    }

    const history = session?.messages || [];
    let aiResponseText = "";

    if (imageBase64 && mimeType) {
      try {
        const result = await gemini.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `You are a patient tutor. A student has this question. Solve it step-by-step, explaining the reasoning at each step, not just the final answer. Question context: ${message}`,
                },
                {
                  inlineData: { mimeType, data: imageBase64 },
                },
              ],
            },
          ],
        });
        aiResponseText = result.response.text() || "Unable to process the image. Please try again.";
      } catch (geminiError) {
        console.error("Gemini error:", geminiError);
        
        const err = geminiError as { status?: number; message?: string };
        // Handle rate limiting (429)
        if (err?.status === 429 || err?.message?.includes("429")) {
          return NextResponse.json(
            { 
              error: "Image processing service is busy. Please try asking a text question or wait a moment." 
            },
            { status: 429 }
          );
        }
        
        // Handle quota exceeded
        if (err?.message?.includes("quota") || err?.message?.includes("Quota")) {
          return NextResponse.json(
            { 
              error: "Image processing quota exceeded. Please use text-based questions for now." 
            },
            { status: 429 }
          );
        }
        
        return NextResponse.json(
          { error: "Failed to process image. Please try a text question instead." },
          { status: 500 }
        );
      }
    } else {
      try {
        const messages = [
          {
            role: "system" as const,
            content:
              "You are a patient, encouraging tutor. Solve questions step-by-step, explaining reasoning at each step. If the student asks a follow-up, use the conversation history to give context-aware answers.",
          },
          ...history.map((m: { role: "user" | "assistant"; content: string }) => ({
            role: m.role,
            content: m.content,
          })),
          { role: "user" as const, content: message },
        ];

        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages,
        });

        aiResponseText = completion.choices[0].message.content || "";
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
    }

    if (!aiResponseText) {
      return NextResponse.json(
        { error: "Failed to generate response" },
        { status: 500 }
      );
    }

    const updatedMessages = [
      ...history,
      { role: "user", content: message },
      { role: "assistant", content: aiResponseText },
    ];

    let finalSessionId = sessionId;

    if (sessionId) {
      await supabaseAdmin
        .from("doubt_sessions")
        .update({ messages: updatedMessages })
        .eq("id", sessionId);
    } else {
      const { data: newSession, error: insertError } = await supabaseAdmin
        .from("doubt_sessions")
        .insert({ user_id: userId, messages: updatedMessages })
        .select()
        .single();

      if (insertError || !newSession) {
        return NextResponse.json(
          { error: "Failed to save session" },
          { status: 500 }
        );
      }

      finalSessionId = newSession.id;
    }

    return NextResponse.json({ sessionId: finalSessionId, reply: aiResponseText });
  } catch (error) {
    console.error("Solve doubt error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}