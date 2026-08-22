import 'server-only'
import type { ArticleBlock, WorkflowStage } from '@nagarikwatch/db'
import {
  canActorTransition,
  isValidHttpUrl,
  reporterMayEditDraft,
} from '@nagarikwatch/db'

export function isPayloadDeclared(): boolean {
  const source = process.env.CONTENT_SOURCE?.trim() || process.env.PAYLOAD_CONTENT_SOURCE?.trim()
  return source === 'payload'
}

export function isPayloadCanonical(): boolean {
  if (!isPayloadDeclared()) return false
  // Only treat Payload as canonical when its URL is configured. Otherwise the
  // in-app Postgres/JSON article store remains the newsroom CMS.
  return Boolean(
    process.env.PAYLOAD_PUBLIC_SERVER_URL?.trim() || process.env.PAYLOAD_ADMIN_URL?.trim(),
  )
}

/**
 * True when the content authority declaration is unsafe. Preview may use the
 * local desk store, but a declared live launch is required by ADR-014 to use
 * Payload with a configured CMS URL. This prevents successful shadow writes
 * that the public reader can never see.
 */
export function isPayloadSourceMisconfigured(): boolean {
  const source =
    process.env.CONTENT_SOURCE?.trim() || process.env.PAYLOAD_CONTENT_SOURCE?.trim() || 'json'
  const launchLive =
    (process.env.NEXT_PUBLIC_LAUNCH_STATUS?.trim() || 'preview').toLowerCase() === 'live'
  if (launchLive && source !== 'payload') return true
  if (source !== 'payload') return false
  return !isPayloadCanonical()
}

export function shouldBlockLocalContentWrites(): boolean {
  return isPayloadCanonical() || isPayloadSourceMisconfigured()
}

export function payloadServerUrl(): string {
  const configured = process.env.PAYLOAD_PUBLIC_SERVER_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')
  if (process.env.NODE_ENV !== 'production') return 'http://localhost:3001'
  throw new Error('PAYLOAD_PUBLIC_SERVER_URL is required when Payload is canonical.')
}

export function payloadAdminUrlIfConfigured(path = ''): string | null {
  const configured = process.env.PAYLOAD_ADMIN_URL?.trim()
  const publicServer = process.env.PAYLOAD_PUBLIC_SERVER_URL?.trim()
  const base = configured
    ? configured.replace(/\/$/, '')
    : publicServer
      ? `${publicServer.replace(/\/$/, '')}/admin`
      : null
  if (!base) return null
  return `${base}${path.startsWith('/') ? path : path ? `/${path}` : ''}`
}

