import type { CapabilitySpec } from '../types'
import { num, str, clamp01, okLocal } from '../handlers/utils'
import {
  canonicalOk,
  hreflangCoverage,
  ogPreviewScore,
  rssItemHealth,
  faqSchemaScore,
  internalLinkAuthority,
  crawlBudgetScore,
} from '../product/seo-dist'
import { surfaceFor } from './surface'

export const LOCAL_DISTRIBUTION_CAPABILITIES: CapabilitySpec[] = [
  {
    id: 'crawl-budget-allocation',
    surface: surfaceFor('crawl-budget-allocation'),
    mode: 'local',
    run: (input) => {
      const freshUrls = num(input, 'freshUrls', 40)
      const staleUrls = num(input, 'staleUrls', 200)
      const crawlRateLimit = num(input, 'crawlRateLimit', 60)
      const score = crawlBudgetScore(freshUrls, staleUrls, crawlRateLimit)
      return okLocal(
        `crawlBudgetCoverage=${score.toFixed(3)} fresh=${freshUrls} stale=${staleUrls}`,
        { score },
      )
    },
  },
  {
    id: 'canonical-url-resolution',
    surface: surfaceFor('canonical-url-resolution'),
    mode: 'local',
    run: (input) => {
      const requestUrl = str(input, 'requestUrl', '')
      const canonicalUrl = str(input, 'canonicalUrl', '')
      const ok = canonicalOk(requestUrl, canonicalUrl)
      return okLocal(`canonicalMatch=${ok} url=${requestUrl}`, { score: ok ? 1 : 0 })
    },
  },
  {
    id: 'hreflang-mapping',
    surface: surfaceFor('hreflang-mapping'),
    mode: 'local',
    run: (input) => {
      const locales = (input.supportedLocales as string[]) ?? ['ne', 'en']
      const provided = (input.providedLocales as string[]) ?? locales
      const score = hreflangCoverage(locales, provided)
      return okLocal(`hreflangCoverage=${score.toFixed(3)} locales=${locales.join(',')}`, { score })
    },
  },
  {
    id: 'internal-link-authority',
    surface: surfaceFor('internal-link-authority'),
    mode: 'local',
    run: (input) => {
      const inboundLinks = num(input, 'inboundLinks', 8)
      const outboundLinks = num(input, 'outboundLinks', 3)
      const score = internalLinkAuthority(inboundLinks, outboundLinks)
      return okLocal(
        `internalLinkAuthority=${score.toFixed(3)} inbound=${inboundLinks} outbound=${outboundLinks}`,
        {
          score,
        },
      )
    },
  },
  {
    id: 'faq-howto-schema',
    surface: surfaceFor('faq-howto-schema'),
    mode: 'local',
    run: (input) => {
      const faqPairs = num(input, 'faqPairs', 4)
      const score = faqSchemaScore(faqPairs)
      return okLocal(`faqSchemaDensity=${score.toFixed(3)} qaPairs=${faqPairs}`, { score })
    },
  },
  {
    id: 'rss-atom-optimization',
    surface: surfaceFor('rss-atom-optimization'),
    mode: 'local',
    run: (input) => {
      const item =
        (input.rssItem as { title?: string; link?: string; pubDate?: string; guid?: string }) ?? {}
      const score = rssItemHealth(item)
      return okLocal(`rssItemHealth=${score.toFixed(3)}`, { score })
    },
  },
  {
    id: 'instant-static-rendering',
    surface: surfaceFor('instant-static-rendering'),
    mode: 'local',
    run: (input) => {
      const staticHitRate = num(input, 'staticHitRate', 0.85)
      const revalidateSeconds = num(input, 'revalidateSeconds', 60)
      const score = clamp01(staticHitRate * 0.8 + clamp01(1 - revalidateSeconds / 600) * 0.2)
      return okLocal(`staticRenderScore=${score.toFixed(3)} hitRate=${staticHitRate}`, { score })
    },
  },
  {
    id: 'open-graph-previews',
    surface: surfaceFor('open-graph-previews'),
    mode: 'local',
    run: (input) => {
      const score = ogPreviewScore({
        title: str(input, 'ogTitle', ''),
        image: str(input, 'ogImage', ''),
        description: str(input, 'ogDescription', ''),
      })
      return okLocal(`ogPreviewCompleteness=${score.toFixed(3)}`, { score })
    },
  },
  {
    id: 'whatsapp-viber-previews',
    surface: surfaceFor('whatsapp-viber-previews'),
    mode: 'local',
    run: (input) => {
      const imageWidth = num(input, 'ogImageWidth', 1200)
      const imageHeight = num(input, 'ogImageHeight', 630)
      const aspectOk = Math.abs(imageWidth / Math.max(1, imageHeight) - 16 / 9) < 0.35
      return okLocal(`messagingPreviewAspectOk=${aspectOk} ${imageWidth}x${imageHeight}`, {
        score: aspectOk ? 1 : 0,
      })
    },
  },
  {
    id: 'newsletter-send-curation',
    surface: surfaceFor('newsletter-send-curation'),
    mode: 'local',
    run: (input) => {
      const candidateStories = num(input, 'candidateStories', 12)
      const slots = num(input, 'newsletterSlots', 6)
      const diversityScore = num(input, 'categoryDiversity', 0.7)
      const score = clamp01(
        Math.min(1, candidateStories / Math.max(1, slots * 1.5)) * 0.5 + diversityScore * 0.5,
      )
      return okLocal(
        `newsletterCurationScore=${score.toFixed(3)} candidates=${candidateStories} slots=${slots}`,
        {
          score,
        },
      )
    },
  },
]
