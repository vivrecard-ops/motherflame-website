/**
 * src/lib/rate-limit.ts — Per-IP rate limiting for sensitive API endpoints.
 *
 * Backed by Upstash Redis (free tier: 10k commands/day, plenty for this scale).
 * Sliding window algorithm — more accurate than fixed-window because it
 * doesn't allow 2× burst at the window boundary.
 *
 * Threat model:
 *   • /api/validate         — brute-force enumeration of license keys
 *   • /api/billing-portal   — abuse / Stripe API spam
 *
 * Each endpoint has its own limiter so a heavy user of one doesn't lock out
 * the other.  Limits are per-IP because that's what an attacker can't
 * trivially rotate (residential proxies are expensive at scale).
 *
 * ── Graceful degradation ─────────────────────────────────────────────────
 * If UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN aren't set, every
 * request is allowed through and a one-time warning is logged.  This lets
 * the app deploy before Redis is wired up, but production MUST have these
 * configured — without them, `validate` is unprotected.
 *
 * ── Configuring Upstash ──────────────────────────────────────────────────
 * 1. Sign up at https://console.upstash.com (free)
 * 2. Create a Redis database (any region — "Global" recommended)
 * 3. Copy REST URL + REST Token from the database page
 * 4. Add to Vercel → Settings → Environment Variables:
 *      UPSTASH_REDIS_REST_URL    = https://...upstash.io
 *      UPSTASH_REDIS_REST_TOKEN  = AX...
 * 5. Redeploy
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

// ── Redis client (singleton, lazy) ────────────────────────────────────────
//
// Upstash's Redis client is REST-based, so it works in Vercel serverless
// functions without persistent connections.  We instantiate once per cold
// start; warm invocations reuse the same client.

let _redis: Redis | null = null;
let _warned = false;

function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (!_warned) {
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN " +
        "not set — rate limiting DISABLED.  Configure these in Vercel " +
        "before going to production.",
      );
      _warned = true;
    }
    return null;
  }
  _redis = new Redis({ url, token });
  return _redis;
}

// ── Limiters ──────────────────────────────────────────────────────────────
//
// Sliding window counts requests in the last `window` seconds.  Each call
// to limit() decrements the budget by 1.
//
// Tuning rationale:
//   • validate: legitimate clients hit it once at app start + once every 6h.
//     30/min is ~720× more than needed → blocks brute-force scripts that
//     try thousands per minute, but never blocks a real user.
//   • billing-portal: manual user action (clicking "Manage subscription").
//     10/min per IP is generous; anything beyond is abuse.
//
// Key prefix isolates each limiter's keys in Redis so they can't collide.

let _validateLimiter: Ratelimit | null = null;
let _portalLimiter:   Ratelimit | null = null;

function getValidateLimiter(): Ratelimit | null {
  if (_validateLimiter) return _validateLimiter;
  const redis = getRedis();
  if (!redis) return null;
  _validateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    prefix:  "rl:validate",
    analytics: false,
  });
  return _validateLimiter;
}

function getPortalLimiter(): Ratelimit | null {
  if (_portalLimiter) return _portalLimiter;
  const redis = getRedis();
  if (!redis) return null;
  _portalLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    prefix:  "rl:portal",
    analytics: false,
  });
  return _portalLimiter;
}

// ── IP extraction ─────────────────────────────────────────────────────────
//
// On Vercel, `x-forwarded-for` is set by the edge proxy and is the closest
// thing to the client's real IP.  It's a comma-separated list ordered from
// closest-to-client first; we take the first entry.
//
// Falls back to `x-real-ip` (some other proxies) and finally to a literal
// "unknown" string — every "unknown"-tagged request shares one bucket, so
// if the IP can't be determined an attacker can't sidestep the limiter by
// stripping headers (they'd just collide with everyone else and get
// throttled hard).

function getClientIp(request: NextRequest | Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

// ── Public API ────────────────────────────────────────────────────────────

export type RateLimitResult = {
  /** True iff the request should be rejected with 429. */
  rateLimited: boolean;
  /** Seconds the client should wait before retrying (only meaningful when rateLimited). */
  retryAfter: number;
};

/**
 * Check the rate limit for `/api/validate`.
 *
 * Fails OPEN when Upstash isn't configured (returns rateLimited=false) so
 * the endpoint stays usable during initial deployment.  Configure Upstash
 * in Vercel before going to production.
 */
export async function checkValidateRateLimit(
  request: NextRequest | Request,
): Promise<RateLimitResult> {
  const limiter = getValidateLimiter();
  if (!limiter) return { rateLimited: false, retryAfter: 0 };
  const { success, reset } = await limiter.limit(getClientIp(request));
  return {
    rateLimited: !success,
    retryAfter:  Math.max(0, Math.ceil((reset - Date.now()) / 1000)),
  };
}

/**
 * Check the rate limit for `/api/billing-portal`.  See checkValidateRateLimit
 * for behaviour notes.
 */
export async function checkPortalRateLimit(
  request: NextRequest | Request,
): Promise<RateLimitResult> {
  const limiter = getPortalLimiter();
  if (!limiter) return { rateLimited: false, retryAfter: 0 };
  const { success, reset } = await limiter.limit(getClientIp(request));
  return {
    rateLimited: !success,
    retryAfter:  Math.max(0, Math.ceil((reset - Date.now()) / 1000)),
  };
}
