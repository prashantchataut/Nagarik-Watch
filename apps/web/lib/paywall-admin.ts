import 'server-only'
import { cleanText, ensureOperationalSchema, toIso, type Queryable } from '@/lib/ops-db'

export type SubscriptionStatus = 'active' | 'trialing' | 'expired' | 'comped'

export type ManualSubscription = {
  email: string
  status: SubscriptionStatus
  plan: string
  note?: string
  expiresAt?: string
  updatedAt: string
}

type Row = {
  email: string
  status: SubscriptionStatus
  plan: string
  note: string | null
  expires_at: Date | string | null
  updated_at: Date | string
}

const memory = new Map<string, ManualSubscription>()

async function ensureSchema(): Promise<Queryable | null> {
  return ensureOperationalSchema('paywall-admin', async (pool) => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nw_manual_subscriptions (
        email text PRIMARY KEY,
        status text NOT NULL DEFAULT 'active',
        plan text NOT NULL DEFAULT 'manual',
        note text,
        expires_at timestamptz,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `)
  })
}

function rowToSubscription(row: Row): ManualSubscription {
  return {
    email: row.email,
    status: row.status,
    plan: row.plan,
    note: row.note ?? undefined,
    expiresAt: row.expires_at ? toIso(row.expires_at) : undefined,
    updatedAt: toIso(row.updated_at),
  }
}

export async function listManualSubscriptions(): Promise<ManualSubscription[]> {
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<Row>(`SELECT * FROM nw_manual_subscriptions ORDER BY updated_at DESC LIMIT 500`)
    return result.rows.map(rowToSubscription)
  }
  return Array.from(memory.values()).sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))
}

export async function setManualSubscription(input: {
  email: unknown
  status?: unknown
  plan?: unknown
  note?: unknown
  expiresAt?: unknown
}): Promise<ManualSubscription | null> {
  const email = cleanText(input.email, 200).toLowerCase()
  if (!email.includes('@')) return null
  const status = input.status === 'expired' || input.status === 'trialing' || input.status === 'comped' ? input.status : 'active'
  const plan = cleanText(input.plan || 'manual', 80)
  const note = cleanText(input.note, 500) || undefined
  const expiresAtRaw = cleanText(input.expiresAt, 40)
  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw).toISOString() : undefined
  const subscription: ManualSubscription = {
    email,
    status,
    plan,
    note,
    expiresAt,
    updatedAt: new Date().toISOString(),
  }
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<Row>(
      `INSERT INTO nw_manual_subscriptions (email, status, plan, note, expires_at)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (email) DO UPDATE SET status = EXCLUDED.status, plan = EXCLUDED.plan, note = EXCLUDED.note, expires_at = EXCLUDED.expires_at, updated_at = now()
       RETURNING *`,
      [subscription.email, subscription.status, subscription.plan, subscription.note ?? null, subscription.expiresAt ?? null],
    )
    return rowToSubscription(result.rows[0]!)
  }
  memory.set(email, subscription)
  return subscription
}

export async function isManualSubscriberEmail(email: string): Promise<boolean> {
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<Row>(
      `SELECT * FROM nw_manual_subscriptions WHERE email = $1 AND status IN ('active','trialing','comped') AND (expires_at IS NULL OR expires_at > now()) LIMIT 1`,
      [email.toLowerCase()],
    )
    return result.rows.length > 0
  }
  const item = memory.get(email.toLowerCase())
  if (!item) return false
  if (!['active', 'trialing', 'comped'].includes(item.status)) return false
  return !item.expiresAt || new Date(item.expiresAt).getTime() > Date.now()
}
