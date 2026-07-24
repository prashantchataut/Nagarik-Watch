import { NextResponse, type NextRequest } from 'next/server'
import { getNewsroomSession } from '@/lib/auth/session'
import { CONTRIBUTOR_ROLES, JOURNALIST_DESK_ROLES } from '@/lib/admin-roles'
import {
  assertWorkflowTransition,
  reporterMayEditDraft,
} from '@/lib/editorial/workflow-transitions'
import { blocksFromShorthand, shorthandFromBlocks } from '@/lib/content/blocks'
import {
  findArticleForAdmin,
  updateArticle,
} from '@/lib/content/store/json-store'
import {
  getPayloadJournalistDraft,
  isPayloadCanonical,
  updatePayloadJournalistDraft,
} from '@/lib/content/payload-admin-client'
import {
  appendJournalistDraftRevision,
  getJournalistDraftMeta,
  saveJournalistDraftMeta,
} from '@/lib/journalist-workspace'
import { enforceRateLimit } from '@/lib/rate-limit'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import { recordAuditEvent } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

async function context(id: string) {
  const session = await getNewsroomSession()
  if (!session || !CONTRIBUTOR_ROLES.has(session.newsroomRole)) return { session: null, meta: null }
  return { session, meta: await getJournalistDraftMeta(id, session.userId) }
}

function tags(value: unknown): string[] {
  const items = Array.isArray(value) ? value.map(String) : String(value ?? '').split(',')
  return [...new Set(items.map((item) => item.trim().toLowerCase()).filter(Boolean))].slice(0, 30)
}

