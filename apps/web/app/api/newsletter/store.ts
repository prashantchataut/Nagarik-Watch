/**
 * Newsletter subscriber store.
 *
 * Production contract:
 *   - DATABASE_URL present: pending + confirmed subscribers are stored in a
 *     Postgres table (`nw_newsletter_subscribers`) so double opt-in survives
 *     restarts, deployments, and serverless instance changes.
 *   - DATABASE_URL absent: process-local maps are used for preview/dev only.
 *
 * The route handlers call functions from this module rather than touching maps
 * directly, so the persistence strategy stays centralized.
 */
import 'server-only'

type PendingSubscriber = { email: string; token: string; createdAt: number }

type Queryable = {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<{ rows: T[]; rowCount: number | null }>
}

type SubscriberRow = {
  email: string
  token: string | null
  status: 'pending' | 'confirmed'
  created_at: Date | string
  confirmed_at: Date | string | null
}

type SubscriberStore = {
  pendingSubscribers: Map<string, PendingSubscriber>
  confirmedSubscribers: Set<string>
}

let cached: SubscriberStore | null = null
let poolPromise: Promise<Queryable | null> | null = null
let schemaReady: Promise<void> | null = null

export function newsletterStorageMode(): 'postgres' | 'memory' {
  return process.env.DATABASE_URL?.startsWith('postgres') ? 'postgres' : 'memory'
}

export function getSubscriberStore(): SubscriberStore {
  if (!cached) cached = { pendingSubscribers: new Map(), confirmedSubscribers: new Set() }
  return cached
}

async function getPool(): Promise<Queryable | null> {
  if (newsletterStorageMode() !== 'postgres') return null
  if (!poolPromise) {
    poolPromise = (async () => {
      const { Pool } = await import('pg')
      return new Pool({
        connectionString: process.env.DATABASE_URL,
        max: Number(process.env.NEWSLETTER_DB_POOL_MAX ?? 3),
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
      }) as Queryable
    })()
  }
  return poolPromise
}

async function ensureSchema(): Promise<Queryable | null> {
  const pool = await getPool()
  if (!pool) return null
  if (!schemaReady) {
    schemaReady = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS nw_newsletter_subscribers (
          email text PRIMARY KEY,
          token text UNIQUE,
          status text NOT NULL DEFAULT 'pending',
          created_at timestamptz NOT NULL DEFAULT now(),
          confirmed_at timestamptz
        )
      `)
      await pool.query(`CREATE INDEX IF NOT EXISTS nw_newsletter_status_idx ON nw_newsletter_subscribers(status, created_at DESC)`)
    })()
  }
  await schemaReady
  return pool
}

export async function isConfirmedSubscriber(email: string): Promise<boolean> {
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<SubscriberRow>(
      `SELECT email FROM nw_newsletter_subscribers WHERE email = $1 AND status = 'confirmed' LIMIT 1`,
      [email],
    )
    return result.rows.length > 0
  }
  return getSubscriberStore().confirmedSubscribers.has(email)
}

export async function addPendingSubscriber(email: string, token: string): Promise<void> {
  const pool = await ensureSchema()
  if (pool) {
    await pool.query(
      `INSERT INTO nw_newsletter_subscribers (email, token, status, created_at, confirmed_at)
       VALUES ($1,$2,'pending',now(),NULL)
       ON CONFLICT (email) DO UPDATE SET token = EXCLUDED.token, status = 'pending', created_at = now(), confirmed_at = NULL`,
      [email, token],
    )
    return
  }
  getSubscriberStore().pendingSubscribers.set(token, { email, token, createdAt: Date.now() })
}

export async function removePendingSubscriber(token: string): Promise<void> {
  const pool = await ensureSchema()
  if (pool) {
    await pool.query(`UPDATE nw_newsletter_subscribers SET token = NULL WHERE token = $1 AND status = 'pending'`, [token])
    return
  }
  getSubscriberStore().pendingSubscribers.delete(token)
}

export async function getPendingSubscriber(token: string): Promise<PendingSubscriber | null> {
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<SubscriberRow>(
      `SELECT email, token, status, created_at, confirmed_at
       FROM nw_newsletter_subscribers
       WHERE token = $1 AND status = 'pending'
       LIMIT 1`,
      [token],
    )
    const row = result.rows[0]
    if (!row?.token) return null
    const createdAt = row.created_at instanceof Date ? row.created_at.getTime() : Date.parse(row.created_at)
    return { email: row.email, token: row.token, createdAt }
  }
  return getSubscriberStore().pendingSubscribers.get(token) ?? null
}

export async function confirmSubscriber(token: string): Promise<PendingSubscriber | null> {
  const pending = await getPendingSubscriber(token)
  if (!pending) return null
  const pool = await ensureSchema()
  if (pool) {
    await pool.query(
      `UPDATE nw_newsletter_subscribers
       SET status = 'confirmed', confirmed_at = now(), token = NULL
       WHERE token = $1 AND status = 'pending'`,
      [token],
    )
    return pending
  }
  const store = getSubscriberStore()
  store.confirmedSubscribers.add(pending.email)
  store.pendingSubscribers.delete(token)
  return pending
}
