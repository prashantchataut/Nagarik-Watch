import { NextResponse, type NextRequest } from 'next/server'
import { toggleCommentVote } from '@/lib/engagement/reactions'
import { enforceRateLimit } from '@/lib/rate-limit'
import { isTrustedWriteRequest } from '@/lib/security/origin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }
  const limited = await enforceRateLimit(request, 'comment-votes', 40, 60_000)
  if (limited) return limited

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const commentId = String(body.commentId ?? '').trim()
  if (!commentId || commentId.length > 80) {
    return NextResponse.json({ error: 'Invalid comment.' }, { status: 400 })
  }
  const cookieVisitor =
    request.cookies.get('nw_fp')?.value ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'anonymous'
  const result = await toggleCommentVote({ commentId, visitorKey: cookieVisitor })
  return NextResponse.json(result)
}
