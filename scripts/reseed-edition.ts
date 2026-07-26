#!/usr/bin/env node
/**
 * Force-load the July 2026 original edition into articles.json and optional Postgres.
 *
 * Usage (repo root):
 *   pnpm exec tsx scripts/reseed-edition.ts
 *   pnpm exec tsx scripts/reseed-edition.ts --postgres   # also upserts nw_articles
 *
 * Never writes sourceUrl/sourceName. Replaces prior art-nw-* / art-ed-* inventory.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildEditionArticles } from '../apps/web/lib/content/store/seed-edition/index.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const webData = path.join(root, 'apps/web/data')
const storeFile = path.join(webData, 'articles.json')
const withPostgres = process.argv.includes('--postgres')

async function writeJson(articles: ReturnType<typeof buildEditionArticles>) {
  await fs.mkdir(webData, { recursive: true })
  let previous = []
  try {
    const raw = JSON.parse(await fs.readFile(storeFile, 'utf8'))
    previous = Array.isArray(raw.articles) ? raw.articles : []
  } catch {
    previous = []
  }

  const editionIds = new Set(articles.map((a) => a.id))
  const editionSlugs = new Set(articles.map((a) => `${a.categorySlug}:${a.slug}`))
  const kept = previous.filter((article) => {
    const id = String(article.id || '')
    const key = `${article.categorySlug}:${article.slug}`
    if (id.startsWith('art-nw-') || id.startsWith('art-ed-')) return false
    if (editionIds.has(id) || editionSlugs.has(key)) return false
    return true
  })

  const store = { version: 1, articles: [...kept, ...articles] }
  await fs.writeFile(storeFile, JSON.stringify(store, null, 2), 'utf8')
  return store.articles.length
}

async function writePostgres(articles: ReturnType<typeof buildEditionArticles>) {
  const url =
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.NEON_DATABASE_URL?.trim()
  if (!url) {
    console.error('DATABASE_URL missing; skip postgres upsert')
    return 0
  }

  const { default: pg } = await import('pg')
  const pool = new pg.Pool({ connectionString: url, max: 1 })
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS nw_articles (
      id text PRIMARY KEY,
      slug text NOT NULL,
      category_slug text NOT NULL,
      workflow_stage text NOT NULL,
      published_at timestamptz,
      updated_at timestamptz,
      document jsonb NOT NULL
    )`)
    await pool.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS nw_articles_category_slug_uidx
       ON nw_articles (category_slug, slug)`,
    )

    await pool.query(
      `DELETE FROM nw_articles WHERE id LIKE 'art-nw-%' OR id LIKE 'art-ed-%'`,
    )

    for (const article of articles) {
      await pool.query(
        `INSERT INTO nw_articles (id, slug, category_slug, workflow_stage, published_at, updated_at, document)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)
         ON CONFLICT (id) DO UPDATE SET
           slug = EXCLUDED.slug,
           category_slug = EXCLUDED.category_slug,
           workflow_stage = EXCLUDED.workflow_stage,
           published_at = EXCLUDED.published_at,
           updated_at = EXCLUDED.updated_at,
           document = EXCLUDED.document`,
        [
          article.id,
          article.slug,
          article.categorySlug,
          article.workflowStage,
          article.publishedAt,
          article.updatedAt,
          JSON.stringify(article),
        ],
      )
    }
    return articles.length
  } finally {
    await pool.end()
  }
}

async function main() {
  const articles = buildEditionArticles()
  const byCat = articles.reduce<Record<string, number>>((acc, a) => {
    acc[a.categorySlug] = (acc[a.categorySlug] || 0) + 1
    return acc
  }, {})

  console.log('edition articles', articles.length)
  console.log('per category', byCat)

  const jsonCount = await writeJson(articles)
  console.log('wrote', storeFile, 'total rows', jsonCount)

  if (withPostgres) {
    const n = await writePostgres(articles)
    console.log('postgres upserted', n)
  } else {
    console.log('json only (pass --postgres to upsert nw_articles)')
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
