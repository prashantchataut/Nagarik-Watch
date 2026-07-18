import { NextResponse, type NextRequest } from 'next/server'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import { getNewsroomSession } from '@/lib/auth/session'
import { CONTRIBUTOR_ROLES } from '@/lib/admin-roles'
import { createArticle } from '@/lib/content/store/json-store'
import { blocksFromShorthand } from '@/lib/content/blocks'
import {
  appendJournalistDraftRevision,
  listJournalistDraftMeta,
  saveJournalistDraftMeta,
} from '@/lib/journalist-workspace'
import { createPayloadJournalistDraft, isPayloadCanonical } from '@/lib/content/payload-admin-client'
import { enforceRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

function asWorkflowStage(value: unknown): 'draft' | 'submitted' {
  return value === 'submitted' ? 'submitted' : 'draft'
}

function cleanTags(value: unknown): string[] {
  const items = Array.isArray(value) ? value.map(String) : String(value ?? '').split(',')
  return [...new Set(items.map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 30)
}

function notificationMode(value: unknown): 'none' | 'breaking' | 'followers' {
  return value === 'breaking' || value === 'followers' ? value : 'none'
}

function handoffNotes(body: Record<string, unknown>): string | undefined {
  const notes = [
    String(body.sourceNote ?? '').trim() ? `Source note: ${String(body.sourceNote).trim()}` : '',
    String(body.reportingLocation ?? '').trim() ? `Reporting location: ${String(body.reportingLocation).trim()}` : '',
    String(body.heroImageUrl ?? '').trim() ? `Hero image candidate: ${String(body.heroImageUrl).trim()}` : '',
    String(body.customHomepageText ?? '').trim() ? `Homepage text: ${String(body.customHomepageText).trim()}` : '',
    String(body.customSocialText ?? '').trim() ? `Social text: ${String(body.customSocialText).trim()}` : '',
    notificationMode(body.notificationMode) !== 'none' ? `Notification recommendation: ${notificationMode(body.notificationMode)}` : '',
  ].filter(Boolean)
  return notes.length ? notes.join('\n\n') : undefined
}

async function writerSession() {
  const session = await getNewsroomSession()
  return session && CONTRIBUTOR_ROLES.has(session.newsroomRole) ? session : null
}

export async function GET() {
  const session = await writerSession()
  if (!session) return NextResponse.json({ error: 'Journalist access required.' }, { status: 403 })
  return NextResponse.json({ drafts: await listJournalistDraftMeta(session.userId) })
}

export async function POST(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  const limited = await enforceRateLimit(request, 'journalist-draft-create', 12, 60_000)
  if (limited) return limited
  const session = await writerSession()
  if (!session) return NextResponse.json({ error: 'Journalist access required.' }, { status: 403 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const titleNe = String(body.titleNe ?? '').trim()
  const slug = String(body.slug ?? '').trim()
  const categorySlug = String(body.categorySlug ?? '').trim()
  const bodyNe = String(body.bodyNe ?? '').trim()
  if (!titleNe || !slug || !categorySlug || !bodyNe) {
    return NextResponse.json({ error: 'Title, slug, category and body are required.' }, { status: 400 })
  }

  try {
    const workflowStage = asWorkflowStage(body.workflowStage)
    const tagSlugs = cleanTags(body.tagSlugs ?? body.tags)
    const requestedNotificationTags = cleanTags(body.notificationTags)
    const notificationTags = requestedNotificationTags.length ? requestedNotificationTags.filter((slug) => tagSlugs.includes(slug)) : tagSlugs
    const bodyBlocks = blocksFromShorthand(bodyNe, titleNe)
    const editorPitch = String(body.editorPitch ?? '').trim() || undefined
    const article = isPayloadCanonical()
      ? await createPayloadJournalistDraft({
          reporterEmail: session.email,
          titleNe,
          titleEn: String(body.titleEn ?? '').trim() || undefined,
          slug,
          categorySlug,
          deckNe: String(body.deckNe ?? '').trim() || undefined,
          bodyNe: bodyBlocks,
          tagSlugs,
          workflowStage,
          editorPitch,
          homepageTeaserNe: String(body.customHomepageText ?? '').trim() || undefined,
          socialCopyNe: String(body.customSocialText ?? '').trim() || undefined,
          reportingLocation: String(body.reportingLocation ?? '').trim() || undefined,
          sourceNote: String(body.sourceNote ?? '').trim() || undefined,
          mediaReferenceUrl: String(body.heroImageUrl ?? '').trim() || undefined,
          internalNotes: handoffNotes(body),
          locale: body.locale === 'en' ? 'en' : 'ne',
          notificationMode: notificationMode(body.notificationMode),
          notificationTagSlugs: notificationTags,
        })
      : await createArticle({
          slug,categorySlug,titleNe,titleEn: String(body.titleEn ?? '').trim() || undefined,
          deckNe: String(body.deckNe ?? '').trim() || undefined,
          homepageTeaserNe: String(body.customHomepageText ?? '').trim() || undefined,
          socialCopyNe: String(body.customSocialText ?? '').trim() || undefined,
          reportingLocation: String(body.reportingLocation ?? '').trim() || undefined,
          sourceNote: String(body.sourceNote ?? '').trim() || undefined,
          editorPitch,
          mediaReferenceUrl: String(body.heroImageUrl ?? '').trim() || undefined,
          bodyNe: bodyBlocks,
          heroImageUrl: String(body.heroImageUrl ?? '').trim() || undefined,
          heroImageAlt: String(body.heroImageAlt ?? '').trim() || titleNe,authorIds: [],tagSlugs,
          workflowStage,sourceType: 'original',noIndex: true,includeInNewsSitemap: false,
          premium: false,commentsEnabled: true,
          locale: body.locale === 'en' ? 'en' : 'ne',createdBy: session.userId,
        })

    const meta = await saveJournalistDraftMeta({
      articleId: String(article.id),articleSlug: slug,titleNe,categorySlug,workflowStage,
      reporterId: session.userId,reportingLocation: String(body.reportingLocation ?? '').trim() || undefined,
      sourceNote: String(body.sourceNote ?? '').trim() || undefined,editorPitch,
      mediaReferenceUrl: String(body.heroImageUrl ?? '').trim() || undefined,
      customHomepageText: String(body.customHomepageText ?? '').trim() || undefined,
      customSocialText: String(body.customSocialText ?? '').trim() || undefined,
      notificationMode: notificationMode(body.notificationMode),
      notificationTags,
    })
    await appendJournalistDraftRevision({
      articleId: meta.articleId,
      articleSlug: meta.articleSlug,
      reporterId: meta.reporterId,
      actorId: session.userId,
      actorRole: session.newsroomRole,
      action: workflowStage === 'submitted' ? 'submitted' : 'saved',
      stage: workflowStage,
      snapshot: {
        titleNe,
        titleEn: String(body.titleEn ?? ''),
        slug,
        categorySlug,
        deckNe: String(body.deckNe ?? ''),
        bodyNe,
        tagSlugs,
        reportingLocation: String(body.reportingLocation ?? ''),
        sourceNote: String(body.sourceNote ?? ''),
        editorPitch,
        mediaReferenceUrl: String(body.heroImageUrl ?? ''),
        customHomepageText: String(body.customHomepageText ?? ''),
        customSocialText: String(body.customSocialText ?? ''),
        notificationMode: notificationMode(body.notificationMode),
        notificationTags,
      },
    })

    return NextResponse.json({ article, meta }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not save article.' }, { status: 400 })
  }
}
