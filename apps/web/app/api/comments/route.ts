import { NextResponse, type NextRequest } from 'next/server'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import { createComment, getCommentsForArticle } from '@/lib/engagement/store'
import { getSession } from '@/lib/auth/session'
import { enforceRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/comments?articleSlug=… — list approved comments for an article.
 * Pending comments are only visible in /admin/comments.
 */
export async function GET(request: NextRequest) {
  const articleSlug = request.nextUrl.searchParams.get('articleSlug') ?? ''
  if (!articleSlug) return NextResponse.json({ comments: [] })
  const comments = await getCommentsForArticle(articleSlug)
  return NextResponse.json({ comments })
}

/**
 * POST /api/comments — create a reader comment. Comments are always created in
 * 'pending' status; a moderator approves them in /admin/comments before they
 * appear publicly.
 */
export async function POST(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }

  const limited = await enforceRateLimit(request, 'comment', 5, 60_000)
  if (limited) return limited

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const articleSlug = String(body.articleSlug ?? '').trim()
  const articleCategory = String(body.articleCategory ?? '').trim()
  const authorName = String(body.authorName ?? '').trim()
  const bodyNe = String(body.bodyNe ?? '').trim()
  const parentId = body.parentId ? String(body.parentId) : undefined
  const locale = body.locale === 'en' ? 'en' : 'ne'

  if (!articleSlug || !authorName || !bodyNe) {
    return NextResponse.json({ error: 'आवश्यक क्षेत्रहरू भर्नुहोस्।' }, { status: 400 })
  }
  if (bodyNe.length > 2000) {
    return NextResponse.json({ error: 'टिप्पणी २००० अक्षरभन्दा छोटो हुनुपर्छ।' }, { status: 400 })
  }

  const session = await getSession().catch(() => null)
  const comment = await createComment({
    articleSlug,
    articleCategory,
    authorName,
    authorEmail: session?.email,
    authorUserId: session?.userId,
    bodyNe,
    parentId,
    locale,
  })

  return NextResponse.json(
    {
      id: comment.id,
      status: comment.status,
      message: 'टिप्पणी प्राप्त भयो। सम्पादकीय स्वीकृतिपछि प्रकाशित हुनेछ।',
    },
    { status: 201 },
  )
}
