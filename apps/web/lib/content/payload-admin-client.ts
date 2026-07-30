import 'server-only'
import type { ArticleBlock } from '@nagarikwatch/db'

export function isPayloadCanonical(): boolean {
  const source = process.env.CONTENT_SOURCE?.trim() || process.env.PAYLOAD_CONTENT_SOURCE?.trim()
  if (source !== 'payload') return false
  // Only treat Payload as canonical when its URL is configured. Otherwise the
  // in-app Postgres/JSON article store remains the newsroom CMS.
  return Boolean(
    process.env.PAYLOAD_PUBLIC_SERVER_URL?.trim() || process.env.PAYLOAD_ADMIN_URL?.trim(),
  )
}

/** True when env asks for Payload but the public CMS URL is missing (misconfig). */
export function isPayloadSourceMisconfigured(): boolean {
  const source = process.env.CONTENT_SOURCE?.trim() || process.env.PAYLOAD_CONTENT_SOURCE?.trim()
  if (source !== 'payload') return false
  return !isPayloadCanonical()
}

export function payloadServerUrl(): string {
  const configured = process.env.PAYLOAD_PUBLIC_SERVER_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')
  if (process.env.NODE_ENV !== 'production') return 'http://localhost:3001'
  throw new Error('PAYLOAD_PUBLIC_SERVER_URL is required when Payload is canonical.')
}

export function payloadAdminUrl(path = ''): string {
  const configured = process.env.PAYLOAD_ADMIN_URL?.trim()
  const base = configured ? configured.replace(/\/$/, '') : `${payloadServerUrl()}/admin`
  return `${base}${path.startsWith('/') ? path : path ? `/${path}` : ''}`
}

export function payloadCollectionAdminUrl(collection: string, id?: string): string {
  const suffix = id
    ? `/collections/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`
    : `/collections/${encodeURIComponent(collection)}`
  return payloadAdminUrl(suffix)
}

export function assertLocalContentAdmin(): void {
  if (isPayloadCanonical()) {
    throw new Error(
      `Production content is managed in Payload CMS: ${payloadAdminUrl()}. The web admin shadow store is disabled.`,
    )
  }
}

type PayloadDoc = { id: string | number; slug?: string; email?: string }
type PayloadList<T> = { docs?: T[] }

function payloadHeaders(): HeadersInit {
  const apiKey = process.env.PAYLOAD_API_TOKEN?.trim()
  if (!apiKey) {
    throw new Error(
      'PAYLOAD_API_TOKEN is required for the journalist-to-Payload draft bridge. Use an API key belonging to a least-privilege Payload service account.',
    )
  }
  return {
    authorization: `users API-Key ${apiKey}`,
    'content-type': 'application/json',
  }
}

