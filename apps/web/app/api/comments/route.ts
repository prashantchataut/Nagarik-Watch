import { createHash } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import {
  createComment,
  deleteOwnComment,
  getCommentsForArticle,
  isValidCommentParent,
} from '@/lib/engagement/store'
import { getSession } from '@/lib/auth/session'
import { clientIp, enforceRateLimit } from '@/lib/rate-limit'
import { getPublicArticleIdentity } from '@/lib/content/public-article-identity'
import { getCaptchaState, verifyTurnstileToken } from '@/lib/security/turnstile'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const articleSlug = request.nextUrl.searchParams.get('articleSlug')?.trim() ?? ''
  const articleCategory = request.nextUrl.searchParams.get('articleCategory')?.trim() ?? ''
  if (
    !articleSlug ||
    !articleCategory ||
    articleSlug.length > 160 ||
    articleCategory.length > 120
  ) {
    return NextResponse.json({ comments: [] })
  }
  let article
  try {
    article = await getPublicArticleIdentity(articleCategory, articleSlug)
  } catch {
    return NextResponse.json(
      { error: 'Content service is temporarily unavailable.' },
      { status: 503 },
    )
  }
  if (!article || !article.commentsEnabled) return NextResponse.json({ comments: [] })

  let comments: Awaited<ReturnType<typeof getCommentsForArticle>>
  let session: Awaited<ReturnType<typeof getSession>> | null
  try {
    ;[comments, session] = await Promise.all([
      getCommentsForArticle(article.slug, article.category),
      getSession().catch(() => null),
    ])
  } catch (error) {
    console.error('[comments] read failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Comments are temporarily unavailable.' }, { status: 503 })
  }
  const payload = {
    comments: comments.map((comment) => ({
      id: comment.id,
      authorName: comment.authorName,
      bodyNe: comment.bodyNe,
      parentId: comment.parentId,
      locale: comment.locale,
      status: comment.status,
      createdAt: comment.createdAt,
      upvoteCount: Number(comment.upvoteCount ?? 0),
      canDelete: Boolean(
        session?.userId && 'authorUserId' in comment && comment.authorUserId === session.userId,
      ),
    })),
    signedIn: Boolean(session),
    displayName: session?.displayName ?? null,
  }
  const etag = `"${createHash('sha256').update(JSON.stringify(payload)).digest('base64url')}"`
  const headers = {
    'cache-control': 'private, no-cache, must-revalidate',
    etag,
    vary: 'Cookie',
  }
  if (request.headers.get('if-none-match') === etag) {
    return new NextResponse(null, { status: 304, headers })
  }
  return NextResponse.json(payload, { headers })
}

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
  const bodyNe = String(body.bodyNe ?? '').trim()
  const parentId = body.parentId ? String(body.parentId).trim() : undefined
  const turnstileToken = String(body.turnstileToken ?? '')
  const locale = body.locale === 'en' ? 'en' : 'ne'
  const session = await getSession().catch(() => null)

  if (!session?.userId) {
    return NextResponse.json(
      {
        error:
          locale === 'en' ? 'Sign in is required to comment.' : 'टिप्पणी गर्न साइन इन आवश्यक छ।',
      },
      { status: 401 },
    )
  }

  if (
    !articleSlug ||
    !articleCategory ||
    !bodyNe ||
    articleSlug.length > 160 ||
    articleCategory.length > 120 ||
    (parentId?.length ?? 0) > 160
  ) {
    return NextResponse.json(
      {
        error:
          locale === 'en' ? 'Complete all required fields.' : 'आवश्यक क्षेत्रहरू ठीकसँग भर्नुहोस्।',
      },
      { status: 400 },
    )
  }
  if (bodyNe.length < 3 || bodyNe.length > 2000) {
    return NextResponse.json(
      {
        error:
          locale === 'en'
            ? 'Comment must be 3–2,000 characters.'
            : 'टिप्पणी ३ देखि २००० अक्षरभित्र हुनुपर्छ।',
      },
      { status: 400 },
    )
  }
  if (getCaptchaState().enabled) {
    const captcha = await verifyTurnstileToken(turnstileToken, clientIp(request))
    if (!captcha.success) {
      return NextResponse.json(
        {
          error: locale === 'en' ? 'Captcha verification failed.' : 'क्याप्चा प्रमाणिकरण असफल भयो।',
        },
        { status: 400 },
      )
    }
  }

  let article
  try {
    article = await getPublicArticleIdentity(articleCategory, articleSlug)
  } catch {
    return NextResponse.json(
      { error: 'Content service is temporarily unavailable.' },
      { status: 503 },
    )
  }
  if (!article) return NextResponse.json({ error: 'Article not found.' }, { status: 404 })
  if (!article.commentsEnabled) {
    return NextResponse.json(
      {
        error:
          locale === 'en' ? 'Comments are closed for this article.' : 'यो समाचारमा टिप्पणी बन्द छ।',
      },
      { status: 403 },
    )
  }
  if (parentId) {
    let validParent = false
    try {
      validParent = await isValidCommentParent(article.slug, article.category, parentId)
    } catch (error) {
      console.error(
        '[comments] reply validation failed',
        error instanceof Error ? error.message : error,
      )
      return NextResponse.json(
        {
          error:
            locale === 'en'
              ? 'Comments are temporarily unavailable.'
              : 'टिप्पणी सेवा अस्थायी रूपमा उपलब्ध छैन।',
        },
        { status: 503 },
      )
    }
    if (!validParent) {
      return NextResponse.json(
        {
          error:
            locale === 'en'
              ? 'Reply target is not available.'
              : 'जवाफ दिन खोजिएको टिप्पणी उपलब्ध छैन।',
        },
        { status: 400 },
      )
    }
  }

  const authorName = session.displayName?.trim() || (locale === 'en' ? 'Reader' : 'पाठक')
  let comment
  try {
    comment = await createComment({
      articleSlug: article.slug,
      articleCategory: article.category,
      authorName,
      authorEmail: session?.email,
      authorUserId: session?.userId,
      bodyNe,
      parentId,
      locale,
    })
  } catch (error) {
    console.error('[comments] write failed', error instanceof Error ? error.message : error)
    return NextResponse.json(
      {
        error:
          locale === 'en'
            ? 'Comments are temporarily unavailable.'
            : 'टिप्पणी सेवा अस्थायी रूपमा उपलब्ध छैन।',
      },
      { status: 503 },
    )
  }

  return NextResponse.json(
    {
      id: comment.id,
      status: comment.status,
      authorName,
      parentId: comment.parentId,
      canDelete: Boolean(session?.userId),
      message:
        locale === 'en'
          ? 'Comment received for moderation.'
          : 'टिप्पणी प्राप्त भयो। सम्पादकीय स्वीकृतिपछि प्रकाशित हुनेछ।',
    },
    { status: 201 },
  )
}

export async function DELETE(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }
  const limited = await enforceRateLimit(request, 'comment-delete', 20, 60_000)
  if (limited) return limited
  const session = await getSession().catch(() => null)
  if (!session?.userId) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const id = String(body.id ?? '').trim()
  if (!id || id.length > 160)
    return NextResponse.json({ error: 'Invalid comment.' }, { status: 400 })
  let result: Awaited<ReturnType<typeof deleteOwnComment>>
  try {
    result = await deleteOwnComment(id, session.userId)
  } catch (error) {
    console.error('[comments] delete failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Comments are temporarily unavailable.' }, { status: 503 })
  }
  if (result === 'deleted') return NextResponse.json({ ok: true })
  if (result === 'has_replies') {
    return NextResponse.json(
      { error: 'A comment with published replies cannot be deleted.' },
      { status: 409 },
    )
  }
  return NextResponse.json({ error: 'Comment not found.' }, { status: 404 })
}
