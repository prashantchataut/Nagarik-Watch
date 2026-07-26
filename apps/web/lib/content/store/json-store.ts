/**
 * Article store — Postgres (`nw_articles`) in production when DATABASE_URL is
 * set; local JSON file for development. Empty stores auto-seed original
 * Nagarik Watch starter articles (editable via /admin/articles). Never holds
 * scraped BBC / Online Khabar copy.
 */
import 'server-only'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { ArticleBlock, Locale, WorkflowStage } from '@nagarikwatch/db'
import { ensureOperationalSchema, isProductionRuntime, runSchemaStatements, type Queryable } from '@/lib/ops-db'
import { buildOriginalStarterArticles } from './seed-original'
import type { NewsroomRole } from '@/lib/admin-roles'
import {
  assertWorkflowTransition,
  isPublicWorkflowStage,
} from '@/lib/editorial/workflow-transitions'

const DATA_DIR = path.resolve(process.cwd(), 'data')
const STORE_FILE = path.join(DATA_DIR, 'articles.json')
const PUBLIC_WORKFLOW_STAGES: readonly WorkflowStage[] = ['published', 'updated']
const SCHEMA_KEY = 'nw-articles-v1'

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
  isFeatured: 'lead' | 'secondary' | 'none'
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

type StoreShape = {
  articles: StoredArticle[]
  version: number
}

let cache: StoreShape | null = null
let writeLock: Promise<void> = Promise.resolve()

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

/** Drop legacy short starters so the full art-ed-* edition is the public inventory. */
async function purgeLegacyStarterRows(pool: Queryable): Promise<void> {
  await pool.query(`DELETE FROM nw_articles WHERE id LIKE 'art-nw-%'`)
}

