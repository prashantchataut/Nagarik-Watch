/**
 * Article store — Postgres (`nw_articles`) in production when DATABASE_URL is
 * set; local JSON file for development. Development empty stores may auto-seed
 * starter articles (editable via /admin/articles). Production never auto-publishes
 * seed unless ALLOW_STARTER_SEED=true. Never holds scraped third-party copy.
 */
import 'server-only'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { ArticleBlock, Locale, WorkflowStage } from '@nagarikwatch/db'
import { ensureOperationalSchema, isProductionRuntime, runSchemaStatements, type Queryable } from '@/lib/ops-db'
import { buildOriginalStarterArticles } from './seed-original'
import { normalizeEditionHeroUrl } from './seed-edition/_helpers'
import type { NewsroomRole } from '@/lib/admin-roles'
import {
  assertWorkflowTransition,
  isPublicWorkflowStage,
} from '@/lib/editorial/workflow-transitions'

const DATA_DIR = path.resolve(process.cwd(), 'data')
const STORE_FILE = path.join(DATA_DIR, 'articles.json')
const PUBLIC_WORKFLOW_STAGES: readonly WorkflowStage[] = ['published', 'updated']
const SCHEMA_KEY = 'nw-articles-v1'

/** Production must not invent a published edition unless operators opt in. */
function allowStarterSeed(): boolean {
  const flag = process.env.ALLOW_STARTER_SEED?.trim().toLowerCase()
  if (flag === 'true' || flag === '1') return true
  if (flag === 'false' || flag === '0') return false
  return !isProductionRuntime()
}

export type StoredArticle = {
  id: string
  slug: string
  categorySlug: string
  titleNe: string
  titleEn?: string
  deckNe?: string
  deckEn?: string
  homepageTeaserNe?: string
  socialCopyNe?: string
  reportingLocation?: string
  sourceNote?: string
  editorPitch?: string
  mediaReferenceUrl?: string
  bodyNe: ArticleBlock[]
  bodyEn?: ArticleBlock[]
  heroImageUrl?: string
  heroImageAlt?: string
  heroCaptionNe?: string
  heroCredit?: string
  authorIds: string[]
  tagSlugs: string[]
  publishedAt: string
  updatedAt: string
  isBreaking: boolean
  /** Set when machine auto-boosted breaking; cleared when kill switch turns off. */
  autoBreakingAt?: string
  isFeatured: 'lead' | 'featured' | 'secondary' | 'none'
  /** ISO timestamp; when past, homepage placement falls back to none. */
  featuredExpiresAt?: string
  workflowStage: WorkflowStage
  sourceType: 'original' | 'aggregated' | 'wire'
  sourceName?: string
  sourceUrl?: string
  seoTitleNe?: string
  seoDescriptionNe?: string
  noIndex: boolean
  includeInNewsSitemap: boolean
  aiSummary?: string
  premium: boolean
  commentsEnabled: boolean
  locale: Locale
  /** Author-reviewed English workflow. Public /en requires `published`. */
  englishStatus?: 'none' | 'requested' | 'in_progress' | 'ready' | 'published'
  hasEnglish: boolean
  readingMinutes: number
  createdBy: string
  updatedBy: string
  province?: string
  district?: string
  exclusive?: boolean
  editorPick?: boolean
  dataStory?: boolean
  factCheckStatus?:
    | 'not_fact_check'
    | 'in_review'
    | 'verified'
    | 'false'
    | 'mixed'
    | 'context_needed'
}

/** ADR-007: public English only when englishStatus is published (never titleEn presence alone). */
export function articleHasPublicEnglish(article: Pick<StoredArticle, 'englishStatus' | 'hasEnglish'>): boolean {
  if (article.englishStatus) return article.englishStatus === 'published'
  // Legacy rows without englishStatus: do not expose EN (fail closed).
  return false
}

function normalizeEnglishStatus(
  value: StoredArticle['englishStatus'] | 'draft' | 'in_review' | undefined,
): StoredArticle['englishStatus'] {
  if (value === 'draft') return 'requested'
  if (value === 'in_review') return 'ready'
  return value ?? 'none'
}

function assertEnglishPublicationReady(input: {
  englishStatus: StoredArticle['englishStatus']
  titleEn?: string
  bodyEn?: ArticleBlock[]
}): void {
  if (input.englishStatus !== 'published') return
  if (!input.titleEn?.trim() || !input.bodyEn?.length) {
    throw new Error('English publication requires both titleEn and bodyEn.')
  }
}

