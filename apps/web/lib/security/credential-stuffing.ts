/**
 * Tells a credential-stuffing run apart from a journalist who forgot their
 * password.
 *
 * Rate limiting already caps how fast any one key can try, and it is the wrong
 * tool for this: a stuffing run is cheap precisely because it spreads — one
 * attempt per account across thousands of accounts, or one account attacked
 * from a thousand residential IPs. Every individual key stays under the limit
 * while the campaign as a whole succeeds.
 *
 * What separates the two is *shape*, not volume:
 *   - a real user fails their own account, two or three times, then succeeds
 *     or gives up;
 *   - a spray fails many distinct accounts from one origin;
 *   - a distributed run fails one account from many origins;
 *   - and in both attack cases nearly every attempt fails, because the
 *     credentials came from somebody else's breach.
 *
 * Pure and synchronous on purpose — the ledger that feeds it lives in
 * `auth-attempts.ts`, so this file can be reasoned about and tested without a
 * database.
 */

export type StuffingReason =
  | 'account-spray'
  | 'distributed-origins'
  | 'failure-volume'
  | 'all-failures'
  | 'superhuman-velocity'

export type StuffingVerdict = 'clear' | 'watch' | 'challenge' | 'block'

/** Aggregates over one window, from the point of view of one sign-in attempt. */
export type StuffingWindow = {
  windowMinutes: number
  /** Failed sign-ins from this origin in the window. */
  originFailures: number
  /** Total sign-ins from this origin, failed or not. */
  originAttempts: number
  /** Distinct accounts this origin has tried. */
  originIdentifiers: number
  /** Failed sign-ins against this account in the window, from anywhere. */
  identifierFailures: number
  /** Distinct origins that have tried this account. */
  identifierOrigins: number
}

export type StuffingSignal = {
  /** 0–1. Not a probability; a ranking of how unlike one person this looks. */
  score: number
  verdict: StuffingVerdict
  reasons: StuffingReason[]
}

/**
 * One person mistyping a password produces up to about three failures against
 * one account from one origin. Everything below is calibrated from that.
 */
const SPRAY_IDENTIFIERS = 5
const DISTRIBUTED_ORIGINS = 4
const FAILURE_VOLUME = 10
const HUMAN_ATTEMPTS_PER_MINUTE = 6
/** Below this many attempts the ratio is noise, not a signal. */
const RATIO_FLOOR = 5

/**
 * Calibrated against the shapes in the tests rather than picked round: a
 * forty-account spray with a total failure ratio scores ~0.68 and must block,
 * a single account worked from thirty origins scores ~0.42 and must at least
 * be challenged, and a journalist's three mistyped passwords score ~0.04.
 */
const BLOCK_AT = 0.62
const CHALLENGE_AT = 0.4
const WATCH_AT = 0.22

const WEIGHT_SPRAY = 0.38
const WEIGHT_DISTRIBUTED = 0.27
const WEIGHT_VOLUME = 0.2
const WEIGHT_RATIO = 0.15

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

/**
 * Saturating ramp: at the threshold the term is 0.5, and it approaches 1 as
 * the count grows. A linear ramp would either ignore a 5-account spray or
 * saturate on a 200-account one and stop distinguishing anything above it.
 */
function ramp(count: number, threshold: number): number {
  if (count <= 1) return 0
  return clamp01((count - 1) / (count - 1 + Math.max(1, threshold - 1)))
}

export function scoreCredentialStuffing(window: StuffingWindow): StuffingSignal {
  const reasons: StuffingReason[] = []

  const spray = ramp(window.originIdentifiers, SPRAY_IDENTIFIERS)
  if (window.originIdentifiers >= SPRAY_IDENTIFIERS) reasons.push('account-spray')

  const distributed = ramp(window.identifierOrigins, DISTRIBUTED_ORIGINS)
  if (window.identifierOrigins >= DISTRIBUTED_ORIGINS) reasons.push('distributed-origins')

  const volume = ramp(Math.max(window.originFailures, window.identifierFailures), FAILURE_VOLUME)
  if (Math.max(window.originFailures, window.identifierFailures) >= FAILURE_VOLUME)
    reasons.push('failure-volume')

  // A high failure ratio only means something once there are enough attempts
  // for it to be a ratio rather than an accident.
  const ratio =
    window.originAttempts >= RATIO_FLOOR ? window.originFailures / window.originAttempts : 0
  if (window.originAttempts >= RATIO_FLOOR && ratio >= 0.9) reasons.push('all-failures')

  const perMinute = window.originAttempts / Math.max(1, window.windowMinutes)
  if (perMinute > HUMAN_ATTEMPTS_PER_MINUTE && window.originAttempts >= RATIO_FLOOR)
    reasons.push('superhuman-velocity')

  const score = clamp01(
    WEIGHT_SPRAY * spray +
      WEIGHT_DISTRIBUTED * distributed +
      WEIGHT_VOLUME * volume +
      WEIGHT_RATIO * ratio,
  )

  const verdict: StuffingVerdict =
    score >= BLOCK_AT
      ? 'block'
      : score >= CHALLENGE_AT
        ? 'challenge'
        : score >= WATCH_AT
          ? 'watch'
          : 'clear'

  return { score, verdict, reasons }
}

/**
 * Reader-facing (well, operator-facing) copy for a refused sign-in. Deliberately
 * says nothing about which signal fired: an attacker tuning a run should not be
 * able to read the detector off the error message.
 */
export const STUFFING_BLOCK_MESSAGE_NE =
  'असामान्य लगइन प्रयास पत्ता लाग्यो। केही बेरपछि पुनः प्रयास गर्नुहोस् वा न्युजरूम प्रशासकलाई सम्पर्क गर्नुहोस्।'
