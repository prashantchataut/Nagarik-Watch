import { NextResponse, type NextRequest } from 'next/server'
import { requireNewsroomSession } from '@/lib/auth/session'
import { canModerateComments } from '@/lib/admin-roles'
import { updateCommentStatus, type CommentStatus } from '@/lib/engagement/store'

export const dynamic = 'force-dynamic'

const STATUSES = new Set<CommentStatus>(['pending', 'approved', 'rejected', 'flagged'])

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireNewsroomSession()
  if (!canModerateComments(session.newsroomRole)) {
    return NextResponse.json({ error: 'टिप्पणी मध्यस्थता अनुमति छैन।' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const status = body.status
  if (typeof status !== 'string' || !STATUSES.has(status as CommentStatus)) {
    return NextResponse.json({ error: 'Invalid comment status' }, { status: 400 })
  }

  const { id } = await params
  const ok = await updateCommentStatus(id, status as CommentStatus)
  if (!ok) return NextResponse.json({ error: 'टिप्पणी भेटिएन।' }, { status: 404 })
  return NextResponse.json({ ok: true, id, status })
}
