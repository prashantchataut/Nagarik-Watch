/**
 * In-memory rate limiter (per-process). For multi-instance production, swap the
 * `buckets` Map for a Redis-backed store — the function signatures stay the same.
 *
 * Use `enforceRateLimit()` at the top of any public POST route handler
 * (newsletter, contact, tips, votes) to cap abuse; it returns a 429 Response
 * when the window is exhausted, or null when the request is allowed.
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

export interface RateLimitOptions {
  /** Unique key prefix (e.g. "auth", "comment"). */
  prefix: string
  /** Identifier — IP, userId, or fingerprint. */
  id: string
  /** Max requests in the window. */
  max: number
  /** Window in ms. */
  windowMs: number
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  resetAt: number
}

export function rateLimit(opts: RateLimitOptions): RateLimitResult {
  const key = `${opts.prefix}:${opts.id}`
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || now > b.resetAt) {
    const resetAt = now + opts.windowMs
    buckets.set(key, { count: 1, resetAt })
    return { ok: true, remaining: opts.max - 1, resetAt }
  }
  if (b.count >= opts.max) {
    return { ok: false, remaining: 0, resetAt: b.resetAt }
  }
  b.count += 1
  return { ok: true, remaining: opts.max - b.count, resetAt: b.resetAt }
}

/** Extract client IP from request, handling common proxy headers. */
export function clientIp(req: Request): string {
  const h = req.headers
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    h.get('cf-connecting-ip') ||
    'unknown'
  )
}

/**
 * Enforce a rate limit on a route handler. Returns null if the request is
 * allowed (continue processing), or a 429 Response to return immediately.
 */
export function enforceRateLimit(
  req: Request,
  prefix: string,
  max: number,
  windowMs: number,
): Response | null {
  const ip = clientIp(req)
  const r = rateLimit({ prefix, id: ip, max, windowMs })
  if (r.ok) return null
  const retryAfter = Math.ceil((r.resetAt - Date.now()) / 1000)
  return new Response(
    JSON.stringify({ error: 'धेरै अनुरोध। कृपया केही समयपछि प्रयास गर्नुहोस्।' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(r.resetAt),
      },
    },
  )
}
