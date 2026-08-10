import 'server-only'
import { ensureOperationalSchema, isProductionRuntime, type Queryable } from '@/lib/ops-db'

/**
 * Token-bucket rate limiter. Each key holds a bucket that refills
 * continuously at `max / windowMs` tokens per millisecond, up to a capacity
 * of `max`. This smooths bursts at a window boundary compared to a fixed
 * window counter (which lets 2x `max` requests through across a boundary).
 */
type Bucket = { tokens: number; capacity: number; refillPerMs: number; lastRefillAt: number }
type RateLimitRow = { tokens: string | number; ok: boolean }

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

/**
 * Ensure token-bucket columns exist even when 0004 created the legacy
 * (count / reset_at) shape. Index creation must run AFTER the ALTER adds
 * last_refill_at, or schema setup fails forever and production throws 500.
 */
async function ensureSchema(): Promise<Queryable | null> {
  return ensureOperationalSchema('rate-limit-v2', async (pool) => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nw_rate_limits (
        key text PRIMARY KEY,
        tokens double precision NOT NULL DEFAULT 0,
        capacity double precision NOT NULL DEFAULT 60,
        refill_per_ms double precision NOT NULL DEFAULT 0.001,
        last_refill_at timestamptz NOT NULL DEFAULT now()
      )
    `)
    // Legacy 0004 table: add token-bucket columns before any index on them.
    await pool.query(`ALTER TABLE nw_rate_limits ADD COLUMN IF NOT EXISTS tokens double precision`)
    await pool.query(
      `ALTER TABLE nw_rate_limits ADD COLUMN IF NOT EXISTS capacity double precision`,
    )
    await pool.query(
      `ALTER TABLE nw_rate_limits ADD COLUMN IF NOT EXISTS refill_per_ms double precision`,
    )
    await pool.query(
      `ALTER TABLE nw_rate_limits ADD COLUMN IF NOT EXISTS last_refill_at timestamptz DEFAULT now()`,
    )
    await pool.query(`
      UPDATE nw_rate_limits SET
        tokens = COALESCE(tokens, 0),
        capacity = COALESCE(capacity, 60),
        refill_per_ms = COALESCE(refill_per_ms, 0.001),
        last_refill_at = COALESCE(last_refill_at, now())
      WHERE tokens IS NULL
         OR capacity IS NULL
         OR refill_per_ms IS NULL
         OR last_refill_at IS NULL
    `)
    await pool
      .query(`ALTER TABLE nw_rate_limits ALTER COLUMN tokens SET NOT NULL`)
      .catch(() => undefined)
    await pool
      .query(`ALTER TABLE nw_rate_limits ALTER COLUMN capacity SET NOT NULL`)
      .catch(() => undefined)
    await pool
      .query(`ALTER TABLE nw_rate_limits ALTER COLUMN refill_per_ms SET NOT NULL`)
      .catch(() => undefined)
    await pool
      .query(`ALTER TABLE nw_rate_limits ALTER COLUMN last_refill_at SET NOT NULL`)
      .catch(() => undefined)
    // Soften / drop legacy fixed-window columns so INSERTs no longer need them.
    await pool
      .query(`ALTER TABLE nw_rate_limits ALTER COLUMN count DROP NOT NULL`)
      .catch(() => undefined)
    await pool
      .query(`ALTER TABLE nw_rate_limits ALTER COLUMN reset_at DROP NOT NULL`)
      .catch(() => undefined)
    await pool.query(`DROP INDEX IF EXISTS nw_rate_limits_reset_idx`)
    await pool.query(`ALTER TABLE nw_rate_limits DROP COLUMN IF EXISTS count`)
    await pool.query(`ALTER TABLE nw_rate_limits DROP COLUMN IF EXISTS reset_at`)
    await pool.query(
      `CREATE INDEX IF NOT EXISTS nw_rate_limits_refill_idx ON nw_rate_limits(last_refill_at)`,
    )
  })
}

function refillMemoryBucket(
  bucket: Bucket,
  capacity: number,
  refillPerMs: number,
  now: number,
): number {
  const elapsedMs = Math.max(0, now - bucket.lastRefillAt)
  return Math.min(capacity, bucket.tokens + elapsedMs * refillPerMs)
}

function memoryRateLimit(opts: RateLimitOptions): RateLimitResult {
  const key = `${opts.prefix}:${opts.id}`
  const now = Date.now()
  const refillPerMs = opts.max / Math.max(1, opts.windowMs)
  const existing = buckets.get(key)
  const available = existing ? refillMemoryBucket(existing, opts.max, refillPerMs, now) : opts.max

  const ok = available >= 1
  const tokens = ok ? available - 1 : available
  buckets.set(key, { tokens, capacity: opts.max, refillPerMs, lastRefillAt: now })

  const deficit = Math.max(0, 1 - tokens)
  const resetAt = now + Math.ceil(deficit / refillPerMs)
  return { ok, remaining: Math.max(0, Math.floor(tokens)), resetAt }
}

export async function rateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  let pool: Queryable | null = null
  try {
    pool = await ensureSchema()
  } catch (error) {
    console.error(
      '[rate-limit] schema setup failed',
      error instanceof Error ? error.message : error,
    )
    pool = null
  }

  if (!pool) {
    // Production: fail closed. In-memory buckets are per-instance and do not
    // rate-limit abuse across serverless isolates.
    if (isProductionRuntime()) {
      throw new Error('Rate limit store unavailable (Postgres required in production).')
    }
    return memoryRateLimit(opts)
  }

  const key = `${opts.prefix}:${opts.id}`
  const capacity = opts.max
  const refillPerMs = opts.max / Math.max(1, opts.windowMs)

  try {
    await pool.query(
      `INSERT INTO nw_rate_limits (key, tokens, capacity, refill_per_ms, last_refill_at)
       VALUES ($1, $2, $2, $3, now())
       ON CONFLICT (key) DO NOTHING`,
      [key, capacity, refillPerMs],
    )

    const result = await pool.query<RateLimitRow>(
      `WITH current AS (
         SELECT tokens, last_refill_at FROM nw_rate_limits WHERE key = $1 FOR UPDATE
       ),
       computed AS (
         SELECT LEAST(
           $2::float8,
           current.tokens + (EXTRACT(EPOCH FROM (now() - current.last_refill_at)) * 1000) * $3::float8
         ) AS available
         FROM current
       )
       UPDATE nw_rate_limits
       SET tokens = CASE WHEN computed.available >= 1 THEN computed.available - 1 ELSE computed.available END,
           capacity = $2,
           refill_per_ms = $3,
           last_refill_at = now()
       FROM computed
       WHERE nw_rate_limits.key = $1
       RETURNING tokens, (computed.available >= 1) AS ok`,
      [key, capacity, refillPerMs],
    )
    const row = result.rows[0]
    if (!row) throw new Error('Rate limit token bucket update returned no row.')
    const tokens = Number(row.tokens)
    const deficit = Math.max(0, 1 - tokens)
    const resetAt = Date.now() + Math.ceil(deficit / refillPerMs)
    return { ok: row.ok, remaining: Math.max(0, Math.floor(tokens)), resetAt }
  } catch (error) {
    console.error(
      '[rate-limit] postgres path failed',
      error instanceof Error ? error.message : error,
    )
    if (isProductionRuntime()) throw error
    return memoryRateLimit(opts)
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
  try {
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
  } catch (error) {
    console.error('[rate-limit] enforce failed', error instanceof Error ? error.message : error)
    if (isProductionRuntime()) {
      return new Response(
        JSON.stringify({
          error: 'सेवा अस्थायी रूपमा उपलब्ध छैन। केही क्षणमा फेरि प्रयास गर्नुहोस्।',
        }),
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Retry-After': '30',
            'cache-control': 'no-store',
          },
        },
      )
    }
    // Local/dev: keep writes available when Postgres is not running.
    return null
  }
}
