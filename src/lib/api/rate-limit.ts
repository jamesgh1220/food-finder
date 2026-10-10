interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimiterOptions {
  limit: number;
  windowMs: number;
  now?: () => number;
}

export interface RateLimiter {
  consume(key: string): boolean;
}

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const limit = options.limit;
  const windowMs = options.windowMs;
  const now = options.now ?? (() => Date.now());
  const store = new Map<string, RateLimitEntry>();

  return {
    consume(key: string): boolean {
      const currentTime = now();
      const entry = store.get(key);
      if (!entry || entry.resetAt <= currentTime) {
        store.set(key, { count: 1, resetAt: currentTime + windowMs });
        return true;
      }
      if (entry.count >= limit) {
        return false;
      }
      entry.count += 1;
      return true;
    },
  };
}

export const DEFAULT_RECOMMENDATIONS_RATE_LIMIT = {
  limit: 10,
  windowMs: 60_000,
};

const defaultLimiter = createRateLimiter(DEFAULT_RECOMMENDATIONS_RATE_LIMIT);

export function getDefaultRecommendationsRateLimiter(): RateLimiter {
  return defaultLimiter;
}

export function resolveClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0]?.trim();
    if (ip) {
      return ip;
    }
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp && realIp.trim()) {
    return realIp.trim();
  }
  return "unknown";
}
