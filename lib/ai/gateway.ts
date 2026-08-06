import { AIProvider, ChatOptions, VisionOptions, ProviderResult } from "./providers/provider-interface";
import { GroqProvider } from "./providers/groq";
import { GeminiProvider } from "./providers/gemini";
import { logAIRequest } from "./logger";
import { getHash, getCache, setCache } from "@/lib/cache";
import { withTimeout } from "@/lib/timeout";

export interface ModelConfig {
  provider: "groq" | "gemini";
  model: string;
}

// Centralized registries for primary models and failover paths
export const TEXT_FALLBACKS: ModelConfig[] = [
  { provider: "groq", model: "llama-3.3-70b-versatile" },
  { provider: "gemini", model: "gemini-2.0-flash" },
  { provider: "gemini", model: "gemini-1.5-flash" },
  { provider: "groq", model: "llama-3.1-8b-instant" },
];

export const VISION_FALLBACKS: ModelConfig[] = [
  { provider: "gemini", model: "gemini-2.0-flash" },
  { provider: "gemini", model: "gemini-1.5-flash" },
  { provider: "groq", model: "llama-3.2-11b-vision-preview" },
];

class CircuitBreaker {
  private state: "CLOSED" | "OPEN" | "HALF-OPEN" = "CLOSED";
  private failureCount = 0;
  private maxFailures = 5;
  private cooldownMs = 5000; // 5 seconds
  private lastFailureTime = 0;

  constructor(maxFailures = 5, cooldownMs = 5000) {
    this.maxFailures = maxFailures;
    this.cooldownMs = cooldownMs;
  }

  isOpen(): boolean {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.cooldownMs) {
        this.state = "HALF-OPEN";
        console.warn(`[Circuit Breaker]: Cooldown expired. Transitioning to HALF-OPEN.`);
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess() {
    this.state = "CLOSED";
    this.failureCount = 0;
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.maxFailures) {
      this.state = "OPEN";
      console.error(`[Circuit Breaker]: Max failures (${this.maxFailures}) reached. Transitioning to OPEN.`);
    }
  }
}

/**
 * Executes a function with automatic retries and exponential backoff.
 * Retries only on transient errors (rate limits (429) or server errors (5xx/network)).
 */
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  delayMs = 500
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const status = error?.status || error?.statusCode || error?.status_code;
      
      const isRateLimit = status === 429 || error?.message?.includes("429");
      const isServerError = status >= 500 || error?.message?.includes("500") || error?.message?.includes("503");
      const isNetworkError = !status; // No status code usually indicates network failure

      const isTransient = isRateLimit || isServerError || isNetworkError;

      if (attempt === maxRetries || !isTransient) {
        throw error;
      }

      // Backoff delay
      const waitTime = delayMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
}

class AIGateway {
  private providers: Record<string, AIProvider>;
  private breakers: Record<string, CircuitBreaker>;

  constructor() {
    this.providers = {
      groq: new GroqProvider(),
      gemini: new GeminiProvider(),
    };
    this.breakers = {
      groq: new CircuitBreaker(5, 5000),
      gemini: new CircuitBreaker(5, 5000),
    };
  }

