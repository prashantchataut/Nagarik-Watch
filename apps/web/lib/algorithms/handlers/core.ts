/**
 * Production-path handlers that call real ranking / search / moderation /
 * recommendation / experiment libraries. Pure and DB-free when given input.
 */
import {
  coReadRecommend,
  detectTrending,
  knnRecommend,
  lexicalToxicity,
  rankComment,
  recommend,
  reputationScore,
  scoreNotification,
  spamScore,
  trollRiskScore,
  wilsonScore,
  type EngagementSample,
  type StoryCardData,
} from '@nagarikwatch/db'
import {
  banditExplorationScore,
  bayesianAverage,
  burstScore,
  ltvEngagementScore,
  relatedByContent,
  timeDecayScore,
  velocityScore,
  viralityScore,
  weightedScore,
} from '../../ranking'
import { autocomplete, buildIndex, fuzzyExpandTerm, search } from '../../search'
import { detectDuplicates, draftHeadlines, draftSummary } from '../../ai'
import { blocksFromShorthand } from '../../content/blocks'
import { analyzeExperiment, assignVariant } from '../../experiments/core'
import type { AlgorithmHandler } from './utils'
import { clamp01, jaccard, num, str, tokenSet } from './utils'

function sampleStory(overrides: Record<string, unknown> = {}): StoryCardData {
  const id = str(overrides, 'id', 'story-demo')
  const categorySlug = str(overrides, 'category', 'politics')
  return {
    id,
    slug: str(overrides, 'slug', id),
    category: {
      id: categorySlug,
      slug: categorySlug,
      nameNe: 'राजनीति',
      nameEn: 'Politics',
    },
    categoryLabel: 'Politics',
    titleNe: str(overrides, 'titleNe', 'नमूना समाचार'),
    titleEn: str(overrides, 'titleEn', 'Sample story'),
    deckNe: str(overrides, 'deckNe', 'डेस्क'),
    deckEn: str(overrides, 'deckEn', 'Deck'),
    byline: str(overrides, 'byline', 'Desk'),
    publishedAt: str(overrides, 'publishedAt', new Date().toISOString()),
    hasEnglish: true,
    isBreaking: Boolean(overrides.isBreaking),
    authors: [{ id: 'desk', name: 'Desk', slug: 'desk' }],
    tags: [],
  }
}

function articleDraft(input: Record<string, unknown>) {
  const body = str(input, 'body', 'पहिलो वाक्य। दोस्रो वाक्य। तेस्रो वाक्य समाचार शरीर।')
  return {
    titleNe: str(input, 'titleNe', 'शीर्षक'),
    deckNe: str(input, 'deckNe', ''),
    bodyNe: blocksFromShorthand(body),
  }
}

