/**
 * Indexation health of the published archive.
 *
 * The catalog described this as "local health score from sitemap freshness and
 * canonical coverage", and the handler computed one from fixture inputs. This
 * computes it from the actual corpus: the same story projections the sitemap
 * emits, checked for the things that make a URL index badly rather than not at
 * all.
 *
 * Deliberately limited to what a list projection carries — deck, hero image,
 * title, slug, noIndex, publishedAt. The per-article SEO fields live on the
 * full article and reading a few thousand of them to colour an admin page is
 * not a trade worth making. Everything reported here is checkable in one pass
 * over data the site already loads.
 */
import type { StoryCardData } from '@nagarikwatch/db'

/** Nepali renders wide; past this a headline is truncated in most SERP layouts. */
const TITLE_SERP_LIMIT = 70
/** Google News drops stories older than two days, so an empty window is a real gap. */
const NEWS_WINDOW_HOURS = 48
/** Above this share of the archive, no-indexing stops looking deliberate. */
const NOINDEX_SHARE_LIMIT = 0.15

export type IndexationIssueCode =
  'missing-deck' | 'missing-hero' | 'long-title' | 'duplicate-title' | 'duplicate-slug'

export type IndexationFinding = {
  code: IndexationIssueCode
  severity: 'error' | 'warning'
  count: number
  /** A handful of slugs so an editor can go and look. */
  samples: string[]
}

export type IndexationHealth = {
  total: number
  indexable: number
  noIndexed: number
  /** Hours since the newest indexable story; drives the news-sitemap window. */
  freshnessHours: number | null
  /** True when nothing published inside the Google News window. */
  newsWindowEmpty: boolean
  /** Share of indexable stories with a reviewed English edition. */
  bilingualShare: number
  /** 0–1, weighted by how much each finding costs indexation. */
  score: number
  findings: IndexationFinding[]
}

const WEIGHTS: Record<IndexationIssueCode, number> = {
  'duplicate-slug': 0.3,
  'duplicate-title': 0.2,
  'missing-deck': 0.2,
  'missing-hero': 0.15,
  'long-title': 0.05,
}

function normaliseTitle(title: string): string {
  return title.trim().replace(/\s+/gu, ' ').toLowerCase()
}

function finding(
  code: IndexationIssueCode,
  severity: IndexationFinding['severity'],
  slugs: string[],
): IndexationFinding | null {
  if (slugs.length === 0) return null
  return { code, severity, count: slugs.length, samples: slugs.slice(0, 5) }
}

export function assessIndexation(
  stories: readonly StoryCardData[],
  now = Date.now(),
): IndexationHealth {
  const indexable = stories.filter((story) => story.noIndex !== true)
  const noIndexed = stories.length - indexable.length

  const missingDeck: string[] = []
  const missingHero: string[] = []
  const longTitle: string[] = []
  const byTitle = new Map<string, string[]>()
  const bySlug = new Map<string, string[]>()
  let newest: number | null = null
  let bilingual = 0

  for (const story of indexable) {
    if (!story.deckNe?.trim()) missingDeck.push(story.slug)
    if (!story.heroImage?.url) missingHero.push(story.slug)
    if (story.titleNe.trim().length > TITLE_SERP_LIMIT) longTitle.push(story.slug)
    if (story.hasEnglish) bilingual += 1

    const title = normaliseTitle(story.titleNe)
    byTitle.set(title, [...(byTitle.get(title) ?? []), story.slug])
    // The same slug under two categories is two URLs for one story, and the
    // canonical resolver has to pick one — which is the crawler's problem too.
    bySlug.set(story.slug, [...(bySlug.get(story.slug) ?? []), story.category.slug])

    const published = Date.parse(story.publishedAt)
    if (!Number.isNaN(published) && (newest === null || published > newest)) newest = published
  }

  const duplicateTitles = [...byTitle.values()].filter((slugs) => slugs.length > 1).flat()
  const duplicateSlugs = [...bySlug.entries()]
    .filter(([, categories]) => categories.length > 1)
    .map(([slug]) => slug)

  const findings = [
    finding('duplicate-slug', 'error', duplicateSlugs),
    finding('duplicate-title', 'warning', duplicateTitles),
    finding('missing-deck', 'warning', missingDeck),
    finding('missing-hero', 'warning', missingHero),
    finding('long-title', 'warning', longTitle),
  ].filter((entry): entry is IndexationFinding => entry !== null)

  // Each finding costs its weight scaled by how much of the archive it touches,
  // so one bad headline in a thousand stories does not read as a crisis.
  const penalty = indexable.length
    ? findings.reduce(
        (sum, entry) => sum + WEIGHTS[entry.code] * (entry.count / indexable.length),
        0,
      )
    : 0
  const freshnessHours = newest === null ? null : Math.max(0, (now - newest) / 3_600_000)
  const noIndexPenalty =
    stories.length && noIndexed / stories.length > NOINDEX_SHARE_LIMIT ? 0.1 : 0

  return {
    total: stories.length,
    indexable: indexable.length,
    noIndexed,
    freshnessHours,
    newsWindowEmpty: freshnessHours === null || freshnessHours > NEWS_WINDOW_HOURS,
    bilingualShare: indexable.length ? bilingual / indexable.length : 0,
    score: Math.max(0, Math.min(1, 1 - penalty - noIndexPenalty)),
    findings,
  }
}
