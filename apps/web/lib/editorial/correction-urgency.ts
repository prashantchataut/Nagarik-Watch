/**
 * Correction urgency.
 *
 * The catalog described this as "ranks correction requests by reach of the
 * original story and severity keywords", and the handler ranked fixture rows.
 * There was nothing real to rank: reader correction requests arrive as
 * submissions with `type: 'correction'`, and no surface read them as a queue.
 *
 * This scores the actual queue from three inputs. Severity is inferred from
 * what the reader wrote. Reach comes from the first-party engagement index for
 * whichever published story the request points at. The third input is the one
 * that makes this a queue rather than a sort: how long the request has gone
 * unanswered. A typo on a story nobody reads still climbs to the top
 * eventually, because a corrections desk that quietly drops the small ones is
 * not a corrections desk.
 *
 * Pure and locale-free on purpose — it returns reason codes, and the desk page
 * owns the Nepali copy, the same split `indexation-health` and `alt-text` use.
 */

import type { CorrectionSeverity } from '@nagarikwatch/db'

export type { CorrectionSeverity }

export type CorrectionReasonCode =
  'severe' | 'high-reach' | 'aging' | 'overdue' | 'unmatched' | 'no-telemetry'

export type CorrectionRequest = {
  id: string
  headline: string
  description: string
  /** ISO timestamp the reader filed it. */
  createdAt: string
  evidenceUrl?: string
}

export type CorrectionTarget = {
  slug: string
  categorySlug: string
  title: string
  publishedAt: string
  /** Unique readers from the engagement index; 0 when the story is untracked. */
  readers: number
}

export type RankedCorrection = {
  id: string
  severity: CorrectionSeverity
  /** 0–1. Sorted descending; ties broken by age so the queue never stalls. */
  urgency: number
  hoursOpen: number
  /** 0–1 share of the busiest story in the window. */
  reach: number
  target: CorrectionTarget | null
  reasons: CorrectionReasonCode[]
}

const SEVERITY_WEIGHT: Record<CorrectionSeverity, number> = {
  retraction: 1,
  factual: 0.72,
  attribution: 0.5,
  clarification: 0.32,
  typo: 0.12,
}

/**
 * Ordered strongest-first; the first class that matches wins. These are the
 * words Nepali readers actually use in the correction form, not a translation
 * of an English list — `फिर्ता लिनु` (withdraw it) and `मानहानि` (defamation)
 * are the two that mean a lawyer may be reading the same story soon.
 */
const SEVERITY_PATTERNS: ReadonlyArray<readonly [CorrectionSeverity, RegExp]> = [
  [
    'retraction',
    /मानहानि|बदनाम|झुट्ठा|झूटो|झुटो|खारेज|फिर्ता|defam|libel|retract|fabricat|made\s?up/iu,
  ],
  [
    'factual',
    /गलत|त्रुटि|फरक\s*छ|रकम|तथ्याङ्क|तथ्यांक|आँकडा|उद्धरण|wrong|incorrect|inaccurat|misquot|misattribut|wrong\s+(name|date|number|figure)/iu,
  ],
  ['attribution', /श्रेय|क्रेडिट|कपिराइट|स्रोत\s*उल्लेख|credit|attribut|copyright|uncredited/iu],
  ['clarification', /स्पष्ट|सन्दर्भ|अपूर्ण|भ्रम|clarif|context|misleading|incomplete/iu],
  ['typo', /हिज्जे|वर्णविन्यास|टाइपो|अक्षर|typo|spelling|misspel/iu],
]

/** Past this many hours unanswered, a request counts as fully escalated. */
const OPEN_ESCALATION_HOURS = 48
/** Past this, the desk is not running; the page says so out loud. */
const OVERDUE_HOURS = 72
/** A request we could not tie to a story gets the middle of the reach range. */
const UNMATCHED_REACH = 0.4
/** Above this share of the window's busiest story, reach is worth naming. */
const HIGH_REACH = 0.6
/** Token overlap needed to call a headline a match for a story. */
const TITLE_MATCH = 0.34

