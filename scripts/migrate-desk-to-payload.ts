#!/usr/bin/env node
/**
 * Migrate soft-desk articles (Postgres nw_articles) into Payload CMS.
 *
 * Dry-run by default. Does not flip CONTENT_SOURCE — operators cut over after
 * verifying counts and a sample publish → public path.
 *
 * Usage (repo root):
 *   pnpm exec tsx scripts/migrate-desk-to-payload.ts
 *   pnpm exec tsx scripts/migrate-desk-to-payload.ts --apply
 *   pnpm exec tsx scripts/migrate-desk-to-payload.ts --apply --limit=20
 *
 * Required env:
 *   DATABASE_URL
 *   PAYLOAD_PUBLIC_SERVER_URL
 *   PAYLOAD_API_TOKEN  (service account that can create categories/tags/authors/articles)
 */
import pg from 'pg'

type DeskArticle = {
  id: string
  slug: string
  categorySlug: string
  titleNe: string
  titleEn?: string
  deckNe?: string
  deckEn?: string
  homepageTeaserNe?: string
  socialCopyNe?: string
  bodyNe: unknown[]
  bodyEn?: unknown[]
  authorIds?: string[]
  tagSlugs?: string[]
  publishedAt?: string
  updatedAt?: string
  workflowStage?: string
  sourceType?: string
  sourceName?: string
  sourceUrl?: string
  isBreaking?: boolean
  englishStatus?: string
  noIndex?: boolean
  includeInNewsSitemap?: boolean
  premium?: boolean
  commentsEnabled?: boolean
  locale?: string
  province?: string
  district?: string
  exclusive?: boolean
  editorPick?: boolean
  dataStory?: boolean
  readingMinutes?: number
  heroImageUrl?: string
  heroImageAlt?: string
  heroCaptionNe?: string
  heroCredit?: string
  seoTitleNe?: string
  seoDescriptionNe?: string
}

type PayloadDoc = { id: string | number; slug?: string; email?: string }

const apply = process.argv.includes('--apply')
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
const limit = limitArg ? Number(limitArg.split('=')[1]) : undefined

function env(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required`)
  return value
}

function payloadBase(): string {
  return env('PAYLOAD_PUBLIC_SERVER_URL').replace(/\/$/, '')
}

function payloadHeaders(): HeadersInit {
  return {
    authorization: `users API-Key ${env('PAYLOAD_API_TOKEN')}`,
    'content-type': 'application/json',
    accept: 'application/json',
  }
}

async function payloadJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${payloadBase()}${path}`, {
    ...init,
    headers: { ...payloadHeaders(), ...(init?.headers ?? {}) },
  })
  const body = (await response.json().catch(() => ({}))) as T & {
    errors?: Array<{ message?: string }>
    message?: string
  }
  if (!response.ok) {
    throw new Error(
      body.errors?.[0]?.message || body.message || `Payload ${response.status} for ${path}`,
    )
  }
  return body
}

async function findByField(
  collection: 'categories' | 'tags' | 'authors' | 'articles',
  field: string,
  value: string,
): Promise<PayloadDoc | null> {
  const params = new URLSearchParams({ limit: '1', depth: '0' })
  params.set(`where[${field}][equals]`, value)
  const result = await payloadJson<{ docs?: PayloadDoc[] }>(
    `/api/${collection}?${params.toString()}`,
  )
  return result.docs?.[0] ?? null
}

async function ensureCategory(slug: string): Promise<string> {
  const existing = await findByField('categories', 'slug', slug)
  if (existing) return String(existing.id)
  if (!apply) return `dry-run-category:${slug}`
  const created = await payloadJson<PayloadDoc>('/api/categories', {
    method: 'POST',
    body: JSON.stringify({
      slug,
      nameNe: slug,
      nameEn: slug,
      showInNav: true,
      navOrder: 99,
    }),
  })
  return String(created.id)
}

async function ensureTag(slug: string): Promise<string> {
  const existing = await findByField('tags', 'slug', slug)
  if (existing) return String(existing.id)
  if (!apply) return `dry-run-tag:${slug}`
  const created = await payloadJson<PayloadDoc>('/api/tags', {
    method: 'POST',
    body: JSON.stringify({
      slug,
      nameNe: slug,
      nameEn: slug,
    }),
  })
  return String(created.id)
}

async function ensureAuthor(idOrSlug: string): Promise<string | null> {
  const slug = idOrSlug.replace(/^author[_-]?/i, '').slice(0, 64) || idOrSlug
  const bySlug = await findByField('authors', 'slug', slug)
  if (bySlug) return String(bySlug.id)
  const byIdSlug = await findByField('authors', 'slug', idOrSlug)
  if (byIdSlug) return String(byIdSlug.id)
  if (!apply) return `dry-run-author:${slug}`
  const created = await payloadJson<PayloadDoc>('/api/authors', {
    method: 'POST',
    body: JSON.stringify({
      name: slug,
      slug,
      role: 'staff',
      isActive: true,
    }),
  })
  return String(created.id)
}