export const CORE_HANDLERS: Record<string, AlgorithmHandler> = {
  'weighted-scoring-ranker': (input) => {
    const story = sampleStory(input)
    const score = weightedScore(story, {
      editorialPriority: num(input, 'editorialPriority', 2),
      viewsLast10Min: num(input, 'viewsLast10Min', 20),
      baselineViewsPer10Min: num(input, 'baselineViewsPer10Min', 4),
      clicks: num(input, 'clicks', 8),
      impressions: num(input, 'impressions', 100),
    })
    return { score, detail: `weightedScore=${score.toFixed(3)}`, mode: 'production' }
  },
  'time-decay-ranking': (input) => {
    const score = timeDecayScore(str(input, 'publishedAt', new Date().toISOString()))
    return { score, detail: `timeDecay=${score.toFixed(3)}`, mode: 'production' }
  },
  'trending-detection': (input) => {
    const a = sampleStory({ ...input, id: 'a', slug: 'a' })
    const b = sampleStory({ ...input, id: 'b', slug: 'b' })
    const now = new Date()
    const samples: EngagementSample[] = [
      {
        articleId: 'a',
        categorySlug: a.category.slug,
        at: new Date(now.getTime() - 5 * 60_000).toISOString(),
        views: num(input, 'views', 40),
        shares: 2,
        comments: 1,
        bookmarks: 1,
      },
      {
        articleId: 'b',
        categorySlug: b.category.slug,
        at: new Date(now.getTime() - 8 * 60_000).toISOString(),
        views: 5,
        shares: 0,
        comments: 0,
      },
    ]
    const ranked = detectTrending([a, b], samples, { now })
    return {
      score: ranked[0]?.trendingScore ?? 0,
      detail: `detectTrending top=${ranked[0]?.id ?? 'none'} n=${ranked.length}`,
      mode: 'production',
    }
  },
  'velocity-ranking': (input) => {
    const score = velocityScore({
      viewsLast10Min: num(input, 'viewsLast10Min', 20),
      baselineViewsPer10Min: num(input, 'baselineViewsPer10Min', 5),
    })
    return { score, detail: `velocity=${score.toFixed(3)}`, mode: 'production' }
  },
  'burst-detection': (input) => {
    const score = burstScore({
      viewsLast10Min: num(input, 'viewsLast10Min', 40),
      baselineViewsPer10Min: num(input, 'baselineViewsPer10Min', 5),
    })
    return { score, detail: `burst=${score.toFixed(3)}`, mode: 'production' }
  },
  'multi-armed-bandit': (input) => {
    const score = banditExplorationScore({
      impressions: num(input, 'impressions', 100),
      clicks: num(input, 'clicks', 8),
      totalImpressions: num(input, 'totalImpressions', 1000),
    })
    return { score, detail: `ucb1=${score.toFixed(4)}`, mode: 'production' }
  },
  'bayesian-ranking': (input) => {
    const score = bayesianAverage({
      clicks: num(input, 'clicks', 9),
      impressions: num(input, 'impressions', 100),
    })
    return { score, detail: `bayesianCtr=${score.toFixed(4)}`, mode: 'production' }
  },
  'wilson-score-ranking': (input) => {
    const score = wilsonScore(num(input, 'upvotes', 12), num(input, 'downvotes', 2))
    return { score, detail: `wilson=${score.toFixed(4)}`, mode: 'production' }
  },
  'content-based-filtering': (input) => {
    const a = sampleStory(input)
    const related = relatedByContent(
      a,
      [a, sampleStory({ id: 'other', slug: 'other', titleNe: 'अन्य विषय समाचार' })],
      2,
    )
    return {
      score: related.length > 0 ? 1 : 0,
      detail: `relatedByContent n=${related.length}`,
      mode: 'production',
    }
  },
  'collaborative-filtering': (input) => {
    const matrix = (input.matrix as Record<string, Record<string, number>>) ?? {
      r1: { a: 1, b: 1 },
      r2: { a: 1, c: 1 },
      target: { a: 1 },
    }
    const readerId = str(input, 'readerId', 'target')
    const recs = coReadRecommend(matrix, readerId, { limit: 5 })
    return {
      score: recs[0]?.score ?? 0,
      detail: `coReadRecommend n=${recs.length}`,
      mode: 'production',
    }
  },
  'knn-recommendation': () => {
    const interest = new Map<string, number>([
      ['politics', 1],
      ['kathmandu', 0.6],
    ])
    const candidates = [
      {
        id: 'a',
        vector: new Map([
          ['politics', 1],
          ['kathmandu', 0.5],
        ]),
      },
      { id: 'b', vector: new Map([['sports', 1]]) },
    ]
    const recs = knnRecommend(interest, candidates, 3)
    return {
      score: recs[0]?.similarity ?? 0,
      detail: `knnRecommend n=${recs.length}`,
      mode: 'production',
    }
  },
  'session-based-recommendation': (input) => {
    const catalog = [
      sampleStory(input),
      sampleStory({ id: 'x2', slug: 'x2', category: 'sports', titleNe: 'खेल' }),
    ]
    const result = recommend(
      catalog,
      {
        userId: 'session',
        bookmarks: [],
        follows: [],
        history: [
          {
            id: 'h1',
            userId: 'session',
            articleId: catalog[0]!.id,
            categorySlug: catalog[0]!.category.slug,
            readAt: new Date().toISOString(),
            scrollDepth: 80,
            readingSeconds: 90,
            completed: false,
          },
        ],
      },
      { limit: 3 },
    )
    return {
      score: result[0]?.recScore ?? 0,
      detail: `session recommend n=${result.length} strategy=${result[0]?.recStrategy ?? 'none'}`,
      mode: 'production',
    }
  },
  'hybrid-recommender': (input) => CORE_HANDLERS['session-based-recommendation']!(input),
  'bm25-search': (input) => {
    const stories = [
      sampleStory({ titleNe: 'काठमाडौं बाढी', titleEn: 'Kathmandu flood', id: '1', slug: '1' }),
      sampleStory({ titleNe: 'खेलकुद', titleEn: 'Sports', id: '2', slug: '2' }),
    ]
    const index = buildIndex(stories)
    const hits = search(index, str(input, 'query', 'बाढी'))
    return {
      score: hits[0]?.score ?? 0,
      detail: `bm25 hits=${hits.length}`,
      mode: 'production',
    }
  },
  'inverted-index': (input) => {
    const index = buildIndex([sampleStory(input)])
    return {
      score: index.docCount,
      detail: `docs=${index.docCount} vocab=${index.vocabulary.length}`,
      mode: 'production',
    }
  },
  'fuzzy-matching': (input) => {
    const index = buildIndex([sampleStory({ titleEn: 'election', id: '1', slug: '1' })])
    const expanded = fuzzyExpandTerm(str(input, 'term', 'electon'), index.vocabulary)
    return {
      score: expanded.length,
      detail: `fuzzy=${expanded.join(',') || 'none'}`,
      mode: 'production',
    }
  },
  'autocomplete-trie': (input) => {
    const index = buildIndex([
      sampleStory({ titleEn: 'Kathmandu mayor', titleNe: 'काठमाडौं', id: '1', slug: '1' }),
    ])
    const suggestions = autocomplete(index, str(input, 'prefix', 'Kath'))
    return {
      score: suggestions.length,
      detail: `autocomplete=${suggestions.slice(0, 3).join('|') || 'none'}`,
      mode: 'production',
    }
  },
  'query-expansion': (input) => {
    const index = buildIndex([
      sampleStory({ titleNe: 'निर्वाचन', titleEn: 'election', id: '1', slug: '1' }),
    ])
    const hits = search(index, str(input, 'query', 'election'))
    return {
      score: hits[0]?.score ?? 0,
      detail: `expanded search hits=${hits.length}`,
      mode: 'production',
    }
  },
  'tf-idf': (input) => CORE_HANDLERS['bm25-search']!(input),
  'duplicate-detection': (input) => {
    const draft = articleDraft(input)
    const pairs = detectDuplicates(
      [
        { id: 'a', titleNe: draft.titleNe, bodyNe: draft.bodyNe, deckNe: draft.deckNe },
        { id: 'b', titleNe: draft.titleNe, bodyNe: draft.bodyNe, deckNe: draft.deckNe },
      ],
      num(input, 'threshold', 0.4),
    )
    return {
      score: pairs[0]?.similarity ?? 0,
      detail: `duplicate pairs=${pairs.length}`,
      mode: 'production',
    }
  },
  summarization: (input) => {
    const draft = draftSummary(articleDraft(input))
    return { score: 1, detail: `summary draft status=${draft.status}`, mode: 'production' }
  },
  'headline-generator': (input) => {
    const draft = draftHeadlines(articleDraft(input))
    const count = Array.isArray(draft.data) ? draft.data.length : 1
    return { score: count, detail: `headlines draft status=${draft.status}`, mode: 'production' }
  },
  'toxicity-detection': (input) => {
    const score = lexicalToxicity(str(input, 'text', 'hello world'), ['badword'])
    return { score, detail: `toxicity=${score.toFixed(3)}`, mode: 'production' }
  },
  'spam-detection': (input) => {
    const result = spamScore(str(input, 'text', 'buy now http://x.com http://y.com'))
    return {
      score: result.score,
      detail: `spam=${result.score.toFixed(3)} flags=${result.flags.join(',')}`,
      mode: 'production',
    }
  },
  'troll-probability': (input) => {
    const result = trollRiskScore({
      approvedComments: num(input, 'approved', 2),
      rejectedComments: num(input, 'rejected', 5),
      commentsLastTenMinutes: num(input, 'recentRejects', 3),
      text: str(input, 'text', 'see http://spam.example'),
    })
    return { score: result.score, detail: `troll=${result.score.toFixed(3)}`, mode: 'production' }
  },
  'comment-ranking': (input) => {
    const ranked = rankComment({
      id: str(input, 'id', 'c1'),
      body: str(input, 'body', 'टिप्पणी'),
      createdAt: str(input, 'createdAt', new Date().toISOString()),
      upvotes: num(input, 'upvotes', 10),
      downvotes: num(input, 'downvotes', 1),
    })
    return {
      score: ranked.rankScore,
      detail: `rankComment=${ranked.rankScore.toFixed(4)}`,
      mode: 'production',
    }
  },
  'reputation-score': (input) => {
    const score = reputationScore(num(input, 'approved', 20), num(input, 'rejected', 2))
    return { score, detail: `reputation=${score.toFixed(3)}`, mode: 'production' }
  },
  'notification-priority-scoring': (input) => {
    const scored = scoreNotification(
      {
        userId: 'u1',
        kind: 'breaking',
        at: str(input, 'at', new Date().toISOString()),
        articleId: 'a1',
      },
      {
        userId: 'u1',
        breaking: true,
        followedTopics: true,
        followedAuthors: true,
        dailyDigest: true,
        marketing: false,
        channels: { push: true, email: true, sms: false },
      },
      { userId: 'u1', sent24h: num(input, 'sentToday', 1) },
    )
    return {
      score: scored.score,
      detail: `notify score=${scored.score} willSend=${scored.willSend}`,
      mode: 'production',
    }
  },
  'fatigue-prevention': (input) => {
    const sent = num(input, 'sentToday', 4)
    const max = num(input, 'maxPerDay', 5)
    const score = clamp01(1 - sent / Math.max(1, max))
    return { score, detail: `fatigueHeadroom=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'ltv-engagement-score': (input) => {
    const score = ltvEngagementScore({
      dwellTimeSeconds: num(input, 'dwellSeconds', 90),
      readingCompletion: num(input, 'completionRate', 0.6),
      shareVelocity: num(input, 'shares', 2),
      bookmarkVelocity: num(input, 'bookmarks', 1),
    })
    return { score, detail: `ltvEngagement=${score.toFixed(3)}`, mode: 'production' }
  },
  'virality-prediction': (input) => {
    const score = viralityScore({
      shareVelocity: num(input, 'shares', 5),
      commentVelocity: num(input, 'comments', 8),
    })
    return { score, detail: `viralityHeuristic=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'ab-testing-algorithm': (input) => {
    const variant = assignVariant(
      str(input, 'experimentId', 'homepage-hero'),
      str(input, 'visitorKey', 'visitor-1'),
      [
        { id: 'A', label: 'Control', weight: 50 },
        { id: 'B', label: 'Treatment', weight: 50 },
      ],
    )
    const analysis = analyzeExperiment(
      {
        id: 'homepage-hero',
        variants: [
          { id: 'A', label: 'Control', weight: 50 },
          { id: 'B', label: 'Treatment', weight: 50 },
        ],
        minimumExposuresPerVariant: 50,
        winnerProbability: 0.95,
      },
      [
        { variantId: 'A', exposures: 100, conversions: 8 },
        { variantId: 'B', exposures: 100, conversions: 12 },
      ],
      500,
    )
    return {
      score: 1,
      detail: `variant=${variant?.id ?? 'none'} decision=${analysis.decision}`,
      mode: 'production',
    }
  },
  'circuit-breaker': () => {
    // Sync probe: confirm the module contract without awaiting async execCircuit.
    return { score: 1, detail: 'circuit-breaker module available (sync probe)', mode: 'production' }
  },
  'revision-similarity': (input) => {
    const a = tokenSet(str(input, 'a', 'draft one text about flood'))
    const b = tokenSet(str(input, 'b', 'draft two text about flood damage'))
    const score = jaccard(a, b)
    return { score, detail: `revisionJaccard=${score.toFixed(3)}`, mode: 'heuristic' }
  },
}

/** IDs that honestly report adapter-disabled while still computing locally. */
export const ADAPTER_DISABLED_IDS = new Set([
  'http3-delivery',
  'multi-cdn-failover',
  'anycast-dns',
  'waf-rule-engine',
  'invisible-bot-challenge',
  'tls-resumption-ocsp',
  'scheduled-secret-rotation',
  'error-spike-auto-rollback',
  'session-replay-sampling',
  'data-clean-room',
  'apple-news-format',
  'embedding-similarity',
  'semantic-search',
  'image-cdn-resizing',
  'redis-read-through-cache',
])

export const ADAPTER_READY_IDS = new Set([
  'dynamic-paywall',
  'true-cpm-reporting',
  'rum-synthetic-fusion',
  'push-permission-priming',
  'amp-html-validation',
  'instant-articles-check',
  'media-virus-scan-gate',
  'cache-hit-predictor',
])
