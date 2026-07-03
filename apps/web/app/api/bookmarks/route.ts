import { NextResponse, type NextRequest } from 'next/server'
import { addBookmark, removeBookmark, getBookmarks } from '@/lib/engagement/store'
import { getSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

/**
 * Bookmarks API. Three methods:
 *   GET  /api/bookmarks?fingerprint=…       → list bookmarks for this reader
 *   POST /api/bookmarks { action: 'add'|'remove', articleSlug, … }
 *
 * Logged-in readers are keyed by userId (so bookmarks sync across devices).
 * Anonymous readers are keyed by a client-generated fingerprint stored in
 * localStorage. When an anonymous reader later signs in, a migration hook
 * (Phase 3) will merge their anonymous bookmarks into their user account.
 */
export async function GET(request: NextRequest) {
  const fingerprint = request.nextUrl.searchParams.get('fingerprint') ?? ''
  const session = await getSession().catch(() => null)
  const list = await getBookmarks(fingerprint, session?.userId)
  return NextResponse.json({ bookmarks: list })
}

export async function POST(request: NextRequest) {
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
  const articleTitleNe = String(body.articleTitleNe ?? '').trim()

  if (!fingerprint || !articleSlug) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const session = await getSession().catch(() => null)

  if (action === 'add') {
    await addBookmark({
      anonymousId: fingerprint,
      userId: session?.userId,
      articleSlug,
      articleCategory,
      articleTitleNe,
    })
    return NextResponse.json({ ok: true }, { status: 201 })
  }
  if (action === 'remove') {
    await removeBookmark(fingerprint, session?.userId, articleSlug)
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
