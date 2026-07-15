import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { groq } from "@/lib/groq";
import { supabaseAdmin } from "@/lib/supabase-admin";
import crypto from "crypto";
import { checkUsageLimit } from "@/lib/usage";

const requestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  message: z.string().min(1),
  imageBase64: z.string().optional(),
  mimeType: z.string().optional(),
  regenerate: z.boolean().optional(),
});

const SYSTEM_PROMPT = `You are a patient, encouraging tutor. Solve questions step-by-step, explaining reasoning at each step.
Follow these formatting rules for mathematical expressions:
1. Always output math equations, variables, operations, and fractions using standard LaTeX formatting.
2. Use single dollar signs ($...$) for inline math (e.g. $x^2 + 5x + 6 = 0$).
3. Use double dollar signs ($$...$$) for block or display equations (e.g. $$e = mc^2$$).
4. Do not output raw text symbols for math formulas (like x^2 or /frac). Use valid LaTeX markup.
5. If the student asks a follow-up, use the conversation history to give context-aware answers.`;

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
    const parseResult = requestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { sessionId, message, imageBase64, mimeType, regenerate } = parseResult.data;

    let finalSessionId = sessionId;
    let session = null;
    
    if (finalSessionId) {
      const { data } = await supabaseAdmin
        .from("doubt_sessions")
        .select("*")
        .eq("id", finalSessionId)
        .eq("user_id", userId)
        .single();
      session = data;
    }

    let history = session?.messages || [];
    if (regenerate && history.length >= 2) {
      history = history.slice(0, -2);
    }

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
          let fullResponseText = "";
          try {
            const completionStream = await groq.chat.completions.create({
              model: "meta-llama/llama-4-scout-17b-16e-instruct",
              messages: [
                {
                  role: "system",
                  content: SYSTEM_PROMPT,
                },
                ...history.map((m: { role: "user" | "assistant"; content: string }) => ({
                  role: m.role,
                  content: m.content,
                })),
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: message,
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: `data:${mimeType};base64,${imageBase64}`,
                      },
                    },
                  ],
                },
              ],
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

          } catch (groqVisionError: any) {
            console.error("Groq vision error in stream:", groqVisionError);
            const errStatus = groqVisionError?.status || groqVisionError?.statusCode || "UNKNOWN";
            const errMsg = groqVisionError?.message || String(groqVisionError);
            console.error(`Exact Groq Vision Error: Status ${errStatus} - Message: ${errMsg}`);
            
            let userFriendlyMsg = "Failed to process image. Please try a text question instead.";
            if (errStatus === 429 || errMsg.includes("429")) {
              userFriendlyMsg = "Image processing service is busy. Please wait a moment or try a text question.";
            }
            controller.enqueue(encoder.encode(`⚠️ ERROR: ${userFriendlyMsg} (Details: ${errMsg})`));
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
          content: SYSTEM_PROMPT,
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