async function payloadJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${payloadServerUrl()}${path}`, {
    ...init,
    headers: { ...payloadHeaders(), ...(init?.headers ?? {}) },
    cache: 'no-store',
  })
  const body = (await response.json().catch(() => ({}))) as T & {
    errors?: Array<{ message?: string }>
    message?: string
  }
  if (!response.ok) {
    const message = body.errors?.[0]?.message || body.message || `Payload request failed: ${response.status}`
    throw new Error(message)
  }
  return body
}

async function findDocument(
  collection: 'categories' | 'authors' | 'tags',
  field: 'slug' | 'email',
  value: string,
): Promise<PayloadDoc | null> {
  const params = new URLSearchParams({ limit: '1', depth: '0' })
  params.set(`where[${field}][equals]`, value)
  const result = await payloadJson<PayloadList<PayloadDoc>>(
    `/api/${collection}?${params.toString()}`,
  )
  return result.docs?.[0] ?? null
}

export type PayloadJournalistDraftInput = {
  reporterEmail: string
  titleNe: string
  titleEn?: string
  slug: string
  categorySlug: string
  deckNe?: string
  bodyNe: ArticleBlock[]
  tagSlugs: string[]
  workflowStage: 'draft' | 'submitted'
  editorPitch?: string
  homepageTeaserNe?: string
  socialCopyNe?: string
  reportingLocation?: string
  sourceNote?: string
  mediaReferenceUrl?: string
  internalNotes?: string
  locale: 'ne' | 'en'
  notificationMode?: 'none' | 'followers' | 'breaking'
  notificationTagSlugs?: string[]
}

export async function createPayloadJournalistDraft(
  input: PayloadJournalistDraftInput,
): Promise<{ id: string; slug: string; workflowStage: string }> {
  const [category, author, tags] = await Promise.all([
    findDocument('categories', 'slug', input.categorySlug),
    findDocument('authors', 'email', input.reporterEmail),
    Promise.all(input.tagSlugs.map((slug) => findDocument('tags', 'slug', slug))),
  ])

  if (!category) {
    throw new Error(`Payload category not found for slug "${input.categorySlug}".`)
  }
  if (!author) {
    throw new Error(
      `No active Payload author profile matches ${input.reporterEmail}. Create the author profile before submitting a draft.`,
    )
  }

  const created = await payloadJson<PayloadDoc & { workflowStage?: string }>('/api/articles?draft=true', {
    method: 'POST',
    body: JSON.stringify({
      titleNe: input.titleNe,
      titleEn: input.titleEn,
      slug: input.slug,
      deckNe: input.deckNe,
      bodyNe: input.bodyNe,
      englishStatus: input.titleEn ? 'in_progress' : 'none',
      workflowStage: input.workflowStage,
      category: category.id,
      tags: tags.filter((tag): tag is PayloadDoc => Boolean(tag)).map((tag) => ({ tag: tag.id })),
      authors: [{ author: author.id }],
      sourceType: 'original',
      locale: input.locale,
      noIndex: true,
      includeInNewsSitemap: false,
      homepageTeaserNe: input.homepageTeaserNe,
      socialCopyNe: input.socialCopyNe,
      reportingLocation: input.reportingLocation,
      sourceNote: input.sourceNote,
      editorPitch: input.editorPitch,
      mediaReferenceUrl: input.mediaReferenceUrl,
      internalNotes: input.internalNotes,
      premium: false,
      commentsEnabled: true,
      notificationMode: input.notificationMode ?? 'none',
      notificationTagSlugs: input.notificationTagSlugs ?? [],
      _status: 'draft',
    }),
  })

  return {
    id: String(created.id),
    slug: String(created.slug ?? input.slug),
    workflowStage: String(created.workflowStage ?? input.workflowStage),
  }
}

export type PayloadJournalistDraft = {
  id: string
  slug: string
  titleNe: string
  titleEn?: string
  deckNe?: string
  categorySlug: string
  bodyNe: ArticleBlock[]
  tagSlugs: string[]
  workflowStage: string
  homepageTeaserNe?: string
  socialCopyNe?: string
  reportingLocation?: string
  sourceNote?: string
  editorPitch?: string
  mediaReferenceUrl?: string
  updatedAt?: string
}

type PayloadRelationship = string | number | { id?: string | number; slug?: string }
type PayloadDraftDoc = PayloadDoc & {
  titleNe?: string
  titleEn?: string
  deckNe?: string
  bodyNe?: ArticleBlock[]
  category?: PayloadRelationship
  tags?: Array<{ tag?: PayloadRelationship }>
  workflowStage?: string
  homepageTeaserNe?: string
  socialCopyNe?: string
  reportingLocation?: string
  sourceNote?: string
  editorPitch?: string
  mediaReferenceUrl?: string
  updatedAt?: string
}

function relationshipSlug(value: PayloadRelationship | undefined): string {
  return value && typeof value === 'object' ? String(value.slug ?? '') : ''
}

function draftFromPayload(doc: PayloadDraftDoc): PayloadJournalistDraft {
  return {
    id: String(doc.id),
    slug: String(doc.slug ?? ''),
    titleNe: String(doc.titleNe ?? ''),
    titleEn: doc.titleEn ? String(doc.titleEn) : undefined,
    deckNe: doc.deckNe ? String(doc.deckNe) : undefined,
    categorySlug: relationshipSlug(doc.category),
    bodyNe: Array.isArray(doc.bodyNe) ? doc.bodyNe : [],
    tagSlugs: (doc.tags ?? []).map((item) => relationshipSlug(item.tag)).filter(Boolean),
    workflowStage: String(doc.workflowStage ?? 'draft'),
    homepageTeaserNe: doc.homepageTeaserNe ? String(doc.homepageTeaserNe) : undefined,
    socialCopyNe: doc.socialCopyNe ? String(doc.socialCopyNe) : undefined,
    reportingLocation: doc.reportingLocation ? String(doc.reportingLocation) : undefined,
    sourceNote: doc.sourceNote ? String(doc.sourceNote) : undefined,
    editorPitch: doc.editorPitch ? String(doc.editorPitch) : undefined,
    mediaReferenceUrl: doc.mediaReferenceUrl ? String(doc.mediaReferenceUrl) : undefined,
    updatedAt: doc.updatedAt ? String(doc.updatedAt) : undefined,
  }
}

export async function getPayloadJournalistDraft(id: string): Promise<PayloadJournalistDraft> {
  const params = new URLSearchParams({ draft: 'true', depth: '2' })
  const doc = await payloadJson<PayloadDraftDoc>(
    `/api/articles/${encodeURIComponent(id)}?${params.toString()}`,
  )
  return draftFromPayload(doc)
}

export async function updatePayloadJournalistDraft(
  id: string,
  input: Omit<PayloadJournalistDraftInput, 'reporterEmail'>,
): Promise<PayloadJournalistDraft> {
  const [category, tags] = await Promise.all([
    findDocument('categories', 'slug', input.categorySlug),
    Promise.all(input.tagSlugs.map((slug) => findDocument('tags', 'slug', slug))),
  ])
  if (!category) throw new Error(`Payload category not found for slug "${input.categorySlug}".`)
  const doc = await payloadJson<PayloadDraftDoc>(
    `/api/articles/${encodeURIComponent(id)}?draft=true&depth=2`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        titleNe: input.titleNe,
        titleEn: input.titleEn,
        slug: input.slug,
        deckNe: input.deckNe,
        bodyNe: input.bodyNe,
        category: category.id,
        tags: tags.filter((tag): tag is PayloadDoc => Boolean(tag)).map((tag) => ({ tag: tag.id })),
        workflowStage: input.workflowStage,
        homepageTeaserNe: input.homepageTeaserNe,
        socialCopyNe: input.socialCopyNe,
        reportingLocation: input.reportingLocation,
        sourceNote: input.sourceNote,
        editorPitch: input.editorPitch,
        mediaReferenceUrl: input.mediaReferenceUrl,
        internalNotes: input.internalNotes,
        locale: input.locale,
        noIndex: true,
        includeInNewsSitemap: false,
        notificationMode: input.notificationMode ?? 'none',
        notificationTagSlugs: input.notificationTagSlugs ?? [],
        _status: 'draft',
      }),
    },
  )
  return draftFromPayload(doc)
}
