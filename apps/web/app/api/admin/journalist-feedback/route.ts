import { NextResponse, type NextRequest } from 'next/server'
import { EDITOR_ROLES } from '@/lib/admin-roles'
import { getNewsroomSession } from '@/lib/auth/session'
import { recordAuditEvent } from '@/lib/audit-log'
import { shorthandFromBlocks } from '@/lib/content/blocks'
import { getPayloadJournalistDraft, isPayloadCanonical } from '@/lib/content/payload-admin-client'
import { findArticleForAdmin, updateArticle } from '@/lib/content/store/json-store'
import {
  appendJournalistDraftRevision,
  getJournalistDraftMeta,
  saveJournalistDraftMeta,
  setJournalistFeedback,
} from '@/lib/journalist-workspace'
import { enforceRateLimit } from '@/lib/rate-limit'
import { isTrustedWriteRequest } from '@/lib/security/origin'

export async function POST(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  const limited = await enforceRateLimit(request, 'journalist-feedback', 30, 60_000)
  if (limited) return limited
  const session = await getNewsroomSession()
  if (!session || !EDITOR_ROLES.has(session.newsroomRole)) return NextResponse.json({ error: 'Editor access required.' }, { status: 403 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }) }
  const identifier = String(body.identifier ?? '').trim()
  const reporterId = String(body.reporterId ?? '').trim()
  const feedback = String(body.feedback ?? '').trim()
  const action = body.action === 'clear' ? 'clear' : body.action === 'note' ? 'note' : 'revision'
  if (!identifier || !reporterId || identifier.length > 160 || reporterId.length > 160 || feedback.length > 4000) {
    return NextResponse.json({ error: 'Invalid feedback request.' }, { status: 400 })
  }
  if (action !== 'clear' && feedback.length < 3) return NextResponse.json({ error: 'Feedback is too short.' }, { status: 400 })

  const current = await getJournalistDraftMeta(identifier, reporterId)
  if (!current) return NextResponse.json({ error: 'Draft handoff not found.' }, { status: 404 })
  const article = action === 'revision'
    ? isPayloadCanonical()
      ? current.articleId ? await getPayloadJournalistDraft(current.articleId) : null
      : await findArticleForAdmin(current.articleId || current.articleSlug)
    : null
  if (action === 'revision' && !article) {
    return NextResponse.json({ error: 'Draft content could not be loaded for the revision record.' }, { status: 409 })
  }
  const next = await setJournalistFeedback(
    current.articleId || current.articleSlug,
    current.reporterId,
    action === 'clear' ? null : feedback,
    action === 'revision' ? new Date().toISOString() : action === 'clear' ? null : current.revisionRequestedAt ?? null,
  )
  if (!next) return NextResponse.json({ error: 'Draft handoff not found.' }, { status: 404 })
  let responseMeta = next
  if (action === 'revision') {
    responseMeta = await saveJournalistDraftMeta({ ...next, workflowStage: 'draft' })
  }
  if (action === 'revision' && article) {
    if (!isPayloadCanonical() && current.articleId) {
      await updateArticle(
        current.articleId,
        { workflowStage: 'draft' },
        session.userId,
        session.newsroomRole,
      )
    }
    const tagSlugs = 'tagSlugs' in article && Array.isArray(article.tagSlugs) ? article.tagSlugs : []
    await appendJournalistDraftRevision({
      articleId: responseMeta.articleId,
      articleSlug: responseMeta.articleSlug,
      reporterId: responseMeta.reporterId,
      actorId: session.userId,
      actorRole: session.newsroomRole,
      action: 'returned',
      stage: 'draft',
      snapshot: {
        titleNe: article.titleNe,
        titleEn: article.titleEn,
        slug: article.slug,
        categorySlug: article.categorySlug || next.categorySlug,
        deckNe: article.deckNe,
        bodyNe: shorthandFromBlocks(article.bodyNe),
        tagSlugs,
        reportingLocation: ('reportingLocation' in article ? article.reportingLocation : undefined) || next.reportingLocation,
        sourceNote: ('sourceNote' in article ? article.sourceNote : undefined) || next.sourceNote,
        editorPitch: ('editorPitch' in article ? article.editorPitch : undefined) || next.editorPitch,
        mediaReferenceUrl: ('mediaReferenceUrl' in article ? article.mediaReferenceUrl : undefined) || next.mediaReferenceUrl,
        customHomepageText: ('homepageTeaserNe' in article ? article.homepageTeaserNe : undefined) || next.customHomepageText,
        customSocialText: ('socialCopyNe' in article ? article.socialCopyNe : undefined) || next.customSocialText,
        notificationMode: next.notificationMode,
        notificationTags: next.notificationTags,
        editorFeedback: feedback,
      },
    })
  }
  await recordAuditEvent({
    session,
    action: 'update',
    targetType: 'journalist_draft_feedback',
    targetId: current.articleId || current.articleSlug,
    summary: action === 'revision' ? `Revision requested for ${current.titleNe}` : action === 'clear' ? `Feedback cleared for ${current.titleNe}` : `Editorial note added for ${current.titleNe}`,
    meta: { reporterId, action },
  })
  return NextResponse.json({ ok: true, meta: responseMeta })
}
