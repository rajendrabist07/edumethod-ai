import { Redis } from "@upstash/redis";
import crypto from "crypto";

const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = hasUpstash
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// In-memory cache fallback for development/testing when Upstash Redis is not configured
const inMemoryCache = new Map<string, { value: string; expiresAt: number }>();

/**
 * Generates a SHA-256 hash of any value to use as a cache key identifier.
 */
export function getHash(value: any): string {
  const inputStr = typeof value === "string" ? value : JSON.stringify(value);
  return crypto.createHash("sha256").update(inputStr).digest("hex");
}

/**
 * Retrieves a parsed object from Redis cache if available, falling back to in-memory cache.
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (redis) {
    try {
      const data = await redis.get(key);
      if (!data) return null;
      return (typeof data === "string" ? JSON.parse(data) : data) as T;
    } catch (err) {
      console.error(`[Cache Read Warning]: Failed for key ${key}:`, err);
    }
  }

  // In-memory fallback
  const item = inMemoryCache.get(key);
  if (item) {
    if (Date.now() < item.expiresAt) {
      try {
        return JSON.parse(item.value) as T;
      } catch {
        return null;
      }
    } else {
      inMemoryCache.delete(key);
    }
  }
  return null;
}

/**
 * Saves a stringified object to Redis cache with an expiration TTL, falling back to in-memory cache.
 */
export async function setCache(key: string, value: any, ttlSeconds = 86400): Promise<void> {
  const strVal = JSON.stringify(value);
  
  if (redis) {
    try {
      await redis.set(key, strVal, { ex: ttlSeconds });
      return;
    } catch (err) {
      console.error(`[Cache Write Warning]: Failed for key ${key}:`, err);
    }
  }

  // In-memory fallback
  inMemoryCache.set(key, {
    value: strVal,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}
