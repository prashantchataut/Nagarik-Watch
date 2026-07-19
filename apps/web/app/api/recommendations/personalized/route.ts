import { NextResponse, type NextRequest } from 'next/server'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { getSession } from '@/lib/auth/session'
import { asLocale } from '@/lib/i18n/locales'
import { getStories } from '@/lib/content'
import { getBookmarks, getReadingHistory } from '@/lib/engagement/store'
import { getReaderPreferences } from '@/lib/reader/preferences-store'
import { getInteractionMatrix } from '@/lib/engagement/interaction-matrix'
import { recommendForReader } from '@/lib/reader/personalize'
import type { BookmarkRecord, ReadingHistoryRecord } from '@/lib/reader/state'

export const dynamic = 'force-dynamic'

/**
 * Server-side counterpart to the client-only `recommendForReader` call in
 * `RecommendedForYou`. Only this route sees the full consented interaction
 * matrix — the client never receives raw reader×article data, just the
 * final ranked stories, keeping collaborative filtering server-only.
 */
export async function GET(request: NextRequest) {
  const fingerprint = request.nextUrl.searchParams.get('fingerprint')?.trim() ?? ''
  const session = await getSession().catch(() => null)
  if (!session && !fingerprint) return NextResponse.json({ recommendations: [] })
  if (fingerprint.length > 160) {
    return NextResponse.json({ error: 'Invalid reader identifier.' }, { status: 400 })
  }

  const locale: Locale = asLocale(request.nextUrl.searchParams.get('locale') ?? 'ne')
  const limit = Math.max(1, Math.min(12, Number(request.nextUrl.searchParams.get('limit') ?? 5)))

  const [catalogResult, bookmarkRows, historyRows, preferences, interactions] = await Promise.all([
    getStories({ locale, perPage: 200 }),
    getBookmarks(fingerprint, session?.userId),
    getReadingHistory(fingerprint, session?.userId),
    getReaderPreferences(fingerprint, session?.userId),
    getInteractionMatrix(),
  ])

  const catalog = catalogResult.items
  const byRoute = new Map(catalog.map((story) => [`${story.category.slug}:${story.slug}`, story]))

  const bookmarks: BookmarkRecord[] = bookmarkRows.flatMap((item) => {
    const story = byRoute.get(`${item.articleCategory}:${item.articleSlug}`)
    return story ? [{ articleId: story.id, story, savedAt: item.createdAt }] : []
  })

  const history: ReadingHistoryRecord[] = historyRows.flatMap((item) => {
    const story = byRoute.get(`${item.articleCategory}:${item.articleSlug}`)
    if (!story) return []
    return [
      {
        articleId: story.id,
        slug: story.slug,
        categorySlug: story.category.slug,
        tagSlugs: item.articleTagSlugs ?? [],
        authorSlugs: item.articleAuthorSlugs ?? [],
        title: story.titleNe,
        href: `/${story.category.slug}/${story.slug}`,
        readAt: item.readAt,
        firstReadAt: item.firstReadAt,
        scrollDepth: item.readPercent,
        completed: item.completed,
        sessions: item.sessions,
        dwellSeconds: item.dwellSeconds,
      },
    ]
  })

  const readerId = session?.userId || fingerprint
  const recommendations = recommendForReader(catalog, bookmarks, history, {
    limit,
    preferences,
    interactions,
    readerId,
  })

  return NextResponse.json({
    recommendations: recommendations.map((story: StoryCardData & { recStrategy: string }) => ({
      id: story.id,
      recStrategy: story.recStrategy,
    })),
  })
}
