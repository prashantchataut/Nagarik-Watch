import { createHash, randomUUID } from 'node:crypto'

export type JournalistRevisionAction = 'saved' | 'submitted' | 'returned'

export type JournalistDraftSnapshot = {
  titleNe: string
  titleEn?: string
  slug: string
  categorySlug: string
  deckNe?: string
  bodyNe: string
  tagSlugs: string[]
  reportingLocation?: string
  sourceNote?: string
  editorPitch?: string
  mediaReferenceUrl?: string
  customHomepageText?: string
  customSocialText?: string
  notificationMode: 'none' | 'breaking' | 'followers'
  notificationTags: string[]
  editorFeedback?: string
}

export type JournalistDraftRevision = {
  id: string
  articleId?: string
  articleSlug: string
  reporterId: string
  actorId: string
  actorRole: string
  action: JournalistRevisionAction
  stage: string
  createdAt: string
  contentHash: string
  snapshot: JournalistDraftSnapshot
}

function text(value: unknown, max: number): string | undefined {
  const result = String(value ?? '').replace(/\r\n/g, '\n').trim().slice(0, max)
  return result || undefined
}

function tags(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map(String).map((item) => item.trim().toLowerCase()).filter(Boolean))]
    .sort()
    .slice(0, 40)
}

function notificationMode(value: unknown): JournalistDraftSnapshot['notificationMode'] {
  return value === 'breaking' || value === 'followers' ? value : 'none'
}

export function normalizeJournalistDraftSnapshot(input: Partial<JournalistDraftSnapshot>): JournalistDraftSnapshot {
  return {
    titleNe: text(input.titleNe, 240) ?? '',
    titleEn: text(input.titleEn, 240),
    slug: text(input.slug, 160) ?? '',
    categorySlug: text(input.categorySlug, 120) ?? '',
    deckNe: text(input.deckNe, 1000),
    bodyNe: text(input.bodyNe, 500_000) ?? '',
    tagSlugs: tags(input.tagSlugs),
    reportingLocation: text(input.reportingLocation, 160),
    sourceNote: text(input.sourceNote, 20_000),
    editorPitch: text(input.editorPitch, 5000),
    mediaReferenceUrl: text(input.mediaReferenceUrl, 2048),
    customHomepageText: text(input.customHomepageText, 500),
    customSocialText: text(input.customSocialText, 500),
    notificationMode: notificationMode(input.notificationMode),
    notificationTags: tags(input.notificationTags),
    editorFeedback: text(input.editorFeedback, 20_000),
  }
}

export function hashJournalistDraftSnapshot(snapshot: JournalistDraftSnapshot): string {
  return createHash('sha256').update(JSON.stringify(snapshot)).digest('hex')
}

export function createJournalistDraftRevision(
  input: Omit<JournalistDraftRevision, 'id' | 'createdAt' | 'contentHash' | 'snapshot'> & {
    id?: string
    createdAt?: string
    snapshot: Partial<JournalistDraftSnapshot>
  },
): JournalistDraftRevision {
  const snapshot = normalizeJournalistDraftSnapshot(input.snapshot)
  return {
    id: input.id ?? randomUUID(),
    articleId: text(input.articleId, 160),
    articleSlug: text(input.articleSlug, 160) ?? '',
    reporterId: text(input.reporterId, 160) ?? '',
    actorId: text(input.actorId, 160) ?? '',
    actorRole: text(input.actorRole, 80) ?? 'unknown',
    action: input.action,
    stage: text(input.stage, 60) ?? 'draft',
    createdAt: input.createdAt ?? new Date().toISOString(),
    contentHash: hashJournalistDraftSnapshot(snapshot),
    snapshot,
  }
}
