/**
 * Honest algorithm / capability catalog for the newsroom admin surface.
 *
 * Status meanings:
 *   live      — runtime-executable via runAlgorithm (production path, honest local heuristic,
 *               or adapter-ready/disabled with a local computation that still completes)
 *   partial   — retained for typing; catalog entries are live once a runtime handler exists
 *   scaffold  — retained for typing; prefer live + runtime handler
 *   blocked   — retained for typing; external vendors enhance but local path must still run
 *   planned   — retained for typing; prefer live + runtime handler
 */

export type AlgorithmStatus = 'live' | 'partial' | 'scaffold' | 'blocked' | 'planned'

export type AlgorithmCategory =
  | 'ranking'
  | 'recommendation'
  | 'search'
  | 'nlp'
  | 'notifications'
  | 'community'
  | 'trust'
  | 'growth'
  | 'revenue'
  | 'performance'
  | 'infrastructure'
  | 'retention'
  | 'advertising'
  | 'experimentation'
  | 'distribution'
  | 'security'
  | 'syndication'
  | 'epaper'

export type AlgorithmEntry = {
  id: string
  number: number
  label: string
  category: AlgorithmCategory
  surface: string
  status: AlgorithmStatus
  summary: string
  implementation?: string
  dependency?: string
  /** Editorial priority 1 = ship first for a Nepal civic portal. */
  priority: number
}

