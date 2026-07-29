import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  ALGORITHM_CATALOG,
  algorithmCatalogStats,
  algorithmRoadmapNumberingStats,
  rankAlgorithmsForShipping,
} from './catalog'
import { runAlgorithm } from './runtime'
import { listRegisteredIds } from './capabilities/registry'

describe('algorithm catalog', () => {
  it('has exactly 232 unique ids covering numbers 1..232', () => {
    expect(ALGORITHM_CATALOG).toHaveLength(232)
    const ids = new Set<string>()
    const numbers = new Set<number>()
    for (const entry of ALGORITHM_CATALOG) {
      expect(ids.has(entry.id)).toBe(false)
      ids.add(entry.id)
      expect(numbers.has(entry.number)).toBe(false)
      numbers.add(entry.number)
      expect(entry.priority).toBeGreaterThan(0)
      expect(entry.summary.length).toBeGreaterThan(12)
      expect(entry.status).toBe('live')
      expect(entry.implementation).toBeTruthy()
    }
    for (let n = 1; n <= 232; n++) {
      expect(numbers.has(n)).toBe(true)
    }
  })

  it('marks BM25 search stack and core capabilities as live', () => {
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
    expect(liveIds.has('reading-streak-scorer')).toBe(true)
    expect(liveIds.has('news-sitemap-priority')).toBe(true)
  })

  it('reports full catalog stats as live', () => {
    const shipping = rankAlgorithmsForShipping(30)
    expect(shipping.every((entry) => entry.status === 'live')).toBe(true)
    const stats = algorithmCatalogStats()
    expect(stats.total).toBe(232)
    expect(stats.live).toBe(232)
    expect(stats.partial + stats.scaffold + stats.blocked + stats.planned).toBe(0)
  })

  it('has no missing roadmap numbers', () => {
    const numbering = algorithmRoadmapNumberingStats()
    expect(numbering.maxNumber).toBe(232)
    expect(numbering.missingCount).toBe(0)
    expect(numbering.missingNumbers).toEqual([])
  })

  it('runs every catalog id successfully via runAlgorithm', () => {
    for (const entry of ALGORITHM_CATALOG) {
      const result = runAlgorithm(entry.id)
      expect(result.ok).toBe(true)
      expect(result.id).toBe(entry.id)
      expect(result.number).toBe(entry.number)
    }
  })

  it('has a dedicated capability handler for every catalog id — no generic fallback', () => {
    const registered = new Set(listRegisteredIds())
    for (const entry of ALGORITHM_CATALOG) {
      expect(registered.has(entry.id)).toBe(true)
    }
    expect(registered.size).toBe(232)
  })

  it('renders every catalog entry on the admin algorithms page', () => {
    const pageSource = readFileSync(
      new URL('../../app/admin/(desk)/algorithms/page.tsx', import.meta.url),
      'utf8',
    )
    expect(pageSource).toContain('top.map')
    expect(pageSource).toContain('Product-functional capabilities')
    expect(pageSource).toContain('runAllAlgorithms')
    expect(pageSource).toContain('data-algorithm-id={algorithm.id}')
    expect(pageSource).toContain('data-algorithm-count={ALGORITHM_CATALOG.length}')
    expect(pageSource).toContain('Functional pass')
  })
})
