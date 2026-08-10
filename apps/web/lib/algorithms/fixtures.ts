/**
 * Deterministic default inputs for `runAllAlgorithms` / `runAlgorithm`.
 *
 * Handlers already carry sane inline fallbacks (existing style in
 * handlers/core.ts and handlers/heuristics.ts), so fixtures exist as a
 * shared, richer baseline — never randomized, never network-backed — so
 * every capability can compute an honest result even with zero caller input.
 */

const BASE_FIXTURE: Record<string, unknown> = {
  text: 'काठमाडौंमा आज मध्यराति देखि निरन्तर वर्षा भएको छ । स्थानीय प्रशासनले तल्लो तटीय क्षेत्रमा बाढीको जोखिम रहेको जनाएको छ ।',
  other: 'काठमाडौं उपत्यकामा वर्षाका कारण बागमती नदीमा बाढीको सम्भावना बढेको छ ।',
  titleNe: 'काठमाडौंमा बाढीको जोखिम',
  titleEn: 'Kathmandu flood risk rises after overnight rain',
  title: 'Kathmandu flood risk rises after overnight rain',
  deckNe: 'स्थानीय प्रशासनले सतर्कता अपनाउन आग्रह गरेको छ',
  caption: 'काठमाडौंमा बाढीपछि सडक डुबानमा',
  alt: 'काठमाडौंको सडकमा बाढीको पानी जमेको दृश्य',
  byline: 'Desk',
  category: 'politics',
  categoryWeight: 0.8,
  locale: 'ne',
  supportedLocales: ['ne', 'en'],
  providedLocales: ['ne', 'en'],
  canonicalUrl: 'https://nagarikwatch.com/ne/politics/kathmandu-flood',
  requestUrl: 'https://nagarikwatch.com/ne/politics/kathmandu-flood',
  ogTitle: 'Kathmandu flood risk rises after overnight rain',
  ogImage: 'https://cdn.nagarikwatch.com/og/kathmandu-flood.jpg',
  ogDescription:
    'Local authorities warn of flood risk in low-lying Kathmandu areas after overnight rain.',
  tags: ['politics', 'kathmandu', 'flood', 'disaster'],
  history: ['politics', 'politics', 'sports', 'politics', 'business', 'politics'],
  dayNumbers: [1, 2, 3, 5, 6, 7],
  values: [100, 108, 96, 112, 260],
  dailyBytes: [100, 110, 120, 132],
  matrix: {
    r1: { a: 1, b: 1 },
    r2: { a: 1, c: 1 },
    r3: { b: 1, c: 1 },
    target: { a: 1 },
  },
  headers: {
    'content-security-policy': "default-src 'self'",
    'strict-transport-security': 'max-age=63072000',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
  },
  transcript: 'Intro\n00:00 Welcome\n05:00 Interview\n20:00 Outro',
  claims: 5,
  citations: 3,
  reach: 1200,
  severity: 0.6,
  hour: 14,
  quietStart: 22,
  quietEnd: 6,
  engagementByHour: [
    2, 1, 1, 1, 1, 2, 5, 12, 18, 20, 19, 17, 16, 18, 20, 22, 25, 30, 34, 28, 20, 14, 8, 4,
  ],
  requestsPerMinute: 6,
  jsExecuted: true,
  mouseMovements: 24,
  headlessUserAgent: false,
  knownDatacenterIp: false,
  sessionDurationSeconds: 95,
  pagesPerSession: 3,
  bytes: 200_000,
  budgetBytes: 250_000,
  p95Ms: 420,
  budgetMs: 500,
  active: 8,
  max: 20,
  waiting: 0,
  errorRate: 0.01,
  trafficPercent: 25,
  ageHours: 4,
  ttlHours: 2,
  pathPopularity: 0.6,
  fillRate: 0.6,
  baselineFill: 0.68,
  impressions: 5000,
  clicks: 120,
  spend: 340,
  revenue: 980,
  ecpm: 4.2,
  tier: 'digital',
  requiredTier: 'digital',
  totalPages: 24,
  cachedPages: 18,
  quotaMb: 200,
  usedMb: 90,
  printCopies: 4200,
  digitalEntitlements: 3900,
  deviceTier: 'mid',
  measuredFlipMs: 90,
  correctionsIssued: 2,
  storiesPublished: 240,
  yearsActive: 6,
  faqPairs: 4,
  rssItem: {
    title: 'Kathmandu flood risk rises',
    link: 'https://nagarikwatch.com/ne/politics/kathmandu-flood',
    pubDate: new Date().toISOString(),
    guid: 'nw-kathmandu-flood-1',
  },
  variantId: 'A',
  exposures: 400,
  conversions: 36,
  rolloutPercent: 20,
  cohortRetention: [1, 0.62, 0.48, 0.4, 0.35],
  sessions: [
    { path: '/ne/politics', durationSeconds: 40 },
    { path: '/ne/politics/kathmandu-flood', durationSeconds: 90 },
    { path: '/ne/sports', durationSeconds: 20 },
  ],
}

/**
 * Deterministic fixture for a catalog id. Merges the shared base with a
 * small number of id-specific shape overrides for capabilities that need a
 * distinct structure the base does not cover well.
 */
export function defaultFixtureFor(id: string): Record<string, unknown> {
  const overrides: Record<string, Record<string, unknown>> = {
    'matrix-factorization': {
      matrix: BASE_FIXTURE.matrix,
      readerId: 'target',
    },
    'embedding-similarity': { text: BASE_FIXTURE.text, other: BASE_FIXTURE.other },
    'semantic-search': { query: 'बाढी', text: BASE_FIXTURE.text },
    'named-entity-recognition': { text: BASE_FIXTURE.text },
    'topic-classification': { text: BASE_FIXTURE.text },
    'sentiment-analysis': { text: 'सरकारको राहत प्रतिक्रिया प्रभावकारी र सराहनीय छ' },
    'keyword-extraction': { text: BASE_FIXTURE.text },
    'topic-modeling-lda': {
      documents: [BASE_FIXTURE.text, BASE_FIXTURE.other, 'खेलकुद प्रतियोगिता सम्पन्न भयो'],
    },
    clustering: {
      documents: [BASE_FIXTURE.text, BASE_FIXTURE.other, 'खेलकुद प्रतियोगिता सम्पन्न भयो'],
    },
  }
  return { ...BASE_FIXTURE, ...(overrides[id] ?? {}) }
}