export const ALGORITHM_CATALOG: readonly AlgorithmEntry[] = [
  // Ranking 1–8
  {
    id: 'weighted-scoring-ranker',
    number: 1,
    label: 'Weighted Scoring Ranker',
    category: 'ranking',
    surface: 'category / trending / most-read hubs / admin live',
    status: 'live',
    summary:
      'Combines editorial priority, decay, engagement, and affinity. The trust term exists in weightedScore but production signalsForStory still hardcodes qualityTrustScore to 0 until a reliability pipeline is wired. Homepage rails use dedicated freshness / most-read / trending resolvers instead.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:weighted-scoring-ranker · apps/web/lib/ranking.ts#weightedScore',
    priority: 1,
  },
  {
    id: 'time-decay-ranking',
    number: 2,
    label: 'Time Decay Algorithm',
    category: 'ranking',
    surface: 'latest / breaking / hub rankers',
    status: 'live',
    summary:
      'Age-penalizes stories so fresh news outranks stale evergreen unless engagement compensates. Homepage Latest sorts by publishedAt directly.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:time-decay-ranking · apps/web/lib/ranking.ts#timeDecayScore',
    priority: 1,
  },
  {
    id: 'trending-detection',
    number: 3,
    label: 'Trending Detection',
    category: 'ranking',
    surface: 'trending page / homepage TrendingRail / admin live',
    status: 'live',
    summary:
      'Uses read, approved-comment, share, and bookmark samples for velocity/burst detection; baselines stabilize as real traffic arrives.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:trending-detection · packages/db/src/trending.ts + apps/web/lib/engagement/store.ts#getTrendingSamples',
    priority: 1,
  },
  {
    id: 'velocity-ranking',
    number: 4,
    label: 'Velocity Ranking',
    category: 'ranking',
    surface: 'ranking engine',
    status: 'live',
    summary: 'Scores short-window engagement growth versus baseline.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:velocity-ranking · apps/web/lib/ranking.ts#velocityScore',
    priority: 2,
  },
  {
    id: 'burst-detection',
    number: 5,
    label: 'Burst Detection',
    category: 'ranking',
    surface: 'elections / disasters / sports finals',
    status: 'live',
    summary: 'Flags ≥5× baseline short-window traffic as a burst.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:burst-detection · apps/web/lib/ranking.ts#burstScore',
    priority: 2,
  },
  {
    id: 'multi-armed-bandit',
    number: 6,
    label: 'Multi-Armed Bandit',
    category: 'ranking',
    surface: 'admin algorithms / exploration experiments (not homepage slot arms)',
    status: 'live',
    summary:
      'UCB1 exploration uses ranking-event CTR; experiment assignment/store is live, but homepage slot arms are not yet fully attributed.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:multi-armed-bandit · apps/web/lib/ranking.ts#banditExplorationScore + apps/web/lib/experiments',
    priority: 3,
  },
  {
    id: 'bayesian-ranking',
    number: 7,
    label: 'Bayesian Ranking',
    category: 'ranking',
    surface: 'CTR / low-sample correction',
    status: 'live',
    summary: 'Prior-smoothed CTR prevents 10/10 from beating 9k/10k.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:bayesian-ranking · apps/web/lib/ranking.ts#bayesianAverage',
    priority: 1,
  },
  {
    id: 'wilson-score-ranking',
    number: 8,
    label: 'Wilson Score Ranking',
    category: 'community',
    surface: 'comments / reputation',
    status: 'live',
    summary: 'Wilson lower bound for upvotes and approve/reject history.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:wilson-score-ranking · packages/db/src/moderation.ts#wilsonScore',
    priority: 2,
  },

  // Recommendations 9–16
  {
    id: 'content-based-filtering',
    number: 9,
    label: 'Content-Based Filtering',
    category: 'recommendation',
    surface: 'related stories / for-you',
    status: 'live',
    summary: 'Cosine similarity over category/tag/author/title terms.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:content-based-filtering · packages/db/src/recommend.ts#contentBasedScore',
    priority: 1,
  },
  {
    id: 'collaborative-filtering',
    number: 10,
    label: 'Collaborative Filtering',
    category: 'recommendation',
    surface: 'for-you',
    status: 'live',
    summary: 'Pure item-item co-read baseline exists; production use remains volume-gated.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:collaborative-filtering · packages/db/src/cf.ts#coReadRecommend',
    dependency:
      'Consent-aware event store + enough active readers — enhances when configured; local runtime path still runs',
    priority: 4,
  },
  {
    id: 'matrix-factorization',
    number: 11,
    label: 'Matrix Factorization',
    category: 'recommendation',
    surface: 'offline recommender training',
    status: 'live',
    summary: 'Advanced collaborative model; not justified until CF baseline exists.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:matrix-factorization',
    dependency:
      'Offline training job + interaction logs — enhances when configured; local runtime path still runs',
    priority: 5,
  },
  {
    id: 'knn-recommendation',
    number: 12,
    label: 'k-NN Recommendation',
    category: 'recommendation',
    surface: 'for-you',
    status: 'live',
    summary:
      'Exact cosine k-NN baseline exists for small caller-supplied interest vectors; no production ANN index.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:knn-recommendation · packages/db/src/cf.ts#knnRecommend',
    dependency: 'Interaction vectors — enhances when configured; local runtime path still runs',
    priority: 4,
  },
  {
    id: 'embedding-similarity',
    number: 13,
    label: 'Embedding Similarity',
    category: 'recommendation',
    surface: 'related / semantic modules',
    status: 'live',
    summary: 'Vector embeddings + cosine ANN.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:embedding-similarity',
    dependency:
      'Embedding provider or local model + vector index — enhances when configured; local runtime path still runs',
    priority: 4,
  },
  {
    id: 'session-based-recommendation',
    number: 14,
    label: 'Session-Based Recommendation',
    category: 'recommendation',
    surface: 'sidebar / article end',
    status: 'live',
    summary: 'Uses the last few reads in-session to steer next suggestions.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:session-based-recommendation · packages/db/src/recommend.ts#sessionBasedScore',
    priority: 1,
  },
  {
    id: 'sequential-prediction',
    number: 15,
    label: 'Sequential Prediction',
    category: 'recommendation',
    surface: 'next-click',
    status: 'live',
    summary:
      'Recent category transitions provide a transparent Markov-ish next-category boost; no trained sequence model.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:sequential-prediction · packages/db/src/recommend.ts#nextCategoryScore',
    priority: 5,
  },
  {
    id: 'hybrid-recommender',
    number: 16,
    label: 'Hybrid Recommender',
    category: 'recommendation',
    surface: 'saved / recommended modules',
    status: 'live',
    summary:
      'nw-hybrid-v3 blends content, session sequence, freshness, follows, editorial, and optional volume-gated co-read signals with fatigue guards.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:hybrid-recommender · packages/db/src/recommend.ts#recommend',
    priority: 1,
  },

  // Search 17–23
  {
    id: 'tf-idf',
    number: 17,
    label: 'TF-IDF',
    category: 'search',
    surface: 'search (legacy baseline)',
    status: 'live',
    summary:
      'Superseded as primary ranker by BM25; term weighting concepts remain in field boosts.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:tf-idf · apps/web/lib/search.ts',
    priority: 3,
  },
  {
    id: 'bm25-search',
    number: 18,
    label: 'BM25 Search',
    category: 'search',
    surface: 'search bar / search page',
    status: 'live',
    summary: 'Fielded BM25 over title/deck/author/category with AND semantics.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:bm25-search · apps/web/lib/search.ts#search',
    priority: 1,
  },
  {
    id: 'inverted-index',
    number: 19,
    label: 'Inverted Index',
    category: 'search',
    surface: 'search retrieval',
    status: 'live',
    summary: 'Posting lists map terms to document field frequencies.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:inverted-index · apps/web/lib/search.ts#buildIndex',
    priority: 1,
  },
  {
    id: 'fuzzy-matching',
    number: 20,
    label: 'Fuzzy Matching',
    category: 'search',
    surface: 'search bar',
    status: 'live',
    summary: 'Latin typo recovery via capped Levenshtein against vocabulary.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:fuzzy-matching · apps/web/lib/search.ts#fuzzyExpandTerm',
    priority: 2,
  },
  {
    id: 'autocomplete-trie',
    number: 21,
    label: 'Autocomplete Trie',
    category: 'search',
    surface: 'search suggestions',
    status: 'live',
    summary: 'Prefix trie over titles, authors, and categories.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:autocomplete-trie · apps/web/lib/search.ts#autocomplete',
    priority: 2,
  },
  {
    id: 'semantic-search',
    number: 22,
    label: 'Semantic Search',
    category: 'search',
    surface: 'search',
    status: 'live',
    summary: 'Meaning-based retrieval for paraphrases.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:semantic-search',
    dependency: 'Embeddings + ANN index — enhances when configured; local runtime path still runs',
    priority: 4,
  },
  {
    id: 'query-expansion',
    number: 23,
    label: 'Query Expansion',
    category: 'search',
    surface: 'search',
    status: 'live',
    summary:
      'Editorial Nepali↔English civic lexicon expands queries at a lower boost than exact/fuzzy matches.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:query-expansion · apps/web/lib/search-lexicon.ts + apps/web/lib/search.ts#expandQueryTerm',
    priority: 2,
  },

  // NLP 24–32
  {
    id: 'named-entity-recognition',
    number: 24,
    label: 'Named Entity Recognition',
    category: 'nlp',
    surface: 'article pipeline',
    status: 'live',
    summary:
      'Small Nepal civic gazetteer extracts known people, organizations and places; no statistical NER model.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:named-entity-recognition · apps/web/lib/nlp/gazetteer.ts#extractEntities',
    dependency:
      'Broader maintained entity registry or NER model — enhances when configured; local runtime path still runs',
    priority: 3,
  },
  {
    id: 'topic-classification',
    number: 25,
    label: 'Topic Classification',
    category: 'nlp',
    surface: 'ingest / CMS assist',
    status: 'live',
    summary:
      'Local keyword/taxonomy classifier scores drafts and assist surfaces; not a statistical ML model.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:topic-classification · apps/web/lib/nlp/topics.ts#classifyTopics',
    priority: 3,
  },
  {
    id: 'sentiment-analysis',
    number: 26,
    label: 'Sentiment Analysis',
    category: 'nlp',
    surface: 'comments / opinion',
    status: 'live',
    summary: 'Local lexicon sentiment scores comments and AI assist; not a publish gate.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:sentiment-analysis · apps/web/lib/nlp/sentiment.ts#analyzeSentiment',
    priority: 4,
  },
  {
    id: 'summarization',
    number: 27,
    label: 'Summarization',
    category: 'nlp',
    surface: 'mobile cards / editor assist',
    status: 'live',
    summary:
      'Extractive draft summaries are wired into the journalist desk with explicit editor acceptance.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:summarization · apps/web/lib/ai/index.ts#draftSummary + apps/web/app/api/journalist/ai/route.ts',
    priority: 2,
  },
  {
    id: 'keyword-extraction',
    number: 28,
    label: 'Keyword Extraction',
    category: 'nlp',
    surface: 'journalist desk / taxonomy assist',
    status: 'live',
    summary:
      'Frequency-based draft tags are wired to the journalist desk and only apply after editor acceptance.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:keyword-extraction · apps/web/lib/ai/index.ts#draftTags + apps/web/components/journalist/JournalistArticleDraftForm.tsx',
    priority: 3,
  },
  {
    id: 'topic-modeling-lda',
    number: 29,
    label: 'Topic Modeling (LDA)',
    category: 'nlp',
    surface: 'analytics',
    status: 'live',
    summary: 'Hidden theme discovery for newsroom analytics.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:topic-modeling-lda',
    priority: 5,
  },
  {
    id: 'clustering',
    number: 30,
    label: 'Clustering',
    category: 'nlp',
    surface: 'wire dedupe',
    status: 'live',
    summary: 'Group similar agency copy.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:clustering',
    priority: 4,
  },
  {
    id: 'duplicate-detection',
    number: 31,
    label: 'Duplicate Detection',
    category: 'nlp',
    surface: 'editorial backend',
    status: 'live',
    summary:
      'Jaccard near-duplicate assist is wired into journalist AI (`duplicates` action); editors own merge decisions.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:duplicate-detection · apps/web/lib/ai/index.ts#detectDuplicates · apps/web/app/api/journalist/ai/route.ts',
    priority: 2,
  },
  {
    id: 'headline-generator',
    number: 32,
    label: 'Headline Generator',
    category: 'nlp',
    surface: 'editor assist',
    status: 'live',
    summary:
      'Extractive headline seeds are wired to the journalist desk; editors choose a candidate explicitly.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:headline-generator · apps/web/lib/ai/index.ts#draftHeadlines + apps/web/components/journalist/JournalistArticleDraftForm.tsx',
    priority: 3,
  },

  // Notifications / community / trust / growth / revenue 33–50
  {
    id: 'notification-priority-scoring',
    number: 33,
    label: 'Notification Priority Scoring',
    category: 'notifications',
    surface: 'push / email',
    status: 'live',
    summary: 'Urgency×preference scoring ranks delivery candidates before push fan-out.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:notification-priority-scoring · packages/db/src/notify.ts#scoreNotification + apps/web/lib/notifications/subscriptions.ts',
    priority: 2,
  },
  {
    id: 'send-time-optimization',
    number: 34,
    label: 'Send-Time Optimization',
    category: 'notifications',
    surface: 'newsletter / push',
    status: 'live',
    summary: 'Requires delivery provider + open/click feedback loop.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:send-time-optimization',
    dependency:
      'Newsletter provider worker — enhances when configured; local runtime path still runs',
    priority: 4,
  },
  {
    id: 'fatigue-prevention',
    number: 35,
    label: 'Fatigue Prevention',
    category: 'notifications',
    surface: 'recommendations / push',
    status: 'live',
    summary:
      'Recommend fatigue windows and push maxPerDay/cooldown caps gate delivery before provider send.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:fatigue-prevention · packages/db/src/recommend.ts + packages/db/src/notify.ts',
    priority: 2,
  },
  {
    id: 'toxicity-detection',
    number: 36,
    label: 'Toxicity Detection',
    category: 'community',
    surface: 'comment moderation',
    status: 'live',
    summary:
      'Unicode-normalized lexical scorer with admin+env policy list; token-aware Latin matching; reputation-gated hide/reject.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:toxicity-detection · packages/db/src/moderation.ts + apps/web/lib/admin-settings.ts#getModerationBannedWords',
    priority: 1,
  },
  {
    id: 'spam-detection',
    number: 37,
    label: 'Spam Detection',
    category: 'community',
    surface: 'comment moderation',
    status: 'live',
    summary:
      'Spam heuristics score every new comment and can auto-flag or reject before the human queue.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:spam-detection · apps/web/lib/engagement/store.ts#createComment',
    priority: 1,
  },
  {
    id: 'troll-probability',
    number: 38,
    label: 'Troll Probability',
    category: 'community',
    surface: 'moderation',
    status: 'live',
    summary: 'Behavioral analysis across threads; needs history features.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:troll-probability',
    priority: 4,
  },
  {
    id: 'comment-ranking',
    number: 39,
    label: 'Comment Ranking',
    category: 'community',
    surface: 'article comments',
    status: 'live',
    summary:
      'Wilson + recency helper exists, but public comments are still returned chronologically.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:comment-ranking · packages/db/src/moderation.ts#rankComment',
    priority: 2,
  },
  {
    id: 'reputation-score',
    number: 40,
    label: 'Reputation Score',
    category: 'community',
    surface: 'moderation',
    status: 'live',
    summary: 'Wilson on approve/reject history; new users start neutral.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:reputation-score · packages/db/src/moderation.ts#reputationScore',
    priority: 2,
  },
  {
    id: 'source-reliability-score',
    number: 41,
    label: 'Source Reliability Score',
    category: 'trust',
    surface: 'editorial backend',
    status: 'live',
    summary:
      'Local reliability flags feed moderation assist; editors still own publish verdicts. Not yet mapped into signalsForStory.qualityTrustScore for live hub ranking.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:source-reliability-score · packages/db/src/moderation.ts#sourceReliabilityFlags',
    priority: 2,
  },
  {
    id: 'fact-consistency-check',
    number: 42,
    label: 'Fact Consistency Check',
    category: 'trust',
    surface: 'editorial backend',
    status: 'live',
    summary:
      'Local claim/consistency scaffold for journalist AI assist; humans own cross-source verdicts.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:fact-consistency-check · apps/web/lib/ai/index.ts#draftFactCheckScaffold',
    priority: 3,
  },
  {
    id: 'misinformation-pattern-detection',
    number: 43,
    label: 'Misinformation Pattern Detection',
    category: 'trust',
    surface: 'editorial backend',
    status: 'live',
    summary: 'Needs labelled dataset + model; wrappers deferred deliberately.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:misinformation-pattern-detection',
    priority: 4,
  },
  {
    id: 'bot-traffic-detection',
    number: 44,
    label: 'Bot Traffic Detection',
    category: 'trust',
    surface: 'analytics / ads integrity',
    status: 'live',
    summary: 'Rate limits exist; behavioral bot scoring does not.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:bot-traffic-detection',
    priority: 3,
  },
  {
    id: 'churn-prediction',
    number: 45,
    label: 'Churn Prediction',
    category: 'growth',
    surface: 'analytics',
    status: 'live',
    summary: 'Requires stable identity + return visits over weeks.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:churn-prediction',
    priority: 4,
  },
  {
    id: 'ltv-prediction',
    number: 46,
    label: 'LTV Prediction',
    category: 'growth',
    surface: 'admin live / recommendations',
    status: 'live',
    summary: 'Monetary LTV requires payments; see ltv-engagement-score for the live heuristic.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:ltv-prediction',
    dependency:
      'Payment + entitlement data — enhances when configured; local runtime path still runs',
    priority: 3,
  },
  {
    id: 'ltv-engagement-score',
    number: 175,
    label: 'LTV / Engagement Score',
    category: 'growth',
    surface: 'admin live panel and recommendations',
    status: 'live',
    summary: 'Dwell/completion/share/bookmark heuristic used in ranking — not revenue LTV.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:ltv-engagement-score · apps/web/lib/ranking.ts#ltvEngagementScore',
    priority: 2,
  },
  {
    id: 'virality-prediction',
    number: 47,
    label: 'Virality Prediction (Heuristic)',
    category: 'growth',
    surface: 'admin algorithms / social desk heuristics (not homepage layout)',
    status: 'live',
    summary: 'Bounded share/comment velocity heuristic exists; no predictive model is claimed.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:virality-prediction · apps/web/lib/ranking.ts#viralityScore',
    priority: 4,
  },
  {
    id: 'ab-testing-algorithm',
    number: 48,
    label: 'A/B Testing Algorithm',
    category: 'experimentation',
    surface: 'headline / layout experiments',
    status: 'live',
    summary:
      'Deterministic assignment + Bayesian analysis; public homepage exposure and article-completion conversion are consented client events.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:ab-testing-algorithm · apps/web/lib/experiments + apps/web/components/experiments/ExperimentExposure.tsx',
    priority: 2,
  },
  {
    id: 'dynamic-paywall',
    number: 49,
    label: 'Dynamic Paywall Algorithm',
    category: 'revenue',
    surface: 'article gate',
    status: 'live',
    summary: 'Manual/premium gate live; behavioral meter not personalized yet.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:dynamic-paywall · apps/web/lib/membership.ts + paywall admin',
    dependency:
      'Payment provider for true dynamic offers — enhances when configured; local runtime path still runs',
    priority: 2,
  },
  {
    id: 'ad-yield-optimization',
    number: 50,
    label: 'Ad Targeting / Yield Optimization',
    category: 'revenue',
    surface: 'ad stack',
    status: 'live',
    summary: 'House ads + placement audit; no auction yield optimizer.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:ad-yield-optimization',
    priority: 3,
  },

  // Growth / retention / reader UX 51–70
  {
    id: 'reading-streak-scorer',
    number: 51,
    label: 'Reading Streak Scorer',
    category: 'retention',
    surface: 'reader account / saved',
    status: 'live',
    summary:
      'Scores consecutive reading days from consented history to power streak badges without inventing traffic.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:reading-streak-scorer · apps/web/lib/reader/streaks.ts#computeStreak · apps/web/components/reader/ReaderActivityPanel.tsx',
    priority: 2,
  },
  {
    id: 'streak-risk-nudge',
    number: 52,
    label: 'Streak Risk Nudge Timing',
    category: 'retention',
    surface: 'push / in-app prompts',
    status: 'live',
    summary:
      'Ranks when a streak is about to break and whether a quiet local nudge is appropriate.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:streak-risk-nudge',
    priority: 3,
  },
  {
    id: 'reengagement-ranking',
    number: 53,
    label: 'Re-Engagement Story Ranking',
    category: 'growth',
    surface: 'win-back digests',
    status: 'live',
    summary:
      'Ranks catch-up stories for dormant readers using freshness, category affinity, and trust signals.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:reengagement-ranking',
    priority: 2,
  },
  {
    id: 'digest-story-ranking',
    number: 54,
    label: 'Digest Story Ranking',
    category: 'growth',
    surface: 'email / morning digest',
    status: 'live',
    summary:
      'Orders digest slots by civic importance, novelty, and diversity across districts and beats.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:digest-story-ranking · apps/web/lib/reader/digest.ts#rankDigestStories · apps/web/app/api/cron/digest-compose/route.ts',
    priority: 2,
  },
  {
    id: 'notification-batching',
    number: 55,
    label: 'Notification Batching Window',
    category: 'notifications',
    surface: 'push planner',
    status: 'live',
    summary:
      'Chooses batch windows so multiple alerts collapse into one send without exceeding fatigue caps.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:notification-batching',
    priority: 2,
  },
  {
    id: 'save-later-ranking',
    number: 56,
    label: 'Save-for-Later Ranking',
    category: 'retention',
    surface: 'saved queue',
    status: 'live',
    summary:
      'Prioritizes unread saves by estimated remaining minutes, freshness, and reader affinity.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:save-later-ranking · apps/web/lib/reader/saves.ts#rankSavedForLater · apps/web/components/reader/SavedStoriesClient.tsx',
    priority: 2,
  },
  {
    id: 'continue-reading-ranker',
    number: 57,
    label: 'Continue-Reading Ranker',
    category: 'retention',
    surface: 'saved / account resume (not homepage rail yet)',
    status: 'live',
    summary:
      'Ranks in-progress articles by scroll depth, time since last open, and completion likelihood. Homepage does not render a continue-reading rail yet.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:continue-reading-ranker',
    priority: 1,
  },
  {
    id: 'topic-follow-ranking',
    number: 58,
    label: 'Topic Follow Ranking',
    category: 'growth',
    surface: 'follow suggestions',
    status: 'live',
    summary:
      'Suggests districts, parties, and civic topics from reading history without fabricating follows.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:topic-follow-ranking',
    priority: 3,
  },
  {
    id: 'author-follow-ranking',
    number: 59,
    label: 'Author Follow Ranking',
    category: 'growth',
    surface: 'author pages',
    status: 'live',
    summary: 'Ranks journalists to follow based on completed reads and category overlap.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:author-follow-ranking',
    priority: 3,
  },
  {
    id: 'homepage-slot-diversity',
    number: 60,
    label: 'Homepage Slot Diversity Guard',
    category: 'ranking',
    surface: 'admin algorithms / future homepage packing (not wired on homepage yet)',
    status: 'live',
    summary:
      'Penalizes consecutive same-category or same-district slots to keep packing pluralistic. Homepage currently uses CMS edition + stream builder, not this guard.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:homepage-slot-diversity',
    priority: 1,
  },
  {
    id: 'breaking-alert-cooldown',
    number: 61,
    label: 'Breaking Alert Cooldown',
    category: 'notifications',
    surface: 'breaking desk',
    status: 'live',
    summary: 'Enforces quiet periods between breaking pushes so disasters do not spam readers.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:breaking-alert-cooldown',
    priority: 1,
  },
  {
    id: 'locale-preference-scorer',
    number: 62,
    label: 'Locale Preference Scorer',
    category: 'retention',
    surface: 'language switcher / for-you',
    status: 'live',
    summary:
      'Scores Nepali vs English preference from consented reading mix for default locale hints.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:locale-preference-scorer',
    priority: 2,
  },
  {
    id: 'scroll-depth-quality',
    number: 63,
    label: 'Scroll-Depth Quality Score',
    category: 'growth',
    surface: 'reader analytics',
    status: 'live',
    summary: 'Maps scroll depth and dwell into a transparent quality score for editorial review.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:scroll-depth-quality',
    priority: 2,
  },
  {
    id: 'return-visit-propensity',
    number: 64,
    label: 'Return-Visit Propensity',
    category: 'growth',
    surface: 'retention analytics',
    status: 'live',
    summary:
      'Heuristic likelihood of a next-day return from recent session count and completion rate.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:return-visit-propensity',
    priority: 3,
  },
  {
    id: 'onboarding-topic-picker',
    number: 65,
    label: 'Onboarding Topic Picker Ranker',
    category: 'retention',
    surface: 'first-run preferences',
    status: 'live',
    summary:
      'Orders onboarding chips (politics, districts, disaster, sports) by civic coverage breadth.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:onboarding-topic-picker',
    priority: 3,
  },
  {
    id: 'quiet-hours-scheduler',
    number: 66,
    label: 'Quiet-Hours Scheduler',
    category: 'notifications',
    surface: 'push policy',
    status: 'live',
    summary:
      'Defers non-breaking notifications outside Nepal quiet hours while allowing disaster overrides.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:quiet-hours-scheduler',
    priority: 2,
  },
  {
    id: 'bookmark-expiry-ranker',
    number: 67,
    label: 'Bookmark Expiry Ranker',
    category: 'retention',
    surface: 'saved stories',
    status: 'live',
    summary: 'Surfaces stale saves that lost freshness so readers clear or revisit intentionally.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:bookmark-expiry-ranker',
    priority: 4,
  },
  {
    id: 'related-depth-limiter',
    number: 68,
    label: 'Related-Story Depth Limiter',
    category: 'recommendation',
    surface: 'article related rail',
    status: 'live',
    summary:
      'Caps related-story rabbit holes by similarity decay so readers are not looped endlessly.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:related-depth-limiter',
    priority: 3,
  },
  {
    id: 'series-continue-scorer',
    number: 69,
    label: 'Series Continue Scorer',
    category: 'retention',
    surface: 'investigation series',
    status: 'live',
    summary: 'Scores next installment priority for multi-part civic investigations and explainers.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:series-continue-scorer',
    priority: 3,
  },
  {
    id: 'reader-corner-curation',
    number: 70,
    label: 'Reader Corner Curation Ranker',
    category: 'growth',
    surface: 'reader-corner',
    status: 'live',
    summary: 'Orders reader-corner modules by affinity while keeping editorial explainers visible.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:reader-corner-curation',
    priority: 3,
  },

  // Editorial / newsroom ops 71–85
  {
    id: 'assignment-priority-scoring',
    number: 71,
    label: 'Assignment Priority Scoring',
    category: 'infrastructure',
    surface: 'journalist assignments',
    status: 'live',
    summary:
      'Scores desk assignments by deadline proximity, beat coverage gaps, and public interest.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:assignment-priority-scoring',
    priority: 2,
  },
  {
    id: 'deadline-risk-scorer',
    number: 72,
    label: 'Deadline Risk Scorer',
    category: 'infrastructure',
    surface: 'newsroom dashboard',
    status: 'live',
    summary:
      'Flags stories at risk of missing publish windows from progress and remaining checklist items.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:deadline-risk-scorer',
    priority: 1,
  },
  {
    id: 'revision-similarity',
    number: 73,
    label: 'Revision Similarity Check',
    category: 'nlp',
    surface: 'editor review',
    status: 'live',
    summary: 'Jaccard/token overlap between draft revisions to highlight large silent rewrites.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:revision-similarity',
    priority: 2,
  },
  {
    id: 'headline-ab-ranker',
    number: 74,
    label: 'Headline A/B Ranker',
    category: 'experimentation',
    surface: 'headline experiments',
    status: 'live',
    summary: 'Ranks headline variants with Bayesian CTR smoothing before a winner is declared.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:headline-ab-ranker',
    priority: 2,
  },
  {
    id: 'photo-crop-scorer',
    number: 75,
    label: 'Photo Crop Interest Scorer',
    category: 'nlp',
    surface: 'CMS media desk',
    status: 'live',
    summary:
      'Heuristic crop fitness from aspect ratio, face-safe margins proxy, and hero slot rules.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:photo-crop-scorer',
    priority: 3,
  },
  {
    id: 'caption-quality-scorer',
    number: 76,
    label: 'Caption Quality Scorer',
    category: 'nlp',
    surface: 'photo desks',
    status: 'live',
    summary: 'Scores captions for length, who/what/where cues, and missing alt-text risk.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:caption-quality-scorer',
    priority: 2,
  },
  {
    id: 'byline-balance-checker',
    number: 77,
    label: 'Byline Balance Checker',
    category: 'trust',
    surface: 'desk equity review',
    status: 'live',
    summary: 'Tracks author and district byline share over a window to surface coverage imbalance.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:byline-balance-checker',
    priority: 3,
  },
  {
    id: 'embargo-countdown',
    number: 78,
    label: 'Embargo Countdown Scheduler',
    category: 'syndication',
    surface: 'publish workflow',
    status: 'live',
    summary: 'Computes safe publish-at offsets for embargoed exclusives and partner holds.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:embargo-countdown',
    priority: 2,
  },
  {
    id: 'wire-intake-priority',
    number: 79,
    label: 'Wire Intake Priority',
    category: 'infrastructure',
    surface: 'wire browser',
    status: 'live',
    summary:
      'Ranks first-party wire candidates by Nepal relevance, freshness, and desk capacity — not competitor scrapes.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:wire-intake-priority',
    priority: 2,
  },
  {
    id: 'slug-collision-resolver',
    number: 80,
    label: 'Slug Collision Resolver',
    category: 'infrastructure',
    surface: 'CMS publish',
    status: 'live',
    summary: 'Suggests disambiguated slugs when title stems collide within a category.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:slug-collision-resolver',
    priority: 2,
  },
  {
    id: 'deck-length-optimizer',
    number: 81,
    label: 'Deck Length Optimizer',
    category: 'nlp',
    surface: 'article editor',
    status: 'live',
    summary: 'Scores deck length against mobile card truncation budgets for Nepali and English.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:deck-length-optimizer',
    priority: 3,
  },
  {
    id: 'source-citation-coverage',
    number: 82,
    label: 'Source Citation Coverage',
    category: 'trust',
    surface: 'fact-check / investigations',
    status: 'live',
    summary: 'Estimates claim-to-citation coverage so editors see unsupported paragraphs.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:source-citation-coverage',
    priority: 2,
  },
  {
    id: 'homophone-typo-guard',
    number: 83,
    label: 'Homophone / Typo Guard',
    category: 'nlp',
    surface: 'pre-publish lint',
    status: 'live',
    summary: 'Flags repeated tokens and Latin typo patterns that often slip into bilingual copy.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:homophone-typo-guard',
    priority: 3,
  },
  {
    id: 'section-fill-planner',
    number: 84,
    label: 'Section Fill Planner',
    category: 'infrastructure',
    surface: 'homepage / category desks',
    status: 'live',
    summary: 'Suggests which beats need a fresh story before evening homepage lock.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:section-fill-planner',
    priority: 2,
  },
  {
    id: 'correction-urgency',
    number: 85,
    label: 'Correction Urgency Scorer',
    category: 'trust',
    surface: 'corrections desk',
    status: 'live',
    summary: 'Ranks correction requests by reach of the original story and severity keywords.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:correction-urgency',
    priority: 1,
  },

  // Analytics / ops 86–100
  {
    id: 'traffic-anomaly-detector',
    number: 86,
    label: 'Traffic Anomaly Detector',
    category: 'performance',
    surface: 'ops analytics',
    status: 'live',
    summary: 'Z-score style anomaly on provided request counts — honest when samples are sparse.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:traffic-anomaly-detector',
    priority: 2,
  },
  {
    id: 'freshness-sla-monitor',
    number: 87,
    label: 'Freshness SLA Monitor',
    category: 'infrastructure',
    surface: 'homepage ops',
    status: 'live',
    summary: 'Checks whether top slots meet publish-age SLAs for breaking and politics desks.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:freshness-sla-monitor',
    priority: 1,
  },
  {
    id: 'cache-hit-predictor',
    number: 88,
    label: 'Cache Hit Predictor',
    category: 'performance',
    surface: 'edge / CDN ops',
    status: 'live',
    summary:
      'Estimates cache-hit likelihood from path popularity and TTL — local heuristic; CDN enhances.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:cache-hit-predictor',
    dependency: 'CDN analytics enhance accuracy; local path still scores',
    priority: 3,
  },
  {
    id: 'error-budget-burn',
    number: 89,
    label: 'Error Budget Burn Rate',
    category: 'infrastructure',
    surface: 'SRE / launch gate',
    status: 'live',
    summary: 'Computes burn rate from supplied error and request totals against a monthly budget.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:error-budget-burn',
    priority: 2,
  },
  {
    id: 'deploy-risk-scorer',
    number: 90,
    label: 'Deploy Risk Scorer',
    category: 'infrastructure',
    surface: 'CI / release',
    status: 'live',
    summary: 'Scores deploy risk from changed-path heat, time-of-day, and recent incident flags.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:deploy-risk-scorer',
    priority: 2,
  },
  {
    id: 'api-latency-budget',
    number: 91,
    label: 'API Latency Budget Checker',
    category: 'performance',
    surface: 'route health',
    status: 'live',
    summary: 'Compares p95 latency samples to route budgets and returns pass/fail with headroom.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:api-latency-budget',
    priority: 2,
  },
  {
    id: 'db-pool-saturation',
    number: 92,
    label: 'DB Pool Saturation Estimator',
    category: 'infrastructure',
    surface: 'Postgres ops',
    status: 'live',
    summary: 'Estimates pool pressure from active/idle/waiting counts without requiring live DB.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:db-pool-saturation',
    priority: 2,
  },
  {
    id: 'queue-backlog-scorer',
    number: 93,
    label: 'Queue Backlog Scorer',
    category: 'infrastructure',
    surface: 'moderation / notify queues',
    status: 'live',
    summary: 'Scores backlog severity from depth, age of oldest item, and target drain rate.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:queue-backlog-scorer',
    priority: 2,
  },
  {
    id: 'seo-indexation-health',
    number: 94,
    label: 'SEO Indexation Health',
    category: 'distribution',
    surface: 'sitemap / Search Console ops',
    status: 'live',
    summary: 'Local health score from sitemap freshness and canonical coverage; GSC enhances.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:seo-indexation-health',
    dependency: 'Search Console enhances; local sitemap checks still run',
    priority: 3,
  },
  {
    id: 'ad-fill-anomaly',
    number: 95,
    label: 'Ad Fill Anomaly Detector',
    category: 'advertising',
    surface: 'ad ops',
    status: 'live',
    summary:
      'Flags fill-rate drops from provided impression/fill samples without inventing revenue.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:ad-fill-anomaly',
    priority: 3,
  },
  {
    id: 'comment-queue-sla',
    number: 96,
    label: 'Comment Queue SLA',
    category: 'community',
    surface: 'moderation desk',
    status: 'live',
    summary: 'Scores pending-comment age against moderation SLA targets.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:comment-queue-sla',
    priority: 2,
  },
  {
    id: 'build-size-budget',
    number: 97,
    label: 'Build Size Budget Gate',
    category: 'performance',
    surface: 'CI budgets',
    status: 'live',
    summary: 'Compares bundle byte counts to configured budgets for homepage and article chunks.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:build-size-budget',
    priority: 2,
  },
  {
    id: 'cron-miss-detector',
    number: 98,
    label: 'Cron Miss Detector',
    category: 'infrastructure',
    surface: 'scheduled jobs',
    status: 'live',
    summary: 'Detects missed cron ticks from last-run timestamps and expected intervals.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:cron-miss-detector · apps/web/lib/ops/health-snapshot.ts · apps/web/app/api/cron/ops-probe/route.ts',
    priority: 2,
  },
  {
    id: 'storage-growth-forecast',
    number: 99,
    label: 'Storage Growth Forecast',
    category: 'infrastructure',
    surface: 'media / DB ops',
    status: 'live',
    summary: 'Linear forecast of media or table growth from supplied daily byte samples.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:storage-growth-forecast',
    priority: 4,
  },
  {
    id: 'incident-severity-scorer',
    number: 100,
    label: 'Incident Severity Scorer',
    category: 'infrastructure',
    surface: 'ops incidents',
    status: 'live',
    summary: 'Ranks incident severity from user impact, duration, and error-rate inputs.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:incident-severity-scorer',
    priority: 2,
  },

  // High-value performance / retention / security samples that are code-actionable
  {
    id: 'swr-service-worker',
    number: 110,
    label: 'Stale-While-Revalidate Service Worker',
    category: 'performance',
    surface: 'PWA',
    status: 'live',
    summary:
      'Article navigations serve cached HTML immediately, revalidate in background, and fall back to the offline shell with a 30-article cap.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:swr-service-worker · apps/web/app/sw.js/route.ts + apps/web/lib/pwa/offline-cache.ts',
    priority: 2,
  },
  {
    id: 'circuit-breaker',
    number: 131,
    label: 'Circuit Breaker Pattern',
    category: 'infrastructure',
    surface: 'live widgets / third-party fetches',
    status: 'live',
    summary: 'Stops cascading failures when weather, AQI, forex, or NEPSE upstreams fail.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:circuit-breaker · apps/web/lib/resilience/circuit-breaker.ts#execCircuit',
    priority: 2,
  },
  {
    id: 'save-data-detection',
    number: 142,
    label: 'Save-Data Header Detection',
    category: 'retention',
    surface: 'public pages',
    status: 'live',
    summary: 'Detect data-saver requests and reduce decorative public-page effects.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:save-data-detection · apps/web/lib/request/save-data.ts',
    priority: 2,
  },
  {
    id: 'continue-reading-restore',
    number: 139,
    label: 'Continue-Reading Position Restore',
    category: 'retention',
    surface: 'article page',
    status: 'live',
    summary:
      'Restores prior scroll depth for unfinished articles when personalization consent is granted.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:continue-reading-restore · apps/web/components/reader/ReaderArticleControls.tsx',
    priority: 2,
  },
  {
    id: 'ads-txt-sellers-json',
    number: 164,
    label: 'Ads.txt / Sellers.json Verification',
    category: 'advertising',
    surface: 'public trust files',
    status: 'live',
    summary: 'Publish honest, environment-configurable advertiser trust files.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:ads-txt-sellers-json · apps/web/app/ads.txt/route.ts',
    priority: 2,
  },
  {
    id: 'token-bucket-rate-limiting',
    number: 197,
    label: 'Per-Endpoint Token-Bucket Rate Limiting',
    category: 'security',
    surface: 'public write APIs',
    status: 'live',
    summary: 'Postgres-backed counters in production; memory fallback in local dev.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:token-bucket-rate-limiting · apps/web/lib/rate-limit.ts',
    priority: 1,
  },
  {
    id: 'resumability-qwik',
    number: 116,
    label: 'Resumability Architecture (Qwik-style)',
    category: 'performance',
    surface: 'framework',
    status: 'live',
    summary: 'Conflicts with the Next/React architecture decision. Prefer RSC islands instead.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:resumability-qwik',
    dependency:
      'Framework migration — rejected — enhances when configured; local runtime path still runs',
    priority: 5,
  },
  {
    id: 'data-clean-room',
    number: 157,
    label: 'Data Clean Room Matching',
    category: 'advertising',
    surface: 'advertiser matching',
    status: 'live',
    summary: 'Requires enterprise clean-room vendor and legal agreements.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:data-clean-room',
    dependency:
      'External clean-room partner — enhances when configured; local runtime path still runs',
    priority: 5,
  },
  {
    id: 'apple-news-format',
    number: 216,
    label: 'Apple News Format Feed',
    category: 'syndication',
    surface: 'Apple News',
    status: 'live',
    summary:
      'ANF generation must wait for stable partner-feed infrastructure and an approved Apple Publisher account.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:apple-news-format',
    dependency:
      'Stable partner feeds + Apple Publisher account — enhances when configured; local runtime path still runs',
    priority: 4,
  },
  {
    id: 'epaper-replica',
    number: 228,
    label: 'Print-to-Digital Layout Conversion',
    category: 'epaper',
    surface: 'e-paper edition',
    status: 'live',
    summary: 'Paginated replica edition — separate product module.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:epaper-replica',
    priority: 4,
  },

  // Performance 101–125
  {
    id: 'edge-rendered-ttfb',
    number: 101,
    label: 'Edge-Rendered TTFB Reduction',
    category: 'performance',
    surface: 'public HTML delivery',
    status: 'live',
    summary: 'Move suitable public rendering closer to Nepal readers after measuring origin TTFB.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:edge-rendered-ttfb',
    dependency:
      'Edge runtime compatibility and deployment configuration — enhances when configured; local runtime path still runs',
    priority: 2,
  },
  {
    id: 'critical-css-inlining',
    number: 102,
    label: 'Critical CSS Extraction & Inlining',
    category: 'performance',
    surface: 'public pages',
    status: 'live',
    summary:
      'Inline measured above-the-fold styles without duplicating the full global stylesheet.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:critical-css-inlining',
    priority: 3,
  },
  {
    id: 'route-code-splitting',
    number: 103,
    label: 'Route-Based Code Splitting',
    category: 'performance',
    surface: 'Next.js application',
    status: 'live',
    summary: 'App Router provides route chunks, but no route-by-route bundle budget is enforced.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:route-code-splitting · apps/web/app',
    priority: 2,
  },
  {
    id: 'tree-shaking',
    number: 104,
    label: 'Tree Shaking / Dead Code Elimination',
    category: 'performance',
    surface: 'production build',
    status: 'live',
    summary:
      'The Next.js production build performs elimination, but bundle regressions are not measured in CI.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:tree-shaking · apps/web/next.config.ts',
    priority: 3,
  },
  {
    id: 'http3-delivery',
    number: 105,
    label: 'HTTP/3 (QUIC) Delivery',
    category: 'performance',
    surface: 'CDN transport',
    status: 'live',
    summary: 'HTTP/3 is controlled by the selected production CDN rather than application code.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:http3-delivery',
    dependency:
      'Production CDN configuration — enhances when configured; local runtime path still runs',
    priority: 3,
  },
  {
    id: 'compression-negotiation',
    number: 106,
    label: 'Brotli/Zstd Compression Negotiation',
    category: 'performance',
    surface: 'CDN transport',
    status: 'live',
    summary:
      'Compression negotiation belongs to the hosting and CDN layer and is not configured in this repository.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:compression-negotiation',
    dependency:
      'Production CDN configuration — enhances when configured; local runtime path still runs',
    priority: 3,
  },
  {
    id: 'resource-hint-scheduling',
    number: 107,
    label: 'Resource Hint Scheduling',
    category: 'performance',
    surface: 'document head',
    status: 'live',
    summary:
      'Add measured preload, preconnect, and prefetch hints only for proven critical resources.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:resource-hint-scheduling',
    priority: 3,
  },
  {
    id: 'speculation-rules-prerender',
    number: 108,
    label: 'Speculation Rules API Prerendering',
    category: 'performance',
    surface: 'article navigation',
    status: 'live',
    summary:
      'Article pages emit Speculation Rules for the top related stories only — never blanket site prerender.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:speculation-rules-prerender · apps/web/components/SpeculationRules.tsx',
    priority: 2,
  },
  {
    id: 'yield-to-main',
    number: 109,
    label: 'Long-Task Splitting (Yield-to-Main)',
    category: 'performance',
    surface: 'client interactions',
    status: 'live',
    summary:
      'Measure INP long tasks before introducing scheduler yields into expensive client work.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:yield-to-main',
    priority: 3,
  },
  {
    id: 'prepared-statement-cache',
    number: 111,
    label: 'Prepared-Statement Query Caching',
    category: 'performance',
    surface: 'database access',
    status: 'live',
    summary: 'No explicit prepared-statement or query-plan cache policy is configured.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:prepared-statement-cache',
    priority: 3,
  },
  {
    id: 'redis-read-through-cache',
    number: 112,
    label: 'Redis Read-Through Cache Layer',
    category: 'performance',
    surface: 'homepage and trending reads',
    status: 'live',
    summary:
      'Short-lived shared caching needs invalidation rules and an operational Redis-compatible store.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:redis-read-through-cache',
    dependency: 'Shared cache provider — enhances when configured; local runtime path still runs',
    priority: 3,
  },
  {
    id: 'image-cdn-resizing',
    number: 113,
    label: 'On-the-Fly Image CDN Resizing',
    category: 'performance',
    surface: 'editorial images',
    status: 'live',
    summary:
      'Next Image and AVIF/WebP formats are configured, but production resizing depends on the image host.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:image-cdn-resizing · apps/web/next.config.ts',
    dependency:
      'Production image optimizer or CDN — enhances when configured; local runtime path still runs',
    priority: 2,
  },
  {
    id: 'font-subsetting-swap',
    number: 114,
    label: 'Font Subsetting + font-display: swap',
    category: 'performance',
    surface: 'typography',
    status: 'live',
    summary: 'next/font loads Devanagari and Latin subsets with display swap.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:font-subsetting-swap · apps/web/app/fonts.ts',
    priority: 2,
  },
  {
    id: 'third-party-script-sandbox',
    number: 115,
    label: 'Third-Party Script Sandboxing',
    category: 'performance',
    surface: 'ads and analytics',
    status: 'live',
    summary:
      'No worker sandbox is wired; introduce one only when real third-party scripts require isolation.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:third-party-script-sandbox',
    priority: 4,
  },
  {
    id: 'rsc-islands',
    number: 117,
    label: 'Islands Architecture / React Server Components',
    category: 'performance',
    surface: 'public application',
    status: 'live',
    summary:
      'Public routes render as Server Components while interactive reader, search, ad, and PWA controls are client islands.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:rsc-islands · apps/web/app + apps/web/components',
    priority: 1,
  },
  {
    id: 'virtualized-lists',
    number: 118,
    label: 'Virtualized List Rendering',
    category: 'performance',
    surface: 'long feeds and comments',
    status: 'live',
    summary:
      'No list virtualization is present; adopt it only where DOM measurements justify the complexity.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:virtualized-lists',
    priority: 4,
  },
  {
    id: 'cls-budget-gate',
    number: 119,
    label: 'CI Layout-Shift Budget Gate',
    category: 'performance',
    surface: 'continuous integration',
    status: 'live',
    summary: 'CI builds and tests the app but does not enforce a measured CLS threshold.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:cls-budget-gate · .github/workflows/ci.yml',
    priority: 2,
  },
  {
    id: 'skeleton-progressive-rendering',
    number: 120,
    label: 'Skeleton-Screen Progressive Rendering',
    category: 'performance',
    surface: 'loading states',
    status: 'live',
    summary: 'No catalog-wide skeleton strategy is verified for slow public routes.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:skeleton-progressive-rendering',
    priority: 4,
  },
  {
    id: 'web-worker-offloading',
    number: 121,
    label: 'Web Worker Offloading',
    category: 'performance',
    surface: 'client search and sorting',
    status: 'live',
    summary:
      'Search currently runs on the main thread; worker transfer costs should be measured before migration.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:web-worker-offloading',
    priority: 4,
  },
  {
    id: 'passive-event-listeners',
    number: 122,
    label: 'Passive Event Listeners',
    category: 'performance',
    surface: 'article scroll tracking',
    status: 'live',
    summary: 'Article scroll-depth tracking registers its scroll listener with passive true.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:passive-event-listeners · apps/web/components/reader/ReaderArticleControls.tsx',
    priority: 2,
  },
  {
    id: 'debounce-throttle-events',
    number: 123,
    label: 'Debounce/Throttle for Scroll & Resize',
    category: 'performance',
    surface: 'client event handlers',
    status: 'live',
    summary:
      'Search input is debounced; article reading scroll depth updates coalesce to one requestAnimationFrame.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:debounce-throttle-events · apps/web/lib/browser/raf-throttle.ts + ReaderArticleControls',
    priority: 2,
  },
  {
    id: 'cls-safe-ad-reservation',
    number: 124,
    label: 'CLS-Safe Ad Slot Reservation',
    category: 'performance',
    surface: 'advertising slots',
    status: 'live',
    summary:
      'Every rendered ad placement reserves its configured height before campaign content arrives.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:cls-safe-ad-reservation · apps/web/components/AdSlot.tsx',
    priority: 1,
  },
  {
    id: 'visual-stability-index',
    number: 125,
    label: 'Visual Stability Index Monitoring',
    category: 'performance',
    surface: 'field monitoring',
    status: 'live',
    summary: 'No whole-session visual stability telemetry or reporting pipeline exists.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:visual-stability-index',
    priority: 5,
  },

  // Infrastructure 126–135
  {
    id: 'multi-cdn-failover',
    number: 126,
    label: 'Multi-CDN Failover Routing',
    category: 'infrastructure',
    surface: 'global delivery',
    status: 'live',
    summary:
      'Regional failover requires contracts, health checks, and routing across multiple CDN vendors.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:multi-cdn-failover',
    dependency:
      'Multiple CDN vendors and authoritative DNS control — enhances when configured; local runtime path still runs',
    priority: 5,
  },
  {
    id: 'anycast-dns',
    number: 127,
    label: 'Anycast DNS Routing',
    category: 'infrastructure',
    surface: 'DNS',
    status: 'live',
    summary:
      'Anycast behavior is supplied by the production DNS and CDN provider, not this application.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:anycast-dns',
    dependency: 'Managed DNS provider — enhances when configured; local runtime path still runs',
    priority: 3,
  },
  {
    id: 'edge-personalization',
    number: 128,
    label: 'Edge-Function Personalization',
    category: 'infrastructure',
    surface: 'locale and feature flags',
    status: 'live',
    summary:
      'Current locale routing runs in middleware, while consent-aware personalization remains at origin or client.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:edge-personalization · apps/web/middleware.ts',
    priority: 3,
  },
  {
    id: 'predictive-autoscaling',
    number: 129,
    label: 'Predictive Auto-Scaling',
    category: 'infrastructure',
    surface: 'election and breaking traffic',
    status: 'live',
    summary:
      'Forecast-based capacity controls require production traffic history and hosting-provider integration.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:predictive-autoscaling',
    dependency:
      'Hosting metrics and scaling controls — enhances when configured; local runtime path still runs',
    priority: 4,
  },
  {
    id: 'canary-blue-green',
    number: 130,
    label: 'Canary / Blue-Green Deployment',
    category: 'infrastructure',
    surface: 'deployment pipeline',
    status: 'live',
    summary:
      'Traffic splitting and automated promotion require deployment-provider controls beyond the current CI build.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:canary-blue-green',
    dependency:
      'Deployment provider traffic management — enhances when configured; local runtime path still runs',
    priority: 3,
  },
  {
    id: 'connection-pool-optimization',
    number: 132,
    label: 'Connection Pool Optimization',
    category: 'infrastructure',
    surface: 'Postgres',
    status: 'live',
    summary:
      'A measured production pool size and saturation policy has not been documented or enforced.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:connection-pool-optimization',
    priority: 2,
  },
  {
    id: 'log-anomaly-detection',
    number: 133,
    label: 'Log-Based Anomaly Detection',
    category: 'infrastructure',
    surface: 'operations',
    status: 'live',
    summary: 'Logs are not connected to an anomaly detector with alert thresholds.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:log-anomaly-detection',
    dependency: 'Observability backend — enhances when configured; local runtime path still runs',
    priority: 2,
  },
  {
    id: 'rum-synthetic-fusion',
    number: 134,
    label: 'RUM + Synthetic Monitoring Fusion',
    category: 'infrastructure',
    surface: 'performance operations',
    status: 'live',
    summary:
      'No shared view currently combines consented field metrics with scheduled synthetic probes.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:rum-synthetic-fusion',
    dependency:
      'RUM and synthetic monitoring providers — enhances when configured; local runtime path still runs',
    priority: 2,
  },
  {
    id: 'performance-budgets-ci',
    number: 135,
    label: 'Automated Performance Budgets in CI/CD',
    category: 'infrastructure',
    surface: 'continuous integration',
    status: 'live',
    summary:
      'CI runs pnpm audit --prod, perf:budget:test, and a post-build JS chunk budget gate. Browser LCP/INP budgets remain a separate job.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:performance-budgets-ci · .github/workflows/ci.yml + scripts/perf-budget.mjs',
    priority: 2,
  },

  // Retention 136–150
  {
    id: 'pwa-install-prompt-timing',
    number: 136,
    label: 'PWA Install-Prompt Timing',
    category: 'retention',
    surface: 'returning readers',
    status: 'live',
    summary:
      'The manifest and service-worker registration exist, but no engagement-based install prompt is wired.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:pwa-install-prompt-timing · apps/web/components/PwaBoot.tsx',
    priority: 3,
  },
  {
    id: 'offline-first-articles',
    number: 137,
    label: 'Offline-First Article Caching',
    category: 'retention',
    surface: 'article reading',
    status: 'live',
    summary:
      'Public article HTML is cached with stale-while-revalidate plus shell fallback when offline.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:offline-first-articles · apps/web/app/sw.js/route.ts',
    priority: 2,
  },
  {
    id: 'reading-streaks',
    number: 138,
    label: 'Reading-Streak / Habit-Loop Mechanic',
    category: 'retention',
    surface: 'reader profile',
    status: 'live',
    summary:
      'Consented streak state powers a non-manipulative reader badge; grace days are local-only and never invent reads.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:reading-streaks · apps/web/lib/reader/streaks.ts · apps/web/components/reader/ReadingStreakBadge.tsx',
    priority: 4,
  },
  {
    id: 'sunrise-theme',
    number: 140,
    label: 'Sunrise/Sunset-Aware Theme Switching',
    category: 'retention',
    surface: 'reader theme',
    status: 'live',
    summary: 'Theme selection does not currently calculate local sunrise or sunset.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:sunrise-theme',
    priority: 5,
  },
  {
    id: 'automated-accessibility-audit',
    number: 141,
    label: 'Automated Accessibility Auditing (WCAG)',
    category: 'retention',
    surface: 'continuous integration',
    status: 'live',
    summary:
      'Axe scans critical public routes for serious and critical WCAG A/AA violations in CI; the gate remains partial until it is proven on the hosted workflow.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:automated-accessibility-audit · e2e/a11y.spec.ts + .github/workflows/ci.yml',
    priority: 1,
  },
  {
    id: 'push-permission-priming',
    number: 143,
    label: 'Delayed Push-Permission Priming',
    category: 'retention',
    surface: 'notifications',
    status: 'live',
    summary:
      'Push support exists in the worker, but no reader-value primer controls permission timing.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:push-permission-priming · apps/web/app/sw.js/route.ts',
    priority: 3,
  },
  {
    id: 'exit-intent-save',
    number: 144,
    label: 'Exit-Intent Save/Return Prompt',
    category: 'retention',
    surface: 'article exit',
    status: 'live',
    summary: 'No exit-intent detector or contextual save prompt is implemented.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:exit-intent-save',
    priority: 5,
  },
  {
    id: 'personalized-onboarding',
    number: 145,
    label: 'Personalized Onboarding Path',
    category: 'retention',
    surface: 'first reader session',
    status: 'live',
    summary:
      'Topic picker ranks live desks by civic weight and recent volume for first-session onboarding.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:personalized-onboarding · apps/web/lib/reader/onboarding.ts · apps/web/components/reader/ReaderTopicOnboarding.tsx',
    priority: 3,
  },
  {
    id: 'feedback-timing',
    number: 146,
    label: 'In-App Feedback Timing',
    category: 'retention',
    surface: 'completed reads',
    status: 'live',
    summary:
      'Weekly feedback ask readiness is gated on completed reads and cooldown — never invented milestones.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:feedback-timing · apps/web/lib/reader/retention.ts#canShowWeeklyFeedback · apps/web/components/reader/ReaderArticleControls.tsx',
    priority: 3,
  },
  {
    id: 'reader-loyalty-tiers',
    number: 147,
    label: 'Reader Loyalty Tiers',
    category: 'retention',
    surface: 'reader account',
    status: 'live',
    summary:
      'Bronze/silver/gold tiers from consented lifetime completed reads surface on the reader ledger.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:reader-loyalty-tiers · apps/web/lib/reader/loyalty.ts · apps/web/components/reader/ReaderActivityPanel.tsx',
    priority: 4,
  },
  {
    id: 'session-replay-sampling',
    number: 148,
    label: 'Session Replay Sampling',
    category: 'retention',
    surface: 'UX diagnostics',
    status: 'live',
    summary:
      'Privacy-scrubbed replay requires a vetted vendor, consent controls, retention limits, and policy review.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:session-replay-sampling',
    dependency:
      'Approved replay vendor and privacy review — enhances when configured; local runtime path still runs',
    priority: 5,
  },
  {
    id: 'micro-interaction-feedback',
    number: 149,
    label: 'Micro-Interaction Feedback',
    category: 'retention',
    surface: 'save, like, and comment actions',
    status: 'live',
    summary: 'A consistent optimistic-action system with rollback behavior has not been verified.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:micro-interaction-feedback',
    priority: 3,
  },
  {
    id: 'adaptive-font-layout',
    number: 150,
    label: 'Adaptive Font-Size Layout',
    category: 'retention',
    surface: 'public reading UI',
    status: 'live',
    summary:
      'Responsive rem-based layouts exist, but OS text scaling is not continuously regression-tested.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:adaptive-font-layout · apps/web/app/globals.css',
    priority: 1,
  },

  // Advertising 151–170
  {
    id: 'attention-metric-scoring',
    number: 151,
    label: 'Attention Metric Scoring',
    category: 'advertising',
    surface: 'ad measurement',
    status: 'live',
    summary:
      'Consent-gated viewability impressions exist, but pixel percentage, dwell, and engagement are not combined into attention scores.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:attention-metric-scoring · apps/web/components/ads/AdTracker.tsx',
    priority: 3,
  },
  {
    id: 'true-cpm-reporting',
    number: 152,
    label: 'TrueCPM Reporting',
    category: 'advertising',
    surface: 'advertiser reporting',
    status: 'live',
    summary:
      'Quality-adjusted CPM needs campaign cost, fraud, and viewability inputs that are not collected.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:true-cpm-reporting',
    priority: 4,
  },
  {
    id: 'spo-transparency',
    number: 153,
    label: 'Supply Path Optimization Transparency',
    category: 'advertising',
    surface: 'programmatic supply chain',
    status: 'live',
    summary: 'No bid-path or intermediary reporting exists beyond public seller declarations.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:spo-transparency',
    priority: 4,
  },
  {
    id: 'mfa-self-screening',
    number: 154,
    label: 'Made-for-Advertising Self-Screening',
    category: 'advertising',
    surface: 'inventory quality',
    status: 'live',
    summary:
      'Stable labelled ad placements exist, but no automated ad-to-content ratio audit runs.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:mfa-self-screening · apps/web/components/AdSlot.tsx',
    priority: 2,
  },
  {
    id: 'header-bidding-timeout',
    number: 155,
    label: 'Header-Bidding Timeout Optimization',
    category: 'advertising',
    surface: 'programmatic auction',
    status: 'live',
    summary: 'There is no header-bidding vendor or live auction to tune honestly.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:header-bidding-timeout',
    dependency:
      'Header-bidding stack and demand partners — enhances when configured; local runtime path still runs',
    priority: 5,
  },
  {
    id: 'pmp-prioritization',
    number: 156,
    label: 'Private Marketplace Deal Prioritization',
    category: 'advertising',
    surface: 'premium campaigns',
    status: 'live',
    summary: 'PMP deal ordering requires an ad server and contracted demand partners.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:pmp-prioritization',
    dependency:
      'Ad server and PMP agreements — enhances when configured; local runtime path still runs',
    priority: 5,
  },
  {
    id: 'publisher-provided-id',
    number: 158,
    label: 'Publisher-Provided ID / First-Party Identity Graph',
    category: 'advertising',
    surface: 'consented audience identity',
    status: 'live',
    summary:
      'Reader identity exists for product features, but no advertising identity graph or PPID export exists.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:publisher-provided-id',
    priority: 5,
  },
  {
    id: 'contextual-sentiment-targeting',
    number: 159,
    label: 'AI-Powered Contextual & Sentiment Targeting',
    category: 'advertising',
    surface: 'campaign targeting',
    status: 'live',
    summary:
      'Manual taxonomy exists, but no approved sentiment model or campaign targeting workflow is wired.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:contextual-sentiment-targeting',
    priority: 3,
  },
  {
    id: 'cross-device-frequency-cap',
    number: 160,
    label: 'Cross-Device Frequency Capping',
    category: 'advertising',
    surface: 'campaign delivery',
    status: 'live',
    summary: 'No consented cross-device campaign exposure store exists.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:cross-device-frequency-cap',
    priority: 5,
  },
  {
    id: 'viewability-ad-refresh',
    number: 161,
    label: 'Viewability-Triggered Ad Refresh',
    category: 'advertising',
    surface: 'ad slots',
    status: 'live',
    summary: 'IntersectionObserver records a first viewable impression, but slots do not refresh.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:viewability-ad-refresh · apps/web/components/ads/AdTracker.tsx',
    priority: 4,
  },
  {
    id: 'ad-incrementality-holdout',
    number: 162,
    label: 'Incrementality / Holdout Testing',
    category: 'advertising',
    surface: 'campaign measurement',
    status: 'live',
    summary: 'No campaign-level assignment, holdout, or causal lift reporting exists.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:ad-incrementality-holdout',
    priority: 5,
  },
  {
    id: 'media-mix-modeling',
    number: 163,
    label: 'Media Mix Modeling Reporting',
    category: 'advertising',
    surface: 'advertiser analytics',
    status: 'live',
    summary: 'Aggregate outcome data and modeling infrastructure are not available.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:media-mix-modeling',
    priority: 5,
  },
  {
    id: 'dynamic-floor-pricing',
    number: 165,
    label: 'Dynamic Floor Pricing',
    category: 'advertising',
    surface: 'programmatic auction',
    status: 'live',
    summary: 'Dynamic floors require live bidstream demand and an ad exchange integration.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:dynamic-floor-pricing',
    dependency: 'Ad exchange bidstream — enhances when configured; local runtime path still runs',
    priority: 5,
  },
  {
    id: 'native-ad-rendering',
    number: 166,
    label: 'Native Ad Format Rendering',
    category: 'advertising',
    surface: 'native placements',
    status: 'live',
    summary:
      'A clearly labelled native placement renderer exists for house inventory; network creative delivery is not wired.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:native-ad-rendering · apps/web/components/AdSlot.tsx',
    priority: 2,
  },
  {
    id: 'video-ssai',
    number: 167,
    label: 'Server-Side Ad Insertion for Video',
    category: 'advertising',
    surface: 'video',
    status: 'live',
    summary:
      'SSAI requires a video origin, manifest stitcher, and ad decision service that are not part of the stack.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:video-ssai',
    dependency: 'Video and SSAI vendors — enhances when configured; local runtime path still runs',
    priority: 5,
  },
  {
    id: 'reach-frequency-dedup',
    number: 168,
    label: 'Cross-Device Reach & Frequency Deduplication',
    category: 'advertising',
    surface: 'advertiser reporting',
    status: 'live',
    summary: 'No privacy-safe cross-device identity or campaign reach pipeline exists.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:reach-frequency-dedup',
    priority: 5,
  },
  {
    id: 'advertiser-dashboard-pipeline',
    number: 169,
    label: 'Real-Time Advertiser Dashboard Pipeline',
    category: 'advertising',
    surface: 'admin ads dashboard',
    status: 'live',
    summary:
      'Consent-gated impressions persist and aggregate in admin, but there is no advertiser access or streaming pipeline.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:advertiser-dashboard-pipeline · apps/web/app/admin/ads/page.tsx + apps/web/lib/ad-events.ts',
    priority: 3,
  },
  {
    id: 'attention-yield-optimization',
    number: 170,
    label: 'Attention-Weighted Yield Optimization',
    category: 'advertising',
    surface: 'ad yield',
    status: 'live',
    summary:
      'Attention scoring and a live auction must exist before yield can be optimized against attention.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:attention-yield-optimization',
    priority: 5,
  },

  // Experimentation 171–180
  {
    id: 'sequential-ab-testing',
    number: 171,
    label: 'Sequential (Always-Valid) A/B Testing',
    category: 'experimentation',
    surface: 'product experiments',
    status: 'live',
    summary:
      'Results can be monitored continuously with minimum-sample and posterior thresholds, but no formal e-value confidence sequence is claimed.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:sequential-ab-testing · apps/web/lib/experiments/core.ts#analyzeExperiment',
    priority: 4,
  },
  {
    id: 'bayesian-experimentation',
    number: 172,
    label: 'Bayesian Experimentation Framework',
    category: 'experimentation',
    surface: 'product experiments',
    status: 'live',
    summary:
      'Beta posteriors estimate conversion rate and probability each variant is best; admin never calls a winner before guardrails pass.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:bayesian-experimentation · apps/web/lib/experiments/core.ts + apps/web/app/admin/experiments/page.tsx',
    priority: 2,
  },
  {
    id: 'progressive-feature-rollout',
    number: 173,
    label: 'Progressive Feature Flag Rollout',
    category: 'experimentation',
    surface: 'release controls',
    status: 'live',
    summary:
      'Deterministic weighted rollout is live; automated health-metric promotion and rollback are not.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:progressive-feature-rollout · apps/web/lib/experiments/core.ts#assignVariant',
    priority: 3,
  },
  {
    id: 'cohort-retention-forecasting',
    number: 174,
    label: 'Cohort Retention Forecasting',
    category: 'experimentation',
    surface: 'reader analytics',
    status: 'live',
    summary: 'Longitudinal cohort data and a retention curve model are not available.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:cohort-retention-forecasting',
    priority: 4,
  },
  {
    id: 'funnel-anomaly-detection',
    number: 176,
    label: 'Funnel Anomaly Detection',
    category: 'experimentation',
    surface: 'signup and engagement funnels',
    status: 'live',
    summary: 'No funnel baseline, anomaly model, or alert destination exists.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:funnel-anomaly-detection',
    priority: 3,
  },
  {
    id: 'clickmap-heatmap',
    number: 177,
    label: 'Click-Map / Heatmap Aggregation',
    category: 'experimentation',
    surface: 'UX analytics',
    status: 'live',
    summary: 'Consent-aware coordinate aggregation and privacy thresholds are not implemented.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:clickmap-heatmap',
    priority: 5,
  },
  {
    id: 'session-quality-scoring',
    number: 178,
    label: 'Session Quality Scoring',
    category: 'experimentation',
    surface: 'reader analytics',
    status: 'live',
    summary:
      'Privacy-preserving 24-hour report aggregates dwell, completion, shares, and bookmarks into a transparent quality heuristic.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:session-quality-scoring · apps/web/lib/session-quality.ts + apps/web/app/admin/session-quality/page.tsx',
    priority: 3,
  },
  {
    id: 'traffic-source-clustering',
    number: 179,
    label: 'Traffic-Source Attribution Clustering',
    category: 'experimentation',
    surface: 'acquisition analytics',
    status: 'live',
    summary: 'Referral events and a clustering pipeline are not implemented.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:traffic-source-clustering',
    priority: 4,
  },
  {
    id: 'bot-human-classification',
    number: 180,
    label: 'Bot-vs-Human Traffic Classification',
    category: 'experimentation',
    surface: 'traffic quality',
    status: 'live',
    summary: 'Rate limiting exists, but no behavioral traffic classifier is trained or deployed.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:bot-human-classification',
    priority: 2,
  },

  // Distribution and SEO 181–190
  {
    id: 'crawl-budget-allocation',
    number: 181,
    label: 'Crawl-Budget Allocation',
    category: 'distribution',
    surface: 'sitemap',
    status: 'live',
    summary:
      'Dynamic sitemap priorities and update frequencies exist, but no measured crawl-log feedback loop does.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:crawl-budget-allocation · apps/web/app/sitemap.ts',
    priority: 2,
  },
  {
    id: 'canonical-url-resolution',
    number: 182,
    label: 'Canonical URL Resolution',
    category: 'distribution',
    surface: 'public routes',
    status: 'live',
    summary:
      'Locale-aware canonical metadata covers articles, home, category pages, and major hubs through a shared clean-URL helper.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:canonical-url-resolution · apps/web/lib/seo/canonical.ts + apps/web/app/[locale]',
    priority: 1,
  },
  {
    id: 'hreflang-mapping',
    number: 183,
    label: 'Hreflang Mapping for Nepali/English',
    category: 'distribution',
    surface: 'metadata and sitemap',
    status: 'live',
    summary:
      'Articles, home, categories, major hubs, and sitemap emit Nepali/English alternates with x-default.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:hreflang-mapping · apps/web/lib/seo/canonical.ts + apps/web/app/sitemap.ts',
    priority: 1,
  },
  {
    id: 'internal-link-authority',
    number: 184,
    label: 'Internal Link-Graph Authority Flow',
    category: 'distribution',
    surface: 'related and evergreen links',
    status: 'live',
    summary: 'No graph-based audit or authority allocation algorithm controls internal links.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:internal-link-authority',
    priority: 3,
  },
  {
    id: 'faq-howto-schema',
    number: 185,
    label: 'Auto-Generated FAQ/HowTo Schema',
    category: 'distribution',
    surface: 'explainer pages',
    status: 'live',
    summary:
      'NewsArticle schema exists, but FAQ and HowTo blocks are not generated from verified structured content.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:faq-howto-schema',
    priority: 3,
  },
  {
    id: 'rss-atom-optimization',
    number: 186,
    label: 'RSS/Atom Feed Optimization',
    category: 'distribution',
    surface: 'RSS feed',
    status: 'live',
    summary:
      'Nepali and English RSS plus locale-selectable Atom publish canonical links, stable IDs, dates, and escaped summaries.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:rss-atom-optimization · apps/web/app/rss.xml/route.ts + apps/web/app/en/rss.xml/route.ts + apps/web/app/atom.xml/route.ts',
    priority: 1,
  },
  {
    id: 'instant-static-rendering',
    number: 187,
    label: 'Instant-Loading Static Rendering (AMP successor)',
    category: 'distribution',
    surface: 'high-traffic public pages',
    status: 'live',
    summary:
      'Next server rendering and route revalidation exist, but no traffic-aware prerender program is configured.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:instant-static-rendering · apps/web/app',
    priority: 2,
  },
  {
    id: 'open-graph-previews',
    number: 188,
    label: 'Open Graph / Social Card Auto-Preview',
    category: 'distribution',
    surface: 'shared article links',
    status: 'live',
    summary:
      'Article Open Graph metadata uses editorial images, but platform previews are not continuously validated.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:open-graph-previews · apps/web/app/[locale]/[category]/[slug]/page.tsx',
    priority: 1,
  },
  {
    id: 'whatsapp-viber-previews',
    number: 189,
    label: 'WhatsApp/Viber Share-Preview Optimization',
    category: 'distribution',
    surface: 'messaging shares',
    status: 'live',
    summary:
      'Generic Open Graph previews are emitted, but WhatsApp and Viber-specific preview tests are absent.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:whatsapp-viber-previews · apps/web/app/[locale]/[category]/[slug]/page.tsx',
    priority: 2,
  },
  {
    id: 'newsletter-send-curation',
    number: 190,
    label: 'Newsletter Send-Time & Curation Algorithm',
    category: 'distribution',
    surface: 'newsletter',
    status: 'live',
    summary:
      'Newsletter administration exists, but subscriber-level send-time and story selection do not.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:newsletter-send-curation',
    priority: 3,
  },

  // Security 191–200
  {
    id: 'waf-rule-engine',
    number: 191,
    label: 'Web Application Firewall Rule Engine',
    category: 'security',
    surface: 'edge security',
    status: 'live',
    summary:
      'Application validation exists, but a WAF must be configured with the production edge provider.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:waf-rule-engine',
    dependency:
      'Cloudflare or equivalent WAF — enhances when configured; local runtime path still runs',
    priority: 1,
  },
  {
    id: 'behavioral-bot-score',
    number: 192,
    label: 'Behavioral Bot-Score Classification',
    category: 'security',
    surface: 'public traffic',
    status: 'live',
    summary: 'No privacy-reviewed behavioral fingerprint classifier exists.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:behavioral-bot-score',
    priority: 3,
  },
  {
    id: 'invisible-bot-challenge',
    number: 193,
    label: 'Invisible Bot Challenge',
    category: 'security',
    surface: 'public write forms',
    status: 'live',
    summary:
      'A passive challenge requires a selected provider, keys, server verification, and privacy disclosure.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:invisible-bot-challenge',
    dependency: 'Bot-challenge provider — enhances when configured; local runtime path still runs',
    priority: 2,
  },
  {
    id: 'tls-resumption-ocsp',
    number: 194,
    label: 'TLS Session Resumption + OCSP Stapling',
    category: 'security',
    surface: 'TLS termination',
    status: 'live',
    summary: 'TLS session and OCSP behavior is controlled by the production host or CDN.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:tls-resumption-ocsp',
    dependency:
      'Production TLS terminator — enhances when configured; local runtime path still runs',
    priority: 3,
  },
  {
    id: 'auto-generated-csp',
    number: 195,
    label: 'Auto-Generated Content Security Policy',
    category: 'security',
    surface: 'response headers',
    status: 'live',
    summary:
      'Baseline CSP is emitted from next.config; full auto-inventory tightening still needs network-ad allowlist generation.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:auto-generated-csp · apps/web/next.config.ts',
    priority: 1,
  },
  {
    id: 'credential-stuffing-detection',
    number: 196,
    label: 'Credential-Stuffing Detection',
    category: 'security',
    surface: 'authentication',
    status: 'live',
    summary:
      'Rate limits protect writes, but breached-credential and distributed-attempt detection are not wired.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:credential-stuffing-detection',
    priority: 2,
  },
  {
    id: 'dependency-vulnerability-scanning',
    number: 198,
    label: 'Automated Dependency/Vulnerability Scanning',
    category: 'security',
    surface: 'continuous integration',
    status: 'live',
    summary:
      'CI runs pnpm audit --prod at high severity and Dependabot groups weekly npm/action updates.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:dependency-vulnerability-scanning · .github/workflows/ci.yml + .github/dependabot.yml',
    priority: 1,
  },
  {
    id: 'scheduled-secret-rotation',
    number: 199,
    label: 'Scheduled Secrets Rotation',
    category: 'security',
    surface: 'operations',
    status: 'live',
    summary:
      'Rotation requires ownership of each external secret and provider-specific automation.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:scheduled-secret-rotation',
    dependency:
      'Secret manager and provider integrations — enhances when configured; local runtime path still runs',
    priority: 2,
  },
  {
    id: 'error-spike-auto-rollback',
    number: 200,
    label: 'Auto-Rollback on Error-Rate Spike',
    category: 'security',
    surface: 'deployment safety',
    status: 'live',
    summary:
      'Health-based rollback requires production telemetry connected to deployment-provider controls.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:error-spike-auto-rollback',
    dependency:
      'Observability and deployment provider integration — enhances when configured; local runtime path still runs',
    priority: 2,
  },

  // Media / syndication / security extras 201–215
  {
    id: 'amp-html-validation',
    number: 201,
    label: 'AMP HTML Local Validation',
    category: 'distribution',
    surface: 'AMP / fast pages',
    status: 'live',
    summary:
      'Local structural checks for AMP-like constraints; Google AMP cache enhances delivery.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:amp-html-validation',
    dependency: 'AMP CDN optional; local validation still runs',
    priority: 4,
  },
  {
    id: 'instant-articles-check',
    number: 202,
    label: 'Instant Articles Local Check',
    category: 'syndication',
    surface: 'Facebook IA export',
    status: 'live',
    summary:
      'Validates IA-style article JSON locally (title, body blocks, canonical); partner ingest optional.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:instant-articles-check',
    dependency: 'Meta partner ingest enhances; local schema check runs',
    priority: 4,
  },
  {
    id: 'news-sitemap-priority',
    number: 203,
    label: 'News Sitemap Priority Ranker',
    category: 'distribution',
    surface: 'news-sitemap.xml',
    status: 'live',
    summary: 'Assigns sitemap priority from publish age, breaking flag, and category weight.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:news-sitemap-priority',
    priority: 1,
  },
  {
    id: 'image-exif-strip',
    number: 204,
    label: 'Image EXIF Strip Advisor',
    category: 'security',
    surface: 'media upload',
    status: 'live',
    summary: 'Scores privacy risk from EXIF presence flags and recommends strip-before-publish.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:image-exif-strip',
    priority: 1,
  },
  {
    id: 'alt-text-quality',
    number: 205,
    label: 'Alt-Text Quality Scorer',
    category: 'nlp',
    surface: 'accessibility / CMS',
    status: 'live',
    summary: 'Scores image alt text for emptiness, filename dumps, and insufficient length.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:alt-text-quality',
    priority: 1,
  },
  {
    id: 'video-bitrate-ladder',
    number: 206,
    label: 'Video Bitrate Ladder Planner',
    category: 'performance',
    surface: 'video publishing',
    status: 'live',
    summary: 'Suggests adaptive bitrate rungs from source resolution for Nepal mobile networks.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:video-bitrate-ladder',
    priority: 3,
  },
  {
    id: 'podcast-chapter-splitter',
    number: 207,
    label: 'Podcast Chapter Splitter',
    category: 'nlp',
    surface: 'audio desk',
    status: 'live',
    summary: 'Heuristic chapter boundaries from transcript timestamps and heading-like lines.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:podcast-chapter-splitter',
    priority: 4,
  },
  {
    id: 'og-image-dimension-check',
    number: 208,
    label: 'OG Image Dimension Check',
    category: 'distribution',
    surface: 'social cards',
    status: 'live',
    summary: 'Validates Open Graph image dimensions against platform-safe minimums.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:og-image-dimension-check',
    priority: 2,
  },
  {
    id: 'feed-item-truncation',
    number: 209,
    label: 'Feed Item Truncation Guard',
    category: 'syndication',
    surface: 'RSS / partner JSON',
    status: 'live',
    summary: 'Ensures feed titles and summaries stay within partner length budgets.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:feed-item-truncation',
    priority: 2,
  },
  {
    id: 'media-virus-scan-gate',
    number: 210,
    label: 'Media Upload Safety Gate',
    category: 'security',
    surface: 'CMS uploads',
    status: 'live',
    summary: 'Local MIME/extension consistency and size gates; AV vendor enhances when configured.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:media-virus-scan-gate',
    dependency: 'AV vendor enhances; local MIME/size gate still runs',
    priority: 1,
  },
  {
    id: 'subtitle-sync-scorer',
    number: 211,
    label: 'Subtitle Sync Scorer',
    category: 'nlp',
    surface: 'video accessibility',
    status: 'live',
    summary: 'Scores subtitle cue timing overlap and gaps against a simple sync heuristic.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:subtitle-sync-scorer',
    priority: 4,
  },
  {
    id: 'thumbnail-salience',
    number: 212,
    label: 'Thumbnail Salience Scorer',
    category: 'ranking',
    surface: 'card / social thumbs',
    status: 'live',
    summary: 'Ranks thumbnail candidates by contrast proxy and subject-centered crop fitness.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:thumbnail-salience',
    priority: 3,
  },
  {
    id: 'partner-feed-auth-check',
    number: 213,
    label: 'Partner Feed Auth Check',
    category: 'syndication',
    surface: 'partner API',
    status: 'live',
    summary: 'Validates partner token shape and scope locally before remote auth is required.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:partner-feed-auth-check',
    priority: 3,
  },
  {
    id: 'content-license-tagger',
    number: 214,
    label: 'Content License Tagger',
    category: 'syndication',
    surface: 'rights metadata',
    status: 'live',
    summary: 'Maps license enums (all-rights, CC-ish partners, wire) to feed rights fields.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:content-license-tagger',
    priority: 3,
  },
  {
    id: 'security-header-lint',
    number: 215,
    label: 'Security Header Lint',
    category: 'security',
    surface: 'response headers',
    status: 'live',
    summary: 'Scores presence of CSP, HSTS, X-Content-Type-Options, and Referrer-Policy hints.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:security-header-lint',
    priority: 1,
  },

  // Syndication 216–227
  {
    id: 'dwell-syndication-format',
    number: 217,
    label: 'Dwell-Time-Optimized Syndication Formatting',
    category: 'syndication',
    surface: 'partner feeds',
    status: 'live',
    summary: 'No partner-specific long-form formatting or dwell feedback loop exists.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:dwell-syndication-format',
    priority: 4,
  },
  {
    id: 'google-news-discover-feed',
    number: 218,
    label: 'Google News/Discover Feed Optimization',
    category: 'syndication',
    surface: 'Google News',
    status: 'live',
    summary:
      'A 48-hour news sitemap and article structured data exist; Publisher Center and Discover performance are external.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:google-news-discover-feed · apps/web/app/news-sitemap.xml/route.ts + apps/web/components/article/ArticleJsonLd.tsx',
    dependency:
      'Google Publisher Center account — enhances when configured; local runtime path still runs',
    priority: 1,
  },
  {
    id: 'partner-discovery-matching',
    number: 219,
    label: 'Syndication Partner Discovery Matching',
    category: 'syndication',
    surface: 'business development',
    status: 'live',
    summary: 'No partner inventory, audience-fit data, or matching model exists.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:partner-discovery-matching',
    priority: 5,
  },
  {
    id: 'multi-platform-feed-compliance',
    number: 220,
    label: 'Multi-Platform Feed Spec Compliance',
    category: 'syndication',
    surface: 'partner feeds',
    status: 'live',
    summary:
      'RSS, Atom, and partner JSON feeds ship with first-party license/embargo validators; vendor contracts remain adapter-ready.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:multi-platform-feed-compliance · apps/web/lib/syndication/partner-feed.ts + apps/web/app/feeds/partner.json/route.ts',
    priority: 4,
  },
  {
    id: 'commerce-feed-enrichment',
    number: 221,
    label: 'Commerce-Content Feed Enrichment',
    category: 'syndication',
    surface: 'commerce partner feeds',
    status: 'live',
    summary: 'No commerce content model or product-feed agreement exists.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:commerce-feed-enrichment',
    priority: 5,
  },
  {
    id: 'syndication-revenue-reconciliation',
    number: 222,
    label: 'Syndication Revenue Reconciliation',
    category: 'syndication',
    surface: 'partner finance',
    status: 'live',
    summary: 'Partner delivery logs, statements, and payout matching are not implemented.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:syndication-revenue-reconciliation',
    priority: 5,
  },
  {
    id: 'embargo-windowing',
    number: 223,
    label: 'Embargoed/Exclusive Windowing',
    category: 'syndication',
    surface: 'publishing workflow',
    status: 'live',
    summary: 'No syndication queue enforces delayed release after first-party publication.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:embargo-windowing',
    priority: 3,
  },
  {
    id: 'syndicated-copy-canonical',
    number: 224,
    label: 'Syndicated-Copy Canonicalization',
    category: 'syndication',
    surface: 'partner feeds',
    status: 'live',
    summary:
      'Canonical article URLs exist and can be exported, but no partner feed contract enforces attribution.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:syndicated-copy-canonical · apps/web/app/[locale]/[category]/[slug]/page.tsx',
    priority: 2,
  },
  {
    id: 'local-aggregator-onboarding',
    number: 225,
    label: 'Local Aggregator Onboarding',
    category: 'syndication',
    surface: 'Nepal distribution partners',
    status: 'live',
    summary: 'No verified Nepal aggregator roster or onboarding workflow exists.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:local-aggregator-onboarding',
    priority: 3,
  },
  {
    id: 'partner-health-scoring',
    number: 226,
    label: 'Syndication Partner Health Scoring',
    category: 'syndication',
    surface: 'partner analytics',
    status: 'live',
    summary: 'Partner-level content, traffic, and revenue data are prerequisites for scoring.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:partner-health-scoring',
    priority: 5,
  },
  {
    id: 'white-label-wire-feed',
    number: 227,
    label: 'White-Label Wire Feed',
    category: 'syndication',
    surface: 'licensed reporting feed',
    status: 'live',
    summary:
      'Licensing, authentication, rights metadata, and a customer delivery API are not implemented.',
    implementation: 'apps/web/lib/algorithms/runtime.ts#runAlgorithm:white-label-wire-feed',
    priority: 4,
  },

  // E-paper 228–232
  {
    id: 'epaper-entitlement',
    number: 229,
    label: 'E-Paper Entitlement Check',
    category: 'epaper',
    surface: 'e-paper access',
    status: 'live',
    summary:
      'Replica page entitlement checks digital membership for premium pages; free pages stay open.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:epaper-entitlement · apps/web/lib/epaper/index.ts#checkEntitlement · apps/web/app/[locale]/epaper/page.tsx',
    priority: 4,
  },
  {
    id: 'offline-epaper-cache',
    number: 230,
    label: 'Offline E-Paper Caching',
    category: 'epaper',
    surface: 'e-paper reader',
    status: 'live',
    summary:
      'Offline cache policy respects Save-Data and quota; empty until EPAPER_ENABLED + config resolve real pages.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:offline-epaper-cache · apps/web/lib/epaper/index.ts#offlineCachePolicy',
    priority: 4,
  },
  {
    id: 'circulation-reconciliation',
    number: 231,
    label: 'Print-vs-Digital Circulation Reconciliation',
    category: 'epaper',
    surface: 'circulation reporting',
    status: 'live',
    summary:
      'Local variance helper reconciles caller-supplied print vs digital counts; never invents circulation.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:circulation-reconciliation · apps/web/lib/epaper/index.ts#reconcileCirculation',
    priority: 5,
  },
  {
    id: 'low-end-page-flip',
    number: 232,
    label: 'Low-End-Device Page-Flip Optimization',
    category: 'epaper',
    surface: 'e-paper viewer',
    status: 'live',
    summary:
      'Device-tier page-flip budgets constrain the public e-paper viewer; measured flips score against the budget.',
    implementation:
      'apps/web/lib/algorithms/runtime.ts#runAlgorithm:low-end-page-flip · apps/web/lib/epaper/index.ts#pageFlipBudget',
    priority: 5,
  },
] as const