  /**
   * Generates a complete text response (JSON or standard chat) with full failover support.
   */
  async chat(
    options: ChatOptions,
    userId?: string | null,
    configs: ModelConfig[] = TEXT_FALLBACKS
  ): Promise<ProviderResult> {
    const cacheKey = `ai-cache:${getHash(options.messages)}`;
    const cachedResponse = await getCache<ProviderResult>(cacheKey);
    if (cachedResponse) {
      console.log("[AI Gateway]: Cache HIT for chat generation.");
      logAIRequest({
        userId,
        provider: "cache",
        model: "redis",
        requestType: options.jsonMode ? "json" : "chat",
        latencyMs: 10,
        status: "success",
        promptTokens: cachedResponse.promptTokens || 0,
        completionTokens: cachedResponse.completionTokens || 0,
      });
      return cachedResponse;
    }

    let lastError: any;

    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      const breaker = this.breakers[config.provider];

      if (breaker.isOpen()) {
        console.warn(`[Circuit Breaker]: Skipping provider ${config.provider} because circuit is OPEN.`);
        continue;
      }

      const provider = this.providers[config.provider];
      const startTime = Date.now();

      try {
        const result = await withTimeout(
          executeWithRetry(
            () => provider.chat(options, config.model),
            2,
            500
          ),
          35000,
          `AI request to ${config.provider} timed out after 35s`
        );

        breaker.recordSuccess();
        const latency = Date.now() - startTime;
        
        // Log logAIRequest asynchronously
        logAIRequest({
          userId,
          provider: config.provider,
          model: config.model,
          requestType: options.jsonMode ? "json" : "chat",
          latencyMs: latency,
          status: i === 0 ? "success" : "fallback",
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
        });

        // Cache the successful generation (default 24h)
        await setCache(cacheKey, result);

        return result;
      } catch (error: any) {
        breaker.recordFailure();
        lastError = error;
        const latency = Date.now() - startTime;

        console.error(
          `[AI Gateway Warning]: Model failed -> ${config.provider}:${config.model}. Error: ${error.message || error}`
        );

        logAIRequest({
          userId,
          provider: config.provider,
          model: config.model,
          requestType: options.jsonMode ? "json" : "chat",
          latencyMs: latency,
          status: i === configs.length - 1 ? "error" : "fallback",
          errorMessage: error?.message || String(error),
        });
      }
    }

