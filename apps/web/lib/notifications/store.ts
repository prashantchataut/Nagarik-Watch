import 'server-only'
import { randomUUID } from 'node:crypto'
import { ensureOperationalSchema, type Queryable, toIso } from '@/lib/ops-db'

export type NotificationEvent = {
  id: string
  articleId: string
  articleSlug: string
  categorySlug: string
  titleNe: string
  titleEn?: string
  authorSlugs: string[]
  tagSlugs: string[]
  isBreaking: boolean
  notificationMode: 'none' | 'followers' | 'breaking'
  notificationTagSlugs: string[]
  publishedAt: string
  updatedAt: string
}

export type NotificationReceipt = {
  eventId: string
  seenAt?: string
  readAt?: string
  dismissedAt?: string
}

type EventRow = {
  id: string
  article_id: string
  article_slug: string
  category_slug: string
  title_ne: string
  title_en: string | null
  author_slugs: unknown
  tag_slugs: unknown
  is_breaking: boolean
  notification_mode: string
  notification_tag_slugs: unknown
  published_at: Date | string
  updated_at: Date | string
}

type ReceiptRow = {
  event_id: string
  seen_at: Date | string | null
  read_at: Date | string | null
  dismissed_at: Date | string | null
}

const memoryEvents = new Map<string, NotificationEvent>()
const memoryReceipts = new Map<string, NotificationReceipt>()

function cleanList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map(String).map((item) => item.trim().toLowerCase()).filter(Boolean))].slice(0, 50)
}

function ownerKey(fingerprint: string, userId?: string) {
  return userId ? `user:${userId}` : `anon:${fingerprint}`
}

