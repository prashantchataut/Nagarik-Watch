import { NextResponse, type NextRequest } from 'next/server'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import {
  addBookmark,
  removeBookmark,
  getBookmarks,
  mergeAnonymousBookmarks,
} from '@/lib/engagement/store'
import { getSession } from '@/lib/auth/session'
import { enforceRateLimit } from '@/lib/rate-limit'
import { getPublicArticleIdentity } from '@/lib/content/public-article-identity'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const fingerprint = request.nextUrl.searchParams.get('fingerprint')?.trim() ?? ''
    const session = await getSession().catch(() => null)

    if (!session && !fingerprint) return NextResponse.json({ bookmarks: [] })
    if (fingerprint.length > 160) {
      return NextResponse.json({ error: 'Invalid reader identifier.' }, { status: 400 })
    }
    if (session && fingerprint) await mergeAnonymousBookmarks(fingerprint, session.userId).catch(() => undefined)

    const list = await getBookmarks(fingerprint, session?.userId)
    return NextResponse.json({ bookmarks: list })
  } catch (error) {
    console.error('[bookmarks:GET]', error)
    return NextResponse.json(
      { error: 'Bookmarks temporarily unavailable.', bookmarks: null },
      { status: 503 },
    )
  }
}

export async function POST(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }

  const limited = await enforceRateLimit(request, 'bookmark', 30, 60_000)
  if (limited) return limited

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const action = String(body.action ?? '')
  const fingerprint = String(body.fingerprint ?? '').trim()
  const articleSlug = String(body.articleSlug ?? '').trim()
  const articleCategory = String(body.articleCategory ?? '').trim()
  const session = await getSession().catch(() => null)

  if (
    !articleSlug ||
    articleSlug.length > 160 ||
    articleCategory.length > 120 ||
    fingerprint.length > 160 ||
    (!session && !fingerprint)
  ) {
    return NextResponse.json({ error: 'Missing or invalid fields.' }, { status: 400 })
  }

  if (session && fingerprint) await mergeAnonymousBookmarks(fingerprint, session.userId)

  if (action === 'add') {
    if (!articleCategory) {
      return NextResponse.json({ error: 'Article category is required.' }, { status: 400 })
    }
    let article
    try {
      article = await getPublicArticleIdentity(articleCategory, articleSlug)
    } catch {
      return NextResponse.json({ error: 'Content service is temporarily unavailable.' }, { status: 503 })
    }
    if (!article) return NextResponse.json({ error: 'Article not found.' }, { status: 404 })

    await addBookmark({
      anonymousId: fingerprint,
      userId: session?.userId,
      articleSlug: article.slug,
      articleCategory: article.category,
      articleTitleNe: article.titleNe,
    })
    return NextResponse.json({ ok: true }, { status: 201 })
  }

  if (action === 'remove') {
    await removeBookmark(fingerprint, session?.userId, articleSlug)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
