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

/** Default max is intentionally low for serverless + small Aiven plans. */
function sharedPoolConfig(): PoolConfig | null {
  return postgresPoolConfig({
    // Override per-module max:* callers — one process, one small pool.
    max: Number(process.env.NW_DB_POOL_MAX ?? 3),
    idleTimeoutMillis: Number(process.env.NW_DB_IDLE_TIMEOUT_MS ?? 10_000),
    connectionTimeoutMillis: Number(process.env.NW_DB_CONNECT_TIMEOUT_MS ?? 5_000),
    allowExitOnIdle: true,
  })
}

async function createSharedPool(): Promise<Pool | null> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return null
  if (!resolveDatabaseUrl()) return null

  const config = sharedPoolConfig()
  if (!config) return null

  const { Pool: PgPool } = await import('pg')
  const next = new PgPool(config)

  next.on('error', (error) => {
    console.error('[pg-pool] idle client error', error instanceof Error ? error.message : error)
  })

  // Fail fast if the URL is wrong so we don't leave a half-open pool cached.
  await next.query('SELECT 1')
  return next
}

/**
 * Returns the singleton pool, or null when DATABASE_URL is unset / build-time.
 * Never creates a second pool in this process.
 */
export async function getSharedPool(): Promise<Pool | null> {
  if (pool) return pool
  if (!poolPromise) {
    poolPromise = createSharedPool()
      .then((created) => {
        pool = created
        return created
      })
      .catch((error) => {
        poolPromise = null
        pool = null
        throw error
      })
  }
  try {
    return await poolPromise
  } catch (error) {
    console.error(
      '[pg-pool] could not create shared pool',
      error instanceof Error ? error.message : error,
    )
    return null
  }
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

/** Test / graceful shutdown only — do not call from request handlers. */
export async function closeSharedPool(): Promise<void> {
  const current = pool
  pool = null
  poolPromise = null
  if (current) await current.end().catch(() => undefined)
}
