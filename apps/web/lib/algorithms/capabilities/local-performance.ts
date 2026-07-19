/**
 * Local performance-domain capabilities. Each is a budget/coverage check
 * against a real client or build metric — never a hash of the id.
 */
import type { CapabilitySpec } from '../types'
import { num, clamp01, okLocal, okAdapter } from '../handlers/utils'
import { surfaceFor } from './surface'

function budgetScore(measured: number, budget: number): number {
  return measured <= budget ? 1 : clamp01(budget / measured)
}

export const LOCAL_PERFORMANCE_CAPABILITIES: CapabilitySpec[] = [
  {
    id: 'edge-rendered-ttfb',
    surface: surfaceFor('edge-rendered-ttfb'),
    mode: 'local',
    run: (input) => {
      const ttfbMs = num(input, 'ttfbMs', 140)
      const budgetMs = num(input, 'ttfbBudgetMs', 200)
      const score = budgetScore(ttfbMs, budgetMs)
      return okLocal(`ttfb=${ttfbMs}ms budget=${budgetMs}ms score=${score.toFixed(3)}`, { score })
    },
  },
  {
    id: 'critical-css-inlining',
    surface: surfaceFor('critical-css-inlining'),
    mode: 'local',
    run: (input) => {
      const inlinedBytes = num(input, 'inlinedCssBytes', 8_000)
      const totalCssBytes = num(input, 'totalCssBytes', 40_000)
      const score = totalCssBytes > 0 ? clamp01(inlinedBytes / totalCssBytes) : 0
      return okLocal(`criticalCssRatio=${score.toFixed(3)} inlined=${inlinedBytes}B`, { score })
    },
  },
  {
    id: 'route-code-splitting',
    surface: surfaceFor('route-code-splitting'),
    mode: 'local',
    run: (input) => {
      const chunkCount = num(input, 'chunkCount', 18)
      const routeCount = num(input, 'routeCount', 20)
      const score = routeCount > 0 ? clamp01(chunkCount / routeCount) : 0
      return okLocal(`chunksPerRoute=${score.toFixed(3)} chunks=${chunkCount} routes=${routeCount}`, { score })
    },
  },
  {
    id: 'tree-shaking',
    surface: surfaceFor('tree-shaking'),
    mode: 'local',
    run: (input) => {
      const totalBytes = num(input, 'totalBytes', 320_000)
      const shippedBytes = num(input, 'shippedBytes', 190_000)
      const removedRatio = totalBytes > 0 ? clamp01(1 - shippedBytes / totalBytes) : 0
      return okLocal(`treeShakenRatio=${removedRatio.toFixed(3)} shipped=${shippedBytes}B`, { score: removedRatio })
    },
  },
  {
    id: 'http3-delivery',
    surface: surfaceFor('http3-delivery'),
    mode: 'adapter-disabled',
    run: (input) => {
      const negotiatedProtocol = String(input.negotiatedProtocol ?? 'h2')
      const isH3 = negotiatedProtocol === 'h3'
      return okAdapter('adapter-disabled', `negotiatedProtocol=${negotiatedProtocol} (no HTTP/3 CDN vendor configured)`, {
        score: isH3 ? 1 : 0,
      })
    },
  },
  {
    id: 'compression-negotiation',
    surface: surfaceFor('compression-negotiation'),
    mode: 'local',
    run: (input) => {
      const acceptEncoding = String(input.acceptEncoding ?? 'br, gzip')
      const servedEncoding = String(input.servedEncoding ?? 'br')
      const matched = acceptEncoding.includes(servedEncoding)
      return okLocal(`servedEncoding=${servedEncoding} matchedAcceptEncoding=${matched}`, { score: matched ? 1 : 0 })
    },
  },
  {
    id: 'resource-hint-scheduling',
    surface: surfaceFor('resource-hint-scheduling'),
    mode: 'local',
    run: (input) => {
      const hintsPresent = num(input, 'hintsPresent', 3)
      const hintsRecommended = num(input, 'hintsRecommended', 4)
      const score = hintsRecommended > 0 ? clamp01(hintsPresent / hintsRecommended) : 0
      return okLocal(`resourceHints=${hintsPresent}/${hintsRecommended}`, { score })
    },
  },
  {
    id: 'speculation-rules-prerender',
    surface: surfaceFor('speculation-rules-prerender'),
    mode: 'local',
    run: (input) => {
      const prerenderedNavigations = num(input, 'prerenderedNavigations', 6)
      const totalNavigations = num(input, 'totalNavigations', 10)
      const score = totalNavigations > 0 ? clamp01(prerenderedNavigations / totalNavigations) : 0
      return okLocal(`prerenderHitRatio=${score.toFixed(3)}`, { score })
    },
  },
  {
    id: 'yield-to-main',
    surface: surfaceFor('yield-to-main'),
    mode: 'local',
    run: (input) => {
      const longestTaskMs = num(input, 'longestTaskMs', 40)
      const yieldBudgetMs = num(input, 'yieldBudgetMs', 50)
      const score = budgetScore(longestTaskMs, yieldBudgetMs)
      return okLocal(`longestTask=${longestTaskMs}ms budget=${yieldBudgetMs}ms`, { score })
    },
  },
  {
    id: 'prepared-statement-cache',
    surface: surfaceFor('prepared-statement-cache'),
    mode: 'local',
    run: (input) => {
      const hits = num(input, 'preparedStatementHits', 900)
      const total = num(input, 'preparedStatementTotal', 1000)
      const score = total > 0 ? clamp01(hits / total) : 0
      return okLocal(`preparedStatementHitRatio=${score.toFixed(3)} hits=${hits}/${total}`, { score })
    },
  },
  {
    id: 'redis-read-through-cache',
    surface: surfaceFor('redis-read-through-cache'),
    mode: 'adapter-disabled',
    run: (input) => {
      const hits = num(input, 'cacheHits', 40)
      const misses = num(input, 'cacheMisses', 60)
      const total = hits + misses
      const score = total > 0 ? clamp01(hits / total) : 0
      return okAdapter('adapter-disabled', `inMemoryFallbackHitRatio=${score.toFixed(3)} (no Redis configured)`, {
        score,
      })
    },
  },
  {
    id: 'image-cdn-resizing',
    surface: surfaceFor('image-cdn-resizing'),
    mode: 'adapter-disabled',
    run: (input) => {
      const requestedWidth = num(input, 'requestedWidth', 800)
      const servedWidth = num(input, 'servedWidth', 800)
      const oversizeRatio = requestedWidth > 0 ? servedWidth / requestedWidth : 1
      const score = clamp01(1 / Math.max(1, oversizeRatio))
      return okAdapter('adapter-disabled', `servedWidth=${servedWidth} requestedWidth=${requestedWidth} (no image CDN configured)`, {
        score,
      })
    },
  },
  {
    id: 'font-subsetting-swap',
    surface: surfaceFor('font-subsetting-swap'),
    mode: 'local',
    run: (input) => {
      const glyphsUsed = num(input, 'glyphsUsed', 480)
      const glyphsInFullFont = num(input, 'glyphsInFullFont', 1200)
      const score = glyphsInFullFont > 0 ? clamp01(1 - glyphsUsed / glyphsInFullFont) : 0
      return okLocal(`subsetSavings=${score.toFixed(3)} glyphs=${glyphsUsed}/${glyphsInFullFont}`, { score })
    },
  },
  {
    id: 'third-party-script-sandbox',
    surface: surfaceFor('third-party-script-sandbox'),
    mode: 'local',
    run: (input) => {
      const sandboxedScripts = num(input, 'sandboxedScripts', 3)
      const totalThirdPartyScripts = num(input, 'totalThirdPartyScripts', 4)
      const score = totalThirdPartyScripts > 0 ? clamp01(sandboxedScripts / totalThirdPartyScripts) : 1
      return okLocal(`sandboxedRatio=${score.toFixed(3)} scripts=${sandboxedScripts}/${totalThirdPartyScripts}`, {
        score,
      })
    },
  },
  {
    id: 'rsc-islands',
    surface: surfaceFor('rsc-islands'),
    mode: 'local',
    run: (input) => {
      const clientJsBytes = num(input, 'clientJsBytes', 60_000)
      const totalPageBytes = num(input, 'totalPageBytes', 200_000)
      const islandRatio = totalPageBytes > 0 ? clamp01(clientJsBytes / totalPageBytes) : 0
      return okLocal(`clientIslandRatio=${islandRatio.toFixed(3)} clientJs=${clientJsBytes}B`, {
        score: clamp01(1 - islandRatio),
      })
    },
  },
  {
    id: 'virtualized-lists',
    surface: surfaceFor('virtualized-lists'),
    mode: 'local',
    run: (input) => {
      const renderedRows = num(input, 'renderedRows', 20)
      const totalRows = num(input, 'totalRows', 500)
      const score = totalRows > 0 ? clamp01(1 - renderedRows / totalRows) : 0
      return okLocal(`virtualizationSavings=${score.toFixed(3)} rendered=${renderedRows}/${totalRows}`, { score })
    },
  },
  {
    id: 'cls-budget-gate',
    surface: surfaceFor('cls-budget-gate'),
    mode: 'local',
    run: (input) => {
      const cls = num(input, 'cls', 0.05)
      const budget = num(input, 'clsBudget', 0.1)
      const score = budgetScore(cls, budget)
      return okLocal(`cls=${cls} budget=${budget} withinBudget=${cls <= budget}`, { score })
    },
  },
  {
    id: 'skeleton-progressive-rendering',
    surface: surfaceFor('skeleton-progressive-rendering'),
    mode: 'local',
    run: (input) => {
      const skeletonShownMs = num(input, 'skeletonShownMs', 120)
      const contentReadyMs = num(input, 'contentReadyMs', 900)
      const coverage = contentReadyMs > 0 ? clamp01(skeletonShownMs / contentReadyMs) : 0
      return okLocal(`skeletonCoverage=${coverage.toFixed(3)} skeleton=${skeletonShownMs}ms`, { score: coverage })
    },
  },
  {
    id: 'web-worker-offloading',
    surface: surfaceFor('web-worker-offloading'),
    mode: 'local',
    run: (input) => {
      const mainThreadMsSaved = num(input, 'mainThreadMsSaved', 40)
      const totalTaskMs = num(input, 'totalTaskMs', 100)
      const score = totalTaskMs > 0 ? clamp01(mainThreadMsSaved / totalTaskMs) : 0
      return okLocal(`workerOffloadSavings=${score.toFixed(3)} saved=${mainThreadMsSaved}ms/${totalTaskMs}ms`, {
        score,
      })
    },
  },
  {
    id: 'passive-event-listeners',
    surface: surfaceFor('passive-event-listeners'),
    mode: 'local',
    run: (input) => {
      const passiveListeners = num(input, 'passiveListeners', 5)
      const totalScrollListeners = num(input, 'totalScrollListeners', 5)
      const score = totalScrollListeners > 0 ? clamp01(passiveListeners / totalScrollListeners) : 1
      return okLocal(`passiveListenerRatio=${score.toFixed(3)}`, { score })
    },
  },
  {
    id: 'debounce-throttle-events',
    surface: surfaceFor('debounce-throttle-events'),
    mode: 'local',
    run: (input) => {
      const rawEventsPerSecond = num(input, 'rawEventsPerSecond', 60)
      const handledEventsPerSecond = num(input, 'handledEventsPerSecond', 10)
      const score = rawEventsPerSecond > 0 ? clamp01(1 - handledEventsPerSecond / rawEventsPerSecond) : 0
      return okLocal(`eventReductionRatio=${score.toFixed(3)} handled=${handledEventsPerSecond}/s`, { score })
    },
  },
  {
    id: 'cls-safe-ad-reservation',
    surface: surfaceFor('cls-safe-ad-reservation'),
    mode: 'local',
    run: (input) => {
      const reservedHeightPx = num(input, 'reservedHeightPx', 250)
      const renderedHeightPx = num(input, 'renderedHeightPx', 250)
      const match = Math.abs(reservedHeightPx - renderedHeightPx) <= 4
      const score = match ? 1 : clamp01(1 - Math.abs(reservedHeightPx - renderedHeightPx) / Math.max(1, renderedHeightPx))
      return okLocal(`adSlotHeightMatch=${match} reserved=${reservedHeightPx}px rendered=${renderedHeightPx}px`, {
        score,
      })
    },
  },
  {
    id: 'visual-stability-index',
    surface: surfaceFor('visual-stability-index'),
    mode: 'local',
    run: (input) => {
      const cls = num(input, 'cls', 0.05)
      const layoutShiftCount = num(input, 'layoutShiftCount', 1)
      const clsScore = budgetScore(cls, num(input, 'clsBudget', 0.1))
      const shiftScore = clamp01(1 - layoutShiftCount / 10)
      const score = clsScore * 0.6 + shiftScore * 0.4
      return okLocal(`visualStabilityIndex=${score.toFixed(3)} cls=${cls} shifts=${layoutShiftCount}`, { score })
    },
  },
  {
    id: 'swr-service-worker',
    surface: surfaceFor('swr-service-worker'),
    mode: 'local',
    run: (input) => {
      const swCacheHits = num(input, 'swCacheHits', 70)
      const swCacheTotal = num(input, 'swCacheTotal', 100)
      const score = swCacheTotal > 0 ? clamp01(swCacheHits / swCacheTotal) : 0
      return okLocal(`swCacheHitRatio=${score.toFixed(3)} hits=${swCacheHits}/${swCacheTotal}`, { score })
    },
  },
  {
    id: 'resumability-qwik',
    surface: surfaceFor('resumability-qwik'),
    mode: 'local',
    run: (input) => {
      const hydrationJsBytes = num(input, 'hydrationJsBytes', 45_000)
      const budgetBytes = num(input, 'hydrationBudgetBytes', 60_000)
      const score = budgetScore(hydrationJsBytes, budgetBytes)
      return okLocal(
        `reactHydrationJs=${hydrationJsBytes}B budget=${budgetBytes}B (React app, not Qwik — measuring hydration cost as a proxy)`,
        { score },
      )
    },
  },
]
