import 'server-only'
import { isAdPlacementKey, type AdPlacementKey } from '@/lib/ads'
import { listExperimentAnalyses } from '@/lib/experiments/store'
import {
  getHouseAd,
  houseAdExperimentId,
  listHouseAds,
  upsertHouseAd,
  type HouseAd,
} from '@/lib/house-ads'

export type HouseAdPromoteResult = {
  promoted: Array<{ placementKey: string; winner: string }>
  skipped: Array<{ placementKey: string; reason: string }>
}

/**
 * When a house-ad A/B experiment reaches a Bayesian winner, collapse the
 * placement to that creative and pause further A/B (abEnabled=false).
 */
export async function promoteHouseAdWinners(): Promise<HouseAdPromoteResult> {
  const analyses = await listExperimentAnalyses()
  const byId = new Map(analyses.map((row) => [row.definition.id, row]))
  const ads = await listHouseAds()
  const promoted: HouseAdPromoteResult['promoted'] = []
  const skipped: HouseAdPromoteResult['skipped'] = []

  for (const ad of ads) {
    if (!ad.abEnabled || !ad.challenger) {
      skipped.push({ placementKey: ad.placementKey, reason: 'ab-disabled' })
      continue
    }
    if (!isAdPlacementKey(ad.placementKey)) {
      skipped.push({ placementKey: ad.placementKey, reason: 'invalid-placement' })
      continue
    }
    const experimentId = houseAdExperimentId(ad.placementKey)
    const row = byId.get(experimentId)
    if (!row || row.analysis.decision !== 'winner' || !row.analysis.winner) {
      skipped.push({ placementKey: ad.placementKey, reason: 'no-winner-yet' })
      continue
    }

    const winner = row.analysis.winner
    const next: HouseAd =
      winner === 'challenger'
        ? {
            ...ad,
            title: ad.challenger.title,
            body: ad.challenger.body,
            cta: ad.challenger.cta,
            href: ad.challenger.href,
            imageUrl: ad.challenger.imageUrl,
            abEnabled: false,
            challenger: undefined,
          }
        : {
            ...ad,
            abEnabled: false,
            challenger: undefined,
          }

    await upsertHouseAd({
      placementKey: ad.placementKey as AdPlacementKey,
      active: next.active,
      title: next.title,
      body: next.body,
      cta: next.cta,
      href: next.href,
      imageUrl: next.imageUrl,
      abEnabled: false,
      challenger: null,
    })
    void getHouseAd(ad.placementKey as AdPlacementKey)
    promoted.push({ placementKey: ad.placementKey, winner })
  }

  return { promoted, skipped }
}