function assertSourceAttribution(input: {
  sourceType: StoredArticle['sourceType']
  sourceName?: string
  sourceUrl?: string
}): void {
  if (input.sourceType === 'original') return
  if (!input.sourceName?.trim() || !input.sourceUrl?.trim()) {
    throw new Error('Aggregated/wire stories require sourceName and sourceUrl.')
  }
}

type StoreShape = {
  articles: StoredArticle[]
  version: number
}

let cache: StoreShape | null = null
let cacheAt = 0
let writeLock: Promise<void> = Promise.resolve()

/** Short TTL so serverless instances pick up desk publishes without a redeploy.
 * Publish paths call invalidateArticleStoreCache(); 30s is enough for soft lag. */
function cacheTtlMs(): number {
  return isProductionRuntime() ? 30_000 : 30_000
}

export function invalidateArticleStoreCache(): void {
  cache = null
  cacheAt = 0
}

function rememberCache(store: StoreShape): StoreShape {
  cache = store
  cacheAt = Date.now()
  return store
}

function parseDocument(doc: unknown): StoredArticle | null {
  if (!doc) return null
  if (typeof doc === 'string') {
    try {
      return JSON.parse(doc) as StoredArticle
    } catch {
      return null
    }
  }
  return doc as StoredArticle
}

async function ensureArticlesTable(pool: Queryable): Promise<void> {
  await runSchemaStatements(pool, [
    `CREATE TABLE IF NOT EXISTS nw_articles (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL,
      category_slug TEXT NOT NULL,
      workflow_stage TEXT NOT NULL,
      published_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL,
      document JSONB NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS nw_articles_category_slug_uidx
     ON nw_articles (category_slug, slug)`,
    `CREATE INDEX IF NOT EXISTS nw_articles_public_idx
     ON nw_articles (workflow_stage, published_at DESC)`,
    `CREATE INDEX IF NOT EXISTS nw_articles_updated_idx
     ON nw_articles (updated_at DESC)`,
  ])
}

async function getArticlesPool(): Promise<Queryable | null> {
  return ensureOperationalSchema(SCHEMA_KEY, ensureArticlesTable)
}

async function insertSeedArticles(pool: Queryable, articles: StoredArticle[]): Promise<void> {
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
}

function withoutLegacyStarters(articles: StoredArticle[]): StoredArticle[] {
  return articles.filter((article) => !String(article.id).startsWith('art-nw-'))
}

function normalizeStoredArticle(article: StoredArticle): StoredArticle {
  const heroImageUrl = normalizeEditionHeroUrl(article.heroImageUrl, article.slug)
  if (heroImageUrl === article.heroImageUrl) return article
  return { ...article, heroImageUrl }
}

function normalizeArticles(articles: StoredArticle[]): StoredArticle[] {
  return articles.map(normalizeStoredArticle)
}

/** Refresh art-ed-* rows when Postgres still has pre-JPEG hero paths. */
async function repairStaleEditionHeroes(
  pool: Queryable,
  articles: StoredArticle[],
): Promise<StoredArticle[]> {
  const normalized = normalizeArticles(articles)
  const stale = normalized.filter(
    (article, index) => article.heroImageUrl !== articles[index]?.heroImageUrl,
  )
  if (stale.length > 0) {
    await insertSeedArticles(pool, stale)
  }
  return normalized
}

/** Insert any edition articles missing by id (never overwrite non-seed editor rows). */
function missingSeedArticles(existing: StoredArticle[]): StoredArticle[] {
  const haveIds = new Set(existing.map((article) => article.id))
  const haveSlugs = new Set(existing.map((article) => `${article.categorySlug}:${article.slug}`))
  return buildOriginalStarterArticles().filter(
    (article) =>
      !haveIds.has(article.id) && !haveSlugs.has(`${article.categorySlug}:${article.slug}`),
  )
}

const EDITION_MIN_BODY_WORDS = 300

function editionBodyWords(blocks: StoredArticle['bodyNe']): number {
  return blocks
    .map((b) => {
      if ('text' in b && typeof b.text === 'string') return b.text
      if (b.type === 'pullQuote') return b.quoteNe
      if (b.type === 'list') return b.items.join(' ')
      return ''
    })
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length
}

