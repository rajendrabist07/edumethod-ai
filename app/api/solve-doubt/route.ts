import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { aiGateway } from "@/lib/ai/gateway";
import { supabaseAdmin } from "@/lib/supabase-admin";
import crypto from "crypto";
import { checkUsageLimit } from "@/lib/usage";
import { runCognitivePipeline } from "@/lib/ai/cognitive-pipeline";
import { checkRateLimit } from "@/lib/rate-limit";
import { getEmbedding } from "@/lib/ai/embeddings";
import { getOrCreateLearnerProfile, recordDoubtSessionInteraction } from "@/lib/learner-profile";
import { verifyDoubtResponse } from "@/lib/ai/verification";
import { determineTeachingStrategy, STRATEGY_PROMPT_INSTRUCTIONS, AdaptiveTeachingStrategy } from "@/lib/ai/adaptive-strategy";

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
  effort: z.enum(["low", "medium", "high", "extra"]).optional(),
}).refine(
  (data) => {
    if (data.imageBase64) {
      if (!data.mimeType) return false;
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(data.mimeType)) return false;
      
      // Calculate approximate size in bytes from base64 representation
      const approxBytes = (data.imageBase64.length * 3) / 4;
      if (approxBytes > 4 * 1024 * 1024) return false; // 4MB maximum payload limit
    }
    return true;
  },
  {
    message: "Invalid image upload. Must be JPEG, PNG, WEBP, or GIF, and under 4MB.",
    path: ["imageBase64"],
  }
);

const SYSTEM_PROMPT = `You are a patient, encouraging, and elite senior AI tutor. Solve questions step-by-step, explaining reasoning at each step.
Follow these rules strictly:
1. Mathematical expressions: Always use standard LaTeX. Inline math: $...$, block math: $$...$$. Never use raw text symbols like x^2 or /frac.
2. Language understanding: Detect the user's language and vocabulary style from their message. Reply in the same language and script unless the user explicitly requests another format. Romanized Nepali/Hindi must receive Romanized Nepali/Hindi; Devanagari Nepali/Hindi must receive Devanagari; English must receive natural English.
3. Tone matching: Use student-friendly vocabulary in the user's own tone while keeping the reasoning senior, accurate, and direct.
4. Be professional, deeply insightful, and format your markdown elegantly for a world-class reading experience.`;

const EFFORT_INSTRUCTIONS = {
  low: "Effort mode: Low. Answer fast with the shortest useful explanation, one clear method, and no extra theory unless needed.",
  medium: "Effort mode: Medium. Balance speed and depth. Give the key reasoning, a worked path, and a concise checkpoint.",
  high: "Effort mode: High. Be more thorough. Explain why each step works, mention common mistakes, and include a short verification.",
  extra: "Effort mode: Extra. Give a senior-level explanation with alternatives, edge cases, and a final mastery summary, while staying readable.",
};

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
        { error: "Daily AI usage limit reached. Please continue after the quota window resets." },
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
    const effort = parseResult.data.effort ?? "medium";

    // Fetch Learner Profile
    const learnerProfile = await getOrCreateLearnerProfile(userId);

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

    // RAG & Syllabus Context
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
3. CRITICAL LANGUAGE RULE: Match the user's spoken language, script, and vocabulary style. If they use Romanized Nepali, reply in Romanized Nepali. If they use Devanagari Nepali or Hindi, reply in Devanagari. If they use English, reply in natural English.
4. Be extremely fast and direct while still giving the student a clear next step.`;
    }

    // Inject Learner Profile Context into system prompt
    const profilePromptText = `\n\n[STUDENT LEARNING PROFILE CONTEXT]:
