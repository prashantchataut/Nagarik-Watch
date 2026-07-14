import { NextResponse, type NextRequest } from 'next/server'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import { getSession } from '@/lib/auth/session'
import { createArticle } from '@/lib/content/store/json-store'
import { blocksFromShorthand } from '@/lib/content/blocks'
import { saveJournalistDraftMeta } from '@/lib/journalist-workspace'
import { createPayloadJournalistDraft, isPayloadCanonical } from '@/lib/content/payload-admin-client'

export const dynamic = 'force-dynamic'

const WRITER_ROLES = new Set([
  'contributor',
  'journalist',
  'photo_video_editor',
  'copy_editor',
  'fact_checker',
  'assistant_editor',
  'sub_editor',
  'section_editor',
  'province_editor',
  'managing_editor',
  'editor_in_chief',
  'publisher',
  'admin',
  'super_admin',
])

function asWorkflowStage(value: unknown): 'draft' | 'submitted' {
  return value === 'submitted' ? 'submitted' : 'draft'
}

export async function POST(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }

  const session = await getSession()
  if (!session || !WRITER_ROLES.has(session.role)) {
    return NextResponse.json({ error: 'Journalist access required.' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const titleNe = String(body.titleNe ?? '').trim()
  const slug = String(body.slug ?? '').trim()
  const categorySlug = String(body.categorySlug ?? '').trim()
  const bodyNe = String(body.bodyNe ?? '').trim()

  if (!titleNe || !slug || !categorySlug || !bodyNe) {
    return NextResponse.json({ error: 'Title, slug, category and body are required.' }, { status: 400 })
  }

  try {
    const workflowStage = asWorkflowStage(body.workflowStage)
    const tagSlugs = Array.isArray(body.tagSlugs)
      ? body.tagSlugs.map(String)
      : String(body.tags ?? '')
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
    const bodyBlocks = blocksFromShorthand(bodyNe, titleNe)
    const editorPitch = String(body.editorPitch ?? '').trim() || undefined
    const handoffNotes = [
      String(body.sourceNote ?? '').trim() ? `Source note: ${String(body.sourceNote).trim()}` : '',
      String(body.reportingLocation ?? '').trim() ? `Reporting location: ${String(body.reportingLocation).trim()}` : '',
      String(body.heroImageUrl ?? '').trim() ? `Hero image candidate: ${String(body.heroImageUrl).trim()}` : '',
      String(body.customHomepageText ?? '').trim() ? `Homepage text: ${String(body.customHomepageText).trim()}` : '',
      String(body.customSocialText ?? '').trim() ? `Social text: ${String(body.customSocialText).trim()}` : '',
    ].filter(Boolean).join('\n\n') || undefined

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
          internalNotes: handoffNotes,
          locale: body.locale === 'en' ? 'en' : 'ne',
        })
      : await createArticle({
          slug,
          categorySlug,
          titleNe,
          titleEn: String(body.titleEn ?? '').trim() || undefined,
          deckNe: String(body.deckNe ?? '').trim() || undefined,
          bodyNe: bodyBlocks,
          heroImageUrl: String(body.heroImageUrl ?? '').trim() || undefined,
          heroImageAlt: String(body.heroImageAlt ?? '').trim() || titleNe,
          authorIds: [],
          tagSlugs,
          workflowStage,
          sourceType: 'original',
          noIndex: true,
          includeInNewsSitemap: false,
          aiSummary: editorPitch,
          premium: false,
          commentsEnabled: true,
          locale: body.locale === 'en' ? 'en' : 'ne',
          createdBy: session.userId,
        })

    await saveJournalistDraftMeta({
      articleSlug: slug,
      reporterId: session.userId,
      reportingLocation: String(body.reportingLocation ?? '').trim() || undefined,
      sourceNote: String(body.sourceNote ?? '').trim() || undefined,
      editorPitch: String(body.editorPitch ?? '').trim() || undefined,
      customHomepageText: String(body.customHomepageText ?? '').trim() || undefined,
      customSocialText: String(body.customSocialText ?? '').trim() || undefined,
    })

    return NextResponse.json(article, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not save article.' },
      { status: 400 },
    )
  }
}
