import type { CapabilitySpec } from '../types'
import { num, clamp01, okLocal, okAdapter } from '../handlers/utils'
import { surfaceFor } from './surface'
import { shouldShowPaywall } from '../../paywall/decision'

export const LOCAL_REVENUE_CAPABILITIES: CapabilitySpec[] = [
  {
    id: 'dynamic-paywall',
    surface: surfaceFor('dynamic-paywall'),
    mode: 'adapter-ready',
    run: (input) => {
      const freeArticlesRemaining = num(input, 'freeArticlesRemaining', 2)
      const freeArticleLimit = num(input, 'freeArticleLimit', 5)
      const engagement = num(input, 'engagementScore', 0.5)
      const isMember = Boolean(input.isMember)
      const articlePremium = Boolean(input.articlePremium)
      const willingnessToPay =
        clamp01(1 - freeArticlesRemaining / Math.max(1, freeArticleLimit)) * 0.6 + engagement * 0.4
      const showPaywall = shouldShowPaywall({
        isMember,
        freeRemaining: freeArticlesRemaining,
        articlePremium,
      })
      return okAdapter(
        'adapter-ready',
        `paywallPropensity=${willingnessToPay.toFixed(3)} showPaywall=${showPaywall} (local gate; vendor A/B ready)`,
        { score: willingnessToPay, outputs: { showPaywall } },
      )
    },
  },
  {
    id: 'ad-yield-optimization',
    surface: surfaceFor('ad-yield-optimization'),
    mode: 'local',
    run: (input) => {
      const impressions = num(input, 'impressions', 5000)
      const clicks = num(input, 'clicks', 120)
      const ecpm = num(input, 'ecpm', 4.2)
      const fillRate = num(input, 'fillRate', 0.6)
      const revenue = (impressions * fillRate * ecpm) / 1000
      const ctr = impressions > 0 ? clicks / impressions : 0
      return okLocal(
        `estimatedRevenue=${revenue.toFixed(2)} ctr=${ctr.toFixed(4)} fill=${fillRate.toFixed(2)}`,
        {
          score: revenue,
        },
      )
    },
  },
]