function mode(value: unknown): 'none' | 'breaking' | 'followers' {
  return value === 'breaking' || value === 'followers' ? value : 'none'
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = decodeURIComponent((await params).id)
  const { session, meta } = await context(id)
  if (!session) return NextResponse.json({ error: 'Journalist access required.' }, { status: 403 })
  if (!meta) return NextResponse.json({ error: 'Draft not found.' }, { status: 404 })

  try {
    if (isPayloadCanonical()) {
      if (!meta.articleId) return NextResponse.json({ error: 'This legacy draft is not linked to Payload.' }, { status: 409 })
      const draft = await getPayloadJournalistDraft(meta.articleId)
      return NextResponse.json({ draft: { ...draft, bodyText: shorthandFromBlocks(draft.bodyNe), meta } })
    }
    const article = await findArticleForAdmin(meta.articleId || meta.articleSlug)
    if (!article) return NextResponse.json({ error: 'Draft not found.' }, { status: 404 })
    return NextResponse.json({ draft: { ...article, bodyText: shorthandFromBlocks(article.bodyNe), meta } })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load draft.' }, { status: 502 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isTrustedWriteRequest(request)) return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  const limited = await enforceRateLimit(request, 'journalist-draft-update', 30, 60_000)
  if (limited) return limited
  const id = decodeURIComponent((await params).id)
  const { session, meta } = await context(id)
  if (!session) return NextResponse.json({ error: 'Journalist access required.' }, { status: 403 })
  if (!meta) return NextResponse.json({ error: 'Draft not found.' }, { status: 404 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const titleNe = String(body.titleNe ?? '').trim()
  const categorySlug = String(body.categorySlug ?? '').trim()
  const bodyText = String(body.bodyNe ?? '').trim()
  const workflowStage = body.workflowStage === 'submitted' ? 'submitted' : 'draft'
  if (!titleNe || !categorySlug || !bodyText) return NextResponse.json({ error: 'Title, category and body are required.' }, { status: 400 })

  const articleId = meta.articleId || id
  const existingArticle = isPayloadCanonical()
    ? null
    : await findArticleForAdmin(articleId)
  const currentStage = existingArticle?.workflowStage ?? meta.workflowStage ?? 'draft'

  const isReporter = JOURNALIST_DESK_ROLES.has(session.newsroomRole)
  if (isReporter && !reporterMayEditDraft(currentStage as import('@nagarikwatch/db').WorkflowStage)) {
    return NextResponse.json({ error: 'This draft is in review and cannot be edited.' }, { status: 409 })
  }
  if (workflowStage !== currentStage) {
    try {
      assertWorkflowTransition({
        role: session.newsroomRole,
        from: currentStage as Parameters<typeof assertWorkflowTransition>[0]['from'],
        to: workflowStage as Parameters<typeof assertWorkflowTransition>[0]['to'],
      })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid workflow transition.' },
        { status: 403 },
      )
    }
  }
  const tagSlugs = tags(body.tagSlugs)
  const requestedNotificationTags = tags(body.notificationTags)
  const notificationTags = requestedNotificationTags.length
    ? requestedNotificationTags.filter((slug) => tagSlugs.includes(slug))
    : tagSlugs
  const internalNotes = [
    body.sourceNote ? `Source note: ${String(body.sourceNote).trim()}` : '',
    body.reportingLocation ? `Reporting location: ${String(body.reportingLocation).trim()}` : '',
    body.customHomepageText ? `Homepage text: ${String(body.customHomepageText).trim()}` : '',
    body.customSocialText ? `Social text: ${String(body.customSocialText).trim()}` : '',
    mode(body.notificationMode) !== 'none' ? `Notification recommendation: ${mode(body.notificationMode)}` : '',
  ].filter(Boolean).join('\n\n') || undefined

  try {
    const article = isPayloadCanonical()
      ? await updatePayloadJournalistDraft(articleId, {
          titleNe,titleEn: String(body.titleEn ?? '').trim() || undefined,slug: meta.articleSlug,
          categorySlug,deckNe: String(body.deckNe ?? '').trim() || undefined,
          bodyNe: blocksFromShorthand(bodyText, titleNe),tagSlugs,workflowStage,
          editorPitch: String(body.editorPitch ?? '').trim() || undefined,
          homepageTeaserNe: String(body.customHomepageText ?? '').trim() || undefined,
          socialCopyNe: String(body.customSocialText ?? '').trim() || undefined,
          reportingLocation: String(body.reportingLocation ?? '').trim() || undefined,
          sourceNote: String(body.sourceNote ?? '').trim() || undefined,
          mediaReferenceUrl: String(body.heroImageUrl ?? '').trim() || undefined,
          internalNotes,
          locale: body.locale === 'en' ? 'en' : 'ne',
          notificationMode: mode(body.notificationMode),
          notificationTagSlugs: notificationTags,
        })
      : await updateArticle(articleId, {
          titleNe,titleEn: String(body.titleEn ?? '').trim() || undefined,categorySlug,
          deckNe: String(body.deckNe ?? '').trim() || undefined,bodyNe: blocksFromShorthand(bodyText, titleNe),
          homepageTeaserNe: String(body.customHomepageText ?? '').trim() || undefined,
          socialCopyNe: String(body.customSocialText ?? '').trim() || undefined,
          reportingLocation: String(body.reportingLocation ?? '').trim() || undefined,
          sourceNote: String(body.sourceNote ?? '').trim() || undefined,
          editorPitch: String(body.editorPitch ?? '').trim() || undefined,
          mediaReferenceUrl: String(body.heroImageUrl ?? '').trim() || undefined,
          heroImageUrl: String(body.heroImageUrl ?? '').trim() || undefined,
          tagSlugs,workflowStage,
          province: String(body.province ?? '').trim() || undefined,
          district: String(body.district ?? '').trim() || undefined,
          exclusive: body.exclusive === true,
          editorPick: body.editorPick === true,
        }, session.userId, session.newsroomRole)
    if (!article) return NextResponse.json({ error: 'Draft not found.' }, { status: 404 })
    const nextMeta = await saveJournalistDraftMeta({
      ...meta,articleId,articleSlug: meta.articleSlug,titleNe,categorySlug,workflowStage,
      reporterId: session.userId,reportingLocation: String(body.reportingLocation ?? '').trim() || undefined,
      sourceNote: String(body.sourceNote ?? '').trim() || undefined,
      editorPitch: String(body.editorPitch ?? '').trim() || undefined,
      mediaReferenceUrl: String(body.heroImageUrl ?? '').trim() || undefined,
      customHomepageText: String(body.customHomepageText ?? '').trim() || undefined,
      customSocialText: String(body.customSocialText ?? '').trim() || undefined,
      notificationMode: mode(body.notificationMode),notificationTags,
    })
    await appendJournalistDraftRevision({
      articleId: nextMeta.articleId,
      articleSlug: nextMeta.articleSlug,
      reporterId: nextMeta.reporterId,
      actorId: session.userId,
      actorRole: session.newsroomRole,
      action: workflowStage === 'submitted' ? 'submitted' : 'saved',
      stage: workflowStage,
      snapshot: {
        titleNe,
        titleEn: String(body.titleEn ?? ''),
        slug: nextMeta.articleSlug,
        categorySlug,
        deckNe: String(body.deckNe ?? ''),
        bodyNe: bodyText,
        tagSlugs,
        reportingLocation: String(body.reportingLocation ?? ''),
        sourceNote: String(body.sourceNote ?? ''),
        editorPitch: String(body.editorPitch ?? ''),
        mediaReferenceUrl: String(body.heroImageUrl ?? ''),
        customHomepageText: String(body.customHomepageText ?? ''),
        customSocialText: String(body.customSocialText ?? ''),
        notificationMode: mode(body.notificationMode),
        notificationTags,
      },
    })
    if (workflowStage === 'submitted') {
      await recordAuditEvent({
        session,
        action: 'status_change',
        targetType: 'journalist_draft',
        targetId: nextMeta.articleId || nextMeta.articleSlug,
        summary: `Journalist draft submitted: ${titleNe}`,
        meta: { reporterId: session.userId, workflowStage },
      })
    }
    return NextResponse.json({ article, meta: nextMeta })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update draft.' }, { status: 400 })
  }
}
