import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

/**
 * Enforces rate limiting on a specific identifier (user ID or IP address).
 * Falls back to allow-all with a warning if Upstash credentials are not defined.
 */
export async function checkRateLimit(
  identifier: string,
  limit = 10,
  window = "60 s"
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  if (!hasUpstash) {
    console.warn(
      `[Rate Limit Warning]: Upstash Redis credentials not configured. Rate limiting bypassed for: ${identifier}`
    );
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Date.now() + 60000,
    };
  }

  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, window as any),
      analytics: true,
    });

    const result = await ratelimit.limit(identifier);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error("[Rate Limiter Error]: Connection failed. Falling back to allow.", error);
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Date.now() + 60000,
    };
  }
}
