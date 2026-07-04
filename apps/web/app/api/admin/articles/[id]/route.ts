import { NextResponse, type NextRequest } from 'next/server'
import { requireNewsroomSession } from '@/lib/auth/session'
import { updateArticle, deleteArticle, getArticleById } from '@/lib/content/store/json-store'
import { canEdit, canDelete, canPublish } from '@/lib/admin-roles'
import type { ArticleBlock } from '@nagarikwatch/db'

export const dynamic = 'force-dynamic'

/** GET /api/admin/articles/[id] — fetch a single article for the editor. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireNewsroomSession()
  const { id } = await params
  const article = await getArticleById(id)
  if (!article) return NextResponse.json({ error: 'भेटिएन।' }, { status: 404 })
  return NextResponse.json(article)
}

/** PUT /api/admin/articles/[id] — update an article. Editors+ can update. */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireNewsroomSession()
  if (!canEdit(session.newsroomRole)) {
    return NextResponse.json({ error: 'सम्पादन अनुमति छैन।' }, { status: 403 })
  }
  const { id } = await params
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const requestedStage = body.workflowStage as string | undefined
  if (requestedStage === 'published' && !canPublish(session.newsroomRole)) {
    return NextResponse.json({ error: 'प्रकाशन अनुमति छैन।' }, { status: 403 })
  }

  const patch: Record<string, unknown> = { ...body }
  if (typeof body.bodyNe === 'string') {
    patch.bodyNe = [{ type: 'paragraph', text: body.bodyNe }] as ArticleBlock[]
  }
  if (typeof body.bodyEn === 'string' && body.bodyEn) {
    patch.bodyEn = [{ type: 'paragraph', text: body.bodyEn }] as ArticleBlock[]
  }

  const updated = await updateArticle(id, patch as Parameters<typeof updateArticle>[1], session.userId)
  if (!updated) return NextResponse.json({ error: 'भेटिएन।' }, { status: 404 })
  return NextResponse.json(updated)
}

/** DELETE /api/admin/articles/[id] — delete an article. Super admin only. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireNewsroomSession()
  if (!canDelete(session.newsroomRole)) {
    return NextResponse.json({ error: 'मेटाउन अनुमति छैन। केवल मुख्य एडमिन।' }, { status: 403 })
  }
  const { id } = await params
  const existing = await getArticleById(id)
  if (!existing) return NextResponse.json({ error: 'भेटिएन।' }, { status: 404 })
  const ok = await deleteArticle(id)
  return NextResponse.json({ ok, deletedId: id, deletedBy: session.userId })
}
