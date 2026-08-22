import { NextResponse, type NextRequest } from 'next/server'
import { isReactionEmoji, reactionCounts, toggleReaction } from '@/lib/engagement/reactions'
import { enforceRateLimit } from '@/lib/rate-limit'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import { getPublicArticleIdentity } from '@/lib/content/public-article-identity'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const articleSlug = request.nextUrl.searchParams.get('articleSlug')?.trim() ?? ''
  const articleCategory = request.nextUrl.searchParams.get('articleCategory')?.trim() ?? ''
  if (!articleSlug || !articleCategory || articleSlug.length > 200 || articleCategory.length > 80) {
    return NextResponse.json({ error: 'Invalid article.' }, { status: 400 })
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

  try {
    const counts = await reactionCounts(article.slug)
    return NextResponse.json({ counts })
  } catch (error) {
    console.error('[reactions] read failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Reactions are temporarily unavailable.' }, { status: 503 })
  }
}

export async function POST(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }
  const limited = await enforceRateLimit(request, 'reactions', 40, 60_000)
  if (limited) return limited

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const articleSlug = String(body.articleSlug ?? '').trim()
  const articleCategory = String(body.articleCategory ?? '')
    .trim()
    .slice(0, 80)
  const emoji = String(body.emoji ?? '')
  const visitorKey = String(body.visitorKey ?? '')
    .trim()
    .slice(0, 200)
  if (!articleSlug || !articleCategory || !visitorKey || !isReactionEmoji(emoji)) {
    return NextResponse.json({ error: 'Invalid reaction.' }, { status: 400 })
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

  try {
    const result = await toggleReaction({
      articleSlug: article.slug,
      articleCategory: article.category,
      emoji,
      visitorKey,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('[reactions] write failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Reactions are temporarily unavailable.' }, { status: 503 })
  }
}
