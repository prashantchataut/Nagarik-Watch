import 'server-only'
import type { StoryCardData } from '@nagarikwatch/db'
import { getStories } from '@/lib/content'
import { buildStoryEngagementIndex, signalsForStory } from '@/lib/ranking-signals'
import { velocityScore, burstScore } from '@/lib/ranking'
import { listAdminSettings, setAdminSetting } from '@/lib/admin-settings'
import { listArticlesForAdmin, updateArticle } from '@/lib/content/store/json-store'
import { isPayloadCanonical } from '@/lib/content/payload-admin-client'
import { revalidatePublishedArticle } from '@/lib/content/revalidate-published'

const SETTING_KEY = 'editorial.breakingAutoBoost'
const MAX_BOOSTS_PER_RUN = 3
const MAX_AGE_HOURS = 36
const SYSTEM_ACTOR = 'system:breaking-auto-boost'

export type BreakingBoostResult = {
  enabled: boolean
  boosted: Array<{ id: string; slug: string; reason: string }>
  cleared: Array<{ id: string; slug: string }>
  skipped: string
  inspected: number
}

/** Kill switch: admin setting `editorial.breakingAutoBoost` or env BREAKING_AUTO_BOOST=false. */
export async function isBreakingAutoBoostEnabled(): Promise<boolean> {
  if (process.env.BREAKING_AUTO_BOOST?.trim().toLowerCase() === 'false') return false
  if (process.env.BREAKING_AUTO_BOOST?.trim().toLowerCase() === 'true') return true
  const settings = await listAdminSettings().catch(() => [])
  const row = settings.find((setting) => setting.key === SETTING_KEY)
  if (!row) return false
  const value = row.value.trim().toLowerCase()
  return value === 'on' || value === 'true' || value === '1' || value === 'enabled'
}

export async function ensureBreakingAutoBoostSetting(): Promise<void> {
  const settings = await listAdminSettings().catch(() => [])
  if (settings.some((setting) => setting.key === SETTING_KEY)) return
  await setAdminSetting({
    key: SETTING_KEY,
    value: 'off',
    label: 'Breaking auto-boost (on/off) — velocity + dwell spike; human kill switch',
    group: 'editorial',
  }).catch(() => undefined)
}

function storyIsFresh(story: StoryCardData, now: Date): boolean {
  const published = Date.parse(story.publishedAt)
  if (!Number.isFinite(published)) return false
  return now.getTime() - published <= MAX_AGE_HOURS * 3_600_000
}

function boostReason(
  story: StoryCardData,
  index: Awaited<ReturnType<typeof buildStoryEngagementIndex>>,
): string | null {
  const signals = signalsForStory(story, index)
  const velocity = velocityScore(signals)
  const burst = burstScore(signals)
  const dwell = signals.dwellTimeSeconds ?? 0
  const completion = signals.readingCompletion ?? 0
  const recentViews = signals.viewsLast10Min ?? 0
  const hourly = signals.viewsPerHour ?? 0

  const sustained = dwell >= 40 || completion >= 0.35
  const hot =
    burst > 0 || (recentViews >= 2 && sustained) || (hourly >= 3 && sustained && velocity >= 0.4)

  if (!hot || !sustained) return null
  return `velocity=${velocity.toFixed(2)} burst=${burst.toFixed(2)} dwell=${Math.round(dwell)}s views10m=${recentViews.toFixed(1)}`
}

/**
 * Promote hot stories to breaking when velocity + sustained dwell spike.
 * Respects human kill switch. Never invents traffic — empty engagement = no boosts.
 */
export async function runBreakingAutoBoost(): Promise<BreakingBoostResult> {
  await ensureBreakingAutoBoostSetting()
  const enabled = await isBreakingAutoBoostEnabled()

  if (isPayloadCanonical()) {
    return {
      enabled,
      boosted: [],
      cleared: [],
      skipped: 'payload-canonical',
      inspected: 0,
    }
  }

  const { items: adminList } = await listArticlesForAdmin({ limit: 400 }).catch(() => ({
    items: [],
    total: 0,
  }))

  if (!enabled) {
    const cleared: BreakingBoostResult['cleared'] = []
    for (const article of adminList) {
      if (!article.isBreaking || !article.autoBreakingAt) continue
      await updateArticle(
        article.id,
        { isBreaking: false, autoBreakingAt: undefined },
        SYSTEM_ACTOR,
      )
      cleared.push({ id: article.id, slug: article.slug })
    }
    return {
      enabled: false,
      boosted: [],
      cleared,
      skipped: 'kill-switch-off',
      inspected: adminList.length,
    }
  }

  const now = new Date()
  const [{ items }, engagement] = await Promise.all([
    getStories({ locale: 'ne', perPage: 60 }),
    buildStoryEngagementIndex(120),
  ])

  if (engagement.sampleCount === 0) {
    return {
      enabled: true,
      boosted: [],
      cleared: [],
      skipped: 'no-engagement-samples',
      inspected: items.length,
    }
  }

  const candidates = items
    .filter((story) => storyIsFresh(story, now) && !story.isBreaking)
    .map((story) => {
      const reason = boostReason(story, engagement)
      return reason ? { story, reason } : null
    })
    .filter((row): row is { story: StoryCardData; reason: string } => Boolean(row))
    .sort((a, b) => {
      const sa = signalsForStory(a.story, engagement)
      const sb = signalsForStory(b.story, engagement)
      return velocityScore(sb) - velocityScore(sa)
    })
    .slice(0, MAX_BOOSTS_PER_RUN)

  const boosted: BreakingBoostResult['boosted'] = []
  const bySlug = new Map(adminList.map((article) => [article.slug, article]))

  for (const { story, reason } of candidates) {
    const stored = bySlug.get(story.slug)
    if (!stored) continue
    const updated = await updateArticle(
      stored.id,
      { isBreaking: true, autoBreakingAt: now.toISOString() },
      SYSTEM_ACTOR,
    )
    if (!updated) continue
    boosted.push({ id: updated.id, slug: updated.slug, reason })
    revalidatePublishedArticle({
      categorySlug: updated.categorySlug,
      slug: updated.slug,
      tagSlugs: updated.tagSlugs,
    })
  }

  return {
    enabled: true,
    boosted,
    cleared: [],
    skipped: boosted.length === 0 ? 'no-candidates-met-threshold' : 'ok',
    inspected: items.length,
  }
}
