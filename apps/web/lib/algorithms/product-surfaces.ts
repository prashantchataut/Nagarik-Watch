/**
 * Which catalog algorithms a reader can actually reach.
 *
 * `/admin/algorithms` runs all 232 catalog ids through `runAllAlgorithms` and
 * reports "232 live, 0 failures". That is true of the runtime and misleading
 * about the product: most of those handlers are executed only by that panel,
 * against `defaultFixtureFor(id)`. Nothing a reader loads calls them.
 *
 * This table records the ones that are genuinely wired: the module that
 * implements the algorithm, and one reader-facing entrypoint that transitively
 * imports it. "Reader-facing" means the output reaches a reader — a page they
 * load, a public API route their browser calls, or the delivery cron that
 * pushes to their device. It does not mean "a React render", and the
 * distinction matters for the notification policy algorithms, whose only
 * entrypoint is the cron that sends the push. It is a declaration because the admin page has to render it in a
 * Workers runtime with no filesystem — but it is not a claim. `wiring.test.ts`
 * rebuilds the import graph from source on every run and fails if this table
 * and the graph disagree in either direction, so an algorithm cannot be quietly
 * added here, and one that gets unwired cannot quietly stay.
 *
 * Rows are tagged `reader` or `newsroom`. A newsroom row means an editor or
 * journalist surface runs it — the media upload route, a desk page — but no
 * reader-facing render does. That is a real product surface and saying
 * "panel-only" about it would be the opposite error from the one above. The
 * algorithms panel itself is never counted as a surface: it imports the
 * dispatcher, which imports every handler, so counting it would mark the whole
 * catalog wired again.
 *
 * Entries absent from this table are not broken. They are panel-only: real
 * implementations with no product surface consuming them yet. Saying so is the
 * point.
 *
 * Regenerate with: `pnpm algorithms:wiring`
 */

export type WiringSurface = 'reader' | 'newsroom'

export type ProductWiring = {
  /** Catalog id. */
  id: string
  /** Repo-relative module (from apps/web) implementing the algorithm. */
  module: string
  /** A file on `surface` that transitively imports `module`. */
  entrypoint: string
  /** Who reaches it: a site visitor, or only the newsroom. */
  surface: WiringSurface
}

