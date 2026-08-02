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
      ['../../app/[locale]/page.tsx', 'resolveMostReadStories'],
      ['../../app/[locale]/page.tsx', 'resolveTrendingStories'],
      ['../../app/[locale]/page.tsx', 'getStories'],
      ['../../app/api/reading/route.ts', 'hasServerEngagementConsent'],
      ['../../app/api/ranking-events/route.ts', 'hasServerEngagementConsent'],
      ['../../components/public/RankedStoryList.tsx', 'InstrumentedStory'],
      ['../../components/reader/ReaderArticleControls.tsx', 'response.status === 204'],
      ['../../components/ranking/RankingImpression.tsx', 'CONSENT_EVENT'],
      ['../../app/admin/(desk)/launch/page.tsx', 'getLaunchPhases'],
      ['../../app/admin/(desk)/launch/page.tsx', 'getPayloadCutoverChecklist'],
      ['../../components/home/PollOfDay.tsx', 'hasLivePublicApi'],
    ]

    for (const [file, needle] of surfaces) {
      expect(read(file), `${file} should wire ${needle}`).toContain(needle)
    }
  })

  it('allows algorithmic lens overlap: same story can be latest and most-read', () => {
    const page = read('../../app/[locale]/page.tsx')
    expect(page).toContain('excludeIds: new Set()')
    expect(page).toContain('resolveTrendingStories')
    expect(page).toContain('aboveFoldExclude')
    expect(page).not.toContain('Rails must not recycle the front-page set')
    expect(page).not.toContain('buildStoryEngagementIndex')
  })

  it('keeps catalog surfaces honest about homepage wiring', () => {
    const weighted = ALGORITHM_CATALOG.find((entry) => entry.id === 'weighted-scoring-ranker')
    const bandit = ALGORITHM_CATALOG.find((entry) => entry.id === 'multi-armed-bandit')
    const virality = ALGORITHM_CATALOG.find((entry) => entry.id === 'virality-prediction')
    const diversity = ALGORITHM_CATALOG.find((entry) => entry.id === 'homepage-slot-diversity')
    const continueReading = ALGORITHM_CATALOG.find((entry) => entry.id === 'continue-reading-ranker')
    expect(weighted?.surface).not.toMatch(/^homepage\b/)
    expect(weighted?.summary).toMatch(/qualityTrustScore/)
    expect(bandit?.surface).toMatch(/not homepage/)
    expect(virality?.surface).toMatch(/not homepage/)
    expect(diversity?.surface).toMatch(/not wired on homepage/)
    expect(continueReading?.surface).toMatch(/not homepage/)
  })

  it('reports ok:false for unknown ids instead of silent success', () => {
    const result = runAlgorithm('this-id-does-not-exist-in-catalog')
    expect(result.ok).toBe(false)
    expect(result.reason).toBeTruthy()
  })
})
