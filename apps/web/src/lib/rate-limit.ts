import 'server-only'

/**
 * In-memory sliding-window rate limiter (per bucket + key).
 * Good enough for a single-node newsroom deployment; swap for Redis at scale.
 */

interface Window {
  hits: number[]
}

const buckets = new Map<string, Window>()
let lastSweep = Date.now()

const SWEEP_INTERVAL_MS = 5 * 60 * 1000
const MAX_BUCKETS = 20_000

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return
  lastSweep = now
  for (const [key, w] of buckets) {
    // drop windows with no hit in the last 30 minutes
    if (!w.hits.length || now - w.hits[w.hits.length - 1]! > 30 * 60 * 1000) {
      buckets.delete(key)
    }
  }
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterSec: number
}

/**
 * @param bucket logical name, e.g. "login" or "comment"
 * @param key unique client key (usually ip)
 * @param limit max requests inside the window
 * @param windowMs window size in milliseconds
 */
export function rateLimit(
  bucket: string,
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now()
  sweep(now)
  if (buckets.size > MAX_BUCKETS) buckets.clear()

  const mapKey = `${bucket}:${key}`
  const w = buckets.get(mapKey) ?? { hits: [] }
  w.hits = w.hits.filter((t) => now - t < windowMs)

  if (w.hits.length >= limit) {
    buckets.set(mapKey, w)
    const oldest = w.hits[0]!
    return { ok: false, remaining: 0, retryAfterSec: Math.ceil((windowMs - (now - oldest)) / 1000) }
  }

  w.hits.push(now)
  buckets.set(mapKey, w)
  return { ok: true, remaining: limit - w.hits.length, retryAfterSec: 0 }
}

/** Best-effort client IP for rate-limit keys (never trust it for identity). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return req.headers.get('x-real-ip') ?? 'local'
}
