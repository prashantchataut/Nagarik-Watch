import 'server-only'
import type { StoryCardData } from '@nagarikwatch/db'
import type { RankingSignals } from '@/lib/ranking'
import {
  getBookmarkVelocityStats,
  getMostReadStats,
  getTrendingSamples,
} from '@/lib/engagement/store'
import { getRankingEventStats } from '@/lib/engagement/ranking-events'

export type StoryEngagementIndex = {
  bySlug: Map<
    string,
    {
      viewsPerHour: number
      viewsLast10Min: number
      baselineViewsPer10Min: number
      commentsPerHour: number
      sharesPerHour: number
      shareVelocity: number
      commentVelocity: number
      bookmarkVelocity: number
      readingCompletion: number
      dwellTimeSeconds: number
      impressions: number
      clicks: number
      uniqueReaders: number
    }
  >
  sampleCount: number
  storyCount: number
  totalImpressions: number
}

function emptySignals() {
  return {
    viewsPerHour: 0,
    viewsLast10Min: 0,
    baselineViewsPer10Min: 1,
    commentsPerHour: 0,
    sharesPerHour: 0,
    shareVelocity: 0,
    commentVelocity: 0,
    bookmarkVelocity: 0,
    readingCompletion: 0,
    dwellTimeSeconds: 0,
    impressions: 0,
    clicks: 0,
    uniqueReaders: 0,
  }
}

/** Build a first-party engagement index from reading, bookmarks, and ranking events. */
export async function buildStoryEngagementIndex(
  windowMinutes = 120,
): Promise<StoryEngagementIndex> {
  if (
    engagementCache &&
    engagementCache.windowMinutes === windowMinutes &&
    Date.now() - engagementCache.at < ENGAGEMENT_TTL_MS
  ) {
    return engagementCache.value
  }

  const [samples, mostRead, ranking, bookmarks] = await Promise.all([
    getTrendingSamples(windowMinutes).catch(() => []),
    getMostReadStats(7, 80).catch(() => []),
    getRankingEventStats(windowMinutes).catch(() => []),
    getBookmarkVelocityStats(windowMinutes, 80).catch(() => []),
  ])

  const now = Date.now()
  const bySlug = new Map<string, ReturnType<typeof emptySignals>>()

  for (const sample of samples) {
    const current = bySlug.get(sample.articleId) ?? emptySignals()
    const ageMs = Math.max(0, now - Date.parse(sample.at))
    const weighted =
      sample.views + sample.shares * 6 + sample.comments * 3 + (sample.bookmarks ?? 0) * 4
    const dwellBoost = Math.min(6, (sample.dwellSeconds ?? 0) / 30)
    current.viewsPerHour += (weighted + dwellBoost) / Math.max(1, windowMinutes / 60)
    current.commentsPerHour += sample.comments / Math.max(1, windowMinutes / 60)
    current.sharesPerHour += sample.shares / Math.max(1, windowMinutes / 60)
    current.shareVelocity += sample.shares
    current.commentVelocity += sample.comments
    current.bookmarkVelocity += sample.bookmarks ?? 0
    if (sample.dwellSeconds && sample.dwellSeconds > 0) {
      current.dwellTimeSeconds = Math.max(current.dwellTimeSeconds, sample.dwellSeconds)
    }
    if (ageMs <= 10 * 60_000) current.viewsLast10Min += weighted + dwellBoost
    bySlug.set(sample.articleId, current)
  }

  for (const row of mostRead) {
    const current = bySlug.get(row.articleSlug) ?? emptySignals()
    current.uniqueReaders = row.uniqueReaders
    current.readingCompletion = Math.min(1, row.averageReadPercent / 100)
    // Prefer measured dwell; never invent dwell from completion percent.
    current.dwellTimeSeconds = Math.max(current.dwellTimeSeconds, row.averageDwellSeconds ?? 0)
    bySlug.set(row.articleSlug, current)
  }

  for (const row of bookmarks) {
    const current = bySlug.get(row.articleSlug) ?? emptySignals()
    current.bookmarkVelocity = Math.max(
      current.bookmarkVelocity,
      row.bookmarksLastHour + row.bookmarks / Math.max(1, windowMinutes / 60),
    )
    bySlug.set(row.articleSlug, current)
  }

  let totalImpressions = 0
  for (const row of ranking) {
    const current = bySlug.get(row.articleSlug) ?? emptySignals()
    current.impressions += row.impressions
    current.clicks += row.clicks
    current.sharesPerHour = Math.max(
      current.sharesPerHour,
      row.shares / Math.max(1, windowMinutes / 60),
    )
    current.shareVelocity = Math.max(current.shareVelocity, row.shares)
    totalImpressions += row.impressions
    bySlug.set(row.articleSlug, current)
  }

  for (const [slug, current] of bySlug) {
    current.baselineViewsPer10Min = Math.max(1, current.viewsPerHour / 6)
    bySlug.set(slug, current)
  }

  const value: StoryEngagementIndex = {
    bySlug,
    sampleCount: samples.length,
    storyCount: bySlug.size,
    totalImpressions,
  }
  engagementCache = { at: Date.now(), windowMinutes, value }
  return value
}

const ENGAGEMENT_TTL_MS = 30_000
let engagementCache: {
  at: number
  windowMinutes: number
  value: StoryEngagementIndex
} | null = null

export function signalsForStory(
  story: StoryCardData,
  index: StoryEngagementIndex,
  listIndex = 0,
): RankingSignals {
  const activity = index.bySlug.get(story.slug) ?? emptySignals()
  return {
    editorialPriority: story.isBreaking ? 3 : Math.max(0, 1.2 - listIndex / 25),
    viewsPerHour: activity.viewsPerHour,
    viewsLast10Min: activity.viewsLast10Min,
    baselineViewsPer10Min: activity.baselineViewsPer10Min,
    impressions: activity.impressions,
    clicks: activity.clicks,
    sharesPerHour: activity.sharesPerHour,
    commentsPerHour: activity.commentsPerHour,
    shareVelocity: activity.shareVelocity,
    commentVelocity: activity.commentVelocity,
    bookmarkVelocity: activity.bookmarkVelocity,
    readingCompletion: activity.readingCompletion,
    dwellTimeSeconds: activity.dwellTimeSeconds,
    // Trust stays at 0 until a real source/reliability pipeline populates it.
    qualityTrustScore: 0,
    ltvScore: 0,
    premium: Boolean(story.premium),
  }
}
