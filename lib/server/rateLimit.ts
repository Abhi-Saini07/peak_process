import "server-only";

/**
 * In-memory sliding-window rate limiter.
 *
 * NOTE: the counts live in this server instance's memory. On Vercel each
 * serverless instance has its own copy, and instances come and go, so the
 * limit is per instance and best effort. Move this to a shared store (e.g.
 * Upstash Redis with @upstash/ratelimit) before relying on it in production.
 */

export type RateLimitResult = { ok: true; remaining: number } | { ok: false; retryAfterSeconds: number };

export type RateLimiter = { check: (key: string) => RateLimitResult; reset: () => void };

export function createRateLimiter({
  limit,
  windowMs,
  now = Date.now,
  maxKeys = 10_000,
}: {
  limit: number;
  windowMs: number;
  /** Injectable clock, for tests. */
  now?: () => number;
  /** Safety valve so a flood of unique keys can't grow memory without bound. */
  maxKeys?: number;
}): RateLimiter {
  const hits = new Map<string, number[]>();

  function check(key: string): RateLimitResult {
    const t = now();
    const recent = (hits.get(key) ?? []).filter((at) => at > t - windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((recent[0] + windowMs - t) / 1000)) };
    }
    recent.push(t);
    hits.delete(key); // re-insert so the Map stays ordered by last use
    hits.set(key, recent);
    if (hits.size > maxKeys) {
      const oldest = hits.keys().next().value;
      if (oldest !== undefined) hits.delete(oldest);
    }
    return { ok: true, remaining: limit - recent.length };
  }

  return { check, reset: () => hits.clear() };
}

/** The client IP: the first x-forwarded-for entry (set by Vercel's proxy), else x-real-ip. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

/** POST /api/jobs/[id]/apply: 5 submissions per IP per 10 minutes. */
export const applyRateLimiter = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });

/** Public /api/schedule/[token]/*: 30 requests per IP and 10 per link, per 10 minutes. */
export const scheduleIpRateLimiter = createRateLimiter({ limit: 30, windowMs: 10 * 60 * 1000 });
export const scheduleTokenRateLimiter = createRateLimiter({ limit: 10, windowMs: 10 * 60 * 1000 });

/** Checks both schedule limits; returns the wait in seconds when either is exceeded. */
export function checkScheduleRateLimit(headers: Headers, token: string): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const byIp = scheduleIpRateLimiter.check(`ip:${clientIp(headers)}`);
  if (!byIp.ok) return byIp;
  const byToken = scheduleTokenRateLimiter.check(`token:${token.slice(0, 100)}`);
  if (!byToken.ok) return byToken;
  return { ok: true };
}
