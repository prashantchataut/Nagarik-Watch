import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { ALGORITHM_CATALOG, algorithmCatalogStats, rankAlgorithmsForShipping } from './catalog'

describe('algorithm catalog', () => {
  it('has unique ids and positive priorities', () => {
    const ids = new Set<string>()
    for (const entry of ALGORITHM_CATALOG) {
      expect(ids.has(entry.id)).toBe(false)
      ids.add(entry.id)
      expect(entry.priority).toBeGreaterThan(0)
      expect(entry.summary.length).toBeGreaterThan(12)
    }
  })

  it('marks BM25 search stack as live', () => {
    const liveIds = new Set(
      ALGORITHM_CATALOG.filter((entry) => entry.status === 'live').map((entry) => entry.id),
    )
    expect(liveIds.has('bm25-search')).toBe(true)
    expect(liveIds.has('inverted-index')).toBe(true)
    expect(liveIds.has('fuzzy-matching')).toBe(true)
    expect(liveIds.has('autocomplete-trie')).toBe(true)
    expect(liveIds.has('query-expansion')).toBe(true)
    expect(liveIds.has('circuit-breaker')).toBe(true)
    expect(liveIds.has('ads-txt-sellers-json')).toBe(true)
    expect(liveIds.has('swr-service-worker')).toBe(true)
    expect(liveIds.has('offline-first-articles')).toBe(true)
    expect(liveIds.has('performance-budgets-ci')).toBe(true)
    expect(liveIds.has('reputation-score')).toBe(true)
    expect(liveIds.has('dependency-vulnerability-scanning')).toBe(true)
    expect(liveIds.has('notification-priority-scoring')).toBe(true)
    expect(liveIds.has('fatigue-prevention')).toBe(true)
    expect(liveIds.has('font-subsetting-swap')).toBe(true)
    expect(liveIds.has('hreflang-mapping')).toBe(true)
    expect(liveIds.has('query-expansion')).toBe(true)
  })

  it('never ranks blocked items ahead of shippable work', () => {
    const shipping = rankAlgorithmsForShipping(30)
    expect(shipping.every((entry) => entry.status !== 'blocked')).toBe(true)
    const stats = algorithmCatalogStats()
    expect(stats.total).toBe(ALGORITHM_CATALOG.length)
    expect(stats.live).toBeGreaterThan(10)
  })

  it('renders every catalog entry on the admin algorithms page', () => {
    const pageSource = readFileSync(
      new URL('../../app/admin/algorithms/page.tsx', import.meta.url),
      'utf8',
    )
    expect(pageSource).toContain('ALGORITHM_CATALOG.map')
    expect(pageSource).toContain('data-algorithm-id={algorithm.id}')
    expect(pageSource).toContain('data-algorithm-count={ALGORITHM_CATALOG.length}')
  })
})
