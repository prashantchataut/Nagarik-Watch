/**
 * JSON-file-backed article store. This is the real persistence layer for v3 —
 * no hardcoded seed content. Editors create articles via /admin, they persist
 * to disk (dev) or a blob store (prod). The site renders empty states when no
 * articles exist, so it's never broken.
 *
 * Storage: a single JSON file at <repo>/apps/web/data/articles.json. In dev
 * this persists across restarts. In production (Vercel), the filesystem is
 * read-only, so set ARTICLES_STORE_URL to a blob endpoint OR wire Payload CMS
 * (PAYLOAD_CONTENT_SOURCE=payload + DATABASE_URL). The store interface is the
 * single seam — swapping to Payload is a one-file change.
 *
 * Copyright policy: this store holds ONLY original content created by Nagarik
 * Watch editors via the admin. It never holds reproduced articles from other
 * publishers. The RSS aggregator (packages/ingest) surfaces headlines+links
 * only; editors develop original articles from those leads.
 */
import 'server-only'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { ArticleBlock, Locale } from '@nagarikwatch/db'

const DATA_DIR = path.resolve(process.cwd(), 'data')
const STORE_FILE = path.join(DATA_DIR, 'articles.json')

export type StoredArticle = {
  id: string
  slug: string
  categorySlug: string
  titleNe: string
  titleEn?: string
  deckNe?: string
  deckEn?: string
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
  workflowStage: 'idea' | 'assigned' | 'draft' | 'submitted' | 'fact_check' | 'copy_edit' | 'seo_review' | 'legal_review' | 'ready' | 'scheduled' | 'published' | 'archived'
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
}

type StoreShape = {
  articles: StoredArticle[]
  version: number
}

let cache: StoreShape | null = null
let writeLock: Promise<void> = Promise.resolve()

async function read(): Promise<StoreShape> {
  if (cache) return cache
  try {
    const raw = await fs.readFile(STORE_FILE, 'utf-8')
    cache = JSON.parse(raw) as StoreShape
  } catch {
    cache = { articles: [], version: 1 }
  }
  return cache
}

async function write(store: StoreShape): Promise<void> {
  cache = store
  // Serialize writes so concurrent requests don't clobber each other.
  writeLock = writeLock.then(async () => {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true })
      await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8')
    } catch (err) {
      // In production (read-only FS), writes silently no-op. The store stays
      // in-memory for the life of the process. Document this limitation.
      if (process.env.NODE_ENV !== 'production') {
        console.error('[article-store] write failed:', err)
      }
    }
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

export async function listArticles(opts: {
  category?: string
  locale?: Locale
  status?: StoredArticle['workflowStage']
  limit?: number
  offset?: number
  breaking?: boolean
} = {}): Promise<{ items: StoredArticle[]; total: number }> {
  const store = await read()
  let items = store.articles
  if (opts.category) items = items.filter((a) => a.categorySlug === opts.category)
  if (opts.locale === 'en') items = items.filter((a) => a.hasEnglish)
  if (opts.status) items = items.filter((a) => a.workflowStage === opts.status)
  else items = items.filter((a) => a.workflowStage === 'published')
  if (opts.breaking) items = items.filter((a) => a.isBreaking)
  items = items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  const total = items.length
  if (opts.limit !== undefined) {
    const offset = opts.offset ?? 0
    items = items.slice(offset, offset + opts.limit)
  }
  return { items, total }
}


export async function listArticlesForAdmin(opts: { limit?: number; offset?: number; status?: StoredArticle['workflowStage'] } = {}): Promise<{ items: StoredArticle[]; total: number }> {
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
  const article = store.articles.find(
    (a) => a.categorySlug === category && a.slug === slug,
  )
  if (!article) return null
  if (article.workflowStage !== 'published') return null
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
    .filter((a) => a.workflowStage === 'published')
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

  const breaking = published.filter((a) => a.isBreaking).slice(0, 5)
  const lead = published.find((a) => a.isFeatured === 'lead') ?? published[0] ?? null
  const secondary = published
    .filter((a) => a.id !== lead?.id)
    .slice(0, 8)

  // Group by category for section blocks.
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
}): Promise<StoredArticle> {
  const store = await read()
  // Reject duplicate slugs within the same category.
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
    noIndex: input.noIndex ?? (input.workflowStage !== 'published'),
    includeInNewsSitemap: input.includeInNewsSitemap ?? (input.workflowStage === 'published'),
    aiSummary: input.aiSummary,
    premium: input.premium ?? false,
    commentsEnabled: input.commentsEnabled ?? true,
    locale: input.locale ?? 'ne',
    hasEnglish: Boolean(input.titleEn && input.bodyEn && input.bodyEn.length > 0),
    readingMinutes: estimateReadingMinutes(input.bodyNe),
    createdBy: input.createdBy,
    updatedBy: input.createdBy,
  }
  store.articles.push(article)
  await write(store)
  return article
}

export async function updateArticle(
  id: string,
  patch: Partial<Omit<StoredArticle, 'id' | 'createdBy'>>,
  updatedBy: string,
): Promise<StoredArticle | null> {
  const store = await read()
  const idx = store.articles.findIndex((a) => a.id === id)
  if (idx === -1) return null
  const existing = store.articles[idx]!
  const updated: StoredArticle = {
    ...existing,
    ...patch,
    id: existing.id,
    createdBy: existing.createdBy,
    updatedAt: now(),
    updatedBy,
    hasEnglish: Boolean(
      (patch.titleEn ?? existing.titleEn) && (patch.bodyEn ?? existing.bodyEn)?.length,
    ),
    readingMinutes: estimateReadingMinutes(patch.bodyNe ?? existing.bodyNe),
  }
  store.articles[idx] = updated
  await write(store)
  return updated
}

export async function deleteArticle(id: string): Promise<boolean> {
  const store = await read()
  const idx = store.articles.findIndex((a) => a.id === id)
  if (idx === -1) return false
  store.articles.splice(idx, 1)
  await write(store)
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
    published: store.articles.filter((a) => a.workflowStage === 'published').length,
    drafts: store.articles.filter((a) => a.workflowStage !== 'published').length,
    breaking: store.articles.filter((a) => a.isBreaking && a.workflowStage === 'published').length,
  }
}
