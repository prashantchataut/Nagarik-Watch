/**
 * Honest local heuristics for catalog capabilities without a dedicated lib yet.
 * Every handler returns a deterministic score and detail string.
 */
import type { AlgorithmHandler } from './utils'
import { clamp01, hashScore, mean, num, stddev, str, tokenSet, jaccard } from './utils'
import { newsSitemapPriority, ogImageDimensionOk, ogImageDimensionScore } from '../product/seo-dist'
import { validateAmpHtml, validateInstantArticle } from '../../syndication/validators'
import { checkPartnerTokenShape, isKnownLicenseTag } from '../../syndication/partner-feed'
import { lintSecurityHeaders } from '../../security/header-lint'

function streakFromDays(days: number[]): number {
  if (days.length === 0) return 0
  const sorted = [...new Set(days)].sort((a, b) => b - a)
  let streak = 1
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i - 1]! - sorted[i]! === 1) streak += 1
    else break
  }
  return streak
}

export const HEURISTIC_HANDLERS: Record<string, AlgorithmHandler> = {
  // 51–70 growth / retention
  'reading-streak-scorer': (input) => {
    const days = (input.dayNumbers as number[]) ?? [1, 2, 3, 5]
    const streak = streakFromDays(days)
    return { score: streak, detail: `streakDays=${streak}`, mode: 'heuristic' }
  },
  'streak-risk-nudge': (input) => {
    const hoursSinceRead = num(input, 'hoursSinceRead', 20)
    const streak = num(input, 'streak', 5)
    const score = streak > 0 ? clamp01(hoursSinceRead / 24) : 0
    return { score, detail: `nudgeRisk=${score.toFixed(3)} streak=${streak}`, mode: 'heuristic' }
  },
  'reengagement-ranking': (input) => {
    const freshness = num(input, 'freshness', 0.7)
    const affinity = num(input, 'affinity', 0.5)
    const score = clamp01(freshness * 0.6 + affinity * 0.4)
    return { score, detail: `reengagement=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'digest-story-ranking': (input) => {
    const civic = num(input, 'civicWeight', 0.8)
    const novelty = num(input, 'novelty', 0.5)
    const diversity = num(input, 'diversity', 0.6)
    const score = clamp01(civic * 0.45 + novelty * 0.3 + diversity * 0.25)
    return { score, detail: `digestRank=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'notification-batching': (input) => {
    const pending = num(input, 'pending', 4)
    const windowMin = num(input, 'windowMinutes', 30)
    const score = clamp01(pending / Math.max(1, windowMin / 5))
    return { score, detail: `batchPressure=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'save-later-ranking': (input) => {
    const remainingMin = num(input, 'remainingMinutes', 8)
    const freshness = num(input, 'freshness', 0.5)
    const score = clamp01((1 - Math.min(1, remainingMin / 20)) * 0.5 + freshness * 0.5)
    return { score, detail: `saveLater=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'continue-reading-ranker': (input) => {
    const depth = num(input, 'scrollDepth', 55)
    const hoursAgo = num(input, 'hoursAgo', 6)
    const score = clamp01((depth / 100) * 0.7 + (1 - Math.min(1, hoursAgo / 48)) * 0.3)
    return { score, detail: `continueReading=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'topic-follow-ranking': (input) => {
    const reads = num(input, 'topicReads', 4)
    const score = clamp01(reads / 10)
    return { score, detail: `topicFollow=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'author-follow-ranking': (input) => {
    const completes = num(input, 'completedReads', 3)
    const score = clamp01(completes / 8)
    return { score, detail: `authorFollow=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'homepage-slot-diversity': (input) => {
    const sameCategoryStreak = num(input, 'sameCategoryStreak', 2)
    const score = clamp01(1 - sameCategoryStreak / 5)
    return { score, detail: `diversityGuard=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'breaking-alert-cooldown': (input) => {
    const minutesSince = num(input, 'minutesSinceLast', 45)
    const cooldown = num(input, 'cooldownMinutes', 30)
    const score = minutesSince >= cooldown ? 1 : minutesSince / cooldown
    return {
      score: clamp01(score),
      detail: `cooldownOk=${minutesSince >= cooldown}`,
      mode: 'heuristic',
    }
  },
  'locale-preference-scorer': (input) => {
    const ne = num(input, 'neReads', 7)
    const en = num(input, 'enReads', 3)
    const score = ne / Math.max(1, ne + en)
    return { score, detail: `nePreference=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'scroll-depth-quality': (input) => {
    const depth = num(input, 'scrollDepth', 70)
    const dwell = num(input, 'dwellSeconds', 90)
    const score = clamp01((depth / 100) * 0.6 + Math.min(1, dwell / 180) * 0.4)
    return { score, detail: `quality=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'return-visit-propensity': (input) => {
    const sessions = num(input, 'sessions7d', 4)
    const completion = num(input, 'completionRate', 0.5)
    const score = clamp01((sessions / 10) * 0.5 + completion * 0.5)
    return { score, detail: `returnPropensity=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'onboarding-topic-picker': (input) => {
    const coverage = num(input, 'coverageBreadth', 0.7)
    return {
      score: clamp01(coverage),
      detail: `onboardingRank=${coverage.toFixed(3)}`,
      mode: 'heuristic',
    }
  },
  'quiet-hours-scheduler': (input) => {
    const hour = num(input, 'hour', 22)
    const breaking = Boolean(input.breaking)
    const inQuiet = hour >= 22 || hour < 6
    const score = breaking ? 1 : inQuiet ? 0 : 1
    return { score, detail: `allowSend=${score === 1} quiet=${inQuiet}`, mode: 'heuristic' }
  },
  'bookmark-expiry-ranker': (input) => {
    const ageDays = num(input, 'ageDays', 14)
    const score = clamp01(ageDays / 30)
    return { score, detail: `staleSave=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'related-depth-limiter': (input) => {
    const depth = num(input, 'depth', 3)
    const score = clamp01(1 - depth / 6)
    return { score, detail: `relatedDepthHeadroom=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'series-continue-scorer': (input) => {
    const nextIndex = num(input, 'nextIndex', 2)
    const total = num(input, 'totalParts', 4)
    const score = clamp01(1 - (nextIndex - 1) / Math.max(1, total))
    return { score, detail: `seriesContinue=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'reader-corner-curation': (input) => {
    const affinity = num(input, 'affinity', 0.6)
    const editorial = num(input, 'editorial', 0.4)
    const score = clamp01(affinity * 0.55 + editorial * 0.45)
    return { score, detail: `readerCorner=${score.toFixed(3)}`, mode: 'heuristic' }
  },

  // 71–85 editorial
  'assignment-priority-scoring': (input) => {
    const deadlineHours = num(input, 'deadlineHours', 6)
    const gap = num(input, 'coverageGap', 0.7)
    const score = clamp01((1 - Math.min(1, deadlineHours / 48)) * 0.5 + gap * 0.5)
    return { score, detail: `assignmentPriority=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'deadline-risk-scorer': (input) => {
    const remaining = num(input, 'checklistRemaining', 3)
    const hoursLeft = num(input, 'hoursLeft', 4)
    const score = clamp01((remaining / 5) * 0.5 + (1 - Math.min(1, hoursLeft / 24)) * 0.5)
    return { score, detail: `deadlineRisk=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'headline-ab-ranker': (input) => {
    const clicks = num(input, 'clicks', 12)
    const impressions = num(input, 'impressions', 100)
    const prior = 0.08
    const score = (prior * 50 + clicks) / (50 + impressions)
    return { score, detail: `headlineBayesian=${score.toFixed(4)}`, mode: 'heuristic' }
  },
  'photo-crop-scorer': (input) => {
    const ratio = num(input, 'aspectRatio', 1.6)
    const target = 16 / 9
    const score = clamp01(1 - Math.abs(ratio - target) / target)
    return { score, detail: `cropFit=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'caption-quality-scorer': (input) => {
    const caption = str(input, 'caption', 'काठमाडौंमा बाढीपछि सडक')
    const len = caption.trim().length
    const score = clamp01(len / 80) * (len < 8 ? 0.2 : 1)
    return { score, detail: `captionQuality=${score.toFixed(3)} len=${len}`, mode: 'heuristic' }
  },
  'byline-balance-checker': (input) => {
    const share = num(input, 'authorShare', 0.35)
    const score = clamp01(1 - Math.max(0, share - 0.25) * 2)
    return { score, detail: `bylineBalance=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'embargo-countdown': (input) => {
    const releaseAt = Date.parse(
      str(input, 'releaseAt', new Date(Date.now() + 3600_000).toISOString()),
    )
    const hours = Math.max(0, (releaseAt - Date.now()) / 3_600_000)
    return { score: hours, detail: `hoursUntilRelease=${hours.toFixed(2)}`, mode: 'heuristic' }
  },
  'wire-intake-priority': (input) => {
    const nepal = num(input, 'nepalRelevance', 0.8)
    const fresh = num(input, 'freshness', 0.7)
    const score = clamp01(nepal * 0.6 + fresh * 0.4)
    return { score, detail: `wirePriority=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'slug-collision-resolver': (input) => {
    const base = str(input, 'slug', 'kathmandu-flood')
    const taken = Boolean(input.taken)
    const resolved = taken ? `${base}-2` : base
    return { score: taken ? 0.5 : 1, detail: `slug=${resolved}`, mode: 'heuristic' }
  },
  'deck-length-optimizer': (input) => {
    const len = str(input, 'deck', 'छोटो डेस्क पाठ').length
    const score = len >= 40 && len <= 120 ? 1 : clamp01(1 - Math.abs(len - 80) / 80)
    return { score, detail: `deckLen=${len} score=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'source-citation-coverage': (input) => {
    const claims = num(input, 'claims', 5)
    const citations = num(input, 'citations', 3)
    const score = claims === 0 ? 1 : clamp01(citations / claims)
    return { score, detail: `citationCoverage=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'homophone-typo-guard': (input) => {
    const text = str(input, 'text', 'the the flood flood report')
    const tokens = [...tokenSet(text)]
    const words = text.toLowerCase().split(/\s+/).filter(Boolean)
    const repeats = words.length - tokens.length
    const score = clamp01(1 - repeats / Math.max(1, words.length))
    return { score, detail: `typoGuard=${score.toFixed(3)} repeats=${repeats}`, mode: 'heuristic' }
  },
  'section-fill-planner': (input) => {
    const hoursSince = num(input, 'hoursSinceSectionStory', 10)
    const score = clamp01(hoursSince / 12)
    return { score, detail: `sectionFillNeed=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'correction-urgency': (input) => {
    const reach = num(input, 'reach', 1000)
    const severity = num(input, 'severity', 0.7)
    const score = clamp01(Math.min(1, reach / 5000) * 0.5 + severity * 0.5)
    return { score, detail: `correctionUrgency=${score.toFixed(3)}`, mode: 'heuristic' }
  },

  // 86–100 analytics/ops
  'traffic-anomaly-detector': (input) => {
    const values = (input.values as number[]) ?? [100, 110, 95, 105, 300]
    const m = mean(values)
    const s = stddev(values) || 1
    const latest = values[values.length - 1] ?? m
    const z = Math.abs((latest - m) / s)
    return { score: z, detail: `anomalyZ=${z.toFixed(3)}`, mode: 'heuristic' }
  },
  'freshness-sla-monitor': (input) => {
    const ageHours = num(input, 'topSlotAgeHours', 3)
    const slaHours = num(input, 'slaHours', 6)
    const score = ageHours <= slaHours ? 1 : clamp01(slaHours / ageHours)
    return { score, detail: `freshnessSla=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'cache-hit-predictor': (input) => {
    const popularity = num(input, 'pathPopularity', 0.6)
    const ttlHours = num(input, 'ttlHours', 1)
    const score = clamp01(popularity * 0.7 + Math.min(1, ttlHours / 6) * 0.3)
    return { score, detail: `cacheHitEst=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'error-budget-burn': (input) => {
    const errors = num(input, 'errors', 20)
    const requests = num(input, 'requests', 10_000)
    const budget = num(input, 'monthlyBudget', 0.01)
    const rate = errors / Math.max(1, requests)
    const burn = budget > 0 ? rate / budget : 0
    return {
      score: burn,
      detail: `burnRate=${burn.toFixed(3)} errorRate=${rate.toFixed(5)}`,
      mode: 'heuristic',
    }
  },
  'deploy-risk-scorer': (input) => {
    const heat = num(input, 'pathHeat', 0.4)
    const hour = num(input, 'hour', 14)
    const incident = Boolean(input.recentIncident)
    const peak = hour >= 8 && hour <= 22 ? 0.3 : 0
    const score = clamp01(heat * 0.5 + peak + (incident ? 0.4 : 0))
    return { score, detail: `deployRisk=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'api-latency-budget': (input) => {
    const p95 = num(input, 'p95Ms', 420)
    const budget = num(input, 'budgetMs', 500)
    const score = p95 <= budget ? 1 : clamp01(budget / p95)
    return { score, detail: `latencyBudget=${score.toFixed(3)} p95=${p95}`, mode: 'heuristic' }
  },
  'db-pool-saturation': (input) => {
    const active = num(input, 'active', 8)
    const max = num(input, 'max', 20)
    const waiting = num(input, 'waiting', 0)
    const score = clamp01(active / max + waiting / Math.max(1, max))
    return { score, detail: `poolSaturation=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'queue-backlog-scorer': (input) => {
    const depth = num(input, 'depth', 40)
    const oldestMin = num(input, 'oldestMinutes', 25)
    const score = clamp01((depth / 100) * 0.5 + (oldestMin / 60) * 0.5)
    return { score, detail: `backlog=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'seo-indexation-health': (input) => {
    const sitemapAgeHours = num(input, 'sitemapAgeHours', 2)
    const coverage = num(input, 'canonicalCoverage', 0.95)
    const score = clamp01((sitemapAgeHours <= 24 ? 1 : 0.4) * 0.4 + coverage * 0.6)
    return { score, detail: `seoHealth=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'ad-fill-anomaly': (input) => {
    const fill = num(input, 'fillRate', 0.55)
    const baseline = num(input, 'baselineFill', 0.7)
    const drop = Math.max(0, baseline - fill)
    return { score: drop, detail: `fillDrop=${drop.toFixed(3)}`, mode: 'heuristic' }
  },
  'comment-queue-sla': (input) => {
    const oldestMin = num(input, 'oldestPendingMinutes', 35)
    const sla = num(input, 'slaMinutes', 30)
    const score = oldestMin <= sla ? 1 : clamp01(sla / oldestMin)
    return { score, detail: `commentSla=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'build-size-budget': (input) => {
    const bytes = num(input, 'bytes', 180_000)
    const budget = num(input, 'budgetBytes', 250_000)
    const score = bytes <= budget ? 1 : clamp01(budget / bytes)
    return { score, detail: `bundleBudget=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'cron-miss-detector': (input) => {
    const lastRun = Date.parse(
      str(input, 'lastRunAt', new Date(Date.now() - 2 * 3600_000).toISOString()),
    )
    const intervalMin = num(input, 'intervalMinutes', 60)
    const ageMin = (Date.now() - lastRun) / 60_000
    const missed = ageMin > intervalMin * 1.5
    return {
      score: missed ? 1 : 0,
      detail: `cronMissed=${missed} ageMin=${ageMin.toFixed(1)}`,
      mode: 'heuristic',
    }
  },
  'storage-growth-forecast': (input) => {
    const daily = (input.dailyBytes as number[]) ?? [100, 110, 120, 130]
    if (daily.length < 2) return { score: 0, detail: 'insufficient samples', mode: 'heuristic' }
    const delta = daily[daily.length - 1]! - daily[0]!
    const perDay = delta / (daily.length - 1)
    return { score: perDay, detail: `forecastBytesPerDay=${perDay.toFixed(1)}`, mode: 'heuristic' }
  },
  'incident-severity-scorer': (input) => {
    const impact = num(input, 'userImpact', 0.6)
    const duration = num(input, 'durationMinutes', 40)
    const errorRate = num(input, 'errorRate', 0.05)
    const score = clamp01(
      impact * 0.4 + Math.min(1, duration / 120) * 0.3 + Math.min(1, errorRate * 10) * 0.3,
    )
    return { score, detail: `incidentSeverity=${score.toFixed(3)}`, mode: 'heuristic' }
  },

  // 201–215 media/syndication/security
  'amp-html-validation': (input) => {
    const hasCanonical = Boolean(input.hasCanonical ?? true)
    const hasHero = Boolean(input.hasHero ?? true)
    const { ok, issues } = validateAmpHtml({ hasCanonical, hasHeroImage: hasHero })
    return {
      score: ok ? 1 : 1 - issues.length / 3,
      detail: `ampLocalValid=${ok}`,
      mode: 'heuristic',
    }
  },
  'instant-articles-check': (input) => {
    const title = str(input, 'title', 'Headline')
    const blocks = num(input, 'blocks', 3)
    const { ok } = validateInstantArticle({ title, bodyBlockCount: blocks, hasCanonical: true })
    const score = (title.length > 0 ? 0.5 : 0) + (blocks > 0 ? 0.5 : 0)
    return { score, detail: `iaLocalCheck=${ok}`, mode: 'heuristic' }
  },
  'news-sitemap-priority': (input) => {
    const ageHours = num(input, 'ageHours', 4)
    const breaking = Boolean(input.isBreaking)
    const cat = num(input, 'categoryWeight', 0.8)
    const score = newsSitemapPriority(ageHours, breaking, cat)
    return { score, detail: `sitemapPriority=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'image-exif-strip': (input) => {
    const hasGps = Boolean(input.hasGps)
    const hasExif = Boolean(input.hasExif ?? hasGps)
    const score = hasGps ? 1 : hasExif ? 0.6 : 0
    return {
      score,
      detail: `exifRisk=${score.toFixed(3)} recommendStrip=${hasExif}`,
      mode: 'heuristic',
    }
  },
  'alt-text-quality': (input) => {
    const alt = str(input, 'alt', '')
    if (!alt.trim()) return { score: 0, detail: 'alt empty', mode: 'heuristic' }
    if (/\.(jpe?g|png|webp|gif)$/i.test(alt))
      return { score: 0.1, detail: 'alt looks like filename', mode: 'heuristic' }
    const score = clamp01(alt.trim().length / 60)
    return { score, detail: `altQuality=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'video-bitrate-ladder': (input) => {
    const height = num(input, 'height', 1080)
    const rungs = height >= 1080 ? 4 : height >= 720 ? 3 : 2
    return {
      score: rungs,
      detail: `bitrateRungs=${rungs} sourceHeight=${height}`,
      mode: 'heuristic',
    }
  },
  'podcast-chapter-splitter': (input) => {
    const transcript = str(
      input,
      'transcript',
      'Intro\n00:00 Welcome\n05:00 Interview\n20:00 Outro',
    )
    const chapters = transcript.split('\n').filter((line) => /\d+:\d+/.test(line)).length
    return { score: chapters, detail: `chapters=${chapters}`, mode: 'heuristic' }
  },
  'og-image-dimension-check': (input) => {
    const w = num(input, 'width', 1200)
    const h = num(input, 'height', 630)
    const ok = ogImageDimensionOk(w, h)
    return {
      score: ogImageDimensionScore(w, h),
      detail: `ogDims=${w}x${h} ok=${ok}`,
      mode: 'heuristic',
    }
  },
  'feed-item-truncation': (input) => {
    const title = str(input, 'title', 'A'.repeat(90))
    const max = num(input, 'maxTitle', 80)
    const score = title.length <= max ? 1 : clamp01(max / title.length)
    return { score, detail: `feedTitleOk=${title.length <= max}`, mode: 'heuristic' }
  },
  'media-virus-scan-gate': (input) => {
    const mime = str(input, 'mime', 'image/jpeg')
    const ext = str(input, 'ext', 'jpg')
    const size = num(input, 'bytes', 200_000)
    const mimeOk =
      mime.startsWith('image/') || mime.startsWith('video/') || mime.startsWith('audio/')
    const sizeOk = size > 0 && size < 25_000_000
    const score = mimeOk && sizeOk ? 1 : 0
    return {
      score,
      detail: `uploadGate ok=${score === 1} mime=${mime} ext=${ext}`,
      mode: 'heuristic',
    }
  },
  'subtitle-sync-scorer': (input) => {
    const gaps = num(input, 'maxGapSeconds', 1.5)
    const overlaps = num(input, 'overlaps', 0)
    const score = clamp01(1 - gaps / 5) * (overlaps === 0 ? 1 : 0.5)
    return { score, detail: `subtitleSync=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'thumbnail-salience': (input) => {
    const contrast = num(input, 'contrast', 0.7)
    const centered = num(input, 'subjectCentered', 0.8)
    const score = clamp01(contrast * 0.5 + centered * 0.5)
    return { score, detail: `thumbSalience=${score.toFixed(3)}`, mode: 'heuristic' }
  },
  'partner-feed-auth-check': (input) => {
    const token = str(input, 'token', 'nw_partner_demo_token_value')
    const { ok } = checkPartnerTokenShape(token)
    return { score: ok ? 1 : 0, detail: `partnerTokenShapeOk=${ok}`, mode: 'heuristic' }
  },
  'content-license-tagger': (input) => {
    const license = str(input, 'license', 'all-rights')
    const score = isKnownLicenseTag(license) ? 1 : 0
    return { score, detail: `license=${license} known=${score === 1}`, mode: 'heuristic' }
  },
  'security-header-lint': (input) => {
    const headers = (input.headers as Record<string, string>) ?? {
      'content-security-policy': "default-src 'self'",
      'strict-transport-security': 'max-age=63072000',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin',
    }
    const { score, present, needed } = lintSecurityHeaders(headers)
    return { score, detail: `securityHeaders=${present}/${needed}`, mode: 'heuristic' }
  },
}

/** Deterministic fallback for any catalog id without a dedicated handler. */
/**
 * @deprecated Not used by the capability registry. Kept only so historical
 * tests can assert the hash helper is no longer on the dispatch path.
 */
export function genericHeuristic(
  id: string,
  input: Record<string, unknown>,
): ReturnType<AlgorithmHandler> {
  const salt = str(input, 'salt', JSON.stringify(Object.keys(input).sort()))
  const score = hashScore(id, salt)
  if (input.text && typeof input.text === 'string') {
    const other = str(input, 'other', '')
    if (other) {
      const sim = jaccard(tokenSet(input.text), tokenSet(other))
      return { score: sim, detail: `generic jaccard=${sim.toFixed(3)}`, mode: 'heuristic' }
    }
  }
  return { score, detail: `generic heuristic for ${id}`, mode: 'heuristic' }
}
