import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { aiGateway } from "@/lib/ai/gateway";
import { supabaseAdmin } from "@/lib/supabase-admin";
import crypto from "crypto";
import { checkUsageLimit } from "@/lib/usage";
import { checkRateLimit } from "@/lib/rate-limit";
import { getEmbedding } from "@/lib/ai/embeddings";

const requestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  learningPathId: z.string().uuid().optional(),
  message: z.string().min(1),
  imageBase64: z.string().optional(),
  mimeType: z.string().optional(),
  regenerate: z.boolean().optional(),
  socratic: z.boolean().optional(),
  truncateHistoryAtIndex: z.number().optional(),
  isVoiceMode: z.boolean().optional(),
});

const SYSTEM_PROMPT = `You are a patient, encouraging, and elite senior AI tutor. Solve questions step-by-step, explaining reasoning at each step.
Follow these rules strictly:
1. Mathematical expressions: Always use standard LaTeX. Inline math: $...$, block math: $$...$$. Never use raw text symbols like x^2 or /frac.
2. Language understanding: You possess advanced multi-lingual and contextual understanding. If the user asks you to speak or explain in a specific language format (like "Romanized Nepali", "Nepanglish", etc.), YOU MUST reply in exactly that format (e.g. using English alphabets to write Nepali words: "timro samasya ko samadhan yesto chha"). Do NOT output Devanagari script if Romanized is requested.
3. Be professional, deeply insightful, and format your markdown elegantly for a world-class reading experience.`;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limit: 10 requests per minute
    const rateLimit = await checkRateLimit(`rate-limit:${userId}:solve-doubt`, 10, "60 s");
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a moment." },
        { status: 429 }
      );
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

    const { sessionId, learningPathId, message, imageBase64, mimeType, regenerate, socratic, truncateHistoryAtIndex, isVoiceMode } = parseResult.data;

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
    if (typeof truncateHistoryAtIndex === "number" && truncateHistoryAtIndex >= 0 && truncateHistoryAtIndex <= history.length) {
      history = history.slice(0, truncateHistoryAtIndex);
    } else if (regenerate && history.length >= 2) {
      history = history.slice(0, -2);
    }

    const userMessage: any = { role: "user" as const, content: message };
    if (imageBase64 && mimeType) {
      userMessage.imageUrl = `data:${mimeType};base64,${imageBase64}`;
    }
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

    // RAG Similarity Match
    let finalSystemPrompt = SYSTEM_PROMPT;
    if (socratic) {
      finalSystemPrompt = `You are a patient Socratic tutor. Do NOT give direct answers or solutions. Instead:
1. Break down the problem and ask prompting, scaffolding questions.
2. Guide the student step-by-step so they discover the errors or formulas themselves.
3. Be encouraging and use standard LaTeX formatting for math expressions.`;
    } else if (isVoiceMode) {
      finalSystemPrompt = `You are a world-class, elite senior strategist and AI tutor with a 15+ years experience perspective.
Follow these rules strictly for VOICE MODE:
1. Speak concisely, highly intelligently, and with a mature, engaging tone. Give shorter, punchy, conversational answers.
2. Do NOT output heavy markdown, code blocks, or complex LaTeX formulas. Use plain text formatting that reads naturally out loud.
3. If the user speaks in Romanized Nepali or mixes languages, you MUST reply smoothly in exactly that same format (using English alphabets for Nepali words).
4. Be extremely fast and direct.`;
    }
    let chunksMatched: any[] = [];
    try {
      let targetLearningPathId = learningPathId || null;

      if (!targetLearningPathId) {
        // Fetch the user's most recent learning path as fallback
        const { data: recentPath } = await supabaseAdmin
          .from("learning_paths")
          .select("id")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (recentPath) {
          targetLearningPathId = recentPath.id;
        }
      }

      if (targetLearningPathId) {
        const queryEmbedding = await getEmbedding(message);
        const { data: matchedChunks, error: rpcError } = await supabaseAdmin.rpc("match_syllabus_chunks", {
          query_embedding: queryEmbedding,
          match_threshold: 0.3,
          match_count: 3,
          filter_learning_path_id: targetLearningPathId
        });

        if (!rpcError && matchedChunks && matchedChunks.length > 0) {
          chunksMatched = matchedChunks;
          const contextText = matchedChunks
            .map((c: any, i: number) => `[Syllabus Context Section ${i + 1}]:\n${c.content}`)
            .join("\n\n");
          
          finalSystemPrompt = `${SYSTEM_PROMPT}\n\nUse the following verified syllabus context when answering the student's question. Address the student's question directly, citing the context sections where applicable (e.g. [Syllabus Context Section 1]).\n\nVerified Context:\n${contextText}`;
        }
      }
    } catch (ragError) {
      console.warn("RAG retrieval failed, falling back to standard AI prompt:", ragError);
    }

    const encoder = new TextEncoder();

    if (imageBase64 && mimeType) {
      const messageWithContext = chunksMatched.length > 0
        ? `${message}\n\n[Syllabus Context for citation]:\n${chunksMatched.map((c, idx) => `[Section ${idx + 1}]: ${c.content}`).join("\n")}`
        : message;

      const stream = new ReadableStream({
        async start(controller) {
          let fullResponseText = "";
          try {
            await aiGateway.visionStream(
              {
                message: messageWithContext,
                imageBase64,
                mimeType,
                history: [
                  { role: "system", content: finalSystemPrompt },
                  ...history.map((m: any) => ({
                    role: m.role as "user" | "assistant" | "system",
                    content: m.content,
                  }))
                ],
              },
              (chunk) => {
                fullResponseText += chunk;
                controller.enqueue(encoder.encode(chunk));
              },
              userId
            );

            const finalMessages = [...updatedMessagesWithUser, { role: "assistant", content: fullResponseText }];
            await supabaseAdmin
              .from("doubt_sessions")
              .update({ messages: finalMessages })
              .eq("id", finalSessionId);

          } catch (aiVisionError: any) {
            console.error("AI Gateway vision stream error:", aiVisionError);
            const userFriendlyMsg = aiVisionError.message || "Failed to process image. Please try a text question instead.";
            controller.enqueue(encoder.encode(`⚠️ ERROR: ${userFriendlyMsg}`));
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
          content: finalSystemPrompt,
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
            await aiGateway.chatStream(
              {
                messages: messagesToSend,
              },
              (chunk) => {
                fullResponseText += chunk;
                controller.enqueue(encoder.encode(chunk));
              },
              userId
            );

            const finalMessages = [...updatedMessagesWithUser, { role: "assistant", content: fullResponseText }];
            await supabaseAdmin
              .from("doubt_sessions")
              .update({ messages: finalMessages })
              .eq("id", finalSessionId);

          } catch (aiError: any) {
            console.error("AI Gateway text stream error:", aiError);
            const userFriendlyMsg = aiError.message || "AI tutor service error. Please try again.";
            controller.enqueue(encoder.encode(`⚠️ ERROR: ${userFriendlyMsg}`));
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