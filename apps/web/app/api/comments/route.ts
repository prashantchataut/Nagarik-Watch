import { NextResponse, type NextRequest } from 'next/server'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import {
  createComment,
  getCommentsForArticle,
  isValidCommentParent,
} from '@/lib/engagement/store'
import { getSession } from '@/lib/auth/session'
import { enforceRateLimit } from '@/lib/rate-limit'
import { getPublicArticleIdentity } from '@/lib/content/public-article-identity'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const articleSlug = request.nextUrl.searchParams.get('articleSlug')?.trim() ?? ''
  if (!articleSlug || articleSlug.length > 160) return NextResponse.json({ comments: [] })
  const comments = await getCommentsForArticle(articleSlug)
  return NextResponse.json({ comments })
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
  const submittedName = String(body.authorName ?? '').trim()
  const bodyNe = String(body.bodyNe ?? '').trim()
  const parentId = body.parentId ? String(body.parentId).trim() : undefined
  const locale = body.locale === 'en' ? 'en' : 'ne'

  if (
    !articleSlug ||
    !articleCategory ||
    !submittedName ||
    !bodyNe ||
    articleSlug.length > 160 ||
    articleCategory.length > 120 ||
    submittedName.length > 80 ||
    (parentId?.length ?? 0) > 160
  ) {
    return NextResponse.json({ error: 'आवश्यक क्षेत्रहरू ठीकसँग भर्नुहोस्।' }, { status: 400 })
  }
  if (bodyNe.length > 2000) {
    return NextResponse.json({ error: 'टिप्पणी २००० अक्षरभन्दा छोटो हुनुपर्छ।' }, { status: 400 })
  }

  let article
  try {
    article = await getPublicArticleIdentity(articleCategory, articleSlug)
  } catch {
    return NextResponse.json({ error: 'Content service is temporarily unavailable.' }, { status: 503 })
  }
  if (!article) return NextResponse.json({ error: 'Article not found.' }, { status: 404 })
  if (parentId && !(await isValidCommentParent(article.slug, parentId))) {
    return NextResponse.json({ error: 'Reply target is not available.' }, { status: 400 })
  }

  const session = await getSession().catch(() => null)
  const authorName = session?.displayName?.trim() || submittedName
  const comment = await createComment({
    articleSlug: article.slug,
    articleCategory: article.category,
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