- Preferred Explanation Style: ${learnerProfile.preferred_explanation_style}
- Per-Topic Mastery Scores: ${JSON.stringify(learnerProfile.mastery_scores)}
- Recent Misconceptions: ${JSON.stringify(learnerProfile.recent_mistakes.slice(0, 3).map((m) => ({ topic: m.topic, misconception: m.misconception })))}`;

    finalSystemPrompt = `${finalSystemPrompt}\n\n${EFFORT_INSTRUCTIONS[effort]}${profilePromptText}`;

    let chunksMatched: any[] = [];
    let detectedSubject: string | null = null;
    try {
      let targetLearningPathId = learningPathId || null;

      if (!targetLearningPathId) {
        // Fetch the user's most recent learning path as fallback
        const { data: recentPath } = await supabaseAdmin
          .from("learning_paths")
          .select("id, subject")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (recentPath) {
          targetLearningPathId = recentPath.id;
          detectedSubject = recentPath.subject;
        }
      } else {
        const { data: currentPath } = await supabaseAdmin
          .from("learning_paths")
          .select("subject")
          .eq("id", targetLearningPathId)
          .maybeSingle();
        if (currentPath) {
          detectedSubject = currentPath.subject;
        }
      }

      if (targetLearningPathId) {
        const queryEmbedding = await getEmbedding(message);
        const { data: matchedChunks, error: rpcError } = await supabaseAdmin.rpc("match_syllabus_chunks", {
          query_embedding: queryEmbedding,
          match_threshold: 0.35,
          match_count: 5,
          filter_learning_path_id: targetLearningPathId
        });

        if (!rpcError && matchedChunks && matchedChunks.length > 0) {
          chunksMatched = matchedChunks;
          const contextText = matchedChunks
            .map((c: any, i: number) => {
              const secNum = c.metadata?.section || i + 1;
              const sourceLabel = c.metadata?.source || "Syllabus Notes";
              return `[Section ${secNum} of ${sourceLabel} (Similarity: ${(c.similarity * 100).toFixed(0)}%)]:\n${c.content}`;
            })
            .join("\n\n");
          
          finalSystemPrompt = `${finalSystemPrompt}\n\n=== VERIFIED GROUNDING CONTEXT FROM STUDENT'S UPLOADED NOTES ===\n${contextText}\n\nCRITICAL GROUNDING RULES:\n1. Ground your explanation strictly in the student's uploaded notes provided above.\n2. YOU MUST EXPLICITLY CITE the section(s) used in your answer (e.g., "Based on Section ${matchedChunks[0]?.metadata?.section || 1} of your notes..."). This provides proof that your response is grounded in their material.`;
        } else {
          // No chunks matched above threshold 0.35
          finalSystemPrompt = `${finalSystemPrompt}\n\n=== GROUNDING NOTICE: NO MATCHING NOTES FOUND ===\nCRITICAL GROUNDING RULE (NO MATCHING NOTES):\n1. No relevant sections were found in the student's uploaded syllabus/notes above the similarity threshold for this question.\n2. YOU MUST EXPLICITLY STATE THIS HONESTLY to the student right at the beginning of your response.\n3. Start your response with: "⚠️ Note: I searched your uploaded syllabus/notes, but could not find a direct reference to this question."\n4. After stating this notice, you may provide a clear general answer while explicitly clarifying that it is from general knowledge, not their uploaded material.`;
        }
      } else {
        // No uploaded material exists for this subject yet
        finalSystemPrompt = `${finalSystemPrompt}\n\n=== GROUNDING NOTICE: NO MATERIAL UPLOADED ===\nCRITICAL GROUNDING RULE:\n1. The student has not uploaded a syllabus or study notes for this subject yet.\n2. Start your response with: "⚠️ Note: You have not uploaded any syllabus or study notes for this subject yet."\n3. After stating this notice, provide a helpful general answer.`;
      }
    } catch (ragError) {
      console.warn("RAG retrieval failed, falling back to standard AI prompt:", ragError);
    }

    // Automatically record interaction stats in profile
    void recordDoubtSessionInteraction(userId, detectedSubject, { effort, socratic, isVoiceMode });

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

      // Determine optimal teaching strategy deterministically based on learner profile
      const masteryForSubject = detectedSubject && learnerProfile?.mastery_scores
        ? learnerProfile.mastery_scores[detectedSubject] ?? null
        : null;

      const mistakesForSubject = detectedSubject && learnerProfile?.recent_mistakes
        ? learnerProfile.recent_mistakes.filter((m) => m.topic.toLowerCase() === detectedSubject?.toLowerCase()).length
        : learnerProfile?.recent_mistakes?.length || 0;

      const teachingStrategy: AdaptiveTeachingStrategy = determineTeachingStrategy({
        masteryScore: masteryForSubject,
        recentMistakesCount: mistakesForSubject,
        topic: detectedSubject,
        userPreference: socratic ? "socratic" : learnerProfile?.preferred_explanation_style,
      });

      let isAuditPassed = true;

      const stream = new ReadableStream({
        async start(controller) {
          let fullResponseText = "";
          try {
            // Run the multi-step cognitive pipeline (Strategist -> Generator -> Verifier)
            const pipelineResultText = await runCognitivePipeline({
              message,
              history,
              context: chunksMatched.length > 0
                ? chunksMatched.map((c: any, i: number) => `[Section ${c.metadata?.section || i + 1} of ${c.metadata?.source || "Syllabus Notes"}]:\n${c.content}`).join("\n\n")
                : "NO MATCHING NOTES FOUND ABOVE SIMILARITY THRESHOLD",
              userId,
              learnerProfile,
              teachingStrategy,
            });

            // Verification & Reliability Audit (RAG grounding + code execution math check)
            const audit = await verifyDoubtResponse(
              pipelineResultText,
              chunksMatched.map((c) => c.content),
              userId
            );

            isAuditPassed = audit.passed;
            fullResponseText = audit.verifiedContent || pipelineResultText;

            // Synthetically chunk the verified response to simulate streaming for the UI
            const chunkSize = 20;
            for (let i = 0; i < fullResponseText.length; i += chunkSize) {
              const chunk = fullResponseText.slice(i, i + chunkSize);
              controller.enqueue(encoder.encode(chunk));
              await new Promise((r) => setTimeout(r, 5)); // tiny delay for typewriter effect
            }

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

      const groundingHeader = chunksMatched.length > 0
        ? `Grounded in Section ${chunksMatched[0]?.metadata?.section || 1} of uploaded notes (${chunksMatched[0]?.metadata?.source || "Syllabus"})`
        : "⚠️ No matching reference found in uploaded notes — answered from general knowledge";

      const strategyHeader = `${STRATEGY_PROMPT_INSTRUCTIONS[teachingStrategy]?.label || teachingStrategy} (${teachingStrategy}) - selected based on student mastery level`;

      const verificationHeader = isAuditPassed
        ? "Verified by Independent AI Auditor & Node Arithmetic Code Execution"
        : "⚠️ Verification Downgraded Response: Independent audit flagged discrepancy; presented conservative verified answer";

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          "x-session-id": finalSessionId || "",
          "x-transparency-grounding": groundingHeader,
          "x-transparency-strategy": strategyHeader,
          "x-transparency-verification": verificationHeader,
          "x-transparency-downgraded": isAuditPassed ? "false" : "true",
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