export function payloadAdminUrl(path = ''): string {
  const configured = payloadAdminUrlIfConfigured(path)
  if (configured) return configured
  if (process.env.NODE_ENV !== 'production') {
    const base = 'http://localhost:3001/admin'
    return `${base}${path.startsWith('/') ? path : path ? `/${path}` : ''}`
  }
  throw new Error(
    'PAYLOAD_PUBLIC_SERVER_URL or PAYLOAD_ADMIN_URL is required for the Payload admin URL.',
  )
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
  if (isPayloadSourceMisconfigured()) {
    throw new Error(
      'Live launch content authority is misconfigured. Set CONTENT_SOURCE=payload and PAYLOAD_PUBLIC_SERVER_URL before editorial writes are allowed.',
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
  const timeoutMs = Math.max(
    1_500,
    Math.min(10_000, Number(process.env.NW_PAYLOAD_ADMIN_TIMEOUT_MS ?? 4_000)),
  )
  const response = await fetch(`${payloadServerUrl()}${path}`, {
    ...init,
    headers: { ...payloadHeaders(), ...(init?.headers ?? {}) },
    cache: 'no-store',
    signal: init?.signal ?? AbortSignal.timeout(timeoutMs),
  })
  const body = (await response.json().catch(() => ({}))) as T & {
    errors?: Array<{ message?: string }>
    message?: string
  }
  if (!response.ok) {
    const message =
      body.errors?.[0]?.message || body.message || `Payload request failed: ${response.status}`
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

/**
 * Ensure a Payload Authors document exists for a newsroom email.
 * Required for the journalist→Payload draft bridge (ADR-014).
 * No-op when Payload credentials are not configured.
 */
export async function ensurePayloadAuthorForEmail(input: {
  email: string
  name?: string
  role?: 'staff' | 'columnist' | 'contributor' | 'wire'
}): Promise<{ id: string; slug: string; created: boolean } | null> {
  const email = input.email.trim().toLowerCase()
  if (!email || !email.includes('@')) return null
  if (
    !process.env.PAYLOAD_API_TOKEN?.trim() ||
    !(process.env.PAYLOAD_PUBLIC_SERVER_URL?.trim() || process.env.PAYLOAD_ADMIN_URL?.trim())
  ) {
    return null
  }

  const existing = await findDocument('authors', 'email', email)
  if (existing) {
    return {
      id: String(existing.id),
      slug: String(existing.slug ?? email.split('@')[0]),
      created: false,
    }
  }

  const local = email.split('@')[0] || 'author'
  const slugBase =
    local
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'author'
  let slug = slugBase
  for (let attempt = 0; attempt < 5; attempt++) {
    const clash = await findDocument('authors', 'slug', slug)
    if (!clash) break
    slug = `${slugBase}-${attempt + 2}`
  }

  const created = await payloadJson<PayloadDoc>('/api/authors', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name?.trim() || local,
      slug,
      email,
      role: input.role ?? 'contributor',
      isActive: true,
    }),
  })

  return {
    id: String(created.id),
    slug: String(created.slug ?? slug),
    created: true,
  }
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

export class PayloadJournalistEditBlockedError extends Error {
  readonly status = 409
  constructor(message: string) {
    super(message)
    this.name = 'PayloadJournalistEditBlockedError'
  }
}

function assertOptionalMediaReference(url: string | undefined): string | undefined {
  if (!url?.trim()) return undefined
  const trimmed = url.trim()
  if (!isValidHttpUrl(trimmed)) {
    throw new Error('mediaReferenceUrl must be a valid http(s) URL for editorial handoff only.')
  }
  return trimmed
}

function authorEmail(value: PayloadRelationship | undefined): string {
  return value && typeof value === 'object' && value.email
    ? String(value.email).trim().toLowerCase()
    : ''
}

export async function createPayloadJournalistDraft(
  input: PayloadJournalistDraftInput,
): Promise<{ id: string; slug: string; workflowStage: string }> {
  const mediaReferenceUrl = assertOptionalMediaReference(input.mediaReferenceUrl)
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

  const created = await payloadJson<PayloadDoc & { workflowStage?: string }>(
    '/api/articles?draft=true',
    {
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
        mediaReferenceUrl,
        internalNotes: input.internalNotes,
        premium: false,
        commentsEnabled: true,
        notificationMode: input.notificationMode ?? 'none',
        notificationTagSlugs: input.notificationTagSlugs ?? [],
        // Candidate URL only — never attach as publishable heroImage from the journalist desk.
        _status: 'draft',
      }),
    },
  )

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

type PayloadRelationship = string | number | { id?: string | number; slug?: string; email?: string }
type PayloadDraftDoc = PayloadDoc & {
  titleNe?: string
  titleEn?: string
  deckNe?: string
  bodyNe?: ArticleBlock[]
  category?: PayloadRelationship
  tags?: Array<{ tag?: PayloadRelationship }>
  authors?: Array<{ author?: PayloadRelationship }>
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
  input: Omit<PayloadJournalistDraftInput, 'reporterEmail'> & { reporterEmail: string },
): Promise<PayloadJournalistDraft> {
  const live = await payloadJson<PayloadDraftDoc>(
    `/api/articles/${encodeURIComponent(id)}?draft=true&depth=2`,
  )
  const liveStage = String(live.workflowStage ?? 'draft') as WorkflowStage
  if (!reporterMayEditDraft(liveStage)) {
    throw new PayloadJournalistEditBlockedError(
      `This draft is in “${liveStage}” and cannot be overwritten from the journalist desk.`,
    )
  }
  if (!canActorTransition('reporter', liveStage, input.workflowStage)) {
    throw new PayloadJournalistEditBlockedError(
      `Invalid journalist workflow transition: ${liveStage} → ${input.workflowStage}`,
    )
  }

  const reporterEmail = input.reporterEmail.trim().toLowerCase()
  const authorEmails = (live.authors ?? [])
    .map((row) => authorEmail(row.author))
    .filter(Boolean)
  if (authorEmails.length > 0 && !authorEmails.includes(reporterEmail)) {
    throw new PayloadJournalistEditBlockedError(
      'Only the assigned Payload author can update this journalist draft.',
    )
  }

  const mediaReferenceUrl = assertOptionalMediaReference(input.mediaReferenceUrl)
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
        // Only draft|submitted — never rewind later CMS stages.
        workflowStage: input.workflowStage,
        homepageTeaserNe: input.homepageTeaserNe,
        socialCopyNe: input.socialCopyNe,
        reportingLocation: input.reportingLocation,
        sourceNote: input.sourceNote,
        editorPitch: input.editorPitch,
        mediaReferenceUrl,
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

/** Patch only workflowStage on a Payload article (desk feedback / revision return). */
export async function updatePayloadArticleWorkflowStage(
  id: string,
  workflowStage: string,
): Promise<void> {
  await payloadJson(`/api/articles/${encodeURIComponent(id)}?draft=true`, {
    method: 'PATCH',
    body: JSON.stringify({
      workflowStage,
      ...(workflowStage === 'draft' || workflowStage === 'submitted'
        ? { _status: 'draft', noIndex: true, includeInNewsSitemap: false }
        : {}),
    }),
  })
}

type PayloadScheduledArticle = {
  id: string | number
  slug?: string
  publishAt?: string
  workflowStage?: string
  category?: { slug?: string } | string | number
  tags?: Array<{ tag?: { slug?: string } | string | number }>
}

type PayloadScheduledPublishResult = {
  published: Array<{
    id: string
    slug: string
    categorySlug?: string
    tagSlugs: string[]
    publishedAt: string
  }>
  inspected: number
}

function relationSlug(input: { slug?: string } | string | number | undefined): string | undefined {
  if (!input) return undefined
  if (typeof input === 'object') return input.slug ? String(input.slug) : undefined
  return undefined
}

export async function publishDuePayloadScheduledArticles(
  now = new Date(),
  limit = 200,
): Promise<PayloadScheduledPublishResult> {
  const params = new URLSearchParams({
    limit: String(limit),
    depth: '1',
    sort: 'publishAt',
  })
  params.set('where[workflowStage][equals]', 'scheduled')
  params.set('where[publishAt][less_than_equal]', now.toISOString())

  const listed = await payloadJson<PayloadList<PayloadScheduledArticle>>(
    `/api/articles?${params.toString()}`,
  )
  const docs = listed.docs ?? []
  const published: PayloadScheduledPublishResult['published'] = []

  for (const doc of docs) {
    const patched = await payloadJson<PayloadScheduledArticle>(
      `/api/articles/${encodeURIComponent(String(doc.id))}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          workflowStage: 'published',
          _status: 'published',
          noIndex: false,
          includeInNewsSitemap: true,
        }),
      },
    )
    const tagSlugs = (patched.tags ?? [])
      .map((row) => relationSlug(row.tag))
      .filter((slug): slug is string => Boolean(slug))
    published.push({
      id: String(patched.id),
      slug: String(patched.slug ?? ''),
      categorySlug: relationSlug(patched.category),
      tagSlugs,
      publishedAt: String(patched.publishAt ?? now.toISOString()),
    })
  }

  return { published, inspected: docs.length }
}
