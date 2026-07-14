import 'server-only'
import { cleanText, ensureOperationalSchema, toIso, type Queryable } from '@/lib/ops-db'

export type NewsletterSubscriberStatus = 'pending' | 'confirmed' | 'unsubscribed'

export type NewsletterSubscriber = {
  email: string
  status: NewsletterSubscriberStatus
  source: string
  createdAt: string
  confirmedAt?: string
}

export type PendingSubscriber = {
  email: string
  token: string
  createdAt: number
}

type SubscriberRow = {
  email: string
  token: string | null
  status: NewsletterSubscriberStatus
  source: string | null
  created_at: Date | string
  confirmed_at: Date | string | null
}

type MemoryState = {
  byEmail: Map<string, NewsletterSubscriber & { token?: string }>
  emailByToken: Map<string, string>
}

const memory: MemoryState = { byEmail: new Map(), emailByToken: new Map() }

async function ensureSchema(): Promise<Queryable | null> {
  return ensureOperationalSchema('newsletter-subscribers-v2', async (pool) => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nw_newsletter_subscribers (
        email text PRIMARY KEY,
        token text UNIQUE,
        status text NOT NULL DEFAULT 'pending',
        source text NOT NULL DEFAULT 'site',
        created_at timestamptz NOT NULL DEFAULT now(),
        confirmed_at timestamptz,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `)
    // Safe forward migration for databases created by the earlier conflicting
    // admin and double-opt-in table definitions.
    await pool.query(`ALTER TABLE nw_newsletter_subscribers ADD COLUMN IF NOT EXISTS token text`)
    await pool.query(`ALTER TABLE nw_newsletter_subscribers ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'site'`)
    await pool.query(`ALTER TABLE nw_newsletter_subscribers ADD COLUMN IF NOT EXISTS confirmed_at timestamptz`)
    await pool.query(`ALTER TABLE nw_newsletter_subscribers ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()`)
    await pool.query(`
      UPDATE nw_newsletter_subscribers
      SET status = 'confirmed',
          confirmed_at = COALESCE(confirmed_at, created_at),
          updated_at = now()
      WHERE status = 'active'
    `)
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS nw_newsletter_token_idx ON nw_newsletter_subscribers(token) WHERE token IS NOT NULL`)
    await pool.query(`CREATE INDEX IF NOT EXISTS nw_newsletter_status_idx ON nw_newsletter_subscribers(status, created_at DESC)`)
  })
}

function rowToSubscriber(row: SubscriberRow): NewsletterSubscriber {
  return {
    email: row.email,
    status: row.status,
    source: row.source ?? 'site',
    createdAt: toIso(row.created_at),
    confirmedAt: row.confirmed_at ? toIso(row.confirmed_at) : undefined,
  }
}

function validEmail(value: unknown): string | null {
  const email = cleanText(value, 200).toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
}

export async function isConfirmedSubscriber(emailValue: string): Promise<boolean> {
  const email = validEmail(emailValue)
  if (!email) return false
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<SubscriberRow>(
      `SELECT email, token, status, source, created_at, confirmed_at
       FROM nw_newsletter_subscribers
       WHERE email = $1 AND status = 'confirmed'
       LIMIT 1`,
      [email],
    )
    return result.rows.length > 0
  }
  return memory.byEmail.get(email)?.status === 'confirmed'
}

export async function addPendingSubscriber(emailValue: string, token: string, source = 'site'): Promise<void> {
  const email = validEmail(emailValue)
  if (!email) throw new Error('Invalid newsletter email.')
  const pool = await ensureSchema()
  if (pool) {
    await pool.query(
      `INSERT INTO nw_newsletter_subscribers
        (email, token, status, source, created_at, confirmed_at, updated_at)
       VALUES ($1,$2,'pending',$3,now(),NULL,now())
       ON CONFLICT (email) DO UPDATE SET
         token = EXCLUDED.token,
         status = 'pending',
         source = EXCLUDED.source,
         created_at = now(),
         confirmed_at = NULL,
         updated_at = now()`,
      [email, token, cleanText(source, 80) || 'site'],
    )
    return
  }

  const previous = memory.byEmail.get(email)
  if (previous?.token) memory.emailByToken.delete(previous.token)
  memory.byEmail.set(email, {
    email,
    token,
    status: 'pending',
    source: cleanText(source, 80) || 'site',
    createdAt: new Date().toISOString(),
  })
  memory.emailByToken.set(token, email)
}

