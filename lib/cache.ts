import { Redis } from "@upstash/redis";
import crypto from "crypto";

const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = hasUpstash
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

/**
 * Generates a SHA-256 hash of any value to use as a cache key identifier.
 */
export function getHash(value: any): string {
  const inputStr = typeof value === "string" ? value : JSON.stringify(value);
  return crypto.createHash("sha256").update(inputStr).digest("hex");
}

/**
 * Retrieves a parsed object from Redis cache if available.
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return (typeof data === "string" ? JSON.parse(data) : data) as T;
  } catch (err) {
    console.error(`[Cache Read Warning]: Failed for key ${key}:`, err);
    return null;
  }
}

/**
 * Saves a stringified object to Redis cache with an expiration TTL (defaults to 24 hours).
 */
export async function setCache(key: string, value: any, ttlSeconds = 86400): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
  } catch (err) {
    console.error(`[Cache Write Warning]: Failed for key ${key}:`, err);
  }
}