function publicWorkflow(stage: string | undefined): {
  workflowStage: string
  status: 'draft' | 'published'
} {
  if (stage === 'published' || stage === 'updated') {
    return { workflowStage: stage, status: 'published' }
  }
  if (stage === 'scheduled') {
    return { workflowStage: 'scheduled', status: 'draft' }
  }
  return { workflowStage: stage && stage.length ? stage : 'draft', status: 'draft' }
}

async function upsertArticle(article: DeskArticle): Promise<'created' | 'updated' | 'skipped'> {
  const existing = await findByField('articles', 'slug', article.slug)
  const categoryId = await ensureCategory(article.categorySlug)
  const tagIds = await Promise.all((article.tagSlugs ?? []).map((slug) => ensureTag(slug)))
  const authorIds = (
    await Promise.all((article.authorIds ?? []).map((id) => ensureAuthor(id)))
  ).filter((id): id is string => Boolean(id))

  const { workflowStage, status } = publicWorkflow(article.workflowStage)
  const body = {
    titleNe: article.titleNe,
    titleEn: article.titleEn,
    slug: article.slug,
    deckNe: article.deckNe,
    deckEn: article.deckEn,
    homepageTeaserNe: article.homepageTeaserNe,
    socialCopyNe: article.socialCopyNe,
    bodyNe: Array.isArray(article.bodyNe) ? article.bodyNe : [],
    bodyEn: Array.isArray(article.bodyEn) ? article.bodyEn : undefined,
    category: categoryId.startsWith('dry-run-') ? undefined : categoryId,
    tags: tagIds.filter((id) => !String(id).startsWith('dry-run-')).map((id) => ({ tag: id })),
    authors: authorIds
      .filter((id) => !String(id).startsWith('dry-run-'))
      .map((id) => ({ author: id })),
    workflowStage,
    sourceType: article.sourceType ?? 'original',
    sourceName: article.sourceName,
    sourceUrl: article.sourceUrl,
    isBreaking: Boolean(article.isBreaking),
    englishStatus: article.englishStatus ?? 'none',
    publishAt: article.publishedAt,
    noIndex: Boolean(article.noIndex),
    includeInNewsSitemap: article.includeInNewsSitemap !== false && status === 'published',
    premium: Boolean(article.premium),
    commentsEnabled: article.commentsEnabled !== false,
    locale: article.locale === 'en' ? 'en' : 'ne',
    province: article.province,
    district: article.district,
    exclusive: Boolean(article.exclusive),
    editorPick: Boolean(article.editorPick),
    dataStory: Boolean(article.dataStory),
    readingMinutes: article.readingMinutes,
    seoTitle: article.seoTitleNe,
    seoDescription: article.seoDescriptionNe,
    heroCaption: article.heroCaptionNe,
    heroCredit: article.heroCredit,
    _status: status,
  }

  if (!apply) {
    console.log(
      `[dry-run] ${existing ? 'update' : 'create'} ${article.categorySlug}/${article.slug} (${workflowStage}/${status})`,
    )
    return existing ? 'updated' : 'created'
  }

  if (existing) {
    await payloadJson(
      `/api/articles/${encodeURIComponent(String(existing.id))}?draft=${status === 'draft'}`,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
    )
    return 'updated'
  }

  await payloadJson(`/api/articles?draft=${status === 'draft'}`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return 'created'
}

async function loadDeskArticles(): Promise<DeskArticle[]> {
  const url = env('DATABASE_URL')
  const pool = new pg.Pool({ connectionString: url, max: 1 })
  try {
    const result = await pool.query<{ document: DeskArticle | string }>(
      `SELECT document FROM nw_articles ORDER BY updated_at DESC`,
    )
    const articles: DeskArticle[] = []
    for (const row of result.rows) {
      const doc =
        typeof row.document === 'string' ? (JSON.parse(row.document) as DeskArticle) : row.document
      if (!doc?.slug || !doc?.categorySlug || !doc?.titleNe) continue
      articles.push(doc)
    }
    return Number.isFinite(limit) ? articles.slice(0, limit) : articles
  } finally {
    await pool.end()
  }
}

async function main() {
  console.log(`migrate-desk-to-payload (${apply ? 'APPLY' : 'dry-run'})`)
  const articles = await loadDeskArticles()
  console.log(`desk articles loaded: ${articles.length}`)

  let created = 0
  let updated = 0
  let skipped = 0
  let failed = 0

  for (const article of articles) {
    try {
      const result = await upsertArticle(article)
      if (result === 'created') created += 1
      else if (result === 'updated') updated += 1
      else skipped += 1
    } catch (error) {
      failed += 1
      console.error(
        `FAIL ${article.categorySlug}/${article.slug}:`,
        error instanceof Error ? error.message : error,
      )
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: apply ? 'apply' : 'dry-run',
        total: articles.length,
        created,
        updated,
        skipped,
        failed,
        next: apply
          ? 'Verify sample article in Payload, then set CONTENT_SOURCE=payload on web and redeploy.'
          : 'Re-run with --apply after reviewing the plan.',
      },
      null,
      2,
    ),
  )
  if (failed > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
