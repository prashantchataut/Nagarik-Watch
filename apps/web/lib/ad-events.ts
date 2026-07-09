import 'server-only'
import type { AdMode, AdPlacementKey } from '@/lib/ads'

export type AdEventType = 'impression' | 'click'
export type AdEventSummary = {
  placementKey: string
  impressions: number
  clicks: number
  ctr: number
}

type Queryable = {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<{ rows: T[]; rowCount: number | null }>
}

type SummaryRow = {
  placement_key: string
  impressions: string | number
  clicks: string | number
}

const memory = new Map<string, { impressions: number; clicks: number }>()
let poolPromise: Promise<Queryable | null> | null = null
let schemaReady: Promise<void> | null = null

async function getPool(): Promise<Queryable | null> {
  if (!process.env.DATABASE_URL?.startsWith('postgres')) return null
  if (!poolPromise) {
    poolPromise = (async () => {
      const { Pool } = await import('pg')
      return new Pool({ connectionString: process.env.DATABASE_URL, max: 5 }) as Queryable
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
        CREATE TABLE IF NOT EXISTS nw_ad_events (
          id bigserial PRIMARY KEY,
          placement_key text NOT NULL,
          mode text NOT NULL,
          event text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `)
      await pool.query(
        `CREATE INDEX IF NOT EXISTS nw_ad_events_placement_idx ON nw_ad_events(placement_key, created_at DESC)`,
      )
    })()
  }
  await schemaReady
  return pool
}

export async function recordAdEvent(input: {
  placementKey: AdPlacementKey
  mode: AdMode
  event: AdEventType
}): Promise<void> {
  const pool = await ensureSchema()
  if (pool) {
    await pool.query(
      `INSERT INTO nw_ad_events (placement_key, mode, event) VALUES ($1,$2,$3)`,
      [input.placementKey, input.mode, input.event],
    )
    return
  }
  const current = memory.get(input.placementKey) ?? { impressions: 0, clicks: 0 }
  if (input.event === 'impression') current.impressions += 1
  if (input.event === 'click') current.clicks += 1
  memory.set(input.placementKey, current)
}

export async function getAdEventSummary(): Promise<AdEventSummary[]> {
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<SummaryRow>(`
      SELECT placement_key,
        count(*) FILTER (WHERE event = 'impression') AS impressions,
        count(*) FILTER (WHERE event = 'click') AS clicks
      FROM nw_ad_events
      WHERE created_at > now() - interval '30 days'
      GROUP BY placement_key
      ORDER BY impressions DESC, clicks DESC
    `)
    return result.rows.map((row) => {
      const impressions = Number(row.impressions ?? 0)
      const clicks = Number(row.clicks ?? 0)
      return { placementKey: row.placement_key, impressions, clicks, ctr: impressions ? clicks / impressions : 0 }
    })
  }
  return Array.from(memory.entries()).map(([placementKey, counts]) => ({
    placementKey,
    impressions: counts.impressions,
    clicks: counts.clicks,
    ctr: counts.impressions ? counts.clicks / counts.impressions : 0,
  }))
}