/** Replace stale short art-ed-* rows with the current long-form edition modules. */
async function refreshEditionArticles(
  pool: Queryable,
  articles: StoredArticle[],
): Promise<StoredArticle[]> {
  const canonical = new Map(
    buildOriginalStarterArticles()
      .filter((article) => article.id.startsWith('art-ed-'))
      .map((article) => [article.id, article] as const),
  )
  const toRefresh: StoredArticle[] = []
  const next = articles.map((article) => {
    if (!article.id.startsWith('art-ed-')) return article
    const fresh = canonical.get(article.id)
    if (!fresh) return article
    if (editionBodyWords(article.bodyNe) >= EDITION_MIN_BODY_WORDS) return article
    // Skip rows that newsroom already touched (updatedBy differs from seed creator).
    if (article.updatedBy && article.updatedBy !== article.createdBy) return article
    toRefresh.push(fresh)
    return fresh
  })
  if (toRefresh.length === 0) return next
  await insertSeedArticles(pool, toRefresh)
  return next
}

async function readFromPostgres(pool: Queryable): Promise<StoreShape> {
  const result = await pool.query<{ document: unknown }>(`SELECT document FROM nw_articles`)
  const rawArticles = withoutLegacyStarters(
    result.rows.map((row) => parseDocument(row.document)).filter((a): a is StoredArticle => Boolean(a)),
  )

  if (rawArticles.length === 0) {
    if (!allowStarterSeed()) {
      return { articles: [], version: 1 }
    }
    const seeded = normalizeArticles(buildOriginalStarterArticles())
    await insertSeedArticles(pool, seeded)
    return { articles: seeded, version: 1 }
  }

  const articles = await repairStaleEditionHeroes(pool, rawArticles)
  // Never rewrite short art-ed-* bodies in production (or when seed is off);
  // that wiped desk edits whenever word count fell under the seed threshold.
  if (!allowStarterSeed()) {
    return { articles, version: 1 }
  }
  const refreshed = await refreshEditionArticles(pool, articles)
  const missing = missingSeedArticles(refreshed)
  if (missing.length > 0) {
    const normalizedMissing = normalizeArticles(missing)
    await insertSeedArticles(pool, normalizedMissing)
    return { articles: [...refreshed, ...normalizedMissing], version: 1 }
  }
  return { articles: refreshed, version: 1 }
}