export const ALGORITHM_PRODUCT_WIRING: readonly ProductWiring[] = [
  {
    id: 'ab-testing-algorithm',
    module: 'components/experiments/ExperimentExposure.tsx',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'ads-txt-sellers-json',
    module: 'app/ads.txt/route.ts',
    entrypoint: 'app/ads.txt/route.ts',
    surface: 'reader',
  },
  {
    id: 'advertiser-dashboard-pipeline',
    module: 'lib/ad-events.ts',
    entrypoint: 'app/api/ads/event/route.ts',
    surface: 'reader',
  },
  {
    id: 'attention-metric-scoring',
    module: 'components/ads/AdTracker.tsx',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'author-follow-ranking',
    module: 'lib/reader/signals.ts',
    entrypoint: 'app/[locale]/reader-corner/page.tsx',
    surface: 'reader',
  },
  {
    id: 'autocomplete-trie',
    module: 'lib/search.ts',
    entrypoint: 'app/[locale]/search/page.tsx',
    surface: 'reader',
  },
  {
    id: 'bayesian-experimentation',
    module: 'lib/experiments/core.ts',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'bayesian-ranking',
    module: 'lib/ranking.ts',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'bm25-search',
    module: 'lib/search.ts',
    entrypoint: 'app/[locale]/search/page.tsx',
    surface: 'reader',
  },
  {
    id: 'breaking-alert-cooldown',
    module: 'lib/notifications/subscriptions.ts',
    entrypoint: 'app/api/cron/notifications-deliver/route.ts',
    surface: 'reader',
  },
  {
    id: 'burst-detection',
    module: 'lib/ranking.ts',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'canonical-url-resolution',
    module: 'lib/seo/canonical.ts',
    entrypoint: 'app/[locale]/[category]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'caption-quality-scorer',
    module: 'lib/journalist/desk-scoring.ts',
    entrypoint: 'app/[locale]/journalist/articles/[id]/edit/page.tsx',
    surface: 'reader',
  },
  {
    id: 'circuit-breaker',
    module: 'lib/resilience/circuit-breaker.ts',
    entrypoint: 'app/[locale]/data-stories/page.tsx',
    surface: 'reader',
  },
  {
    id: 'circulation-reconciliation',
    module: 'lib/epaper/index.ts',
    entrypoint: 'app/[locale]/epaper/[date]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'cls-safe-ad-reservation',
    module: 'components/AdSlot.tsx',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'collaborative-filtering',
    module: 'packages/db/src/cf.ts',
    entrypoint: 'app/[locale]/reader-corner/page.tsx',
    surface: 'reader',
  },
  {
    id: 'comment-ranking',
    module: 'packages/db/src/moderation.ts',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'content-based-filtering',
    module: 'packages/db/src/recommend.ts',
    entrypoint: 'app/[locale]/reader-corner/page.tsx',
    surface: 'reader',
  },
  {
    id: 'continue-reading-ranker',
    module: 'lib/reader/signals.ts',
    entrypoint: 'app/[locale]/reader-corner/page.tsx',
    surface: 'reader',
  },
  {
    id: 'continue-reading-restore',
    module: 'components/reader/ReaderArticleControls.tsx',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'crawl-budget-allocation',
    module: 'app/sitemap.ts',
    entrypoint: 'app/sitemap.ts',
    surface: 'reader',
  },
  {
    id: 'cron-miss-detector',
    module: 'lib/ops/health-snapshot.ts',
    entrypoint: 'app/api/cron/ops-probe/route.ts',
    surface: 'reader',
  },
  {
    id: 'debounce-throttle-events',
    module: 'lib/browser/raf-throttle.ts',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'deck-length-optimizer',
    module: 'lib/journalist/desk-scoring.ts',
    entrypoint: 'app/[locale]/journalist/articles/[id]/edit/page.tsx',
    surface: 'reader',
  },
  {
    id: 'digest-story-ranking',
    module: 'lib/reader/digest.ts',
    entrypoint: 'app/[locale]/reader-corner/page.tsx',
    surface: 'reader',
  },
  {
    id: 'duplicate-detection',
    module: 'lib/ai/index.ts',
    entrypoint: 'app/api/journalist/ai/route.ts',
    surface: 'reader',
  },
  {
    id: 'dynamic-paywall',
    module: 'lib/membership.ts',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'epaper-entitlement',
    module: 'lib/epaper/index.ts',
    entrypoint: 'app/[locale]/epaper/[date]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'fact-consistency-check',
    module: 'lib/ai/index.ts',
    entrypoint: 'app/api/journalist/ai/route.ts',
    surface: 'reader',
  },
  {
    id: 'fatigue-prevention',
    module: 'lib/notifications/deliver-run.ts',
    entrypoint: 'app/api/cron/notifications-deliver/route.ts',
    surface: 'reader',
  },
  {
    id: 'feedback-timing',
    module: 'lib/reader/retention.ts',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'font-subsetting-swap',
    module: 'app/fonts.ts',
    entrypoint: 'app/fonts.ts',
    surface: 'reader',
  },
  {
    id: 'fuzzy-matching',
    module: 'lib/search.ts',
    entrypoint: 'app/[locale]/search/page.tsx',
    surface: 'reader',
  },
  {
    id: 'google-news-discover-feed',
    module: 'app/news-sitemap.xml/route.ts',
    entrypoint: 'app/news-sitemap.xml/route.ts',
    surface: 'reader',
  },
  {
    id: 'headline-generator',
    module: 'lib/ai/index.ts',
    entrypoint: 'app/api/journalist/ai/route.ts',
    surface: 'reader',
  },
  {
    id: 'homepage-slot-diversity',
    module: 'lib/ranking.ts',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'hreflang-mapping',
    module: 'lib/seo/canonical.ts',
    entrypoint: 'app/[locale]/[category]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'hybrid-recommender',
    module: 'packages/db/src/recommend.ts',
    entrypoint: 'app/[locale]/reader-corner/page.tsx',
    surface: 'reader',
  },
  {
    id: 'image-exif-strip',
    module: 'lib/storage/exif-strip.ts',
    entrypoint: 'app/api/admin/media/upload/route.ts',
    surface: 'newsroom',
  },
  {
    id: 'inverted-index',
    module: 'lib/search.ts',
    entrypoint: 'app/[locale]/search/page.tsx',
    surface: 'reader',
  },
  {
    id: 'keyword-extraction',
    module: 'lib/ai/index.ts',
    entrypoint: 'app/api/journalist/ai/route.ts',
    surface: 'reader',
  },
  {
    id: 'knn-recommendation',
    module: 'packages/db/src/cf.ts',
    entrypoint: 'app/[locale]/reader-corner/page.tsx',
    surface: 'reader',
  },
  {
    id: 'locale-preference-scorer',
    module: 'lib/reader/signals.ts',
    entrypoint: 'app/[locale]/reader-corner/page.tsx',
    surface: 'reader',
  },
  {
    id: 'low-end-page-flip',
    module: 'lib/epaper/index.ts',
    entrypoint: 'app/[locale]/epaper/[date]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'ltv-engagement-score',
    module: 'lib/ranking.ts',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'mfa-self-screening',
    module: 'components/AdSlot.tsx',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'multi-armed-bandit',
    module: 'lib/ranking.ts',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'multi-platform-feed-compliance',
    module: 'lib/syndication/partner-feed.ts',
    entrypoint: 'app/feeds/partner.json/route.ts',
    surface: 'reader',
  },
  {
    id: 'named-entity-recognition',
    module: 'lib/nlp/gazetteer.ts',
    entrypoint: 'app/api/journalist/ai/route.ts',
    surface: 'reader',
  },
  {
    id: 'native-ad-rendering',
    module: 'components/AdSlot.tsx',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'notification-batching',
    module: 'lib/notifications/deliver-run.ts',
    entrypoint: 'app/api/cron/notifications-deliver/route.ts',
    surface: 'reader',
  },
  {
    id: 'notification-priority-scoring',
    module: 'lib/notifications/subscriptions.ts',
    entrypoint: 'app/api/cron/notifications-deliver/route.ts',
    surface: 'reader',
  },
  {
    id: 'offline-epaper-cache',
    module: 'lib/epaper/index.ts',
    entrypoint: 'app/[locale]/epaper/[date]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'offline-first-articles',
    module: 'app/sw.js/route.ts',
    entrypoint: 'app/sw.js/route.ts',
    surface: 'reader',
  },
  {
    id: 'open-graph-previews',
    module: 'app/[locale]/[category]/[slug]/page.tsx',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'passive-event-listeners',
    module: 'components/reader/ReaderArticleControls.tsx',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'personalized-onboarding',
    module: 'lib/reader/onboarding.ts',
    entrypoint: 'app/[locale]/reader-corner/page.tsx',
    surface: 'reader',
  },
  {
    id: 'progressive-feature-rollout',
    module: 'lib/experiments/core.ts',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'push-permission-priming',
    module: 'app/sw.js/route.ts',
    entrypoint: 'app/sw.js/route.ts',
    surface: 'reader',
  },
  {
    id: 'pwa-install-prompt-timing',
    module: 'components/PwaBoot.tsx',
    entrypoint: 'app/[locale]/layout.tsx',
    surface: 'reader',
  },
  {
    id: 'query-expansion',
    module: 'lib/search-lexicon.ts',
    entrypoint: 'app/[locale]/search/page.tsx',
    surface: 'reader',
  },
  {
    id: 'quiet-hours-scheduler',
    module: 'lib/notifications/deliver-run.ts',
    entrypoint: 'app/api/cron/notifications-deliver/route.ts',
    surface: 'reader',
  },
  {
    id: 'reader-loyalty-tiers',
    module: 'lib/reader/loyalty.ts',
    entrypoint: 'app/[locale]/reader-corner/page.tsx',
    surface: 'reader',
  },
  {
    id: 'reading-streak-scorer',
    module: 'lib/reader/streaks.ts',
    entrypoint: 'app/[locale]/reader-corner/page.tsx',
    surface: 'reader',
  },
  {
    id: 'reading-streaks',
    module: 'lib/reader/streaks.ts',
    entrypoint: 'app/[locale]/reader-corner/page.tsx',
    surface: 'reader',
  },
  {
    id: 'reengagement-ranking',
    module: 'lib/reader/signals.ts',
    entrypoint: 'app/[locale]/reader-corner/page.tsx',
    surface: 'reader',
  },
  {
    id: 'reputation-score',
    module: 'packages/db/src/moderation.ts',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'return-visit-propensity',
    module: 'lib/reader/signals.ts',
    entrypoint: 'app/[locale]/reader-corner/page.tsx',
    surface: 'reader',
  },
  {
    id: 'revision-similarity',
    module: 'lib/journalist/desk-scoring.ts',
    entrypoint: 'app/[locale]/journalist/articles/[id]/edit/page.tsx',
    surface: 'reader',
  },
  {
    id: 'rss-atom-optimization',
    module: 'app/rss.xml/route.ts',
    entrypoint: 'app/rss.xml/route.ts',
    surface: 'reader',
  },
  {
    id: 'save-later-ranking',
    module: 'lib/reader/saves.ts',
    entrypoint: 'app/[locale]/saved/page.tsx',
    surface: 'reader',
  },
  {
    id: 'scroll-depth-quality',
    module: 'lib/reader/signals.ts',
    entrypoint: 'app/[locale]/reader-corner/page.tsx',
    surface: 'reader',
  },
  {
    id: 'sentiment-analysis',
    module: 'lib/nlp/sentiment.ts',
    entrypoint: 'app/api/journalist/ai/route.ts',
    surface: 'reader',
  },
  {
    id: 'sequential-ab-testing',
    module: 'lib/experiments/core.ts',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'sequential-prediction',
    module: 'packages/db/src/recommend.ts',
    entrypoint: 'app/[locale]/reader-corner/page.tsx',
    surface: 'reader',
  },
  {
    id: 'session-based-recommendation',
    module: 'packages/db/src/recommend.ts',
    entrypoint: 'app/[locale]/reader-corner/page.tsx',
    surface: 'reader',
  },
  {
    id: 'session-quality-scoring',
    module: 'lib/session-quality.ts',
    entrypoint: 'app/admin/(desk)/session-quality/page.tsx',
    surface: 'newsroom',
  },
  {
    id: 'slug-collision-resolver',
    module: 'lib/journalist/desk-scoring.ts',
    entrypoint: 'app/[locale]/journalist/articles/[id]/edit/page.tsx',
    surface: 'reader',
  },
  {
    id: 'source-citation-coverage',
    module: 'lib/journalist/desk-scoring.ts',
    entrypoint: 'app/[locale]/journalist/articles/[id]/edit/page.tsx',
    surface: 'reader',
  },
  {
    id: 'source-reliability-score',
    module: 'packages/db/src/moderation.ts',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'spam-detection',
    module: 'lib/engagement/store.ts',
    entrypoint: 'app/[locale]/data-stories/page.tsx',
    surface: 'reader',
  },
  {
    id: 'speculation-rules-prerender',
    module: 'components/SpeculationRules.tsx',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'summarization',
    module: 'lib/ai/index.ts',
    entrypoint: 'app/api/journalist/ai/route.ts',
    surface: 'reader',
  },
  {
    id: 'swr-service-worker',
    module: 'app/sw.js/route.ts',
    entrypoint: 'app/sw.js/route.ts',
    surface: 'reader',
  },
  {
    id: 'syndicated-copy-canonical',
    module: 'app/[locale]/[category]/[slug]/page.tsx',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'tf-idf',
    module: 'lib/search.ts',
    entrypoint: 'app/[locale]/search/page.tsx',
    surface: 'reader',
  },
  {
    id: 'time-decay-ranking',
    module: 'lib/ranking.ts',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'token-bucket-rate-limiting',
    module: 'lib/rate-limit.ts',
    entrypoint: 'app/api/ads/event/route.ts',
    surface: 'reader',
  },
  {
    id: 'topic-classification',
    module: 'lib/nlp/topics.ts',
    entrypoint: 'app/api/journalist/ai/route.ts',
    surface: 'reader',
  },
  {
    id: 'topic-follow-ranking',
    module: 'lib/reader/signals.ts',
    entrypoint: 'app/[locale]/reader-corner/page.tsx',
    surface: 'reader',
  },
  {
    id: 'toxicity-detection',
    module: 'lib/admin-settings.ts',
    entrypoint: 'app/api/cron/breaking-auto-boost/route.ts',
    surface: 'reader',
  },
  {
    id: 'trending-detection',
    module: 'lib/engagement/store.ts',
    entrypoint: 'app/[locale]/data-stories/page.tsx',
    surface: 'reader',
  },
  {
    id: 'velocity-ranking',
    module: 'lib/ranking.ts',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'viewability-ad-refresh',
    module: 'components/ads/AdTracker.tsx',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'virality-prediction',
    module: 'lib/ranking.ts',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'weighted-scoring-ranker',
    module: 'lib/ranking.ts',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'whatsapp-viber-previews',
    module: 'app/[locale]/[category]/[slug]/page.tsx',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
  {
    id: 'wilson-score-ranking',
    module: 'packages/db/src/moderation.ts',
    entrypoint: 'app/[locale]/[category]/[slug]/page.tsx',
    surface: 'reader',
  },
]

const BY_ID = new Map(ALGORITHM_PRODUCT_WIRING.map((row) => [row.id, row]))

/** The product wiring for `id` (reader or newsroom), or `null` when panel-only. */
export function productWiringFor(id: string): ProductWiring | null {
  return BY_ID.get(id) ?? null
}

/**
 * True when a *reader-facing* surface consumes this algorithm.
 *
 * Deliberately narrower than `productWiringFor`: this is the number the
 * runtime reports per run, and widening it to include newsroom surfaces would
 * inflate the honest headline.
 */
export function isProductWired(id: string): boolean {
  return BY_ID.get(id)?.surface === 'reader'
}

/** True when an editor/journalist surface consumes it but no reader render does. */
export function isNewsroomWired(id: string): boolean {
  return BY_ID.get(id)?.surface === 'newsroom'
}

export function productWiringStats(catalogSize: number) {
  const wired = ALGORITHM_PRODUCT_WIRING.filter((row) => row.surface === 'reader').length
  const newsroom = ALGORITHM_PRODUCT_WIRING.filter((row) => row.surface === 'newsroom').length
  return {
    wired,
    newsroom,
    panelOnly: Math.max(0, catalogSize - wired - newsroom),
    /** Share of the catalog a reader can actually reach, 0–1. */
    coverage: catalogSize > 0 ? wired / catalogSize : 0,
  }
}
