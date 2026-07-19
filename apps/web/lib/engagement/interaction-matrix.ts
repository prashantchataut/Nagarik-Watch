/**
 * Consented reader×article interaction matrix for collaborative filtering.
 * Uses Postgres when DATABASE_URL is set; otherwise a local JSON fallback.
 * Never invents synthetic users or traffic.
 *
 * The article key is the canonical story id (`StoryCardData.id`), not the
 * URL slug — @nagarikwatch/db `recommend()` matches collaborative scores
 * against `candidate.id`, and `ReadingHistoryRecord.articleId` uses the same
 * id. The `article_slug` column/field name predates this and is kept as-is
 * to avoid an unnecessary migration; treat it as an opaque article key.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'

export type InteractionMatrix = Record<string, Record<string, number>>

type LocalRow = { ownerKey: string; articleSlug: string; weight: number; updatedAt: string }

const LOCAL_FILE = path.resolve(process.cwd(), '.data', 'interactions.json')
let localCache: LocalRow[] | null = null
let localWrite: Promise<void> = Promise.resolve()

async function getPool(): Promise<{
  query: (sql: string, params?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>
} | null> {
  if (!process.env.DATABASE_URL?.trim()) return null
  try {
    const { ensureOperationalSchema } = await import('../ops-db')
    return ensureOperationalSchema('nw-interactions-v1', async (pool) => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS nw_interactions (
          owner_key text NOT NULL,
          article_slug text NOT NULL,
          weight double precision NOT NULL DEFAULT 1,
          updated_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (owner_key, article_slug)
        )
      `)
    })
  } catch {
    return null
  }
}

async function readLocal(): Promise<LocalRow[]> {
  if (localCache) return localCache
  try {
    const raw = await fs.readFile(LOCAL_FILE, 'utf-8')
    localCache = JSON.parse(raw) as LocalRow[]
  } catch {
    localCache = []
  }
  return localCache
}

async function writeLocal(rows: LocalRow[]): Promise<void> {
  localWrite = localWrite.then(async () => {
    await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true })
    await fs.writeFile(LOCAL_FILE, JSON.stringify(rows.slice(-20_000)), 'utf-8')
    localCache = rows
  })
  await localWrite
}

export async function recordInteraction(
  ownerKey: string,
  articleId: string,
  weight = 1,
): Promise<void> {
  const owner = ownerKey.trim()
  const slug = articleId.trim()
  if (!owner || !slug) return
  const w = Number.isFinite(weight) ? Math.max(0.1, Math.min(10, weight)) : 1

  const pool = await getPool()
  if (pool) {
    await pool.query(
      `INSERT INTO nw_interactions (owner_key, article_slug, weight, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (owner_key, article_slug)
       DO UPDATE SET weight = GREATEST(nw_interactions.weight, EXCLUDED.weight),
                     updated_at = now()`,
      [owner, slug, w],
    )
    return
  }

  const rows = await readLocal()
  const existing = rows.find((row) => row.ownerKey === owner && row.articleSlug === slug)
  if (existing) {
    existing.weight = Math.max(existing.weight, w)
    existing.updatedAt = new Date().toISOString()
  } else {
    rows.push({
      ownerKey: owner,
      articleSlug: slug,
      weight: w,
      updatedAt: new Date().toISOString(),
    })
  }
  await writeLocal(rows)
}

export async function getInteractionMatrix(limit = 5_000): Promise<InteractionMatrix> {
  const pool = await getPool()
  if (pool) {
    const result = await pool.query(
      `SELECT owner_key, article_slug, weight
       FROM nw_interactions
       ORDER BY updated_at DESC
       LIMIT $1`,
      [Math.max(100, limit)],
    )
    const matrix: InteractionMatrix = {}
    for (const row of result.rows) {
      const owner = String(row.owner_key ?? '')
      const slug = String(row.article_slug ?? '')
      if (!owner || !slug) continue
      matrix[owner] ??= {}
      matrix[owner]![slug] = Number(row.weight ?? 1)
    }
    return matrix
  }

  const matrix: InteractionMatrix = {}
  for (const row of await readLocal()) {
    matrix[row.ownerKey] ??= {}
    matrix[row.ownerKey]![row.articleSlug] = row.weight
  }
  return matrix
}

export function matrixReaderCount(matrix: InteractionMatrix): number {
  return Object.keys(matrix).length
}

/** Test helper — clears the in-memory local cache between vitest cases. */
export function __resetInteractionMatrixCacheForTests(): void {
  localCache = null
}
