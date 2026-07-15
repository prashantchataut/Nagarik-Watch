/**
 * First-party impression / click / share events for Bayesian CTR and bandit
 * exploration. Consent-gated on the client; stored anonymously by article slug.
 */
import 'server-only'
import { ensureOperationalSchema, isProductionRuntime, type Queryable } from '@/lib/ops-db'
import { promises as fs } from 'node:fs'
import path from 'node:path'

export type RankingEventType = 'impression' | 'click' | 'share'

export type RankingEventStat = {
  articleSlug: string
  impressions: number
  clicks: number
  shares: number
}

type LocalEvent = {
  articleSlug: string
  articleCategory: string
  type: RankingEventType
  at: string
}

const SCHEMA_KEY = 'nw-ranking-events-v1'
const LOCAL_FILE = path.resolve(process.cwd(), '.data', 'ranking-events.json')
let localCache: LocalEvent[] | null = null
let localWrite: Promise<void> = Promise.resolve()

async function ensureTable(pool: Queryable): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS nw_ranking_events (
      id BIGSERIAL PRIMARY KEY,
      article_slug TEXT NOT NULL,
      article_category TEXT NOT NULL DEFAULT '',
      event_type TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await pool.query(
    `CREATE INDEX IF NOT EXISTS nw_ranking_events_slug_at_idx
     ON nw_ranking_events (article_slug, created_at DESC)`,
  )
}

async function getPool(): Promise<Queryable | null> {
  return ensureOperationalSchema(SCHEMA_KEY, ensureTable)
}

async function readLocal(): Promise<LocalEvent[]> {
  if (localCache) return localCache
  try {
    const raw = await fs.readFile(LOCAL_FILE, 'utf-8')
    localCache = JSON.parse(raw) as LocalEvent[]
  } catch {
    localCache = []
  }
  return localCache
}

async function writeLocal(events: LocalEvent[]): Promise<void> {
  localWrite = localWrite.then(async () => {
    await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true })
    await fs.writeFile(LOCAL_FILE, JSON.stringify(events.slice(-5000)), 'utf-8')
    localCache = events
  })
  await localWrite
}

export async function recordRankingEvent(input: {
  articleSlug: string
  articleCategory?: string
  type: RankingEventType
}): Promise<void> {
  const slug = input.articleSlug.trim()
  if (!slug) return
  const type = input.type
  if (type !== 'impression' && type !== 'click' && type !== 'share') return

  const pool = await getPool()
  if (pool) {
    await pool.query(
      `INSERT INTO nw_ranking_events (article_slug, article_category, event_type)
       VALUES ($1, $2, $3)`,
      [slug, input.articleCategory?.trim() || '', type],
    )
    return
  }

  if (isProductionRuntime()) {
    console.error('[ranking-events] DATABASE_URL missing; event dropped')
    return
  }

  const events = await readLocal()
  events.push({
    articleSlug: slug,
    articleCategory: input.articleCategory?.trim() || '',
    type,
    at: new Date().toISOString(),
  })
  await writeLocal(events)
}

export async function getRankingEventStats(windowMinutes = 120): Promise<RankingEventStat[]> {
  const cutoff = new Date(Date.now() - Math.max(15, windowMinutes) * 60_000)
  const pool = await getPool()
  if (pool) {
    const result = await pool.query<{
      article_slug: string
      impressions: string | number
      clicks: string | number
      shares: string | number
    }>(
      `SELECT article_slug,
              COUNT(*) FILTER (WHERE event_type = 'impression')::int AS impressions,
              COUNT(*) FILTER (WHERE event_type = 'click')::int AS clicks,
              COUNT(*) FILTER (WHERE event_type = 'share')::int AS shares
       FROM nw_ranking_events
       WHERE created_at >= $1
       GROUP BY article_slug`,
      [cutoff.toISOString()],
    )
    return result.rows.map((row) => ({
      articleSlug: row.article_slug,
      impressions: Number(row.impressions ?? 0),
      clicks: Number(row.clicks ?? 0),
      shares: Number(row.shares ?? 0),
    }))
  }

  const events = (await readLocal()).filter((e) => Date.parse(e.at) >= cutoff.getTime())
  const map = new Map<string, RankingEventStat>()
  for (const event of events) {
    const current = map.get(event.articleSlug) ?? {
      articleSlug: event.articleSlug,
      impressions: 0,
      clicks: 0,
      shares: 0,
    }
    if (event.type === 'impression') current.impressions += 1
    if (event.type === 'click') current.clicks += 1
    if (event.type === 'share') current.shares += 1
    map.set(event.articleSlug, current)
  }
  return Array.from(map.values())
}
