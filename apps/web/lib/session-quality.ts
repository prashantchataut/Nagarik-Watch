import 'server-only'
import {
  getBookmarkVelocityStats,
  getMostReadStats,
  type BookmarkVelocityStat,
  type MostReadStat,
} from '@/lib/engagement/store'
import {
  getRankingEventStats,
  type RankingEventStat,
} from '@/lib/engagement/ranking-events'

export type SessionQualityRow = {
  articleSlug: string
  categorySlug: string
  readers: number
  sessions: number
  averageDwellSeconds: number
  completionRate: number
  shares: number
  bookmarks: number
  qualityScore: number
}

export type SessionQualityReport = {
  generatedAt: string
  windowHours: number
  totals: {
    stories: number
    readersAcrossStories: number
    sessions: number
    shares: number
    bookmarks: number
  }
  averages: {
    dwellSeconds: number
    completionRate: number
    qualityScore: number
  }
  stories: SessionQualityRow[]
}

export function aggregateSessionQuality(
  reading: MostReadStat[],
  ranking: RankingEventStat[],
  bookmarks: BookmarkVelocityStat[],
  generatedAt = new Date(),
): SessionQualityReport {
  const rankingBySlug = new Map(ranking.map((row) => [row.articleSlug, row]))
  const bookmarksBySlug = new Map(bookmarks.map((row) => [row.articleSlug, row]))
  const slugs = new Set([
    ...reading.map((row) => row.articleSlug),
    ...ranking.map((row) => row.articleSlug),
    ...bookmarks.map((row) => row.articleSlug),
  ])
  const readingBySlug = new Map(reading.map((row) => [row.articleSlug, row]))

  const stories = Array.from(slugs, (articleSlug): SessionQualityRow => {
    const read = readingBySlug.get(articleSlug)
    const event = rankingBySlug.get(articleSlug)
    const saved = bookmarksBySlug.get(articleSlug)
    const readers = read?.uniqueReaders ?? 0
    const shares = event?.shares ?? 0
    const bookmarkCount = saved?.bookmarks ?? 0
    const dwellComponent = Math.min(1, (read?.averageDwellSeconds ?? 0) / 180)
    const completionComponent = Math.min(1, Math.max(0, read?.completionRate ?? 0))
    const shareComponent = Math.min(1, shares / Math.max(5, readers))
    const bookmarkComponent = Math.min(1, bookmarkCount / Math.max(5, readers))
    return {
      articleSlug,
      categorySlug: read?.articleCategory || saved?.articleCategory || '',
      readers,
      sessions: read?.totalSessions ?? 0,
      averageDwellSeconds: read?.averageDwellSeconds ?? 0,
      completionRate: completionComponent,
      shares,
      bookmarks: bookmarkCount,
      qualityScore:
        dwellComponent * 0.35 +
        completionComponent * 0.35 +
        shareComponent * 0.15 +
        bookmarkComponent * 0.15,
    }
  }).sort((a, b) => b.qualityScore - a.qualityScore || b.readers - a.readers)

  const readersAcrossStories = stories.reduce((sum, row) => sum + row.readers, 0)
  const weightedDenominator = Math.max(1, readersAcrossStories)
  return {
    generatedAt: generatedAt.toISOString(),
    windowHours: 24,
    totals: {
      stories: stories.length,
      readersAcrossStories,
      sessions: stories.reduce((sum, row) => sum + row.sessions, 0),
      shares: stories.reduce((sum, row) => sum + row.shares, 0),
      bookmarks: stories.reduce((sum, row) => sum + row.bookmarks, 0),
    },
    averages: {
      dwellSeconds:
        stories.reduce((sum, row) => sum + row.averageDwellSeconds * row.readers, 0) /
        weightedDenominator,
      completionRate:
        stories.reduce((sum, row) => sum + row.completionRate * row.readers, 0) /
        weightedDenominator,
      qualityScore:
        stories.reduce((sum, row) => sum + row.qualityScore * Math.max(1, row.readers), 0) /
        Math.max(1, stories.reduce((sum, row) => sum + Math.max(1, row.readers), 0)),
    },
    stories,
  }
}

/** Privacy-preserving 24-hour aggregate; no owner or session identifiers leave storage. */
export async function getSessionQualityReport(): Promise<SessionQualityReport> {
  const [reading, ranking, bookmarks] = await Promise.all([
    getMostReadStats(1, 100).catch(() => []),
    getRankingEventStats(24 * 60).catch(() => []),
    getBookmarkVelocityStats(24 * 60, 100).catch(() => []),
  ])
  return aggregateSessionQuality(reading, ranking, bookmarks)
}
