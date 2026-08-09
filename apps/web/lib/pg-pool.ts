/**
 * Process-wide Postgres pool singleton.
 *
 * Serverless / multi-route apps previously created a separate `pg.Pool` in
 * auth, engagement, ads, submissions, live overrides, and boot provisioning.
 * On Aiven that exhausts slots (error 53300) because each pool opens up to
 * `max` connections and they are never shared.
 *
 * All callers must use `getSharedPool()` / `getSharedPoolOrThrow()`. Never call
 * `pool.end()` for the shared pool in request handlers — release happens via
 * idleTimeout / process exit.
 */
import 'server-only'
import type { Pool, PoolClient, PoolConfig, QueryResult, QueryResultRow } from 'pg'
import { postgresPoolConfig, resolveDatabaseUrl } from '@/lib/db-url'

export type SharedQueryable = {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>>
  connect(): Promise<PoolClient>
  totalCount: number
  idleCount: number
  waitingCount: number
}

let pool: Pool | null = null
let poolPromise: Promise<Pool | null> | null = null
/** After a failed connect, skip pool creation briefly to avoid stampedes. */
let poolCooldownUntil = 0
let lastPoolError: { message: string; code?: string; at: number } | null = null

/** Vercel can run many warm instances; a max of three per instance still exhausted
 *  the production database (Postgres 53300), so each instance holds a single connection. */
export const SHARED_POOL_MAX_PER_INSTANCE = 1

const DEFAULT_CONNECT_TIMEOUT_MS = 2_000
const POOL_FAIL_COOLDOWN_MS = Number(process.env.NW_DB_FAIL_COOLDOWN_MS ?? 30_000)

function sharedPoolConfig(): PoolConfig | null {
  return postgresPoolConfig({
    max: SHARED_POOL_MAX_PER_INSTANCE,
    idleTimeoutMillis: Number(process.env.NW_DB_IDLE_TIMEOUT_MS ?? 10_000),
    connectionTimeoutMillis: Number(
      process.env.NW_DB_CONNECT_TIMEOUT_MS ?? DEFAULT_CONNECT_TIMEOUT_MS,
    ),
    allowExitOnIdle: true,
  })
}

async function createSharedPool(): Promise<Pool | null> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return null
  if (!resolveDatabaseUrl()) return null
  if (Date.now() < poolCooldownUntil) return null

  const config = sharedPoolConfig()
  if (!config) return null

  const { Pool: PgPool } = await import('pg')
  const next = new PgPool(config)

  next.on('error', (error) => {
    console.error('[pg-pool] idle client error', error instanceof Error ? error.message : error)
  })

  try {
    // Fail fast if the URL is wrong or the DB is saturated.
    await next.query('SELECT 1')
  } catch (error) {
    await next.end().catch(() => undefined)
    poolCooldownUntil = Date.now() + POOL_FAIL_COOLDOWN_MS
    lastPoolError = {
      message: error instanceof Error ? error.message : String(error),
      code:
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code?: unknown }).code ?? '') || undefined
          : undefined,
      at: Date.now(),
    }
    console.error(
      '[pg-pool] shared pool probe failed',
      error instanceof Error ? error.message : error,
    )
    return null
  }
  lastPoolError = null
  poolCooldownUntil = 0
  return next
}

/**
 * Returns the singleton pool, or null when DATABASE_URL is unset / build-time /
 * temporarily unavailable. Never creates a second pool in this process.
 * Never throws — callers treat null as "skip Postgres this request".
 */
export async function getSharedPool(): Promise<Pool | null> {
  if (pool) return pool
  if (Date.now() < poolCooldownUntil) return null
  if (!poolPromise) {
    poolPromise = createSharedPool()
      .then((created) => {
        pool = created
        if (!created) {
          poolPromise = null
        }
        return created
      })
      .catch((error) => {
        poolPromise = null
        pool = null
        poolCooldownUntil = Date.now() + POOL_FAIL_COOLDOWN_MS
        lastPoolError = {
          message: error instanceof Error ? error.message : String(error),
          code:
            error && typeof error === 'object' && 'code' in error
              ? String((error as { code?: unknown }).code ?? '') || undefined
              : undefined,
          at: Date.now(),
        }
        console.error(
          '[pg-pool] could not create shared pool',
          error instanceof Error ? error.message : error,
        )
        return null
      })
  }
  return poolPromise
}

export async function getSharedPoolOrThrow(): Promise<Pool> {
  const shared = await getSharedPool()
  if (!shared) {
    throw new Error('DATABASE_URL is required for Postgres in this environment.')
  }
  return shared
}

/**
 * Borrow a client for a multi-statement unit of work, always releasing it.
 * Prefer `pool.query()` for single statements — it auto-checks out/releases.
 */
export async function withSharedClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const shared = await getSharedPoolOrThrow()
  const client = await shared.connect()
  try {
    return await fn(client)
  } finally {
    client.release()
  }
}

export type PoolStats = { totalCount: number; idleCount: number; waitingCount: number; max: number }

export type PoolConnectionState = {
  connected: boolean
  coolingDown: boolean
  cooldownRemainingMs: number
  lastError: { message: string; code?: string; at: number } | null
}

/** Safe operational state for health diagnostics; contains no credentials. */
export function getPoolConnectionState(): PoolConnectionState {
  const remaining = Math.max(0, poolCooldownUntil - Date.now())
  return {
    connected: Boolean(pool),
    coolingDown: remaining > 0,
    cooldownRemainingMs: remaining,
    lastError: lastPoolError,
  }
}

/** Read-only snapshot for ops health reporting; never creates a pool as a side effect. */
export function getPoolStats(): PoolStats | null {
  if (!pool) return null
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
    max: SHARED_POOL_MAX_PER_INSTANCE,
  }
}

/** Test / graceful shutdown only — do not call from request handlers. */
export async function closeSharedPool(): Promise<void> {
  const current = pool
  pool = null
  poolPromise = null
  poolCooldownUntil = 0
  lastPoolError = null
  if (current) await current.end().catch(() => undefined)
}
