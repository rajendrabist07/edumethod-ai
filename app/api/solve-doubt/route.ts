import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { groq } from "@/lib/groq";
import { geminiVisionModel as gemini } from "@/lib/gemini";
import { supabaseAdmin } from "@/lib/supabase-admin";
import crypto from "crypto";
import { checkUsageLimit } from "@/lib/usage";

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

    // Validate usage limit for doubt solving messages
    const usage = await checkUsageLimit(userId, "doubt_message");
    if (!usage.allowed) {
      return NextResponse.json(
        { error: "Daily limit reached. Upgrade to Pro for unlimited access." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { sessionId, message, imageBase64, mimeType } = parsed.data;

    let session;
    let finalSessionId = sessionId;
    
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
    const userMessage = { role: "user" as const, content: message };
    const updatedMessagesWithUser = [...history, userMessage];

    // Save user message to DB first
    if (finalSessionId) {
      const { error } = await supabaseAdmin
        .from("doubt_sessions")
        .update({ messages: updatedMessagesWithUser })
        .eq("id", finalSessionId);
      if (error) {
        console.error("Database update error:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
    } else {
      finalSessionId = crypto.randomUUID();
      const { error } = await supabaseAdmin
        .from("doubt_sessions")
        .insert({ id: finalSessionId, user_id: userId, messages: updatedMessagesWithUser });
      if (error) {
        console.error("Database insert error:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
    }

    const encoder = new TextEncoder();

    if (imageBase64 && mimeType) {
      const stream = new ReadableStream({
        async start(controller) {
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
            const text = result.response.text() || "Unable to process the image.";
            controller.enqueue(encoder.encode(text));
            
            const finalMessages = [...updatedMessagesWithUser, { role: "assistant", content: text }];
            await supabaseAdmin
              .from("doubt_sessions")
              .update({ messages: finalMessages })
              .eq("id", finalSessionId);
              
          } catch (geminiError) {
            console.error("Gemini error in stream:", geminiError);
            const err = geminiError as { status?: number; message?: string };
            let errMsg = "Failed to process image. Please try a text question instead.";
            if (err?.status === 429 || err?.message?.includes("429")) {
              errMsg = "Image processing service is busy or quota exceeded. Please ask a text question or wait a moment.";
            } else if (err?.message?.includes("quota") || err?.message?.includes("Quota")) {
              errMsg = "Image processing quota exceeded. Please use text-based questions for now.";
            }
            controller.enqueue(encoder.encode(`⚠️ ERROR: ${errMsg}`));
          } finally {
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          "x-session-id": finalSessionId || "",
        }
      });
    } else {
      const messagesToSend = [
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

      const stream = new ReadableStream({
        async start(controller) {
          let fullResponseText = "";
          try {
            const completionStream = await groq.chat.completions.create({
              model: "llama-3.3-70b-versatile",
              messages: messagesToSend,
              stream: true,
            });

            for await (const chunk of completionStream) {
              const text = chunk.choices[0]?.delta?.content || "";
              if (text) {
                fullResponseText += text;
                controller.enqueue(encoder.encode(text));
              }
            }

            const finalMessages = [...updatedMessagesWithUser, { role: "assistant", content: fullResponseText }];
            await supabaseAdmin
              .from("doubt_sessions")
              .update({ messages: finalMessages })
              .eq("id", finalSessionId);

          } catch (groqError) {
            console.error("Groq stream error:", groqError);
            const err = groqError as { status?: number; message?: string };
            let errMsg = "AI service error. Please try again.";
            if (err?.status === 429 || err?.message?.includes("429")) {
              errMsg = "AI service is busy (rate limit reached). Please try again in a moment.";
            }
            controller.enqueue(encoder.encode(`⚠️ ERROR: ${errMsg}`));
          } finally {
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          "x-session-id": finalSessionId || "",
        }
      });
    }

  } catch (error) {
    console.error("Solve doubt error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}