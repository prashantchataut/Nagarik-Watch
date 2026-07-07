import { NextResponse, type NextRequest } from 'next/server'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import { recordReading } from '@/lib/engagement/store'
import { getSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

/**
 * POST /api/reading — record a reader's reading-progress ping. Called by the
 * ReadingProgress client component as the reader scrolls. One entry per
 * article per reader; re-reading updates the readAt + readPercent.
 *
 * Body: { fingerprint, articleSlug, articleCategory, articleTitleNe, readPercent }
 */
export async function POST(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const fingerprint = String(body.fingerprint ?? '').trim()
  const articleSlug = String(body.articleSlug ?? '').trim()
  const articleCategory = String(body.articleCategory ?? '').trim()
  const articleTitleNe = String(body.articleTitleNe ?? '').trim()
  const readPercent = Math.min(100, Math.max(0, Number(body.readPercent ?? 0)))

  if (!fingerprint || !articleSlug) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const session = await getSession().catch(() => null)
  await recordReading({
    anonymousId: fingerprint,
    userId: session?.userId,
    articleSlug,
    articleCategory,
    articleTitleNe,
    readPercent,
  })

  return NextResponse.json({ ok: true }, { status: 202 })
}
