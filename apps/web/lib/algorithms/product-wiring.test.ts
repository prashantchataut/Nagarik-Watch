import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ALGORITHM_CATALOG } from './catalog'
import { listRegisteredIds } from './capabilities/registry'
import { genericHeuristic } from './handlers/heuristics'
import { runAlgorithm } from './runtime'

function read(relativeFromAlgorithms: string): string {
  return readFileSync(new URL(relativeFromAlgorithms, import.meta.url), 'utf8')
}

describe('product wiring + honesty gates', () => {
  it('never registers a hash-only genericHeuristic path', () => {
    const registrySource = read('./capabilities/registry.ts')
    expect(registrySource).not.toMatch(/import\s*\{[^}]*genericHeuristic/)
    expect(registrySource).not.toMatch(/genericHeuristic\s*\(/)
    expect(listRegisteredIds()).toHaveLength(232)

    // Dead helper may still exist for history, but must not be the dispatch path.
    const probe = genericHeuristic('definitely-not-a-catalog-id', { salt: 'x' })
    expect(typeof probe.score).toBe('number')
    expect(ALGORITHM_CATALOG.some((entry) => entry.id === 'definitely-not-a-catalog-id')).toBe(false)
  })

  it('keeps high-priority surfaces import-wired to product modules', () => {
    const surfaces: Array<[string, string]> = [
      ['../../components/reader/ReaderActivityPanel.tsx', 'lib/reader/streaks'],
      ['../../components/reader/ReaderActivityPanel.tsx', 'lib/reader/loyalty'],
      ['../../components/reader/RecommendedForYou.tsx', 'lib/reader/digest'],
      ['../../components/reader/SavedStoriesClient.tsx', 'lib/reader/saves'],
      ['../../components/reader/ReaderTopicOnboarding.tsx', 'lib/reader/onboarding'],
      ['../../app/api/journalist/ai/route.ts', 'lib/nlp/'],
      ['../../app/api/journalist/ai/route.ts', 'lib/journalist/desk-scoring'],
      ['../../app/[locale]/[category]/[slug]/page.tsx', 'lib/paywall/decision'],
      ['../../app/feeds/partner.json/route.ts', 'lib/syndication/partner-feed'],
      ['../../app/api/cron/digest-compose/route.ts', 'lib/reader/digest'],
      ['../../app/api/cron/interactions-rebuild/route.ts', 'lib/engagement/interaction-matrix'],
      ['../../app/api/cron/ops-probe/route.ts', 'lib/ops/health-snapshot'],
      ['../../app/admin/(desk)/algorithms/page.tsx', 'runAllAlgorithms'],
    ]

    for (const [file, needle] of surfaces) {
      expect(read(file), `${file} should wire ${needle}`).toContain(needle)
    }
  })

  it('reports ok:false for unknown ids instead of silent success', () => {
    const result = runAlgorithm('this-id-does-not-exist-in-catalog')
    expect(result.ok).toBe(false)
    expect(result.reason).toBeTruthy()
  })
})
