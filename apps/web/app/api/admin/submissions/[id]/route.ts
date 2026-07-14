import { NextResponse, type NextRequest } from 'next/server'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import { requireNewsroomSession } from '@/lib/auth/session'
import { canEdit, canModerateComments } from '@/lib/admin-roles'
import { asSubmissionStatus, updateSubmissionStatus } from '@/lib/submissions'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }

  const session = await requireNewsroomSession()
  if (!canEdit(session.newsroomRole) && !canModerateComments(session.newsroomRole)) {
    return NextResponse.json({ error: 'Permission denied.' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const status = asSubmissionStatus(String(body.status ?? ''))
  if (status === 'all') return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })

  const ok = await updateSubmissionStatus({
    id: (await params).id,
    status,
    editorNote: String(body.editorNote ?? '').trim() || undefined,
    handledBy: session.userId,
  })
  if (!ok) return NextResponse.json({ error: 'Submission not found.' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
