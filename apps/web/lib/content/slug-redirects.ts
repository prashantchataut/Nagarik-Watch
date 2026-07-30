import 'server-only'
import { ensureOperationalSchema, isProductionRuntime, type Queryable } from '@/lib/ops-db'
import { promises as fs } from 'node:fs'
import path from 'node:path'

export type SlugRedirect = {
  fromCategory: string
  fromSlug: string
  toCategory: string
  toSlug: string
  createdAt: string
}

const SCHEMA_KEY = 'nw-slug-redirects-v1'
const LOCAL_FILE = path.resolve(process.cwd(), '.data', 'slug-redirects.json')
let localCache: SlugRedirect[] | null = null
let localWrite = Promise.resolve()

async function ensureSchema(): Promise<Queryable | null> {
  return ensureOperationalSchema(SCHEMA_KEY, async (pool) => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nw_slug_redirects (
        from_category text NOT NULL,
        from_slug text NOT NULL,
        to_category text NOT NULL,
        to_slug text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (from_category, from_slug)
      )
    `)
    await pool.query(
      `CREATE INDEX IF NOT EXISTS nw_slug_redirects_to_idx ON nw_slug_redirects(to_category, to_slug)`,
    )
  })
}

async function readLocal(): Promise<SlugRedirect[]> {
  if (localCache) return localCache
  try {
    localCache = JSON.parse(await fs.readFile(LOCAL_FILE, 'utf8')) as SlugRedirect[]
  } catch {
    localCache = []
  }
  return localCache
}

async function writeLocal(rows: SlugRedirect[]): Promise<void> {
  localWrite = localWrite.then(async () => {
    await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true })
    await fs.writeFile(LOCAL_FILE, JSON.stringify(rows.slice(-5000)), 'utf8')
    localCache = rows
  })
  await localWrite
}

/** Record a permanent redirect when an article slug or category changes. */
export async function recordSlugRedirect(input: {
  fromCategory: string
  fromSlug: string
  toCategory: string
  toSlug: string
}): Promise<void> {
  const fromCategory = input.fromCategory.trim()
  const fromSlug = input.fromSlug.trim()
  const toCategory = input.toCategory.trim()
  const toSlug = input.toSlug.trim()
  if (!fromCategory || !fromSlug || !toCategory || !toSlug) return
  if (fromCategory === toCategory && fromSlug === toSlug) return

  const pool = await ensureSchema()
  if (pool) {
    await pool.query(
      `INSERT INTO nw_slug_redirects (from_category, from_slug, to_category, to_slug)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (from_category, from_slug) DO UPDATE SET
         to_category = EXCLUDED.to_category,
         to_slug = EXCLUDED.to_slug,
         created_at = now()`,
      [fromCategory, fromSlug, toCategory, toSlug],
    )
    // Chain: anything that pointed at the old path should now point at the new target.
    await pool.query(
      `UPDATE nw_slug_redirects
       SET to_category = $3, to_slug = $4
       WHERE to_category = $1 AND to_slug = $2`,
      [fromCategory, fromSlug, toCategory, toSlug],
    )
    return
  }

  if (isProductionRuntime()) {
    console.error('[slug-redirects] DATABASE_URL missing; redirect not recorded')
    return
  }

  const rows = await readLocal()
  const next = rows.filter(
    (row) => !(row.fromCategory === fromCategory && row.fromSlug === fromSlug),
  )
  for (const row of next) {
    if (row.toCategory === fromCategory && row.toSlug === fromSlug) {
      row.toCategory = toCategory
      row.toSlug = toSlug
    }
  }
  next.push({
    fromCategory,
    fromSlug,
    toCategory,
    toSlug,
    createdAt: new Date().toISOString(),
  })
  await writeLocal(next)
}

export async function resolveSlugRedirect(
  category: string,
  slug: string,
): Promise<{ category: string; slug: string } | null> {
  const fromCategory = category.trim()
  const fromSlug = slug.trim()
  if (!fromCategory || !fromSlug) return null

  const pool = await ensureSchema()
  if (pool) {
    try {
      const result = await pool.query<{ to_category: string; to_slug: string }>(
        `SELECT to_category, to_slug FROM nw_slug_redirects
         WHERE from_category = $1 AND from_slug = $2
         LIMIT 1`,
        [fromCategory, fromSlug],
      )
      const row = result.rows[0]
      if (!row) return null
      return { category: row.to_category, slug: row.to_slug }
    } catch {
      return null
    }
  }

  const rows = await readLocal()
  const hit = rows.find((row) => row.fromCategory === fromCategory && row.fromSlug === fromSlug)
  return hit ? { category: hit.toCategory, slug: hit.toSlug } : null
}