async function writeToPostgres(pool: Queryable, store: StoreShape): Promise<void> {
  const existing = await pool.query<{ id: string }>(`SELECT id FROM nw_articles`)
  const keep = new Set(store.articles.map((article) => article.id))
  for (const row of existing.rows) {
    if (!keep.has(row.id)) {
      await pool.query(`DELETE FROM nw_articles WHERE id = $1`, [row.id])
    }
  }
  for (const article of store.articles) {
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
}

type StoreMutation =
  | { type: 'upsert'; article: StoredArticle }
  | { type: 'delete'; id: string }

async function applyStoreMutation(pool: Queryable, mutation: StoreMutation): Promise<void> {
  if (mutation.type === 'delete') {
    await pool.query(`DELETE FROM nw_articles WHERE id = $1`, [mutation.id])
    return
  }
  await insertSeedArticles(pool, [mutation.article])
}

async function readFromFile(): Promise<StoreShape> {
  try {
    const raw = await fs.readFile(STORE_FILE, 'utf-8')
    const parsed = JSON.parse(raw) as StoreShape
    const existing = normalizeArticles(withoutLegacyStarters(parsed.articles ?? []))
    if (!existing.length) {
      if (!allowStarterSeed()) {
        return { articles: [], version: 1 }
      }
      const seeded = normalizeArticles(buildOriginalStarterArticles())
      const store = { articles: seeded, version: 1 }
      await fs.mkdir(DATA_DIR, { recursive: true })
      await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8')
      return store
    }
    if (!allowStarterSeed()) {
      return { articles: existing, version: parsed.version ?? 1 }
    }
    const missing = normalizeArticles(missingSeedArticles(existing))
    const articles = missing.length ? [...existing, ...missing] : existing
    const store = { articles, version: parsed.version ?? 1 }
    if (missing.length || articles.length !== (parsed.articles?.length ?? 0)) {
      try {
        await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8')
      } catch {
        // Read-only FS — return merged in-memory edition for this process.
      }
    }
    return store
  } catch {
    if (!allowStarterSeed()) {
      return { articles: [], version: 1 }
    }
    const seeded = normalizeArticles(buildOriginalStarterArticles())
    const store = { articles: seeded, version: 1 }
    try {
      await fs.mkdir(DATA_DIR, { recursive: true })
      await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8')
    } catch {
      // Read-only FS — return in-memory seed for this process.
    }
    return store
  }
}

async function read(): Promise<StoreShape> {
  if (cache && Date.now() - cacheAt < cacheTtlMs()) return cache
  const pool = await getArticlesPool()
  if (pool) {
    try {
      return rememberCache(await readFromPostgres(pool))
    } catch (error) {
      // Pool exhaustion / connect timeouts must not take down the public site.
      // Prefer cached/file inventory so readers still get the edition.
      console.error(
        '[json-store] readFromPostgres failed; falling back to file/empty',
        error instanceof Error ? error.message : error,
      )
    }
  }
  return rememberCache(await readFromFile())
}

async function writeUnlocked(store: StoreShape, mutation?: StoreMutation): Promise<void> {
  const pool = await getArticlesPool()
  if (pool) {
    if (mutation) await applyStoreMutation(pool, mutation)
    else await writeToPostgres(pool, store)
    rememberCache(store)
    return
  }
  if (isProductionRuntime()) {
    throw new Error(
      'Article store needs DATABASE_URL (Postgres) in production. Local file writes are disabled on Vercel.',
    )
  }
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8')
  rememberCache(store)
}

/** Serialize read→mutate→write so concurrent desk saves cannot drop each other. */
async function withArticleMutation<T>(fn: () => Promise<T>): Promise<T> {
  let result!: T
  let error: unknown
  writeLock = writeLock.then(async () => {
    try {
      // Bypass short TTL so we mutate the latest inventory.
      cache = null
      cacheAt = 0
      result = await fn()
    } catch (err) {
      error = err
    }
  })
  await writeLock
  if (error) throw error
  return result
}

function genId(): string {
  return `art-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function now(): string {
  return new Date().toISOString()
}

function estimateReadingMinutes(blocks: ArticleBlock[]): number {
  const words = blocks
    .map((b) => {
      if (b.type === 'paragraph' || b.type === 'heading2' || b.type === 'heading3') return b.text
      if (b.type === 'pullQuote') return b.quoteNe
      if (b.type === 'list') return b.items.join(' ')
      return ''
    })
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

// --- Public CRUD API ---

export async function listArticles(
  opts: {
    category?: string
    locale?: Locale
    status?: StoredArticle['workflowStage']
    limit?: number
    offset?: number
    breaking?: boolean
  } = {},
): Promise<{ items: StoredArticle[]; total: number }> {
  const store = await read()
  let items = store.articles
  if (opts.category) items = items.filter((a) => a.categorySlug === opts.category)
  if (opts.locale === 'en') items = items.filter((a) => articleHasPublicEnglish(a))
  if (opts.status) items = items.filter((a) => a.workflowStage === opts.status)
  else items = items.filter((a) => PUBLIC_WORKFLOW_STAGES.includes(a.workflowStage))
  if (opts.breaking) items = items.filter((a) => a.isBreaking)
  items = items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  const total = items.length
  if (opts.limit !== undefined) {
    const offset = opts.offset ?? 0
    items = items.slice(offset, offset + opts.limit)
  }
  return { items, total }
}

export async function listArticlesForAdmin(
  opts: {
    limit?: number
    offset?: number
    status?: StoredArticle['workflowStage']
    q?: string
  } = {},
): Promise<{ items: StoredArticle[]; total: number }> {
  const pool = await getArticlesPool()
  if (pool) {
    try {
      const clauses: string[] = []
      const params: unknown[] = []
      if (opts.status) {
        params.push(opts.status)
        clauses.push(`workflow_stage = $${params.length}`)
      }
      const q = opts.q?.trim()
      if (q) {
        params.push(`%${q}%`)
        const index = params.length
        clauses.push(`(
          document->>'titleNe' ILIKE $${index}
          OR COALESCE(document->>'titleEn', '') ILIKE $${index}
          OR slug ILIKE $${index}
          OR category_slug ILIKE $${index}
          OR COALESCE(document->>'deckNe', '') ILIKE $${index}
        )`)
      }
      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
      const count = await pool.query<{ total: string | number }>(
        `SELECT COUNT(*) AS total FROM nw_articles ${where}`,
        params,
      )

      const pageParams = [...params]
      let pagination = ''
      if (opts.limit !== undefined) {
        pageParams.push(Math.max(1, opts.limit))
        const limitIndex = pageParams.length
        pageParams.push(Math.max(0, opts.offset ?? 0))
        const offsetIndex = pageParams.length
        pagination = `LIMIT $${limitIndex} OFFSET $${offsetIndex}`
      }
      const result = await pool.query<{ document: unknown }>(
        `SELECT document FROM nw_articles ${where} ORDER BY updated_at DESC ${pagination}`,
        pageParams,
      )
      return {
        items: normalizeArticles(
          result.rows
            .map((row) => parseDocument(row.document))
            .filter((article): article is StoredArticle => Boolean(article)),
        ),
        total: Number(count.rows[0]?.total ?? 0),
      }
    } catch (error) {
      console.error(
        '[json-store] direct admin article query failed; falling back to cached inventory',
        error instanceof Error ? error.message : error,
      )
    }
  }

  const store = await read()
  let items = store.articles
  if (opts.status) items = items.filter((a) => a.workflowStage === opts.status)
  const q = opts.q?.trim().toLowerCase()
  if (q) {
    items = items.filter((article) => {
      const hay =
        `${article.titleNe} ${article.titleEn ?? ''} ${article.slug} ${article.categorySlug} ${article.deckNe ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }
  items = items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const total = items.length
  if (opts.limit !== undefined) {
    const offset = opts.offset ?? 0
    items = items.slice(offset, offset + opts.limit)
  }
  return { items, total }
}

export async function getAdminDashboardSnapshot(): Promise<{
  publishedTotal: number
  scheduledCount: number
  breakingCount: number
  recentPublished: StoredArticle[]
}> {
  const pool = await getArticlesPool()
  if (pool) {
    try {
      const stats = await pool.query<{
        published_total: string | number
        scheduled_count: string | number
        breaking_count: string | number
      }>(`
        SELECT
          COUNT(*) FILTER (WHERE workflow_stage IN ('published', 'updated')) AS published_total,
          COUNT(*) FILTER (WHERE workflow_stage = 'scheduled') AS scheduled_count,
          COUNT(*) FILTER (
            WHERE workflow_stage IN ('published', 'updated')
              AND COALESCE((document->>'isBreaking')::boolean, false)
          ) AS breaking_count
        FROM nw_articles
      `)
      const recent = await pool.query<{ document: unknown }>(`
        SELECT document
        FROM nw_articles
        WHERE workflow_stage IN ('published', 'updated')
        ORDER BY published_at DESC NULLS LAST
        LIMIT 8
      `)
      const row = stats.rows[0]
      return {
        publishedTotal: Number(row?.published_total ?? 0),
        scheduledCount: Number(row?.scheduled_count ?? 0),
        breakingCount: Number(row?.breaking_count ?? 0),
        recentPublished: normalizeArticles(
          recent.rows
            .map((item) => parseDocument(item.document))
            .filter((article): article is StoredArticle => Boolean(article)),
        ),
      }
    } catch (error) {
      console.error(
        '[json-store] dashboard aggregate query failed; falling back to cached inventory',
        error instanceof Error ? error.message : error,
      )
    }
  }

  const store = await read()
  const published = store.articles
    .filter((article) => PUBLIC_WORKFLOW_STAGES.includes(article.workflowStage))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

  return {
    publishedTotal: published.length,
    scheduledCount: store.articles.filter((story) => story.workflowStage === 'scheduled').length,
    breakingCount: published.filter((story) => story.isBreaking).length,
    recentPublished: published.slice(0, 8),
  }
}

export async function getArticleBySlug(
  category: string,
  slug: string,
  _locale: Locale,
): Promise<StoredArticle | null> {
  const store = await read()
  const article = store.articles.find((a) => a.categorySlug === category && a.slug === slug)
  if (!article) return null
  if (!PUBLIC_WORKFLOW_STAGES.includes(article.workflowStage)) return null
  return article
}

export async function getArticleById(id: string): Promise<StoredArticle | null> {
  const store = await read()
  return store.articles.find((a) => a.id === id) ?? null
}

export async function findArticleForAdmin(identifier: string): Promise<StoredArticle | null> {
  const store = await read()
  return store.articles.find((a) => a.id === identifier || a.slug === identifier) ?? null
}

export async function getHomepageData(): Promise<{
  lead: StoredArticle | null
  featured: StoredArticle[]
  secondary: StoredArticle[]
  breaking: StoredArticle[]
  sections: { categorySlug: string; articles: StoredArticle[] }[]
}> {
  const store = await read()
  const published = store.articles
    .filter((a) => PUBLIC_WORKFLOW_STAGES.includes(a.workflowStage))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

  const breaking = published.filter((a) => a.isBreaking).slice(0, 5)
  const now = Date.now()
  const placementActive = (a: StoredArticle) => {
    if (!a.featuredExpiresAt) return true
    const expires = Date.parse(a.featuredExpiresAt)
    return Number.isNaN(expires) || expires > now
  }

  const lead =
    published.find((a) => a.isFeatured === 'lead' && placementActive(a)) ?? published[0] ?? null
  const leadId = lead?.id

  let featured = published
    .filter((a) => a.isFeatured === 'featured' && a.id !== leadId && placementActive(a))
    .slice(0, 6)
  let secondary = published
    .filter((a) => a.isFeatured === 'secondary' && a.id !== leadId && placementActive(a))
    .slice(0, 8)

  const reserved = new Set(
    [leadId, ...featured.map((a) => a.id), ...secondary.map((a) => a.id)].filter(Boolean) as string[],
  )

  if (featured.length < 4) {
    const fill = published
      .filter(
        (a) =>
          a.id !== leadId &&
          !reserved.has(a.id) &&
          (a.editorPick || a.exclusive || Boolean(a.heroImageUrl)),
      )
      .slice(0, 6 - featured.length)
    for (const article of fill) {
      reserved.add(article.id)
      featured.push(article)
    }
  }

  if (secondary.length < 5) {
    const fill = published.filter((a) => a.id !== leadId && !reserved.has(a.id)).slice(0, 8 - secondary.length)
    for (const article of fill) {
      reserved.add(article.id)
      secondary.push(article)
    }
  }

  const byCategory = new Map<string, StoredArticle[]>()
  for (const a of published) {
    if (a.id === leadId || reserved.has(a.id)) continue
    const list = byCategory.get(a.categorySlug) ?? []
    list.push(a)
    byCategory.set(a.categorySlug, list)
  }
  const sections = Array.from(byCategory.entries())
    .map(([categorySlug, articles]) => ({ categorySlug, articles: articles.slice(0, 4) }))
    .filter((section) => section.articles.length > 0)
    .slice(0, 6)

  return { lead, featured, secondary, breaking, sections }
}

export async function createArticle(input: {
  slug: string
  categorySlug: string
  titleNe: string
  titleEn?: string
  deckNe?: string
  deckEn?: string
  homepageTeaserNe?: string
  socialCopyNe?: string
  reportingLocation?: string
  sourceNote?: string
  editorPitch?: string
  mediaReferenceUrl?: string
  bodyNe: ArticleBlock[]
  bodyEn?: ArticleBlock[]
  heroImageUrl?: string
  heroImageAlt?: string
  heroCaptionNe?: string
  heroCredit?: string
  authorIds: string[]
  tagSlugs: string[]
  isBreaking?: boolean
  isFeatured?: 'lead' | 'featured' | 'secondary' | 'none'
  featuredExpiresAt?: string
  workflowStage?: StoredArticle['workflowStage']
  publishedAt?: string
  sourceType?: 'original' | 'aggregated' | 'wire'
  sourceName?: string
  sourceUrl?: string
  seoTitleNe?: string
  seoDescriptionNe?: string
  noIndex?: boolean
  includeInNewsSitemap?: boolean
  aiSummary?: string
  premium?: boolean
  commentsEnabled?: boolean
  locale?: Locale
  englishStatus?: StoredArticle['englishStatus']
  createdBy: string
  province?: string
  district?: string
  exclusive?: boolean
  editorPick?: boolean
  dataStory?: boolean
  factCheckStatus?: StoredArticle['factCheckStatus']
}): Promise<StoredArticle> {
  return withArticleMutation(async () => {
  const store = await read()
  const dup = store.articles.find(
    (a) => a.categorySlug === input.categorySlug && a.slug === input.slug,
  )
  if (dup) throw new Error('स्लग पहिले नै अवस्थित छ। अर्को स्लग राख्नुहोस्।')

  const now_iso = now()
  const stage = input.workflowStage ?? 'draft'
  if (stage === 'scheduled') {
    if (!input.publishedAt || !Number.isFinite(Date.parse(input.publishedAt))) {
      throw new Error('तालिकाबद्ध प्रकाशनका लागि मान्य भविष्यको मिति आवश्यक छ।')
    }
    if (Date.parse(input.publishedAt) <= Date.now()) {
      throw new Error('तालिका मिति भविष्यमा हुनुपर्छ।')
    }
  }
  const publishAt =
    stage === 'scheduled'
      ? new Date(input.publishedAt!).toISOString()
      : stage === 'published' || stage === 'updated'
        ? now_iso
        : input.publishedAt && Number.isFinite(Date.parse(input.publishedAt))
          ? new Date(input.publishedAt).toISOString()
          : now_iso
  const englishStatus = normalizeEnglishStatus(input.englishStatus)
  assertEnglishPublicationReady({
    englishStatus,
    titleEn: input.titleEn,
    bodyEn: input.bodyEn,
  })
  const sourceType = input.sourceType ?? 'original'
  assertSourceAttribution({
    sourceType,
    sourceName: input.sourceName,
    sourceUrl: input.sourceUrl,
  })

  const article: StoredArticle = {
    id: genId(),
    slug: input.slug,
    categorySlug: input.categorySlug,
    titleNe: input.titleNe,
    titleEn: input.titleEn,
    deckNe: input.deckNe,
    deckEn: input.deckEn,
    homepageTeaserNe: input.homepageTeaserNe,
    socialCopyNe: input.socialCopyNe,
    reportingLocation: input.reportingLocation,
    sourceNote: input.sourceNote,
    editorPitch: input.editorPitch,
    mediaReferenceUrl: input.mediaReferenceUrl,
    bodyNe: input.bodyNe,
    bodyEn: input.bodyEn,
    heroImageUrl: input.heroImageUrl,
    heroImageAlt: input.heroImageAlt,
    heroCaptionNe: input.heroCaptionNe,
    heroCredit: input.heroCredit,
    authorIds: input.authorIds,
    tagSlugs: input.tagSlugs,
    publishedAt: publishAt,
    updatedAt: now_iso,
    isBreaking: input.isBreaking ?? false,
    isFeatured: input.isFeatured ?? 'none',
    featuredExpiresAt: input.featuredExpiresAt,
    workflowStage: stage,
    sourceType,
    sourceName: input.sourceName,
    sourceUrl: input.sourceUrl,
    seoTitleNe: input.seoTitleNe,
    seoDescriptionNe: input.seoDescriptionNe,
    noIndex: input.noIndex ?? !PUBLIC_WORKFLOW_STAGES.includes(stage),
    includeInNewsSitemap:
      input.includeInNewsSitemap ?? PUBLIC_WORKFLOW_STAGES.includes(stage),
    aiSummary: input.aiSummary,
    premium: input.premium ?? false,
    commentsEnabled: input.commentsEnabled ?? false,
    locale: input.locale ?? 'ne',
    englishStatus,
    hasEnglish: englishStatus === 'published',
    readingMinutes: estimateReadingMinutes(input.bodyNe),
    createdBy: input.createdBy,
    updatedBy: input.createdBy,
    province: input.province,
    district: input.district,
    exclusive: input.exclusive,
    editorPick: input.editorPick,
    dataStory: input.dataStory,
    factCheckStatus: input.factCheckStatus,
  }
  await writeUnlocked(
    { ...store, articles: [...store.articles, article] },
    { type: 'upsert', article },
  )
  return article
  })
}

export async function updateArticle(
  id: string,
  patch: Partial<Omit<StoredArticle, 'id' | 'createdBy'>>,
  updatedBy: string,
  actorRole?: NewsroomRole,
): Promise<StoredArticle | null> {
  return withArticleMutation(async () => {
  const store = await read()
  const idx = store.articles.findIndex((a) => a.id === id)
  if (idx === -1) return null
  const existing = store.articles[idx]!
  const nextStage = patch.workflowStage ?? existing.workflowStage
  const nextSlug = patch.slug ?? existing.slug
  const nextCategory = patch.categorySlug ?? existing.categorySlug

  if (
    (patch.slug !== undefined && patch.slug !== existing.slug) ||
    (patch.categorySlug !== undefined && patch.categorySlug !== existing.categorySlug)
  ) {
    const dup = store.articles.find(
      (a) => a.id !== id && a.categorySlug === nextCategory && a.slug === nextSlug,
    )
    if (dup) throw new Error('स्लग पहिले नै अवस्थित छ। अर्को स्लग राख्नुहोस्।')
  }

  if (actorRole && patch.workflowStage && patch.workflowStage !== existing.workflowStage) {
    assertWorkflowTransition({
      role: actorRole,
      from: existing.workflowStage,
      to: patch.workflowStage,
    })
  }

  if (nextStage === 'scheduled') {
    const at = patch.publishedAt ?? existing.publishedAt
    if (!at || !Number.isFinite(Date.parse(at))) {
      throw new Error('तालिकाबद्ध प्रकाशनका लागि मान्य भविष्यको मिति आवश्यक छ।')
    }
    // Allow existing future schedules; only reject when newly setting a past time.
    if (patch.publishedAt && Date.parse(patch.publishedAt) <= Date.now()) {
      throw new Error('तालिका मिति भविष्यमा हुनुपर्छ।')
    }
  }

  const now_iso = now()
  const firstPublish =
    patch.workflowStage === 'published' && !isPublicWorkflowStage(existing.workflowStage)
  const republish =
    patch.workflowStage === 'published' && isPublicWorkflowStage(existing.workflowStage)
  const unpublish =
    patch.workflowStage !== undefined &&
    !isPublicWorkflowStage(patch.workflowStage) &&
    isPublicWorkflowStage(existing.workflowStage)

  const nextEnglishStatus = normalizeEnglishStatus(
    patch.englishStatus ?? existing.englishStatus,
  )
  assertEnglishPublicationReady({
    englishStatus: nextEnglishStatus,
    titleEn: patch.titleEn ?? existing.titleEn,
    bodyEn: patch.bodyEn ?? existing.bodyEn,
  })
  const nextSourceType = patch.sourceType ?? existing.sourceType
  assertSourceAttribution({
    sourceType: nextSourceType,
    sourceName: patch.sourceName ?? existing.sourceName,
    sourceUrl: patch.sourceUrl ?? existing.sourceUrl,
  })

  const updated: StoredArticle = {
    ...existing,
    ...patch,
    sourceType: nextSourceType,
    id: existing.id,
    createdBy: existing.createdBy,
    updatedAt: now_iso,
    updatedBy,
    workflowStage: nextStage,
    publishedAt: firstPublish
      ? now_iso
      : republish
        ? existing.publishedAt
        : unpublish
          ? existing.publishedAt
          : patch.publishedAt ?? existing.publishedAt,
    noIndex:
      patch.noIndex ??
      (firstPublish || republish
        ? false
        : unpublish
          ? true
          : existing.noIndex),
    includeInNewsSitemap:
      patch.includeInNewsSitemap ??
      (firstPublish || republish
        ? true
        : unpublish
          ? false
          : existing.includeInNewsSitemap),
    englishStatus: nextEnglishStatus,
    hasEnglish: nextEnglishStatus === 'published',
    readingMinutes: estimateReadingMinutes(patch.bodyNe ?? existing.bodyNe),
  }
  const articles = [...store.articles]
  articles[idx] = updated
  await writeUnlocked({ ...store, articles }, { type: 'upsert', article: updated })

  const slugChanged =
    (patch.slug !== undefined && patch.slug !== existing.slug) ||
    (patch.categorySlug !== undefined && patch.categorySlug !== existing.categorySlug)
  if (slugChanged) {
    const { recordSlugRedirect } = await import('@/lib/content/slug-redirects')
    await recordSlugRedirect({
      fromCategory: existing.categorySlug,
      fromSlug: existing.slug,
      toCategory: updated.categorySlug,
      toSlug: updated.slug,
    }).catch((error) => {
      console.error('[slug-redirect]', error instanceof Error ? error.message : error)
    })
  }

  return updated
  })
}

export async function deleteArticle(id: string): Promise<boolean> {
  return withArticleMutation(async () => {
    const store = await read()
    const idx = store.articles.findIndex((a) => a.id === id)
    if (idx === -1) return false
    await writeUnlocked(
      { ...store, articles: store.articles.filter((article) => article.id !== id) },
      { type: 'delete', id },
    )
    return true
  })
}

export async function getArticleCounts(): Promise<{
  total: number
  published: number
  drafts: number
  breaking: number
}> {
  const store = await read()
  return {
    total: store.articles.length,
    published: store.articles.filter((a) => PUBLIC_WORKFLOW_STAGES.includes(a.workflowStage)).length,
    drafts: store.articles.filter((a) => !PUBLIC_WORKFLOW_STAGES.includes(a.workflowStage)).length,
    breaking: store.articles.filter(
      (a) => a.isBreaking && PUBLIC_WORKFLOW_STAGES.includes(a.workflowStage),
    ).length,
  }
}
