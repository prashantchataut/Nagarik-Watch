/**
 * Comment moderation and trust-safety scoring. Pure, deterministic, side-effect
 * free — the moderation queue calls these to pre-rank comments and flag risk,
 * then a human makes the publish/hold/delete call.
 *
 * What is implemented now:
 *   - Lexical toxicity + spam heuristics (banned-word list, ALL-CAPS, link
 *     density, repetition) — explainable and cheap.
 *   - User reputation score (Wilson lower bound on approve/reject history).
 *   - Comment ranking (Wilson + recency + upvotes).
 *   - Source-reliability note + fact-consistency hook (returns flags only;
 *     verdicts stay human until a real model is wired).
 *
 * What is deliberately deferred: ML toxicity models, bot-traffic
 * detection, misinformation pattern detection — these need a model endpoint
 * and a labelled dataset that do not exist yet. Wrappers are exposed so a
 * future worker plugs in without changing call sites.
 */
import type { Comment } from './types'

/** Wilson score lower bound (95% confidence) for a binomial up/down sample.
 *  Lifted here so moderation has no dependency on apps/web. apps/web re-exports
 *  the same function from its ranking module for backwards compatibility. */
export function wilsonScore(upvotes: number, downvotes: number, confidence = 1.96): number {
  const n = upvotes + downvotes
  if (n === 0) return 0
  const phat = upvotes / n
  const z = confidence
  return (
    (phat + (z * z) / (2 * n) - z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * n)) / n)) /
    (1 + (z * z) / n)
  )
}

export type ModerationVerdict = 'publish' | 'hold_for_review' | 'auto_hide' | 'auto_reject'

export type ModerationResult = {
  commentId: string
  verdict: ModerationVerdict
  toxicityScore: number
  spamScore: number
  flags: string[]
  reputationUsed: number
}

export type BannedWordList = readonly string[]

export const DEFAULT_BANNED_WORDS: BannedWordList = []