export async function removePendingSubscriber(token: string): Promise<void> {
  const pool = await ensureSchema()
  if (pool) {
    await pool.query(
      `DELETE FROM nw_newsletter_subscribers WHERE token = $1 AND status = 'pending'`,
      [token],
    )
    return
  }
  const email = memory.emailByToken.get(token)
  if (email) memory.byEmail.delete(email)
  memory.emailByToken.delete(token)
}

export async function getPendingSubscriber(token: string): Promise<PendingSubscriber | null> {
  if (!token) return null
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<SubscriberRow>(
      `SELECT email, token, status, source, created_at, confirmed_at
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

  const email = memory.emailByToken.get(token)
  const row = email ? memory.byEmail.get(email) : undefined
  if (!row || row.status !== 'pending') return null
  return { email: row.email, token, createdAt: Date.parse(row.createdAt) }
}

export async function confirmSubscriber(token: string): Promise<PendingSubscriber | null> {
  const pending = await getPendingSubscriber(token)
  if (!pending) return null
  const pool = await ensureSchema()
  if (pool) {
    await pool.query(
      `UPDATE nw_newsletter_subscribers
       SET status = 'confirmed', confirmed_at = now(), token = NULL, updated_at = now()
       WHERE token = $1 AND status = 'pending'`,
      [token],
    )
    return pending
  }

  const existing = memory.byEmail.get(pending.email)
  memory.byEmail.set(pending.email, {
    email: pending.email,
    status: 'confirmed',
    source: existing?.source ?? 'site',
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    confirmedAt: new Date().toISOString(),
  })
  memory.emailByToken.delete(token)
  return pending
}

export async function listNewsletterSubscribers(limit = 500): Promise<NewsletterSubscriber[]> {
  const safeLimit = Math.max(1, Math.min(limit, 2000))
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<SubscriberRow>(
      `SELECT email, token, status, source, created_at, confirmed_at
       FROM nw_newsletter_subscribers
       ORDER BY created_at DESC
       LIMIT $1`,
      [safeLimit],
    )
    return result.rows.map(rowToSubscriber)
  }
  return Array.from(memory.byEmail.values())
    .map(({ token: _token, ...subscriber }) => subscriber)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, safeLimit)
}

export async function upsertConfirmedNewsletterSubscriber(input: {
  email: unknown
  source?: unknown
}): Promise<NewsletterSubscriber | null> {
  const email = validEmail(input.email)
  if (!email) return null
  const source = cleanText(input.source || 'admin', 80) || 'admin'
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<SubscriberRow>(
      `INSERT INTO nw_newsletter_subscribers
        (email, token, status, source, created_at, confirmed_at, updated_at)
       VALUES ($1,NULL,'confirmed',$2,now(),now(),now())
       ON CONFLICT (email) DO UPDATE SET
         token = NULL,
         status = 'confirmed',
         source = EXCLUDED.source,
         confirmed_at = COALESCE(nw_newsletter_subscribers.confirmed_at, now()),
         updated_at = now()
       RETURNING email, token, status, source, created_at, confirmed_at`,
      [email, source],
    )
    return rowToSubscriber(result.rows[0]!)
  }

  const current = memory.byEmail.get(email)
  const subscriber: NewsletterSubscriber = {
    email,
    status: 'confirmed',
    source,
    createdAt: current?.createdAt ?? new Date().toISOString(),
    confirmedAt: current?.confirmedAt ?? new Date().toISOString(),
  }
  memory.byEmail.set(email, subscriber)
  if (current?.token) memory.emailByToken.delete(current.token)
  return subscriber
}
