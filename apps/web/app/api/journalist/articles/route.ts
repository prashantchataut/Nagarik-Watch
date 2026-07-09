import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { createArticle } from '@/lib/content/store/json-store'
import type { StoredArticle } from '@/lib/content/store/json-store'
import { blocksFromShorthand } from '@/lib/content/blocks'
import { saveJournalistDraftMeta } from '@/lib/journalist-workspace'

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

function asWorkflowStage(value: unknown): StoredArticle['workflowStage'] {
  return value === 'submitted' ? 'submitted' : 'draft'
}

export async function POST(request: NextRequest) {
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
    const article = await createArticle({
      slug,
      categorySlug,
      titleNe,
      titleEn: String(body.titleEn ?? '').trim() || undefined,
      deckNe: String(body.deckNe ?? '').trim() || undefined,
      bodyNe: blocksFromShorthand(bodyNe, titleNe),
      heroImageUrl: String(body.heroImageUrl ?? '').trim() || undefined,
      heroImageAlt: String(body.heroImageAlt ?? '').trim() || titleNe,
      authorIds: [],
      tagSlugs: Array.isArray(body.tagSlugs)
        ? body.tagSlugs.map(String)
        : String(body.tags ?? '')
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
      workflowStage: asWorkflowStage(body.workflowStage),
      sourceType: 'original',
      noIndex: true,
      includeInNewsSitemap: false,
      aiSummary: String(body.editorPitch ?? '').trim() || undefined,
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