async function setup(pool: Queryable) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS nw_notification_events (
      id text PRIMARY KEY,
      article_id text NOT NULL,
      article_slug text NOT NULL,
      category_slug text NOT NULL,
      title_ne text NOT NULL,
      title_en text,
      author_slugs jsonb NOT NULL DEFAULT '[]'::jsonb,
      tag_slugs jsonb NOT NULL DEFAULT '[]'::jsonb,
      is_breaking boolean NOT NULL DEFAULT false,
      notification_mode text NOT NULL DEFAULT 'none',
      notification_tag_slugs jsonb NOT NULL DEFAULT '[]'::jsonb,
      published_at timestamptz NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(article_id, published_at)
    );
    ALTER TABLE nw_notification_events ADD COLUMN IF NOT EXISTS notification_mode text NOT NULL DEFAULT 'none';
    ALTER TABLE nw_notification_events ADD COLUMN IF NOT EXISTS notification_tag_slugs jsonb NOT NULL DEFAULT '[]'::jsonb;
    CREATE INDEX IF NOT EXISTS nw_notification_events_recent_idx
      ON nw_notification_events(published_at DESC);
    CREATE TABLE IF NOT EXISTS nw_notification_receipts (
      owner_key text NOT NULL,
      event_id text NOT NULL REFERENCES nw_notification_events(id) ON DELETE CASCADE,
      seen_at timestamptz,
      read_at timestamptz,
      dismissed_at timestamptz,
      PRIMARY KEY(owner_key,event_id)
    );
    CREATE INDEX IF NOT EXISTS nw_notification_receipts_owner_seen_idx
      ON nw_notification_receipts(owner_key,seen_at DESC);
  `)
}

function rowToEvent(row: EventRow): NotificationEvent {
  return {
    id: row.id,
    articleId: row.article_id,
    articleSlug: row.article_slug,
    categorySlug: row.category_slug,
    titleNe: row.title_ne,
    titleEn: row.title_en ?? undefined,
    authorSlugs: cleanList(row.author_slugs),
    tagSlugs: cleanList(row.tag_slugs),
    isBreaking: row.is_breaking,
    notificationMode: row.notification_mode === 'breaking' || row.notification_mode === 'followers' ? row.notification_mode : 'none',
    notificationTagSlugs: cleanList(row.notification_tag_slugs),
    publishedAt: toIso(row.published_at),
    updatedAt: toIso(row.updated_at),
  }
}

export async function recordNotificationEvent(
  input: Omit<NotificationEvent, 'id' | 'updatedAt'> & { id?: string },
): Promise<NotificationEvent> {
  const event: NotificationEvent = {
    ...input,
    id: input.id || randomUUID(),
    articleId: String(input.articleId).slice(0, 160),
    articleSlug: String(input.articleSlug).slice(0, 160),
    categorySlug: String(input.categorySlug).slice(0, 120),
    titleNe: String(input.titleNe).trim().slice(0, 240),
    titleEn: input.titleEn?.trim().slice(0, 240) || undefined,
    authorSlugs: cleanList(input.authorSlugs),
    tagSlugs: cleanList(input.tagSlugs),
    notificationMode: input.notificationMode === 'breaking' || input.notificationMode === 'followers' ? input.notificationMode : 'none',
    notificationTagSlugs: cleanList(input.notificationTagSlugs),
    publishedAt: new Date(input.publishedAt).toISOString(),
    updatedAt: new Date().toISOString(),
  }
  const pool = await ensureOperationalSchema('notification-events-v1', setup)
  if (pool) {
    const result = await pool.query<EventRow>(
      `INSERT INTO nw_notification_events(
        id,article_id,article_slug,category_slug,title_ne,title_en,author_slugs,
        tag_slugs,is_breaking,notification_mode,notification_tag_slugs,published_at,updated_at
      ) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,$11::jsonb,$12,now())
      ON CONFLICT(article_id,published_at) DO UPDATE SET
        article_slug=excluded.article_slug,category_slug=excluded.category_slug,
        title_ne=excluded.title_ne,title_en=excluded.title_en,
        author_slugs=excluded.author_slugs,tag_slugs=excluded.tag_slugs,
        is_breaking=excluded.is_breaking,notification_mode=excluded.notification_mode,
        notification_tag_slugs=excluded.notification_tag_slugs,updated_at=now()
      RETURNING *`,
      [
        event.id,event.articleId,event.articleSlug,event.categorySlug,event.titleNe,event.titleEn ?? null,
        JSON.stringify(event.authorSlugs),JSON.stringify(event.tagSlugs),event.isBreaking,event.notificationMode,
        JSON.stringify(event.notificationTagSlugs),event.publishedAt,
      ],
    )
    return rowToEvent(result.rows[0]!)
  }
  const key = `${event.articleId}:${event.publishedAt}`
  const existing = [...memoryEvents.values()].find((item) => `${item.articleId}:${item.publishedAt}` === key)
  if (existing) {
    const updated = { ...existing, ...event, id: existing.id }
    memoryEvents.set(existing.id, updated)
    return updated
  }
  memoryEvents.set(event.id, event)
  return event
}

export async function listNotificationEvents(limit = 50, days = 7): Promise<NotificationEvent[]> {
  const safeLimit = Math.max(1, Math.min(limit, 200))
  const cutoff = new Date(Date.now() - Math.max(1, Math.min(days, 30)) * 86_400_000).toISOString()
  const pool = await ensureOperationalSchema('notification-events-v1', setup)
  if (pool) {
    const result = await pool.query<EventRow>(
      `SELECT * FROM nw_notification_events WHERE published_at >= $1 ORDER BY is_breaking DESC,published_at DESC LIMIT $2`,
      [cutoff, safeLimit],
    )
    return result.rows.map(rowToEvent)
  }
  return [...memoryEvents.values()]
    .filter((event) => event.publishedAt >= cutoff)
    .sort((a, b) => Number(b.isBreaking) - Number(a.isBreaking) || b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, safeLimit)
}

export async function getNotificationReceipts(
  fingerprint: string,
  userId?: string,
): Promise<Map<string, NotificationReceipt>> {
  const owner = ownerKey(fingerprint, userId)
  const pool = await ensureOperationalSchema('notification-events-v1', setup)
  if (pool) {
    const result = await pool.query<ReceiptRow>(
      `SELECT event_id,seen_at,read_at,dismissed_at FROM nw_notification_receipts WHERE owner_key=$1`,
      [owner],
    )
    return new Map(result.rows.map((row) => [row.event_id, {
      eventId: row.event_id,
      seenAt: row.seen_at ? toIso(row.seen_at) : undefined,
      readAt: row.read_at ? toIso(row.read_at) : undefined,
      dismissedAt: row.dismissed_at ? toIso(row.dismissed_at) : undefined,
    }]))
  }
  const prefix = `${owner}:`
  return new Map([...memoryReceipts.entries()].filter(([key]) => key.startsWith(prefix)).map(([, value]) => [value.eventId, value]))
}

export async function updateNotificationReceipts(
  fingerprint: string,
  userId: string | undefined,
  eventIds: string[],
  action: 'seen' | 'read' | 'dismiss',
): Promise<void> {
  const ids = [...new Set(eventIds.map(String).filter(Boolean))].slice(0, 100)
  if (!ids.length) return
  const owner = ownerKey(fingerprint, userId)
  const pool = await ensureOperationalSchema('notification-events-v1', setup)
  if (pool) {
    for (const eventId of ids) {
      await pool.query(
        `INSERT INTO nw_notification_receipts(owner_key,event_id,seen_at,read_at,dismissed_at)
         VALUES($1,$2,CASE WHEN $3='seen' THEN now() ELSE NULL END,
                      CASE WHEN $3='read' THEN now() ELSE NULL END,
                      CASE WHEN $3='dismiss' THEN now() ELSE NULL END)
         ON CONFLICT(owner_key,event_id) DO UPDATE SET
           seen_at=CASE WHEN $3='seen' THEN COALESCE(nw_notification_receipts.seen_at,now()) ELSE nw_notification_receipts.seen_at END,
           read_at=CASE WHEN $3='read' THEN now() ELSE nw_notification_receipts.read_at END,
           dismissed_at=CASE WHEN $3='dismiss' THEN now() ELSE nw_notification_receipts.dismissed_at END`,
        [owner, eventId, action],
      )
    }
    return
  }
  for (const eventId of ids) {
    const key = `${owner}:${eventId}`
    const current = memoryReceipts.get(key) ?? { eventId }
    const now = new Date().toISOString()
    memoryReceipts.set(key, {
      ...current,
      seenAt: action === 'seen' ? current.seenAt ?? now : current.seenAt,
      readAt: action === 'read' ? now : current.readAt,
      dismissedAt: action === 'dismiss' ? now : current.dismissedAt,
    })
  }
}
