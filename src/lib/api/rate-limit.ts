import { NextRequest, NextResponse } from "next/server";

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store for rate limiting
const store = new Map<string, RateLimitEntry>();

// Auto-cleanup expired entries every 60 seconds
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  }, 60_000);
  // Allow Node.js to exit even if interval is active
  if (typeof cleanupInterval === "object" && "unref" in cleanupInterval) {
    cleanupInterval.unref();
  }
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // Take the first IP in the chain (client IP)
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  // Fallback for local development
  return "127.0.0.1";
}

export function rateLimit(config: RateLimitConfig) {
  ensureCleanup();

  return async function checkRateLimit(
    req: NextRequest
  ): Promise<{ limited: boolean; remaining: number; resetAt: number }> {
    const key = config.keyGenerator
      ? config.keyGenerator(req)
      : getClientIp(req);

    const now = Date.now();
    const entry = store.get(key);

    // If no entry or window expired, start a new window
    if (!entry || entry.resetAt <= now) {
      const resetAt = now + config.windowMs;
      store.set(key, { count: 1, resetAt });
      return {
        limited: false,
        remaining: config.maxRequests - 1,
        resetAt,
      };
    }

    // Increment count within existing window
    entry.count += 1;

    if (entry.count > config.maxRequests) {
      return {
        limited: true,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    return {
      limited: false,
      remaining: config.maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  };
}

/**
 * Helper to apply rate limiting and return a 429 response if exceeded.
 * Returns null if the request is within limits, or a NextResponse if rate limited.
 */
export async function applyRateLimit(
  req: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const limiter = rateLimit(config);
  const result = await limiter(req);

  if (result.limited) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(config.maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.resetAt),
        },
      }
    );
  }

  return null;
}

// Pre-configured rate limiters for common endpoint types
export const rateLimiters = {
  auth: { windowMs: 60_000, maxRequests: 5 },
  publicRead: { windowMs: 60_000, maxRequests: 60 },
  write: { windowMs: 60_000, maxRequests: 20 },
  webhook: { windowMs: 60_000, maxRequests: 100 },
  chat: { windowMs: 60_000, maxRequests: 10 },
  checkout: { windowMs: 60_000, maxRequests: 10 },
  giftCardPurchase: { windowMs: 60_000, maxRequests: 5 },
  giftCardRedeem: { windowMs: 60_000, maxRequests: 10 },
  promoValidate: { windowMs: 60_000, maxRequests: 20 },
  b2bApply: { windowMs: 60_000, maxRequests: 3 },
  reviewWrite: { windowMs: 60_000, maxRequests: 5 },
} as const satisfies Record<string, RateLimitConfig>;
