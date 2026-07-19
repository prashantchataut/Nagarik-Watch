/**
 * Shared editorial-trust scorers: source reliability, fact consistency, and
 * misinformation pattern matching. Assignment/deadline/deck scorers already
 * live in handlers/heuristics.ts — this module covers the trust-domain ones
 * that don't.
 */

export function sourceReliabilityScore(history: {
  correctionsIssued: number
  storiesPublished: number
  yearsActive: number
}): number {
  const { correctionsIssued, storiesPublished, yearsActive } = history
  const correctionRate = storiesPublished > 0 ? correctionsIssued / storiesPublished : 0
  const tenure = Math.max(0, Math.min(1, yearsActive / 10))
  return Math.max(0, Math.min(1, (1 - correctionRate) * 0.7 + tenure * 0.3))
}

export function factConsistencyScore(claimCount: number, corroboratingSources: number): number {
  if (claimCount <= 0) return 1
  return Math.max(0, Math.min(1, corroboratingSources / claimCount))
}

const MISINFO_PATTERNS: RegExp[] = [
  /forward(ed)? as received/i,
  /share before it'?s deleted/i,
  /doctors won'?t tell you/i,
  /wake up (nepal|sheeple)/i,
  /100% (proof|confirmed)[^.]{0,20}no source/i,
  /this is not fake[, ]+i checked/i,
]

export function misinformationPatternScore(text: string): { score: number; matches: number } {
  const matches = MISINFO_PATTERNS.filter((re) => re.test(text)).length
  return { score: Math.max(0, Math.min(1, matches / 2)), matches }
}
