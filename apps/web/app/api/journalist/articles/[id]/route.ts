import { NextResponse, type NextRequest } from 'next/server'
import { getNewsroomSession } from '@/lib/auth/session'
import { CONTRIBUTOR_ROLES } from '@/lib/admin-roles'
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
import { getJournalistDraftMeta, saveJournalistDraftMeta } from '@/lib/journalist-workspace'
import { enforceRateLimit } from '@/lib/rate-limit'
import { isTrustedWriteRequest } from '@/lib/security/origin'

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
  const tagSlugs = tags(body.tagSlugs)
  const requestedNotificationTags = tags(body.notificationTags)
  const notificationTags = requestedNotificationTags.length ? requestedNotificationTags.filter((slug) => tagSlugs.includes(slug)) : tagSlugs
  const articleId = meta.articleId || id
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
        }, session.userId)
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
    return NextResponse.json({ article, meta: nextMeta })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update draft.' }, { status: 400 })
  }
}