const WEIGHT_SEVERITY = 0.55
const WEIGHT_REACH = 0.25
const WEIGHT_AGE = 0.2

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

/**
 * The reader wrote something; if none of the classes match we call it a
 * clarification rather than guessing high or low. They still filed a claim that
 * the story is wrong, so the floor is not `typo`.
 */
export function classifySeverity(text: string): CorrectionSeverity {
  for (const [severity, pattern] of SEVERITY_PATTERNS) {
    if (pattern.test(text)) return severity
  }
  return 'clarification'
}

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((token) => token.length > 2),
  )
}

function overlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let shared = 0
  for (const token of a) if (b.has(token)) shared += 1
  return shared / Math.min(a.size, b.size)
}

/**
 * Two ways a request names a story, in order of how much we trust them: the
 * reader pasted the URL, or their headline reads like the story's headline.
 * A wrong match is worse than no match — it would send an editor to correct a
 * story nobody complained about — so the token threshold is deliberately high.
 */
export function matchCorrectionTarget(
  request: CorrectionRequest,
  targets: readonly CorrectionTarget[],
): CorrectionTarget | null {
  const haystack = `${request.evidenceUrl ?? ''} ${request.description} ${request.headline}`
  for (const target of targets) {
    // Anchored on the path so a slug that happens to be a common word in the
    // body text cannot match: `/politics/budget` must appear as a path.
    const path = `/${target.categorySlug}/${target.slug}`
    if (haystack.includes(path)) return target
  }

  const asked = tokens(`${request.headline} ${request.description}`)
  let best: CorrectionTarget | null = null
  let bestScore = TITLE_MATCH
  for (const target of targets) {
    const score = overlap(tokens(target.title), asked)
    if (score > bestScore) {
      best = target
      bestScore = score
    }
  }
  return best
}

export function rankCorrectionRequests(
  requests: readonly CorrectionRequest[],
  targets: readonly CorrectionTarget[],
  now = Date.now(),
): RankedCorrection[] {
  const maxReaders = targets.reduce((max, target) => Math.max(max, target.readers), 0)
  // Log-scaled: one runaway story should not flatten everything else to zero,
  // which is what a linear share of the maximum does on a news homepage.
  const reachOf = (target: CorrectionTarget): number => {
    if (maxReaders > 0) return clamp01(Math.log1p(target.readers) / Math.log1p(maxReaders))
    // No telemetry yet. A story published this week is still being read, so
    // recency is the only honest proxy we have.
    const ageHours = (now - Date.parse(target.publishedAt)) / 3_600_000
    return Number.isFinite(ageHours) ? clamp01(1 - ageHours / 168) : UNMATCHED_REACH
  }

  const ranked = requests.map((request): RankedCorrection => {
    const severity = classifySeverity(`${request.headline} ${request.description}`)
    const target = matchCorrectionTarget(request, targets)
    const reach = target ? reachOf(target) : UNMATCHED_REACH
    const filed = Date.parse(request.createdAt)
    const hoursOpen = Number.isFinite(filed) ? Math.max(0, (now - filed) / 3_600_000) : 0
    const age = clamp01(hoursOpen / OPEN_ESCALATION_HOURS)

    const reasons: CorrectionReasonCode[] = []
    if (severity === 'retraction' || severity === 'factual') reasons.push('severe')
    if (target && reach >= HIGH_REACH) reasons.push('high-reach')
    if (hoursOpen >= OVERDUE_HOURS) reasons.push('overdue')
    else if (age >= 0.5) reasons.push('aging')
    if (!target) reasons.push('unmatched')
    else if (maxReaders === 0) reasons.push('no-telemetry')

    return {
      id: request.id,
      severity,
      urgency: clamp01(
        WEIGHT_SEVERITY * SEVERITY_WEIGHT[severity] + WEIGHT_REACH * reach + WEIGHT_AGE * age,
      ),
      hoursOpen,
      reach,
      target,
      reasons,
    }
  })

  return ranked.sort((a, b) => b.urgency - a.urgency || b.hoursOpen - a.hoursOpen)
}
