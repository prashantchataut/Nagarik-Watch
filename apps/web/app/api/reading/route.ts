import { NextResponse, type NextRequest } from 'next/server'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import { recordReading } from '@/lib/engagement/store'
import { getSession } from '@/lib/auth/session'
import { enforceRateLimit } from '@/lib/rate-limit'
import { getPublicArticleIdentity } from '@/lib/content/public-article-identity'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }

  const limited = await enforceRateLimit(request, 'reading', 30, 60_000)
  if (limited) return limited

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const fingerprint = String(body.fingerprint ?? '').trim()
  const articleSlug = String(body.articleSlug ?? '').trim()
  const articleCategory = String(body.articleCategory ?? '').trim()
  const readPercent = Math.min(100, Math.max(0, Number(body.readPercent ?? 0)))
  const session = await getSession().catch(() => null)

  if (
    (!session && !fingerprint) ||
    fingerprint.length > 160 ||
    !articleSlug ||
    articleSlug.length > 160 ||
    !articleCategory ||
    articleCategory.length > 120 ||
    !Number.isFinite(readPercent)
  ) {
    return NextResponse.json({ error: 'Missing or invalid fields.' }, { status: 400 })
  }

  let article
  try {
    article = await getPublicArticleIdentity(articleCategory, articleSlug)
  } catch {
    return NextResponse.json({ error: 'Content service is temporarily unavailable.' }, { status: 503 })
  }
  if (!article) return NextResponse.json({ error: 'Article not found.' }, { status: 404 })

  await recordReading({
    anonymousId: fingerprint,
    userId: session?.userId,
    articleSlug: article.slug,
    articleCategory: article.category,
    articleTitleNe: article.titleNe,
    readPercent,
  })

  return NextResponse.json({ ok: true }, { status: 202 })
}
