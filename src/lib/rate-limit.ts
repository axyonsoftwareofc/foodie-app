// src/lib/rate-limit.ts
import { getRedis } from './redis';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Sliding-window rate limit via Redis.
 * If Redis is unavailable:
 *   - failClosed=true → rejects the request (for auth/payment/webhook endpoints)
 *   - failClosed=false → allows the request (graceful degradation for reads)
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  failClosed = false
): Promise<RateLimitResult> {
  const redis = getRedis();
  if (!redis) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[RateLimit] Redis unavailable; request for',
        key,
        failClosed ? 'REJECTED' : 'ALLOWED'
      );
    }
    if (failClosed) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset: Date.now() + windowSeconds * 1000,
      };
    }
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Date.now() + windowSeconds * 1000,
    };
  }

  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / windowSeconds);
  const windowKey = `ratelimit:${key}:${windowStart}`;

  const current = await redis.incr(windowKey);
  if (current === 1) {
    await redis.expire(windowKey, windowSeconds);
  }

  const remaining = Math.max(0, limit - current);
  const reset = (windowStart + 1) * windowSeconds * 1000;

  return {
    success: current <= limit,
    limit,
    remaining,
    reset,
  };
}

/** Extract client IP from a Next.js request (works behind proxies).
 *  If TRUSTED_PROXY_COUNT is set, trusts the N-th hop from the end.
 *  Otherwise defaults to the last hop (most conservative).
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const hops = forwarded
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean);
    const trustedCount = Number(process.env.TRUSTED_PROXY_COUNT);
    if (!Number.isNaN(trustedCount) && trustedCount > 0 && hops.length > trustedCount) {
      return hops[hops.length - 1 - trustedCount];
    }
    // Default: last hop (closest to the application / hardest to spoof)
    return hops[hops.length - 1] || hops[0] || 'unknown';
  }
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  // Fallback: use a hash of the user-agent + accept-language (imprecise but better than nothing)
  const ua = headers.get('user-agent') || 'unknown';
  const lang = headers.get('accept-language') || 'unknown';
  return `fallback:${ua.slice(0, 32)}:${lang.slice(0, 16)}`;
}

/** Pre-built configurations for common rate-limit tiers. */
export const RateLimitConfig = {
  /** Strict: login, password reset, payment intent — 5 req / 60s */
  strict: { limit: 5, windowSeconds: 60 },
  /** Moderate: write operations (CRUD) — 30 req / 60s */
  moderate: { limit: 30, windowSeconds: 60 },
  /** Relaxed: read operations — 100 req / 60s */
  relaxed: { limit: 100, windowSeconds: 60 },
} as const;

/** Extract a stable identifier from Next.js headers (for Server Actions). */
export async function getClientIdentifierFromHeaders(): Promise<string> {
  const { headers } = await import('next/headers');
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) {
    const hops = forwarded
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean);
    const trustedCount = Number(process.env.TRUSTED_PROXY_COUNT);
    if (!Number.isNaN(trustedCount) && trustedCount > 0 && hops.length > trustedCount) {
      return hops[hops.length - 1 - trustedCount];
    }
    return hops[hops.length - 1] || hops[0] || 'unknown';
  }
  const realIp = h.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  const ua = h.get('user-agent') || 'unknown';
  const lang = h.get('accept-language') || 'unknown';
  return `fallback:${ua.slice(0, 32)}:${lang.slice(0, 16)}`;
}

/** Build a standard 429 response from a failed rate-limit check. */
export function buildRateLimitResponse(result: RateLimitResult): Response {
  return new Response(JSON.stringify({ error: 'Muitas requisições. Aguarde um momento.' }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': String(result.limit),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(result.reset),
    },
  });
}
