import type { CapabilitySpec } from '../types'
import { num, str, okLocal, fail } from '../handlers/utils'
import {
  replicaRenderScore,
  entitlementOk,
  offlineCacheHealth,
  circulationVariance,
  pageFlipScore,
} from '../product/epaper'
import { surfaceFor } from './surface'

export const LOCAL_EPAPER_CAPABILITIES: CapabilitySpec[] = [
  {
    id: 'epaper-replica',
    surface: surfaceFor('epaper-replica'),
    mode: 'local',
    run: (input) => {
      const totalPages = num(input, 'totalPages', 24)
      const renderedPages = num(input, 'renderedPages', totalPages)
      if (totalPages <= 0) {
        return fail('local', 'totalPages must be greater than zero to score replica coverage')
      }
      const score = replicaRenderScore(totalPages, renderedPages)
      return okLocal(
        `replicaRenderCoverage=${score.toFixed(3)} rendered=${renderedPages}/${totalPages}`,
        { score },
      )
    },
  },
  {
    id: 'epaper-entitlement',
    surface: surfaceFor('epaper-entitlement'),
    mode: 'local',
    run: (input) => {
      const tier = str(input, 'tier', 'digital')
      const requiredTier = str(input, 'requiredTier', 'digital')
      const ok = entitlementOk(tier, requiredTier)
      return okLocal(`epaperEntitlementOk=${ok} tier=${tier} required=${requiredTier}`, {
        score: ok ? 1 : 0,
      })
    },
  },
  {
    id: 'offline-epaper-cache',
    surface: surfaceFor('offline-epaper-cache'),
    mode: 'local',
    run: (input) => {
      const totalPages = num(input, 'totalPages', 24)
      const cachedPages = num(input, 'cachedPages', 0)
      const quotaMb = num(input, 'quotaMb', 200)
      const usedMb = num(input, 'usedMb', 0)
      const score = offlineCacheHealth(cachedPages, totalPages, quotaMb, usedMb)
      return okLocal(
        `offlineEpaperCacheHealth=${score.toFixed(3)} cached=${cachedPages}/${totalPages}`,
        { score },
      )
    },
  },
  {
    id: 'circulation-reconciliation',
    surface: surfaceFor('circulation-reconciliation'),
    mode: 'local',
    run: (input) => {
      const printCopies = num(input, 'printCopies', 0)
      const digitalEntitlements = num(input, 'digitalEntitlements', 0)
      if (printCopies === 0 && digitalEntitlements === 0) {
        return fail('local', 'no print or digital circulation data supplied to reconcile')
      }
      const variance = circulationVariance(printCopies, digitalEntitlements)
      return okLocal(
        `circulationVariance=${variance.toFixed(3)} print=${printCopies} digital=${digitalEntitlements}`,
        {
          score: variance,
        },
      )
    },
  },
  {
    id: 'low-end-page-flip',
    surface: surfaceFor('low-end-page-flip'),
    mode: 'local',
    run: (input) => {
      const deviceTier = str(input, 'deviceTier', 'mid') as 'low' | 'mid' | 'high'
      const measuredFlipMs = num(input, 'measuredFlipMs', 90)
      const score = pageFlipScore(deviceTier, measuredFlipMs)
      return okLocal(
        `pageFlipScore=${score.toFixed(3)} device=${deviceTier} measured=${measuredFlipMs}ms`,
        { score },
      )
    },
  },
]