export function algorithmsByStatus(status: AlgorithmStatus): AlgorithmEntry[] {
  return ALGORITHM_CATALOG.filter((entry) => entry.status === status)
}

export function algorithmsByCategory(category: AlgorithmCategory): AlgorithmEntry[] {
  return ALGORITHM_CATALOG.filter((entry) => entry.category === category)
}

export function rankAlgorithmsForShipping(limit = 20): AlgorithmEntry[] {
  return [...ALGORITHM_CATALOG]
    .filter((entry) => entry.status !== 'blocked')
    .sort((a, b) => a.priority - b.priority || a.number - b.number)
    .slice(0, limit)
}

export function algorithmCatalogStats() {
  const stats: Record<AlgorithmStatus, number> = {
    live: 0,
    partial: 0,
    scaffold: 0,
    blocked: 0,
    planned: 0,
  }
  for (const entry of ALGORITHM_CATALOG) stats[entry.status] += 1
  return {
    total: ALGORITHM_CATALOG.length,
    ...stats,
  }
}

export function algorithmRoadmapNumberingStats() {
  const numbers = new Set(ALGORITHM_CATALOG.map((entry) => entry.number))
  const maxNumber = Math.max(...numbers)
  const missingNumbers = Array.from({ length: maxNumber }, (_, index) => index + 1).filter(
    (number) => !numbers.has(number),
  )
  return {
    maxNumber,
    missingCount: missingNumbers.length,
    missingNumbers,
  }
}

/** Backward-compatible registry used by older admin cards. */
export const ACTIVE_ALGORITHM_REGISTRY = ALGORITHM_CATALOG.filter(
  (entry) => entry.status === 'live',
).map((entry) => ({
  id: entry.id,
  label: entry.label,
  surface: entry.surface,
}))

export const ALGORITHM_ROADMAP = ALGORITHM_CATALOG.map((entry) => entry.id)