function withoutLegacyStarters(articles: StoredArticle[]): StoredArticle[] {
  return articles.filter((article) => !String(article.id).startsWith('art-nw-'))
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

async function readFromPostgres(pool: Queryable): Promise<StoreShape> {
  await purgeLegacyStarterRows(pool)
  const result = await pool.query<{ document: unknown }>(`SELECT document FROM nw_articles`)
  const articles = withoutLegacyStarters(
    result.rows.map((row) => parseDocument(row.document)).filter((a): a is StoredArticle => Boolean(a)),
  )

  if (articles.length === 0) {
    const seeded = buildOriginalStarterArticles()
    await insertSeedArticles(pool, seeded)
    return { articles: seeded, version: 1 }
  }

  const missing = missingSeedArticles(articles)
  if (missing.length > 0) {
    await insertSeedArticles(pool, missing)
    return { articles: [...articles, ...missing], version: 1 }
  }
  return { articles, version: 1 }
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

async function readFromFile(): Promise<StoreShape> {
  try {
    const raw = await fs.readFile(STORE_FILE, 'utf-8')
    const parsed = JSON.parse(raw) as StoreShape
    const existing = withoutLegacyStarters(parsed.articles ?? [])
    if (!existing.length) {
      const seeded = buildOriginalStarterArticles()
      const store = { articles: seeded, version: 1 }
      await fs.mkdir(DATA_DIR, { recursive: true })
      await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8')
      return store
    }
    const missing = missingSeedArticles(existing)
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
    const seeded = buildOriginalStarterArticles()
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
  if (cache) return cache
  const pool = await getArticlesPool()
  if (pool) {
    cache = await readFromPostgres(pool)
    return cache
  }
  cache = await readFromFile()
  return cache
}

async function write(store: StoreShape): Promise<void> {
  writeLock = writeLock.then(async () => {
    const pool = await getArticlesPool()
    if (pool) {
      await writeToPostgres(pool, store)
      cache = store
      return
    }
    if (isProductionRuntime()) {
      throw new Error(
        'Article store needs DATABASE_URL (Postgres) in production. Local file writes are disabled on Vercel.',
      )
    }
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8')
    cache = store
  })
  await writeLock
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
  if (opts.locale === 'en') items = items.filter((a) => a.hasEnglish)
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
  opts: { limit?: number; offset?: number; status?: StoredArticle['workflowStage'] } = {},
): Promise<{ items: StoredArticle[]; total: number }> {
  const store = await read()
  let items = store.articles
  if (opts.status) items = items.filter((a) => a.workflowStage === opts.status)
  items = items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const total = items.length
  if (opts.limit !== undefined) {
    const offset = opts.offset ?? 0
    items = items.slice(offset, offset + opts.limit)
  }
  return { items, total }
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
  secondary: StoredArticle[]
  breaking: StoredArticle[]
  sections: { categorySlug: string; articles: StoredArticle[] }[]
}> {
  const store = await read()
  const published = store.articles
    .filter((a) => PUBLIC_WORKFLOW_STAGES.includes(a.workflowStage))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

  const breaking = published.filter((a) => a.isBreaking).slice(0, 5)
  const lead = published.find((a) => a.isFeatured === 'lead') ?? published[0] ?? null
  const secondary = published.filter((a) => a.id !== lead?.id).slice(0, 8)

  const byCategory = new Map<string, StoredArticle[]>()
  for (const a of published) {
    if (a.id === lead?.id) continue
    const list = byCategory.get(a.categorySlug) ?? []
    list.push(a)
    byCategory.set(a.categorySlug, list)
  }
  const sections = Array.from(byCategory.entries())
    .map(([categorySlug, articles]) => ({ categorySlug, articles: articles.slice(0, 4) }))
    .slice(0, 6)

  return { lead, secondary, breaking, sections }
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
  isFeatured?: 'lead' | 'secondary' | 'none'
  workflowStage?: StoredArticle['workflowStage']
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
  createdBy: string
  province?: string
  district?: string
  exclusive?: boolean
  editorPick?: boolean
  dataStory?: boolean
  factCheckStatus?: StoredArticle['factCheckStatus']
}): Promise<StoredArticle> {
  const store = await read()
  const dup = store.articles.find(
    (a) => a.categorySlug === input.categorySlug && a.slug === input.slug,
  )
  if (dup) throw new Error('स्लग पहिले नै अवस्थित छ। अर्को स्लग राख्नुहोस्।')

  const now_iso = now()
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
    publishedAt: now_iso,
    updatedAt: now_iso,
    isBreaking: input.isBreaking ?? false,
    isFeatured: input.isFeatured ?? 'none',
    workflowStage: input.workflowStage ?? 'draft',
    sourceType: input.sourceType ?? 'original',
    sourceName: input.sourceName,
    sourceUrl: input.sourceUrl,
    seoTitleNe: input.seoTitleNe,
    seoDescriptionNe: input.seoDescriptionNe,
    noIndex: input.noIndex ?? !PUBLIC_WORKFLOW_STAGES.includes(input.workflowStage ?? 'draft'),
    includeInNewsSitemap:
      input.includeInNewsSitemap ?? PUBLIC_WORKFLOW_STAGES.includes(input.workflowStage ?? 'draft'),
    aiSummary: input.aiSummary,
    premium: input.premium ?? false,
    commentsEnabled: input.commentsEnabled ?? true,
    locale: input.locale ?? 'ne',
    hasEnglish: Boolean(input.titleEn && input.bodyEn && input.bodyEn.length > 0),
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
  await write({ ...store, articles: [...store.articles, article] })
  return article
}

export async function updateArticle(
  id: string,
  patch: Partial<Omit<StoredArticle, 'id' | 'createdBy'>>,
  updatedBy: string,
  actorRole?: NewsroomRole,
): Promise<StoredArticle | null> {
  const store = await read()
  const idx = store.articles.findIndex((a) => a.id === id)
  if (idx === -1) return null
  const existing = store.articles[idx]!
  const nextStage = patch.workflowStage ?? existing.workflowStage

  if (actorRole && patch.workflowStage && patch.workflowStage !== existing.workflowStage) {
    assertWorkflowTransition({
      role: actorRole,
      from: existing.workflowStage,
      to: patch.workflowStage,
    })
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

  const updated: StoredArticle = {
    ...existing,
    ...patch,
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
    hasEnglish: Boolean(
      (patch.titleEn ?? existing.titleEn) && (patch.bodyEn ?? existing.bodyEn)?.length,
    ),
    readingMinutes: estimateReadingMinutes(patch.bodyNe ?? existing.bodyNe),
  }
  const articles = [...store.articles]
  articles[idx] = updated
  await write({ ...store, articles })
  return updated
}

export async function deleteArticle(id: string): Promise<boolean> {
  const store = await read()
  const idx = store.articles.findIndex((a) => a.id === id)
  if (idx === -1) return false
  await write({ ...store, articles: store.articles.filter((article) => article.id !== id) })
  return true
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
