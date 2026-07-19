import 'server-only'
import { getSharedPoolOrThrow } from '@/lib/pg-pool'

export type PaidEntitlement = {
  email: string
  provider: 'stripe'
  status: string
  plan: string
  customerId: string | null
  subscriptionId: string
  currentPeriodEnd: Date | null
}

const ACTIVE_STATUSES = new Set(['active', 'trialing'])

export async function upsertPaidEntitlement(input: PaidEntitlement): Promise<void> {
  const pool = await getSharedPoolOrThrow()
  await pool.query(
    `INSERT INTO nw_membership_entitlements
       (email, provider, status, plan, customer_id, subscription_id, current_period_end, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, now())
     ON CONFLICT (email) DO UPDATE SET
       provider = EXCLUDED.provider,
       status = EXCLUDED.status,
       plan = EXCLUDED.plan,
       customer_id = EXCLUDED.customer_id,
       subscription_id = EXCLUDED.subscription_id,
       current_period_end = EXCLUDED.current_period_end,
       updated_at = now()`,
    [
      input.email.trim().toLowerCase(),
      input.provider,
      input.status,
      input.plan,
      input.customerId,
      input.subscriptionId,
      input.currentPeriodEnd,
    ],
  )
}

export async function hasProcessedPaymentEvent(eventId: string): Promise<boolean> {
  const pool = await getSharedPoolOrThrow()
  const result = await pool.query('SELECT 1 FROM nw_payment_events WHERE event_id = $1 LIMIT 1', [
    eventId,
  ])
  return result.rows.length > 0
}

export async function recordProcessedPaymentEvent(
  eventId: string,
  eventType: string,
): Promise<void> {
  const pool = await getSharedPoolOrThrow()
  await pool.query(
    `INSERT INTO nw_payment_events (event_id, event_type)
     VALUES ($1, $2)
     ON CONFLICT (event_id) DO NOTHING`,
    [eventId, eventType],
  )
}

export async function isPaidSubscriberEmail(email: string): Promise<boolean> {
  const pool = await getSharedPoolOrThrow()
  const result = await pool.query<{ status: string; current_period_end: Date | null }>(
    `SELECT status, current_period_end
     FROM nw_membership_entitlements
     WHERE email = $1
     LIMIT 1`,
    [email.trim().toLowerCase()],
  )
  const row = result.rows[0]
  if (!row || !ACTIVE_STATUSES.has(row.status)) return false
  return !row.current_period_end || row.current_period_end.getTime() > Date.now()
}
