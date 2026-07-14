import { NextResponse, type NextRequest } from 'next/server'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import { requireNewsroomSession } from '@/lib/auth/session'
import { updateArticle, deleteArticle, getArticleById } from '@/lib/content/store/json-store'
import type { StoredArticle } from '@/lib/content/store/json-store'
import { canEdit, canDelete, canPublish } from '@/lib/admin-roles'
import type { ArticleBlock } from '@nagarikwatch/db'
import { blocksFromShorthand } from '@/lib/content/blocks'
import { isPayloadCanonical, payloadCollectionAdminUrl } from '@/lib/content/payload-admin-client'

export const dynamic = 'force-dynamic'

const WORKFLOW_STAGES: StoredArticle['workflowStage'][] = [
  'idea',
  'assigned',
  'draft',
  'submitted',
  'fact_check',
  'copy_edit',
  'seo_review',
  'legal_review',
  'ready',
  'scheduled',
  'published',
  'updated',
  'archived',
  'retracted',
]

function isWorkflowStage(value: unknown): value is StoredArticle['workflowStage'] {
  return (
    typeof value === 'string' && WORKFLOW_STAGES.includes(value as StoredArticle['workflowStage'])
  )
}

/** GET /api/admin/articles/[id] — fetch a single article for the editor. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireNewsroomSession()
  const { id } = await params
  if (isPayloadCanonical()) {
    return NextResponse.json(
      { error: 'Production content is managed in Payload CMS.', cmsUrl: payloadCollectionAdminUrl('articles', id) },
      { status: 409 },
    )
  }
  const article = await getArticleById(id)
  if (!article) return NextResponse.json({ error: 'भेटिएन।' }, { status: 404 })
  return NextResponse.json(article)
}

/** PUT /api/admin/articles/[id] — update an article. Editors+ can update. */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }

  const session = await requireNewsroomSession()
  if (!canEdit(session.newsroomRole)) {
    return NextResponse.json({ error: 'सम्पादन अनुमति छैन।' }, { status: 403 })
  }
  const { id } = await params
  if (isPayloadCanonical()) {
    return NextResponse.json(
      { error: 'Production content is managed in Payload CMS.', cmsUrl: payloadCollectionAdminUrl('articles', id) },
      { status: 409 },
    )
  }
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const requestedStage = isWorkflowStage(body.workflowStage) ? body.workflowStage : undefined
  if (body.workflowStage !== undefined && !requestedStage) {
    return NextResponse.json({ error: 'Invalid workflow stage' }, { status: 400 })
  }
  if (requestedStage === 'published' && !canPublish(session.newsroomRole)) {
    return NextResponse.json({ error: 'प्रकाशन अनुमति छैन।' }, { status: 403 })
  }

  const patch: Record<string, unknown> = { ...body }
  if (requestedStage === 'published') {
    if (body.noIndex === undefined) patch.noIndex = false
    if (body.includeInNewsSitemap === undefined) patch.includeInNewsSitemap = true
  } else if (requestedStage) {
    if (body.noIndex === undefined) patch.noIndex = true
    if (body.includeInNewsSitemap === undefined) patch.includeInNewsSitemap = false
  }
  if (body.bodyNe !== undefined) {
    patch.bodyNe = blocksFromShorthand(body.bodyNe, String(body.titleNe ?? '')) as ArticleBlock[]
  }
  if (body.bodyEn !== undefined) {
    const bodyEn = blocksFromShorthand(body.bodyEn)
    patch.bodyEn = bodyEn.length > 0 ? bodyEn : undefined
  }

  const updated = await updateArticle(
    id,
    patch as Parameters<typeof updateArticle>[1],
    session.userId,
  )
  if (!updated) return NextResponse.json({ error: 'भेटिएन।' }, { status: 404 })
  return NextResponse.json(updated)
}

/** DELETE /api/admin/articles/[id] — delete an article. Super admin only. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }

  const session = await requireNewsroomSession()
  if (!canDelete(session.newsroomRole)) {
    return NextResponse.json({ error: 'मेटाउन अनुमति छैन। केवल मुख्य एडमिन।' }, { status: 403 })
  }
  const { id } = await params
  if (isPayloadCanonical()) {
    return NextResponse.json(
      { error: 'Production content is managed in Payload CMS.', cmsUrl: payloadCollectionAdminUrl('articles', id) },
      { status: 409 },
    )
  }
  const existing = await getArticleById(id)
  if (!existing) return NextResponse.json({ error: 'भेटिएन।' }, { status: 404 })
  const ok = await deleteArticle(id)
  return NextResponse.json({ ok, deletedId: id, deletedBy: session.userId })
}
