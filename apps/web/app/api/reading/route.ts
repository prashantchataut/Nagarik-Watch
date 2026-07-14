import { NextResponse, type NextRequest } from 'next/server'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import {
  clearReadingHistory,
  getReadingHistory,
  mergeAnonymousReading,
  recordReading,
} from '@/lib/engagement/store'
import { getSession } from '@/lib/auth/session'
import { enforceRateLimit } from '@/lib/rate-limit'
import { getPublicArticleIdentity } from '@/lib/content/public-article-identity'

export const dynamic = 'force-dynamic'

function readerIdentity(request: NextRequest) {
  return request.nextUrl.searchParams.get('fingerprint')?.trim() ?? ''
}

export async function GET(request: NextRequest) {
  const fingerprint = readerIdentity(request)
  const session = await getSession().catch(() => null)
  if (!session && !fingerprint) return NextResponse.json({ history: [] })
  if (fingerprint.length > 160) {
    return NextResponse.json({ error: 'Invalid reader identifier.' }, { status: 400 })
  }
  if (session && fingerprint) await mergeAnonymousReading(fingerprint, session.userId)
  return NextResponse.json({ history: await getReadingHistory(fingerprint, session?.userId) })
}

export async function POST(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }
  const limited = await enforceRateLimit(request, 'reading', 40, 60_000)
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
  const sessionId = String(body.sessionId ?? '').trim()
  const readPercent = Math.min(100, Math.max(0, Number(body.readPercent ?? 0)))
  const dwellSeconds = Math.min(86_400, Math.max(0, Number(body.dwellSeconds ?? 0)))
  const completed = Boolean(body.completed) || readPercent >= 92
  const session = await getSession().catch(() => null)

  if (
    (!session && !fingerprint) ||
    fingerprint.length > 160 ||
    !articleSlug ||
    articleSlug.length > 160 ||
    !articleCategory ||
    articleCategory.length > 120 ||
    !sessionId ||
    sessionId.length > 160 ||
    !Number.isFinite(readPercent) ||
    !Number.isFinite(dwellSeconds)
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

  if (session && fingerprint) await mergeAnonymousReading(fingerprint, session.userId)
  await recordReading({
    anonymousId: fingerprint,
    userId: session?.userId,
    articleSlug: article.slug,
    articleCategory: article.category,
    articleTitleNe: article.titleNe,
    articleTagSlugs: article.tagSlugs,
    articleAuthorSlugs: article.authorSlugs,
    readPercent,
    dwellSeconds,
    completed,
    sessionId,
  })

  return NextResponse.json({ ok: true }, { status: 202 })
}

export async function DELETE(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }
  const limited = await enforceRateLimit(request, 'reading-clear', 4, 60_000)
  if (limited) return limited
  const fingerprint = readerIdentity(request)
  const session = await getSession().catch(() => null)
  if (!session && !fingerprint) {
    return NextResponse.json({ error: 'Reader identity required.' }, { status: 400 })
  }
  await clearReadingHistory(fingerprint, session?.userId)
  return NextResponse.json({ ok: true })
}
