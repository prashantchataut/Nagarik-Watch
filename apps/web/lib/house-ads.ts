import 'server-only'
import type { AdPlacementKey } from '@/lib/ads'
import { AD_PLACEMENTS } from '@/lib/ads'
import { isProductionRuntime } from '@/lib/ops-db'
import { getSharedPool } from '@/lib/pg-pool'

export type HouseAdCreative = {
  title: string
  body: string
  cta: string
  href: string
  imageUrl?: string
  titleEn?: string
  bodyEn?: string
  ctaEn?: string
}

export type HouseAd = HouseAdCreative & {
  placementKey: string
  active: boolean
  abEnabled: boolean
  challenger?: HouseAdCreative
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
  title_en?: string | null
  body_en?: string | null
  cta_en?: string | null
  ab_enabled?: boolean | null
  challenger_json?: string | null
  updated_at: Date | string
}

const memory = new Map<string, HouseAd>()
let schemaReady: Promise<void> | null = null

async function getPool(): Promise<Queryable | null> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return null
  const pool = await getSharedPool()
  if (!pool) {
    if (isProductionRuntime()) {
      throw new Error('DATABASE_URL must point to Postgres for production house ads.')
    }
    return null
  }
  return pool as unknown as Queryable
}

async function ensureSchema(): Promise<Queryable | null> {
  try {
    const pool = await getPool()
    if (!pool) return null
    // Production schema is migration-owned; never run DDL in a reader/admin request.
    if (isProductionRuntime()) return pool
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
        await pool.query(`ALTER TABLE nw_house_ads ADD COLUMN IF NOT EXISTS title_en text`)
        await pool.query(`ALTER TABLE nw_house_ads ADD COLUMN IF NOT EXISTS body_en text`)
        await pool.query(`ALTER TABLE nw_house_ads ADD COLUMN IF NOT EXISTS cta_en text`)
        await pool.query(
          `ALTER TABLE nw_house_ads ADD COLUMN IF NOT EXISTS ab_enabled boolean NOT NULL DEFAULT false`,
        )
        await pool.query(`ALTER TABLE nw_house_ads ADD COLUMN IF NOT EXISTS challenger_json text`)
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

function optionalText(value: unknown, maxLength: number): string | undefined {
  const normalized = String(value ?? '').trim().slice(0, maxLength)
  return normalized || undefined
}

function normalizeCreative(input: HouseAdCreative): HouseAdCreative {
  return {
    title: input.title.trim().slice(0, 120),
    body: input.body.trim().slice(0, 260),
    cta: input.cta.trim().slice(0, 60),
    href: input.href.trim().slice(0, 500),
    imageUrl: optionalText(input.imageUrl, 500),
    titleEn: optionalText(input.titleEn, 120),
    bodyEn: optionalText(input.bodyEn, 260),
    ctaEn: optionalText(input.ctaEn, 60),
  }
}

function isCompleteCreative(input: HouseAdCreative | null | undefined): input is HouseAdCreative {
  return Boolean(
    input?.title.trim() && input.body.trim() && input.cta.trim() && input.href.trim(),
  )
}

function parseChallenger(raw: string | null | undefined): HouseAdCreative | undefined {
  if (!raw?.trim()) return undefined
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const candidate: HouseAdCreative = {
      title: String(parsed.title ?? ''),
      body: String(parsed.body ?? ''),
      cta: String(parsed.cta ?? ''),
      href: String(parsed.href ?? ''),
      imageUrl: String(parsed.imageUrl ?? ''),
      titleEn: String(parsed.titleEn ?? ''),
      bodyEn: String(parsed.bodyEn ?? ''),
      ctaEn: String(parsed.ctaEn ?? ''),
    }
    return isCompleteCreative(candidate) ? normalizeCreative(candidate) : undefined
  } catch {
    return undefined
  }
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
    titleEn: row.title_en ?? undefined,
    bodyEn: row.body_en ?? undefined,
    ctaEn: row.cta_en ?? undefined,
    abEnabled: Boolean(row.ab_enabled),
    challenger: parseChallenger(row.challenger_json),
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : new Date(row.updated_at).toISOString(),
  }
}

export function houseAdExperimentId(placementKey: string): string {
  return `house-ad-${placementKey}`
}

export function listHouseAdExperimentPlacementKeys(): AdPlacementKey[] {
  return Object.keys(AD_PLACEMENTS) as AdPlacementKey[]
}

export async function getHouseAd(placementKey: AdPlacementKey): Promise<HouseAd | null> {
  try {
    const pool = await ensureSchema()
    if (pool) {
      const result = await pool.query<Row>(`SELECT * FROM nw_house_ads WHERE placement_key = $1`, [
        placementKey,
      ])
      return result.rows[0] ? rowToAd(result.rows[0]) : null
    }
    return memory.get(placementKey) ?? null
  } catch (error) {
    console.error('[house-ads] read failed', error instanceof Error ? error.message : error)
    return null
  }
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
  titleEn?: string
  bodyEn?: string
  ctaEn?: string
  abEnabled?: boolean
  challenger?: HouseAdCreative | null
}): Promise<HouseAd> {
  const challenger = isCompleteCreative(input.challenger)
    ? normalizeCreative(input.challenger)
    : undefined

  const creative = normalizeCreative({
    title: input.title,
    body: input.body,
    cta: input.cta,
    href: input.href,
    imageUrl: input.imageUrl,
    titleEn: input.titleEn,
    bodyEn: input.bodyEn,
    ctaEn: input.ctaEn,
  })

  if (!isCompleteCreative(creative)) {
    throw new Error('House ad creative requires title, body, CTA, and destination URL.')
  }

  const ad: HouseAd = {
    placementKey: input.placementKey,
    active: input.active,
    ...creative,
    abEnabled: Boolean(input.abEnabled) && Boolean(challenger),
    challenger,
    updatedAt: new Date().toISOString(),
  }

  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<Row>(
      `INSERT INTO nw_house_ads
        (placement_key, active, title, body, cta, href, image_url, title_en, body_en, cta_en, ab_enabled, challenger_json)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (placement_key) DO UPDATE SET
        active = EXCLUDED.active,
        title = EXCLUDED.title,
        body = EXCLUDED.body,
        cta = EXCLUDED.cta,
        href = EXCLUDED.href,
        image_url = EXCLUDED.image_url,
        title_en = EXCLUDED.title_en,
        body_en = EXCLUDED.body_en,
        cta_en = EXCLUDED.cta_en,
        ab_enabled = EXCLUDED.ab_enabled,
        challenger_json = EXCLUDED.challenger_json,
        updated_at = now()
       RETURNING *`,
      [
        ad.placementKey,
        ad.active,
        ad.title,
        ad.body,
        ad.cta,
        ad.href,
        ad.imageUrl ?? null,
        ad.titleEn ?? null,
        ad.bodyEn ?? null,
        ad.ctaEn ?? null,
        ad.abEnabled,
        challenger ? JSON.stringify(challenger) : null,
      ],
    )
    return rowToAd(result.rows[0]!)
  }
  memory.set(ad.placementKey, ad)
  return ad
}
