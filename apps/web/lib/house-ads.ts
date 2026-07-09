import 'server-only'
import type { AdPlacementKey } from '@/lib/ads'

export type HouseAd = {
  placementKey: string
  active: boolean
  title: string
  body: string
  cta: string
  href: string
  imageUrl?: string
  updatedAt: string
}

type Queryable = {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<{ rows: T[]; rowCount: number | null }>
}

type Row = {
  placement_key: string
  active: boolean
  title: string
  body: string
  cta: string
  href: string
  image_url: string | null
  updated_at: Date | string
}

const memory = new Map<string, HouseAd>()
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
        CREATE TABLE IF NOT EXISTS nw_house_ads (
          placement_key text PRIMARY KEY,
          active boolean NOT NULL DEFAULT false,
          title text NOT NULL,
          body text NOT NULL,
          cta text NOT NULL,
          href text NOT NULL,
          image_url text,
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `)
    })()
  }
  await schemaReady
  return pool
}

function rowToAd(row: Row): HouseAd {
  return {
    placementKey: row.placement_key,
    active: Boolean(row.active),
    title: row.title,
    body: row.body,
    cta: row.cta,
    href: row.href,
    imageUrl: row.image_url ?? undefined,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : new Date(row.updated_at).toISOString(),
  }
}

export async function getHouseAd(placementKey: AdPlacementKey): Promise<HouseAd | null> {
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<Row>(`SELECT * FROM nw_house_ads WHERE placement_key = $1`, [placementKey])
    return result.rows[0] ? rowToAd(result.rows[0]) : null
  }
  return memory.get(placementKey) ?? null
}

export async function listHouseAds(): Promise<HouseAd[]> {
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<Row>(`SELECT * FROM nw_house_ads ORDER BY updated_at DESC`)
    return result.rows.map(rowToAd)
  }
  return Array.from(memory.values()).sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))
}

export async function upsertHouseAd(input: {
  placementKey: AdPlacementKey
  active: boolean
  title: string
  body: string
  cta: string
  href: string
  imageUrl?: string
}): Promise<HouseAd> {
  const ad: HouseAd = {
    placementKey: input.placementKey,
    active: input.active,
    title: input.title.slice(0, 120),
    body: input.body.slice(0, 260),
    cta: input.cta.slice(0, 60),
    href: input.href.slice(0, 500),
    imageUrl: input.imageUrl?.slice(0, 500) || undefined,
    updatedAt: new Date().toISOString(),
  }
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<Row>(
      `INSERT INTO nw_house_ads (placement_key, active, title, body, cta, href, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (placement_key) DO UPDATE SET
        active = EXCLUDED.active,
        title = EXCLUDED.title,
        body = EXCLUDED.body,
        cta = EXCLUDED.cta,
        href = EXCLUDED.href,
        image_url = EXCLUDED.image_url,
        updated_at = now()
       RETURNING *`,
      [ad.placementKey, ad.active, ad.title, ad.body, ad.cta, ad.href, ad.imageUrl ?? null],
    )
    return rowToAd(result.rows[0]!)
  }
  memory.set(ad.placementKey, ad)
  return ad
}