    throw new Error(
      `AI Platform Gateway Error: All configured models failed to respond. Last error: ${lastError?.message || lastError}`
    );
  }

  /**
   * Streams a text chat response. Falls back dynamically if connection fails before chunk output.
   */
  async chatStream(
    options: ChatOptions,
    onChunk: (text: string) => void,
    userId?: string | null,
    configs: ModelConfig[] = TEXT_FALLBACKS
  ): Promise<ProviderResult> {
    let lastError: any;
    let accumulatedText = "";

    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      const breaker = this.breakers[config.provider];

      if (breaker.isOpen()) {
        console.warn(`[Circuit Breaker]: Skipping provider ${config.provider} because circuit is OPEN.`);
        continue;
      }

      const provider = this.providers[config.provider];
      const startTime = Date.now();

      try {
        // Reset dynamic stream chunk accumulation per provider attempt
        accumulatedText = "";

        const result = await withTimeout(
          executeWithRetry(
            () =>
              provider.chatStream(options, config.model, (chunk) => {
                accumulatedText += chunk;
                onChunk(chunk);
              }),
            2,
            500
          ),
          15000,
          `AI stream to ${config.provider} timed out after 15s`
        );

        breaker.recordSuccess();
        const latency = Date.now() - startTime;

        logAIRequest({
          userId,
          provider: config.provider,
          model: config.model,
          requestType: "chat_stream",
          latencyMs: latency,
          status: i === 0 ? "success" : "fallback",
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
        });

        return result;
      } catch (error: any) {
        breaker.recordFailure();
        lastError = error;
        const latency = Date.now() - startTime;

        console.error(
          `[AI Gateway Warning]: Stream failed -> ${config.provider}:${config.model}. Error: ${error.message || error}`
        );

        logAIRequest({
          userId,
          provider: config.provider,
          model: config.model,
          requestType: "chat_stream",
          latencyMs: latency,
          status: i === configs.length - 1 ? "error" : "fallback",
          errorMessage: error?.message || String(error),
        });

        // If we already streamed some text to the client, we cannot cleanly restart the stream from zero mid-way
        // We throw the error so the client knows it ended abruptly, or continue fallback if no chunks were emitted yet
        if (accumulatedText.length > 0) {
          throw new Error(
            `AI Platform Gateway: Stream interrupted mid-generation. Provider: ${config.provider}. Error: ${error.message}`
          );
        }
      }
    }

    throw new Error(
      `AI Platform Gateway Error: All configured stream models failed. Last error: ${lastError?.message || lastError}`
    );
  }

  /**
   * Evaluates an image/vision question with full failover support.
   */
  async vision(
    options: VisionOptions,
    userId?: string | null,
    configs: ModelConfig[] = VISION_FALLBACKS
  ): Promise<ProviderResult> {
    let lastError: any;

    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      const breaker = this.breakers[config.provider];

      if (breaker.isOpen()) {
        console.warn(`[Circuit Breaker]: Skipping provider ${config.provider} because circuit is OPEN.`);
        continue;
      }

      const provider = this.providers[config.provider];
      const startTime = Date.now();

      try {
        const result = await withTimeout(
          executeWithRetry(
            () => provider.vision(options, config.model),
            2,
            500
          ),
          35000,
          `AI request to ${config.provider} timed out after 35s`
        );

        breaker.recordSuccess();
        const latency = Date.now() - startTime;

        logAIRequest({
          userId,
          provider: config.provider,
          model: config.model,
          requestType: "vision",
          latencyMs: latency,
          status: i === 0 ? "success" : "fallback",
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
        });

        return result;
      } catch (error: any) {
        breaker.recordFailure();
        lastError = error;
        const latency = Date.now() - startTime;

        console.error(
          `[AI Gateway Warning]: Vision failed -> ${config.provider}:${config.model}. Error: ${error.message || error}`
        );

        logAIRequest({
          userId,
          provider: config.provider,
          model: config.model,
          requestType: "vision",
          latencyMs: latency,
          status: i === configs.length - 1 ? "error" : "fallback",
          errorMessage: error?.message || String(error),
        });
      }
    }

    throw new Error(
      `AI Platform Gateway Error: Vision models failed to respond. Last error: ${lastError?.message || lastError}`
    );
  }

  /**
   * Streams a vision analysis response. Falls back dynamically if connection fails before chunk output.
   */
  async visionStream(
    options: VisionOptions,
    onChunk: (text: string) => void,
    userId?: string | null,
    configs: ModelConfig[] = VISION_FALLBACKS
  ): Promise<ProviderResult> {
    let lastError: any;
    let accumulatedText = "";

    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      const breaker = this.breakers[config.provider];

      if (breaker.isOpen()) {
        console.warn(`[Circuit Breaker]: Skipping provider ${config.provider} because circuit is OPEN.`);
        continue;
      }

      const provider = this.providers[config.provider];
      const startTime = Date.now();

      try {
        accumulatedText = "";

        const result = await withTimeout(
          executeWithRetry(
            () =>
              provider.visionStream(options, config.model, (chunk) => {
                accumulatedText += chunk;
                onChunk(chunk);
              }),
            2,
            500
          ),
          15000,
          `AI stream to ${config.provider} timed out after 15s`
        );

        breaker.recordSuccess();
        const latency = Date.now() - startTime;

        logAIRequest({
          userId,
          provider: config.provider,
          model: config.model,
          requestType: "vision_stream",
          latencyMs: latency,
          status: i === 0 ? "success" : "fallback",
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
        });

        return result;
      } catch (error: any) {
        breaker.recordFailure();
        lastError = error;
        const latency = Date.now() - startTime;

        console.error(
          `[AI Gateway Warning]: Vision stream failed -> ${config.provider}:${config.model}. Error: ${error.message || error}`
        );

        logAIRequest({
          userId,
          provider: config.provider,
          model: config.model,
          requestType: "vision_stream",
          latencyMs: latency,
          status: i === configs.length - 1 ? "error" : "fallback",
          errorMessage: error?.message || String(error),
        });

        if (accumulatedText.length > 0) {
          throw new Error(
            `AI Platform Gateway: Vision stream interrupted mid-generation. Provider: ${config.provider}. Error: ${error.message}`
          );
        }
      }
    }

    throw new Error(
      `AI Platform Gateway Error: All configured vision stream models failed. Last error: ${lastError?.message || lastError}`
    );
  }
}

export const aiGateway = new AIGateway();
export default aiGateway;
