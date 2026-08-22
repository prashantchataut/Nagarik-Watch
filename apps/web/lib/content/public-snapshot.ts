import 'server-only'
import type { HomepageData, StoryCardData } from '@nagarikwatch/db'
import {
  ensureOperationalSchema,
  runSchemaStatements,
  type Queryable,
} from '@/lib/ops-db'

const HOMEPAGE_KEY = 'homepage:v1'
const SCHEMA_VERSION = 1
const DEFAULT_MAX_AGE_SECONDS = 24 * 60 * 60
const MAX_ALLOWED_AGE_SECONDS = 7 * 24 * 60 * 60
const WRITE_THROTTLE_MS = 5 * 60_000

let lastHomepageJson = ''
let lastHomepageWriteAt = 0

async function snapshotPool(): Promise<Queryable | null> {
  return ensureOperationalSchema('public-content-snapshots', async (pool) => {
    await runSchemaStatements(pool, [
      `CREATE TABLE IF NOT EXISTS nw_public_content_snapshots (
        snapshot_key text PRIMARY KEY,
        source text NOT NULL,
        schema_version integer NOT NULL DEFAULT 1,
        payload jsonb NOT NULL,
        captured_at timestamptz NOT NULL DEFAULT now()
      )`,
      `CREATE INDEX IF NOT EXISTS nw_public_content_snapshots_captured_idx
        ON nw_public_content_snapshots(captured_at DESC)`,
    ])
  })
}

function snapshotMaxAgeSeconds(): number {
  const configured = Number(process.env.NW_PUBLIC_SNAPSHOT_MAX_AGE_SECONDS ?? DEFAULT_MAX_AGE_SECONDS)
  if (!Number.isFinite(configured)) return DEFAULT_MAX_AGE_SECONDS
  return Math.max(60, Math.min(MAX_ALLOWED_AGE_SECONDS, Math.floor(configured)))
}

function isStoryCard(value: unknown): value is StoryCardData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const story = value as Partial<StoryCardData>
  return (
    typeof story.id === 'string' &&
    typeof story.slug === 'string' &&
    typeof story.titleNe === 'string' &&
    typeof story.publishedAt === 'string' &&
    Boolean(story.category) &&
    typeof story.category?.slug === 'string'
  )
}

export function isHomepageSnapshot(value: unknown): value is HomepageData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const homepage = value as Partial<HomepageData>
  if (!isStoryCard(homepage.lead)) return false
  if (!Array.isArray(homepage.featured) || !homepage.featured.every(isStoryCard)) return false
  if (!Array.isArray(homepage.secondary) || !homepage.secondary.every(isStoryCard)) return false
  if (!Array.isArray(homepage.breaking) || !homepage.breaking.every(isStoryCard)) return false
  if (!Array.isArray(homepage.sections)) return false
  return homepage.sections.every((section) => {
    if (!section || typeof section !== 'object') return false
    return (
      Boolean(section.category) &&
      typeof section.category.slug === 'string' &&
      (section.lead === undefined || isStoryCard(section.lead)) &&
      Array.isArray(section.items) &&
      section.items.every(isStoryCard)
    )
  })
}

export async function readHomepageSnapshot(): Promise<HomepageData | null> {
  const pool = await snapshotPool()
  if (!pool) return null
  const cutoff = new Date(Date.now() - snapshotMaxAgeSeconds() * 1000)
  try {
    const result = await pool.query<{ payload: unknown }>(
      `SELECT payload
       FROM nw_public_content_snapshots
       WHERE snapshot_key = $1
         AND schema_version = $2
         AND captured_at >= $3
       LIMIT 1`,
      [HOMEPAGE_KEY, SCHEMA_VERSION, cutoff],
    )
    const payload = result.rows[0]?.payload
    return isHomepageSnapshot(payload) ? payload : null
  } catch (error) {
    console.error(
      '[content-snapshot] homepage read failed',
      error instanceof Error ? error.message : error,
    )
    return null
  }
}

export async function writeHomepageSnapshot(
  homepage: HomepageData,
  options?: { force?: boolean },
): Promise<boolean> {
  if (!isHomepageSnapshot(homepage)) return false
  const json = JSON.stringify(homepage)
  const now = Date.now()
  if (
    !options?.force &&
    json === lastHomepageJson &&
    now - lastHomepageWriteAt < WRITE_THROTTLE_MS
  ) {
    return false
  }

  const pool = await snapshotPool()
  if (!pool) return false
  try {
    await pool.query(
      `INSERT INTO nw_public_content_snapshots
        (snapshot_key, source, schema_version, payload, captured_at)
       VALUES ($1, 'payload', $2, $3::jsonb, now())
       ON CONFLICT (snapshot_key) DO UPDATE SET
         source = EXCLUDED.source,
         schema_version = EXCLUDED.schema_version,
         payload = EXCLUDED.payload,
         captured_at = EXCLUDED.captured_at`,
      [HOMEPAGE_KEY, SCHEMA_VERSION, json],
    )
    lastHomepageJson = json
    lastHomepageWriteAt = now
    return true
  } catch (error) {
    console.error(
      '[content-snapshot] homepage write failed',
      error instanceof Error ? error.message : error,
    )
    return false
  }
}
