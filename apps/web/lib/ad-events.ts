import 'server-only'
import type { AdMode, AdPlacementKey } from '@/lib/ads'
import { isProductionRuntime } from '@/lib/ops-db'
import { getSharedPool } from '@/lib/pg-pool'

export type AdEventType = 'impression' | 'click'
export type AdEventSummary = {
  placementKey: string
  impressions: number
  clicks: number
  ctr: number
  averageAttention: number
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
  avg_attention: string | number | null
}

const memory = new Map<string, { impressions: number; clicks: number; attentionTotal: number; attentionSamples: number }>()
let schemaReady: Promise<void> | null = null

async function getPool(): Promise<Queryable | null> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return null
  const pool = await getSharedPool()
  if (!pool) {
    if (isProductionRuntime()) {
      throw new Error('DATABASE_URL must point to Postgres for production ad analytics.')
    }
    return null
  }
  return pool as unknown as Queryable
}

async function ensureSchema(): Promise<Queryable | null> {
  try {
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
            attention double precision,
            created_at timestamptz NOT NULL DEFAULT now()
          )
        `)
        await pool.query(`ALTER TABLE nw_ad_events ADD COLUMN IF NOT EXISTS attention double precision`)
        await pool.query(
          `CREATE INDEX IF NOT EXISTS nw_ad_events_placement_idx ON nw_ad_events(placement_key, created_at DESC)`,
        )
      })()
    }
    await schemaReady
    return pool
  } catch (error) {
    schemaReady = null
    if (isProductionRuntime()) throw error
    return null
  }
}

export async function recordAdEvent(input: {
  placementKey: AdPlacementKey
  mode: AdMode
  event: AdEventType
  attention?: number
}): Promise<void> {
  const attention =
    typeof input.attention === 'number' && Number.isFinite(input.attention)
      ? Math.max(0, Math.min(1, input.attention))
      : null
  const pool = await ensureSchema()
  if (pool) {
    await pool.query(
      `INSERT INTO nw_ad_events (placement_key, mode, event, attention) VALUES ($1,$2,$3,$4)`,
      [input.placementKey, input.mode, input.event, attention],
    )
    return
  }
  const current = memory.get(input.placementKey) ?? { impressions: 0, clicks: 0, attentionTotal: 0, attentionSamples: 0 }
  if (input.event === 'impression') current.impressions += 1
  if (input.event === 'click') current.clicks += 1
  if (attention !== null) {
    current.attentionTotal += attention
    current.attentionSamples += 1
  }
  memory.set(input.placementKey, current)
}

export async function getAdEventSummary(): Promise<AdEventSummary[]> {
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<SummaryRow>(`
      SELECT placement_key,
        count(*) FILTER (WHERE event = 'impression') AS impressions,
        count(*) FILTER (WHERE event = 'click') AS clicks,
        avg(attention) FILTER (WHERE attention IS NOT NULL) AS avg_attention
      FROM nw_ad_events
      WHERE created_at > now() - interval '30 days'
      GROUP BY placement_key
      ORDER BY impressions DESC, clicks DESC
    `)
    return result.rows.map((row) => {
      const impressions = Number(row.impressions ?? 0)
      const clicks = Number(row.clicks ?? 0)
      return {
        placementKey: row.placement_key,
        impressions,
        clicks,
        ctr: impressions ? clicks / impressions : 0,
        averageAttention: row.avg_attention === null ? 0 : Number(row.avg_attention),
      }
    })
  }
  return Array.from(memory.entries()).map(([placementKey, counts]) => ({
    placementKey,
    impressions: counts.impressions,
    clicks: counts.clicks,
    ctr: counts.impressions ? counts.clicks / counts.impressions : 0,
    averageAttention: counts.attentionSamples ? counts.attentionTotal / counts.attentionSamples : 0,
  }))
}
