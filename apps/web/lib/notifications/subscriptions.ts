import 'server-only'
import { createHash, randomUUID } from 'node:crypto'
import { ensureOperationalSchema, type Queryable, toIso } from '@/lib/ops-db'
import { getReaderPreferences } from '@/lib/reader/preferences-store'
import { scoreNotification, type NotificationKind, type NotificationPreference } from '@nagarikwatch/db'
import type { NotificationEvent } from '@/lib/notifications/store'

export type PushSubscriptionInput = {
  endpoint: string
  expirationTime?: number | null
  keys: { p256dh: string; auth: string }
}

export type StoredPushSubscription = {
  id: string
  fingerprint: string
  userId?: string
  locale: 'ne' | 'en'
  endpoint: string
  expirationTime?: number
  p256dh: string
  auth: string
  active: boolean
  createdAt: string
  updatedAt: string
}

type SubscriptionRow = {
  id: string
  fingerprint: string
  user_id: string | null
  locale: string
  endpoint: string
  expiration_time: number | null
  p256dh: string
  auth: string
  active: boolean
  created_at: Date | string
  updated_at: Date | string
}

const memory = new Map<string, StoredPushSubscription>()
const memoryDeliveries = new Map<string, { status: 'sent' | 'failed'; attempts: number; attemptedAt: string }>()

function endpointHash(endpoint: string) {
  return createHash('sha256').update(endpoint).digest('hex')
}