/** Normalize for lexical policy matching: NFKC + case fold + strip zero-width. */
export function normalizeModerationText(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Lexical toxicity: count of banned-term hits normalized by length.
 * Uses token-aware boundaries for Latin and whole-token/substring matches for
 * Devanagari so short civic substrings are less likely to false-positive.
 */
export function lexicalToxicity(
  text: string,
  banned: BannedWordList = DEFAULT_BANNED_WORDS,
): number {
  if (!text || banned.length === 0) return 0
  const lower = normalizeModerationText(text)
  if (!lower) return 0
  let hits = 0
  for (const raw of banned) {
    const w = normalizeModerationText(raw)
    if (!w || w.length < 2) continue
    const hasDevanagari = /[\u0900-\u097F]/.test(w)
    const pattern = hasDevanagari
      ? escapeRegex(w)
      : `(?:^|[^\\p{L}\\p{N}_])${escapeRegex(w)}(?:$|[^\\p{L}\\p{N}_])`
    const re = new RegExp(pattern, 'gu')
    const matches = lower.match(re)
    if (matches) hits += matches.length
  }
  return Math.min(1, hits / 4)
}

/** Spam heuristics: link density, ALL-CAPS ratio, repeated characters, length.
 *  Each signal contributes to a 0..1 score; >=0.6 auto-holds. */
export function spamScore(text: string): { score: number; flags: string[] } {
  const flags: string[] = []
  if (!text) return { score: 0, flags }
  const len = text.length
  const links = (text.match(/https?:\/\//gi) ?? []).length
  const linkDensity = links / Math.max(1, len / 100)
  if (linkDensity > 0.5) flags.push('link_density')

  const letters = text.replace(/[^A-Za-z\u0900-\u097F]/gu, '')
  const caps = (letters.match(/[A-Z]/g) ?? []).length
  const capsRatio = letters.length > 0 ? caps / letters.length : 0
  if (capsRatio > 0.6 && len > 20) flags.push('all_caps')

  const repeats = (text.match(/(.)\1{4,}/g) ?? []).length
  if (repeats > 0) flags.push('repeated_chars')

  const repeatedPhrases = (text.match(/(.{6,}?)\1{2,}/g) ?? []).length
  if (repeatedPhrases > 0) flags.push('repeated_phrases')

  if (len > 2000) flags.push('excessive_length')

  const score = Math.min(
    1,
    linkDensity * 0.5 +
      capsRatio * 0.3 +
      Math.min(0.3, repeats * 0.1) +
      (repeatedPhrases > 0 ? 0.2 : 0),
  )
  return { score, flags }
}

/** User reputation: Wilson lower bound on prior approve/reject outcomes, so a
 *  new user with 0 history starts neutral (0.5) rather than trusted. */
export function reputationScore(approved: number, rejected: number): number {
  const total = approved + rejected
  if (total === 0) return 0.5
  return wilsonScore(approved, rejected)
}

export type TrollRiskInput = {
  approvedComments: number
  rejectedComments: number
  text: string
  /** Number of comments submitted by the account in the last ten minutes. */
  commentsLastTenMinutes: number
}

export type TrollRiskResult = {
  score: number
  flags: Array<'high_reject_rate' | 'high_link_density' | 'posting_burst'>
  signals: {
    rejectRate: number
    linkDensity: number
    burst: number
  }
}

/**
 * Explainable behavioral risk hint for queue ordering. It is deliberately not
 * a moderation verdict: sparse history is discounted and humans make the call.
 */
export function trollRiskScore(input: TrollRiskInput): TrollRiskResult {
  const approved = Math.max(0, input.approvedComments)
  const rejected = Math.max(0, input.rejectedComments)
  const historyTotal = approved + rejected
  const rawRejectRate = historyTotal > 0 ? rejected / historyTotal : 0
  const historyConfidence = Math.min(1, historyTotal / 5)
  const rejectRate = rawRejectRate * historyConfidence

  const links = (input.text.match(/https?:\/\//gi) ?? []).length
  const linkDensity = Math.min(1, links / Math.max(1, input.text.length / 100))
  const burst = Math.min(1, Math.max(0, input.commentsLastTenMinutes - 2) / 8)

  const flags: TrollRiskResult['flags'] = []
  if (rawRejectRate >= 0.6 && historyTotal >= 5) flags.push('high_reject_rate')
  if (linkDensity >= 0.5) flags.push('high_link_density')
  if (input.commentsLastTenMinutes >= 6) flags.push('posting_burst')

  return {
    score: Math.min(1, rejectRate * 0.5 + linkDensity * 0.25 + burst * 0.25),
    flags,
    signals: { rejectRate, linkDensity, burst },
  }
}

export function moderateComment(
  comment: Pick<Comment, 'id' | 'body'>,
  reputation: number,
  banned: BannedWordList = DEFAULT_BANNED_WORDS,
): ModerationResult {
  const toxicity = lexicalToxicity(comment.body, banned)
  const spam = spamScore(comment.body)
  const flags = [...spam.flags]
  if (toxicity > 0) flags.push('banned_word')

  let verdict: ModerationVerdict = 'publish'
  if (toxicity >= 0.75 || spam.score >= 0.8) verdict = 'auto_reject'
  else if (toxicity >= 0.4 || spam.score >= 0.6 || reputation < 0.3) verdict = 'auto_hide'
  else if (toxicity > 0 || spam.score >= 0.3 || reputation < 0.5) verdict = 'hold_for_review'

  return {
    commentId: comment.id,
    verdict,
    toxicityScore: toxicity,
    spamScore: spam.score,
    flags,
    reputationUsed: reputation,
  }
}

/** Comment ranking for display order: Wilson on up/down votes blended with
 *  recency decay and a small freshness boost for the first hour. */
export function rankComment(
  comment: {
    id: string
    body: string
    createdAt: string
    upvotes: number
    downvotes: number
  },
  now = new Date(),
): { id: string; rankScore: number } {
  const wilson = wilsonScore(comment.upvotes, comment.downvotes)
  const ageHours = (now.getTime() - Date.parse(comment.createdAt)) / 3_600_000
  const recency = Math.exp(-ageHours / 48)
  return { id: comment.id, rankScore: wilson * 0.8 + recency * 0.2 }
}

/** Reliability note for a cited source. Returns a flag set, never a verdict —
 *  the editor owns the call. Wired to the FactCheckClaim collection later. */
export function sourceReliabilityFlags(source: {
  url: string
  label: string
  knownOutlet?: boolean
  firstSeenAt?: string
}): string[] {
  const flags: string[] = []
  if (!source.knownOutlet) flags.push('unfamiliar_outlet')
  if (source.firstSeenAt) {
    const ageDays = (Date.now() - Date.parse(source.firstSeenAt)) / 86_400_000
    if (ageDays < 30) flags.push('recently_seen')
  }
  if (!/^https:\/\//i.test(source.url)) flags.push('insecure_url')
  return flags
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
