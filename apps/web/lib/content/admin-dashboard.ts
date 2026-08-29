import 'server-only'
import {
  declaredContentSource,
  isPayloadCanonical,
  payloadServerUrl,
} from '@/lib/content/payload-admin-client'
import { getAdminDashboardSnapshot as getStoreDashboardSnapshot } from '@/lib/content/store/json-store'

export type AdminDashboardStory = {
  id: string
  slug: string
  categorySlug: string
  titleNe: string
  publishedAt: string
}

export type AdminDashboardSnapshot = {
  publishedTotal: number
  scheduledCount: number
  breakingCount: number
  recentPublished: AdminDashboardStory[]
  source: 'payload' | 'json'
}

type PayloadArticle = {
  id?: string | number
  slug?: string
  titleNe?: string
  category?: { slug?: string } | string | number | null
  publishAt?: string
  updatedAt?: string
  createdAt?: string
}

type PayloadList<T> = {
  docs?: T[]
  totalDocs?: number
}

function payloadHeaders(): HeadersInit {
  const apiKey = process.env.PAYLOAD_API_TOKEN?.trim()
  if (!apiKey) {
    throw new Error('PAYLOAD_API_TOKEN is required for canonical newsroom dashboard metrics.')
  }
  return {
    accept: 'application/json',
    authorization: `users API-Key ${apiKey}`,
  }
}

async function payloadList<T>(params: URLSearchParams): Promise<PayloadList<T>> {
  const timeoutMs = Math.max(
    1_500,
    Math.min(10_000, Number(process.env.NW_PAYLOAD_ADMIN_TIMEOUT_MS ?? 4_000)),
  )
  const response = await fetch(`${payloadServerUrl()}/api/articles?${params.toString()}`, {
    headers: payloadHeaders(),
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  })
  const body = (await response.json().catch(() => ({}))) as PayloadList<T> & {
    errors?: Array<{ message?: string }>
    message?: string
  }
  if (!response.ok) {
    throw new Error(
      body.errors?.[0]?.message || body.message || `Payload dashboard query failed: ${response.status}`,
    )
  }
  return body
}

function publishedParams(limit: number): URLSearchParams {
  const params = new URLSearchParams({
    limit: String(limit),
    depth: '1',
    sort: '-publishAt',
  })
  params.set('where[_status][equals]', 'published')
  params.set('where[workflowStage][in]', 'published,updated')
  return params
}

function scheduledParams(): URLSearchParams {
  const params = new URLSearchParams({ limit: '1', depth: '0' })
  params.set('where[workflowStage][equals]', 'scheduled')
  return params
}

function breakingParams(): URLSearchParams {
  const params = publishedParams(1)
  params.set('where[isBreaking][equals]', 'true')
  return params
}

function publicationDate(article: PayloadArticle): string {
  for (const value of [article.publishAt, article.updatedAt, article.createdAt]) {
    if (!value) continue
    const timestamp = Date.parse(value)
    if (Number.isFinite(timestamp)) return new Date(timestamp).toISOString()
  }
  return '1970-01-01T00:00:00.000Z'
}

function categorySlug(article: PayloadArticle): string {
  if (article.category && typeof article.category === 'object') {
    return String(article.category.slug ?? '')
  }
  return ''
}

async function getPayloadDashboardSnapshot(): Promise<AdminDashboardSnapshot> {
  const [published, scheduled, breaking] = await Promise.all([
    payloadList<PayloadArticle>(publishedParams(8)),
    payloadList<PayloadArticle>(scheduledParams()),
    payloadList<PayloadArticle>(breakingParams()),
  ])

  return {
    publishedTotal: Number(published.totalDocs ?? published.docs?.length ?? 0),
    scheduledCount: Number(scheduled.totalDocs ?? scheduled.docs?.length ?? 0),
    breakingCount: Number(breaking.totalDocs ?? breaking.docs?.length ?? 0),
    recentPublished: (published.docs ?? []).map((article) => ({
      id: String(article.id ?? article.slug ?? ''),
      slug: String(article.slug ?? ''),
      categorySlug: categorySlug(article),
      titleNe: String(article.titleNe ?? ''),
      publishedAt: publicationDate(article),
    })),
    source: 'payload',
  }
}

export async function getCanonicalAdminDashboardSnapshot(): Promise<AdminDashboardSnapshot> {
  const source = declaredContentSource()
  if (source === 'payload') {
    if (!isPayloadCanonical()) {
      throw new Error(
        'Payload is the declared content authority but PAYLOAD_PUBLIC_SERVER_URL/PAYLOAD_ADMIN_URL is missing.',
      )
    }
    return getPayloadDashboardSnapshot()
  }

  const snapshot = await getStoreDashboardSnapshot()
  return {
    publishedTotal: snapshot.publishedTotal,
    scheduledCount: snapshot.scheduledCount,
    breakingCount: snapshot.breakingCount,
    recentPublished: snapshot.recentPublished.map((article) => ({
      id: article.id,
      slug: article.slug,
      categorySlug: article.categorySlug,
      titleNe: article.titleNe,
      publishedAt: article.publishedAt,
    })),
    source: 'json',
  }
}
