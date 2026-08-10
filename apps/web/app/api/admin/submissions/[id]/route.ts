import { NextResponse, type NextRequest } from 'next/server'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import { requireNewsroomSession } from '@/lib/auth/session'
import { canEdit, canModerateComments } from '@/lib/admin-roles'
import { asSubmissionStatus, updateSubmissionStatus } from '@/lib/submissions'
import { recordAuditEvent } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const id = (await params).id
  const editorNote = String(body.editorNote ?? '').trim() || undefined
  const ok = await updateSubmissionStatus({
    id,
    status,
    editorNote,
    handledBy: session.userId,
  })
  if (!ok) return NextResponse.json({ error: 'Submission not found.' }, { status: 404 })
  await recordAuditEvent({
    session,
    action: 'status_change',
    targetType: 'submission',
    targetId: id,
    summary: `Submission status changed to ${status}.`,
    meta: { status, hasEditorNote: Boolean(editorNote) },
  })
  return NextResponse.json({ ok: true })
}
