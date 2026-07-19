import { supabaseAdmin } from "@/lib/supabase-admin";

export interface LogData {
  userId?: string | null;
  provider: string;
  model: string;
  requestType: "chat" | "chat_stream" | "vision" | "vision_stream" | "json";
  latencyMs: number;
  status: "success" | "fallback" | "error";
  errorMessage?: string | null;
  promptTokens?: number;
  completionTokens?: number;
}

/**
 * Logs AI request metrics to the database table `ai_request_logs`.
 * Operates in a fail-safe block to ensure logging issues do not interrupt user requests.
 */
export async function logAIRequest(data: LogData): Promise<void> {
  // Run async without blocking the main execution loop
  (async () => {
    try {
      const { error } = await supabaseAdmin.from("ai_request_logs").insert({
        user_id: data.userId || null,
        provider: data.provider,
        model: data.model,
        request_type: data.requestType,
        latency_ms: data.latencyMs,
        status: data.status,
        error_message: data.errorMessage || null,
        prompt_tokens: data.promptTokens || null,
        completion_tokens: data.completionTokens || null,
      });

      if (error) {
        // Safe console output warning. Fits case where user has not executed SQL migration yet.
        console.warn(
          `[AI Logger Warning]: Could not write log to public.ai_request_logs (Reason: ${error.message}). ` +
          "Ensure you run the database migrations SQL script in Supabase."
        );
      }
    } catch (err) {
      console.error("[AI Logger Exception]: Failed writing request log to database:", err);
    }
  })();
}
