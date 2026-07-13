import 'server-only'
import { ensureOperationalSchema, isProductionRuntime, type Queryable } from '@/lib/ops-db'

type Bucket = { count: number; resetAt: number }
type RateLimitRow = { count: number | string; reset_at: Date | string }

const buckets = new Map<string, Bucket>()

export interface RateLimitOptions {
  prefix: string
  id: string
  max: number
  windowMs: number
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  resetAt: number
}

async function ensureSchema(): Promise<Queryable | null> {
  return ensureOperationalSchema('rate-limit', async (pool) => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nw_rate_limits (
        key text PRIMARY KEY,
        count integer NOT NULL,
        reset_at timestamptz NOT NULL
      )
    `)
    await pool.query(
      `CREATE INDEX IF NOT EXISTS nw_rate_limits_reset_idx ON nw_rate_limits(reset_at)`,
    )
  })
}

function memoryRateLimit(opts: RateLimitOptions): RateLimitResult {
  const key = `${opts.prefix}:${opts.id}`
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || now >= bucket.resetAt) {
    const resetAt = now + opts.windowMs
    buckets.set(key, { count: 1, resetAt })
    return { ok: true, remaining: Math.max(0, opts.max - 1), resetAt }
  }
  bucket.count += 1
  return {
    ok: bucket.count <= opts.max,
    remaining: Math.max(0, opts.max - bucket.count),
    resetAt: bucket.resetAt,
  }
}

export async function rateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const pool = await ensureSchema()
  if (!pool) {
    if (isProductionRuntime()) {
      throw new Error('Distributed rate limiting requires Postgres in production.')
    }
    return memoryRateLimit(opts)
  }

  const key = `${opts.prefix}:${opts.id}`
  const resetAt = new Date(Date.now() + opts.windowMs)
  const result = await pool.query<RateLimitRow>(
    `INSERT INTO nw_rate_limits (key, count, reset_at)
     VALUES ($1, 1, $2)
     ON CONFLICT (key) DO UPDATE SET
       count = CASE
         WHEN nw_rate_limits.reset_at <= now() THEN 1
         ELSE nw_rate_limits.count + 1
       END,
       reset_at = CASE
         WHEN nw_rate_limits.reset_at <= now() THEN EXCLUDED.reset_at
         ELSE nw_rate_limits.reset_at
       END
     RETURNING count, reset_at`,
    [key, resetAt.toISOString()],
  )
  const row = result.rows[0]
  if (!row) throw new Error('Rate limit counter update returned no row.')
  const count = Number(row.count)
  const resetAtMs = row.reset_at instanceof Date ? row.reset_at.getTime() : Date.parse(row.reset_at)
  return {
    ok: count <= opts.max,
    remaining: Math.max(0, opts.max - count),
    resetAt: resetAtMs,
  }
}

/** Extract client IP from common trusted-proxy headers. */
export function clientIp(req: Request): string {
  const headers = req.headers
  return (
    headers.get('cf-connecting-ip') ||
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  )
}

export async function enforceRateLimit(
  req: Request,
  prefix: string,
  max: number,
  windowMs: number,
): Promise<Response | null> {
  const result = await rateLimit({ prefix, id: clientIp(req), max, windowMs })
  if (result.ok) return null
  const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))
  return new Response(
    JSON.stringify({ error: 'धेरै अनुरोध। कृपया केही समयपछि प्रयास गर्नुहोस्।' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(result.resetAt),
      },
    },
  )
}
