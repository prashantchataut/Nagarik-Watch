import { describe, expect, it } from 'vitest'
import { ALGORITHM_CATALOG } from './catalog'
import { listRegisteredIds } from './capabilities/registry'
import {
  algorithmRuntimeHonesty,
  algorithmRuntimeModeCounts,
  runAlgorithm,
  runAllAlgorithms,
} from './runtime'

describe('algorithm runtime', () => {
  it('registers a dedicated capability handler for every catalog id (no missing)', () => {
    const registered = new Set(listRegisteredIds())
    const missing = ALGORITHM_CATALOG.filter((entry) => !registered.has(entry.id))
    expect(missing.map((entry) => entry.id)).toEqual([])
    expect(registered.size).toBe(232)
  })

  it('runAllAlgorithms returns 232 results, one per catalog id, all ok with fixtures', () => {
    const results = runAllAlgorithms()
    expect(results).toHaveLength(232)
    expect(new Set(results.map((r) => r.id)).size).toBe(232)
    expect(results.every((r) => r.ok === true)).toBe(true)
    for (const result of results) {
      if (!result.ok) expect(result.reason).toBeTruthy()
    }
    const counts = algorithmRuntimeModeCounts(results)
    expect(
      counts.production + counts.local + counts['adapter-ready'] + counts['adapter-disabled'],
    ).toBe(232)
    expect(counts.production).toBeGreaterThan(10)
    expect(counts.local).toBeGreaterThan(100)
  })

  it('spot-checks BM25 / ranking / toxicity call real code paths', () => {
    const bm25 = runAlgorithm('bm25-search', { query: 'बाढी' })
    expect(bm25.ok).toBe(true)
    expect(bm25.mode).toBe('production')
    expect(bm25.detail).toContain('bm25')

    const ranking = runAlgorithm('weighted-scoring-ranker', {
      viewsLast10Min: 30,
      impressions: 200,
      clicks: 15,
    })
    expect(ranking.ok).toBe(true)
    expect(ranking.mode).toBe('production')
    expect(typeof ranking.score).toBe('number')

    const toxicity = runAlgorithm('toxicity-detection', { text: 'badword spam' })
    expect(toxicity.ok).toBe(true)
    expect(toxicity.mode).toBe('production')

    const comment = runAlgorithm('comment-ranking', { upvotes: 20, downvotes: 1 })
    expect(comment.ok).toBe(true)
    expect(comment.mode).toBe('production')

    const dup = runAlgorithm('duplicate-detection')
    expect(dup.ok).toBe(true)
    expect(dup.mode).toBe('production')
  })

  it('spot-checks newly registered local capabilities compute real, non-hashed scores', () => {
    const ner = runAlgorithm('named-entity-recognition', {
      text: 'काठमाडौं सरकारले वर्षाका कारण बाढी चेतावनी दियो',
    })
    expect(ner.ok).toBe(true)
    expect(ner.mode).toBe('local')
    expect(ner.outputs?.entities).toBeDefined()

    const embedding = runAlgorithm('embedding-similarity', {
      text: 'काठमाडौंमा बाढीको जोखिम बढेको छ',
      other: 'काठमाडौंमा बाढीको सम्भावना बढेको छ',
    })
    expect(embedding.ok).toBe(true)
    expect(embedding.mode).toBe('adapter-disabled')
    expect(embedding.score).toBeGreaterThan(0.2)

    const unrelated = runAlgorithm('embedding-similarity', {
      text: 'काठमाडौंमा बाढी',
      other: 'क्रिकेट खेल परिणाम',
    })
    expect(unrelated.score).toBeLessThan(embedding.score!)

    const matrixFactorization = runAlgorithm('matrix-factorization')
    expect(matrixFactorization.ok).toBe(true)
    expect(matrixFactorization.mode).toBe('local')
  })

  it('adapter-disabled ids still complete with a local score and honest detail', () => {
    const result = runAlgorithm('waf-rule-engine')
    expect(result.ok).toBe(true)
    expect(result.mode).toBe('adapter-disabled')
    expect(result.detail.length).toBeGreaterThan(5)
    expect(result.detail).toContain('no managed WAF vendor configured')
  })

  it('adapter-ready ids still complete locally', () => {
    const result = runAlgorithm('dynamic-paywall')
    expect(result.ok).toBe(true)
    expect(result.mode).toBe('adapter-ready')
  })

  it('covers every catalog entry exactly once', () => {
    const results = runAllAlgorithms({ salt: 'coverage' })
    const catalogIds = ALGORITHM_CATALOG.map((e) => e.id).sort()
    const resultIds = results.map((r) => r.id).sort()
    expect(resultIds).toEqual(catalogIds)
  })

  it('honestly fails (ok:false with a reason) for unregistered ids instead of faking success', () => {
    const result = runAlgorithm('not-a-real-capability-id')
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('no dedicated capability handler')
  })

  it('marks a no-input run as fixture-fed rather than letting the score pass for real', () => {
    expect(runAlgorithm('weighted-scoring-ranker').input).toBe('fixture')
  })

  it('records product wiring so a passing handler is not read as a shipped feature', () => {
    // Both pass. Only one of them is something a reader can reach.
    expect(runAlgorithm('bm25-search').productWired).toBe(true)
    expect(runAlgorithm('topic-modeling-lda').productWired).toBe(false)
  })

  it('runs the notification policy handlers through the real delivery gates', () => {
    // These three used to restate the policy in three slightly different ways.
    // They now call the same functions `deliverPushEvent` and the delivery cron
    // call, so a change to the policy shows up here instead of drifting.
    const held = runAlgorithm('breaking-alert-cooldown', { minutesSinceLast: 5 })
    expect(held.mode).toBe('production')
    expect(held.outputs?.willSend).toBe(false)
    expect(held.outputs?.reason).toBe('suppressed-cooldown')
    expect(runAlgorithm('breaking-alert-cooldown', { minutesSinceLast: 60 }).outputs?.willSend).toBe(
      true,
    )

    // Quiet hours never silence breaking — that exemption is the whole reason
    // the batch narrows instead of skipping.
    expect(runAlgorithm('quiet-hours-scheduler', { hour: 23 }).outputs?.allowSend).toBe(false)
    expect(
      runAlgorithm('quiet-hours-scheduler', { hour: 23, breaking: true }).outputs?.allowSend,
    ).toBe(true)
    expect(runAlgorithm('quiet-hours-scheduler', { hour: 10 }).outputs?.allowSend).toBe(true)

    // Past the per-day quota the next push is blocked, not merely scored low.
    const spent = runAlgorithm('fatigue-prevention', { sentToday: 9, maxPerDay: 8 })
    expect(spent.score).toBe(0)
    expect(spent.outputs?.willSend).toBe(false)
    expect(runAlgorithm('notification-batching', { pending: 40, windowMinutes: 30 }).outputs?.capped)
      .toBe(true)
  })

  it('reports the admin panel for what it is: a fixture run of the whole catalog', () => {
    const honesty = algorithmRuntimeHonesty(runAllAlgorithms())
    expect(honesty.total).toBe(ALGORITHM_CATALOG.length)
    expect(honesty.fixtureOnly).toBe(honesty.total)
    expect(honesty.productWired).toBeLessThan(honesty.total)
  })
})
