import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RateLimitConfig = {
  key: string;
  max: number;
  windowMs: number;
  namespace: string;
};

type RateLimitResult = {
  limited: boolean;
  source: "upstash" | "memory";
};

const memoryStore = new Map<string, { count: number; resetAt: number }>();
const limiterCache = new Map<string, Ratelimit>();

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

const getLimiter = (namespace: string, max: number, windowMs: number) => {
  if (!redis) return null;
  const windowSeconds = Math.max(1, Math.round(windowMs / 1000));
  const cacheKey = `${namespace}:${max}:${windowSeconds}`;
  if (limiterCache.has(cacheKey)) {
    return limiterCache.get(cacheKey) ?? null;
  }
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, `${windowSeconds} s`),
    prefix: namespace,
  });
  limiterCache.set(cacheKey, limiter);
  return limiter;
};

const pruneMemoryStore = (now: number) => {
  if (memoryStore.size < 500) return;
  for (const [key, value] of memoryStore.entries()) {
    if (value.resetAt <= now) memoryStore.delete(key);
  }
};

export const isRateLimited = async ({
  key,
  max,
  windowMs,
  namespace,
}: RateLimitConfig): Promise<RateLimitResult> => {
  const limiter = getLimiter(namespace, max, windowMs);
  if (limiter) {
    try {
      const result = await limiter.limit(key);
      return { limited: !result.success, source: "upstash" };
    } catch (error) {
      console.error("Upstash rate limit error, falling back to memory:", error);
    }
  }

  const now = Date.now();
  pruneMemoryStore(now);
  const storageKey = `${namespace}:${key}`;
  const entry = memoryStore.get(storageKey);
  if (!entry || entry.resetAt <= now) {
    memoryStore.set(storageKey, { count: 1, resetAt: now + windowMs });
    return { limited: false, source: "memory" };
  }
  if (entry.count >= max) {
    return { limited: true, source: "memory" };
  }
  entry.count += 1;
  memoryStore.set(storageKey, entry);
  return { limited: false, source: "memory" };
};