async function setup(pool: Queryable) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS nw_push_subscriptions (
      id text PRIMARY KEY,
      endpoint_hash text NOT NULL UNIQUE,
      fingerprint text NOT NULL DEFAULT '',
      user_id text,
      locale text NOT NULL DEFAULT 'ne',
      endpoint text NOT NULL,
      expiration_time bigint,
      p256dh text NOT NULL,
      auth text NOT NULL,
      active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS nw_push_subscriptions_active_idx
      ON nw_push_subscriptions(active,updated_at DESC);
    CREATE TABLE IF NOT EXISTS nw_push_deliveries (
      event_id text NOT NULL,
      subscription_id text NOT NULL REFERENCES nw_push_subscriptions(id) ON DELETE CASCADE,
      status text NOT NULL,
      attempts integer NOT NULL DEFAULT 1,
      attempted_at timestamptz NOT NULL DEFAULT now(),
      error text,
      PRIMARY KEY(event_id,subscription_id)
    );
    ALTER TABLE nw_push_deliveries ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 1;
  `)
}

function rowToSubscription(row: SubscriptionRow): StoredPushSubscription {
  return {
    id: row.id,
    fingerprint: row.fingerprint,
    userId: row.user_id ?? undefined,
    locale: row.locale === 'en' ? 'en' : 'ne',
    endpoint: row.endpoint,
    expirationTime: row.expiration_time ?? undefined,
    p256dh: row.p256dh,
    auth: row.auth,
    active: row.active,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  }
}

function cleanSubscription(input: PushSubscriptionInput): PushSubscriptionInput {
  const endpoint = String(input.endpoint ?? '').trim()
  if (!endpoint.startsWith('https://') || endpoint.length > 2048) throw new Error('Invalid push endpoint.')
  const p256dh = String(input.keys?.p256dh ?? '').trim()
  const auth = String(input.keys?.auth ?? '').trim()
  if (!p256dh || !auth || p256dh.length > 512 || auth.length > 256) throw new Error('Invalid push keys.')
  const expirationTime = input.expirationTime == null ? null : Number(input.expirationTime)
  return {
    endpoint,
    expirationTime: Number.isFinite(expirationTime) ? expirationTime : null,
    keys: { p256dh, auth },
  }
}

export async function savePushSubscription(input: {
  fingerprint: string
  userId?: string
  locale: 'ne' | 'en'
  subscription: PushSubscriptionInput
}): Promise<StoredPushSubscription> {
  const subscription = cleanSubscription(input.subscription)
  const hash = endpointHash(subscription.endpoint)
  const pool = await ensureOperationalSchema('push-subscriptions-v1', setup)
  if (pool) {
    const result = await pool.query<SubscriptionRow>(
      `INSERT INTO nw_push_subscriptions(
        id,endpoint_hash,fingerprint,user_id,locale,endpoint,expiration_time,p256dh,auth,active,updated_at
      ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,true,now())
      ON CONFLICT(endpoint_hash) DO UPDATE SET
        fingerprint=excluded.fingerprint,user_id=excluded.user_id,locale=excluded.locale,
        endpoint=excluded.endpoint,expiration_time=excluded.expiration_time,p256dh=excluded.p256dh,
        auth=excluded.auth,active=true,updated_at=now()
      RETURNING *`,
      [randomUUID(),hash,input.fingerprint.slice(0,160),input.userId ?? null,input.locale,subscription.endpoint,
        subscription.expirationTime ?? null,subscription.keys.p256dh,subscription.keys.auth],
    )
    return rowToSubscription(result.rows[0]!)
  }
  const existing = [...memory.values()].find((item) => endpointHash(item.endpoint) === hash)
  const now = new Date().toISOString()
  const stored: StoredPushSubscription = {
    id: existing?.id ?? randomUUID(), fingerprint: input.fingerprint.slice(0,160), userId: input.userId,
    locale: input.locale, endpoint: subscription.endpoint, expirationTime: subscription.expirationTime ?? undefined,
    p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, active: true,
    createdAt: existing?.createdAt ?? now, updatedAt: now,
  }
  memory.set(stored.id, stored)
  return stored
}

export async function disablePushSubscription(endpoint: string, fingerprint: string, userId?: string): Promise<void> {
  const hash = endpointHash(endpoint.trim())
  const pool = await ensureOperationalSchema('push-subscriptions-v1', setup)
  if (pool) {
    await pool.query(
      `UPDATE nw_push_subscriptions SET active=false,updated_at=now()
       WHERE endpoint_hash=$1 AND (user_id=$2 OR (user_id IS NULL AND fingerprint=$3))`,
      [hash,userId ?? null,fingerprint.slice(0,160)],
    )
    return
  }
  for (const [id,item] of memory) {
    if (endpointHash(item.endpoint) === hash && (item.userId === userId || (!item.userId && item.fingerprint === fingerprint))) {
      memory.set(id, { ...item, active: false, updatedAt: new Date().toISOString() })
    }
  }
}

export async function listActivePushSubscriptions(limit = 500): Promise<StoredPushSubscription[]> {
  const safeLimit = Math.max(1, Math.min(limit, 2000))
  const pool = await ensureOperationalSchema('push-subscriptions-v1', setup)
  if (pool) {
    const result = await pool.query<SubscriptionRow>(
      `SELECT * FROM nw_push_subscriptions WHERE active=true ORDER BY updated_at DESC LIMIT $1`,
      [safeLimit],
    )
    return result.rows.map(rowToSubscription)
  }
  return [...memory.values()].filter((item) => item.active).slice(0,safeLimit)
}

function eventKind(
  event: NotificationEvent,
  preferences: Awaited<ReturnType<typeof getReaderPreferences>>,
): NotificationKind | null {
  if (event.notificationMode === 'none') return null
  if (event.notificationMode === 'breaking' && event.isBreaking && preferences.breaking) return 'breaking'
  if (preferences.followedAuthors && event.authorSlugs.some((slug) => preferences.authors.includes(slug))) {
    return 'followed_author'
  }
  const audienceTags = event.notificationTagSlugs.length ? event.notificationTagSlugs : event.tagSlugs
  if (preferences.followedTopics && (
    preferences.categories.includes(event.categorySlug) ||
    audienceTags.some((slug) => preferences.tags.includes(slug))
  )) return 'followed_topic'
  return null
}

function inQuietHours(start: number | null, end: number | null, timeZone: string, now = new Date()) {
  if (start == null || end == null || start === end) return false
  let hour = now.getUTCHours()
  try {
    const value = new Intl.DateTimeFormat('en-US', { timeZone, hour: '2-digit', hourCycle: 'h23' }).format(now)
    const parsed = Number.parseInt(value, 10)
    if (Number.isFinite(parsed)) hour = parsed
  } catch {}
  return start < end ? hour >= start && hour < end : hour >= start || hour < end
}

async function deliveryState(eventId: string, subscriptionId: string) {
  const key = `${eventId}:${subscriptionId}`
  const pool = await ensureOperationalSchema('push-subscriptions-v1', setup)
  if (pool) {
    const result = await pool.query<{ status: string; attempts: number }>(
      `SELECT status,attempts FROM nw_push_deliveries WHERE event_id=$1 AND subscription_id=$2`,
      [eventId,subscriptionId],
    )
    const row = result.rows[0]
    return row ? { status: row.status, attempts: Number(row.attempts ?? 0) } : null
  }
  return memoryDeliveries.get(key) ?? null
}

async function recordDelivery(eventId: string, subscriptionId: string, status: 'sent' | 'failed', error?: string) {
  const pool = await ensureOperationalSchema('push-subscriptions-v1', setup)
  if (pool) {
    await pool.query(
      `INSERT INTO nw_push_deliveries(event_id,subscription_id,status,attempts,error,attempted_at)
       VALUES($1,$2,$3,1,$4,now())
       ON CONFLICT(event_id,subscription_id) DO UPDATE SET
         status=excluded.status,attempts=nw_push_deliveries.attempts+1,error=excluded.error,attempted_at=now()`,
      [eventId,subscriptionId,status,error?.slice(0,500) ?? null],
    )
    return
  }
  const key = `${eventId}:${subscriptionId}`
  const current = memoryDeliveries.get(key)
  memoryDeliveries.set(key, { status, attempts: (current?.attempts ?? 0) + 1, attemptedAt: new Date().toISOString() })
}


async function deliveryWindow(subscriptionId: string) {
  const pool = await ensureOperationalSchema('push-subscriptions-v1', setup)
  if (pool) {
    const result = await pool.query<{ sent24h: string; last_sent_at: Date | string | null }>(
      `SELECT count(*) FILTER (WHERE status='sent' AND attempted_at > now() - interval '24 hours')::text AS "sent24h",
              max(attempted_at) FILTER (WHERE status='sent') AS last_sent_at
       FROM nw_push_deliveries WHERE subscription_id=$1`,
      [subscriptionId],
    )
    const row = result.rows[0]
    return {
      userId: subscriptionId,
      sent24h: Number(row?.sent24h ?? 0),
      lastSentAt: row?.last_sent_at ? toIso(row.last_sent_at) : undefined,
    }
  }
  const sent = [...memoryDeliveries.entries()]
    .filter(([key, value]) => key.endsWith(`:${subscriptionId}`) && value.status === 'sent')
    .map(([, value]) => value)
    .sort((a, b) => b.attemptedAt.localeCompare(a.attemptedAt))
  const cutoff = Date.now() - 86_400_000
  return {
    userId: subscriptionId,
    sent24h: sent.filter((item) => Date.parse(item.attemptedAt) > cutoff).length,
    lastSentAt: sent[0]?.attemptedAt,
  }
}

export async function deliverPushEvent(event: NotificationEvent): Promise<{ configured: boolean; eligible: number; sent: number; failed: number }> {
  const providerUrl = process.env.WEB_PUSH_PROVIDER_URL?.trim()
  const providerKey = process.env.WEB_PUSH_PROVIDER_API_KEY?.trim()
  if (!providerUrl || !providerKey) return { configured: false, eligible: 0, sent: 0, failed: 0 }
  let provider: URL
  try {
    provider = new URL(providerUrl)
    if (provider.protocol !== 'https:') throw new Error('Push provider must use HTTPS.')
  } catch {
    return { configured: false, eligible: 0, sent: 0, failed: 0 }
  }
  const subscriptions = await listActivePushSubscriptions()
  let eligible = 0, sent = 0, failed = 0
  for (const subscription of subscriptions) {
    const previous = await deliveryState(event.id, subscription.id)
    if (previous?.status === 'sent' || (previous?.attempts ?? 0) >= 5) continue
    const preferences = await getReaderPreferences(subscription.fingerprint, subscription.userId)
    const kind = eventKind(event, preferences)
    const quiet = inQuietHours(preferences.quietStart, preferences.quietEnd, preferences.timeZone)
    const urgentBreaking = kind === 'breaking'
    if (!preferences.browserAlerts || !kind || (quiet && !urgentBreaking)) continue
    const notificationPreference: NotificationPreference = {
      userId: subscription.userId ?? subscription.fingerprint,
      breaking: preferences.breaking,
      followedTopics: preferences.followedTopics,
      followedAuthors: preferences.followedAuthors,
      dailyDigest: preferences.dailyDigest,
      marketing: false,
      channels: { push: true, email: false, sms: false },
    }
    const scored = scoreNotification({
      userId: notificationPreference.userId,
      kind,
      articleId: event.articleId,
      topicSlug: kind === 'followed_topic' ? event.categorySlug : undefined,
      authorSlug: kind === 'followed_author'
        ? event.authorSlugs.find((slug) => preferences.authors.includes(slug))
        : undefined,
      at: event.publishedAt,
    }, notificationPreference, await deliveryWindow(subscription.id), {
      maxPerDay: 8,
      breakingCooldownMinutes: 15,
      topicCooldownMinutes: 45,
    })
    if (!scored.willSend) continue
    eligible += 1
    const title = event.isBreaking
      ? subscription.locale === 'en' ? 'Nagarik Watch breaking' : 'नागरिक वाच ब्रेकिङ'
      : subscription.locale === 'en' ? 'From your Nagarik Watch desk' : 'तपाईंको नागरिक वाच डेस्कबाट'
    const body = subscription.locale === 'en' && event.titleEn ? event.titleEn : event.titleNe
    const url = `${subscription.locale === 'en' ? '/en' : ''}/${event.categorySlug}/${event.articleSlug}`
    try {
      const response = await fetch(provider, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${providerKey}` },
        body: JSON.stringify({
          subscription: { endpoint: subscription.endpoint, expirationTime: subscription.expirationTime ?? null, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
          notification: { title, body, url, tag: event.id, icon: '/apple-icon.png', badge: '/apple-icon.png' },
          metadata: { eventId: event.id, articleId: event.articleId },
        }),
      })
      if (!response.ok) throw new Error(`Provider returned ${response.status}`)
      await recordDelivery(event.id, subscription.id, 'sent')
      sent += 1
    } catch (error) {
      await recordDelivery(event.id, subscription.id, 'failed', error instanceof Error ? error.message : String(error))
      failed += 1
    }
  }
  return { configured: true, eligible, sent, failed }
}
