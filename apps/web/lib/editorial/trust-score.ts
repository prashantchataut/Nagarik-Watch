import type { StoryCardData } from '@nagarikwatch/db'

/**
 * Editorial trust scoring for the ranking pipeline.
 *
 * `weightedScore` has always carried a `qualityTrustScore` term worth 9 points
 * — more than province relevance and author affinity — and `signalsForStory`
 * has always passed it a literal `0`. The term was dead weight on every hub and
 * every related-stories rail, and the constant `0.8` that `relatedByContent`
 * used instead cancelled out across candidates, which is the same as not
 * having the term at all.
 *
 * This computes it from what the newsroom already records on a story. Three
 * rules keep it honest:
 *
 *  1. **No invented evidence.** A component only moves the score when the field
 *     it reads is actually set. An unfilled field is not a penalty; it just
 *     leaves that component at the neutral baseline.
 *  2. **Provenance outranks production value.** A named reporter and a verified
 *     fact-check move the score much further than a hero image does. Otherwise
 *     this becomes a reward for picture desks.
 *  3. **Explainable.** Every call returns the components that fired, so
 *     `/admin/algorithms` can show an editor why a story ranked where it did
 *     instead of printing a number with no provenance.
 *
 * The output is clamped to [0, 1] and is deliberately centred near 0.5 so that
 * an ordinary, adequately-sourced story is not punished relative to the old
 * behaviour — only the well-evidenced and the actively-flagged move far.
 */

/** Neutral starting point for a story with no trust metadata filled in at all. */
const BASELINE = 0.5

export type TrustComponent = {
  key: string
  delta: number
  /** Short editorial-facing explanation, shown in the algorithms panel. */
  reason: string
}

export type EditorialTrust = {
  /** Clamped to [0, 1]; feeds `RankingSignals.qualityTrustScore`. */
  score: number
  components: TrustComponent[]
}

/** The subset of the full `Article` shape that carries extra trust evidence. */
export type TrustEvidence = {
  /** Aggregated / wire provenance. Present means this is not original reporting. */
  source?: { sourceType?: string; sourceName?: string; sourceUrl?: string }
  /** Reader-visible corrections already issued against this story. */
  corrections?: Array<{ at: string; summaryNe: string }>
  /** Newsroom-internal note on how the story was sourced. */
  sourceNotes?: string
  /** A second byline that signs off on the copy. */
  editor?: { name: string; slug: string }
  factChecker?: { name: string; slug: string }
  sponsored?: boolean
  sponsorName?: string
}

function push(components: TrustComponent[], key: string, delta: number, reason: string): void {
  if (delta === 0) return
  components.push({ key, delta, reason })
}

/**
 * Score one story. `evidence` is optional because hub and rail surfaces only
 * hold `StoryCardData`; the article page can pass the fuller record.
 */
export function editorialTrustScore(
  story: StoryCardData,
  evidence: TrustEvidence = {},
): EditorialTrust {
  const components: TrustComponent[] = []

  // --- Provenance -----------------------------------------------------------
  // A real byline that resolves to an author page is the single strongest
  // signal a newsroom can offer a reader. A bare byline string is weaker: it
  // renders, but nothing links to a person who can be held to it.
  const namedAuthors = story.authors?.filter((author) => author.name && author.slug) ?? []
  if (namedAuthors.length > 0) {
    push(components, 'named-author', 0.12, `${namedAuthors.length} attributable byline(s)`)
  } else if (story.byline?.trim()) {
    push(components, 'byline-only', 0.02, 'byline text without a linked author record')
  }

  if (evidence.editor?.slug) {
    push(components, 'editor-signoff', 0.05, 'an editor is recorded on the story')
  }
  if (evidence.factChecker?.slug) {
    push(components, 'fact-checker', 0.07, 'a fact-checker is recorded on the story')
  }
  if (evidence.sourceNotes?.trim()) {
    push(components, 'source-notes', 0.04, 'sourcing notes were filled in')
  }

  // Wire and aggregated copy is not untrustworthy, but it is someone else's
  // reporting; a linked original counts for more than an unlinked credit.
  if (evidence.source?.sourceType) {
    const linked = Boolean(evidence.source.sourceUrl)
    push(
      components,
      'aggregated',
      linked ? -0.03 : -0.1,
      linked
        ? `aggregated from ${evidence.source.sourceName ?? 'an external source'} with a link`
        : 'aggregated without a link to the original',
    )
  }

  // --- Fact-check status ----------------------------------------------------
  switch (story.factCheckStatus) {
    case 'verified':
      push(components, 'fact-check-verified', 0.22, 'fact-check desk marked this verified')
      break
    case 'false':
      // A story the desk has rated false is a debunk; it is legitimate
      // journalism, but it must never be promoted as if it were a finding.
      push(components, 'fact-check-false', -0.3, 'fact-check desk rated the underlying claim false')
      break
    case 'mixed':
      push(components, 'fact-check-mixed', -0.05, 'fact-check verdict is mixed')
      break
    case 'context_needed':
      push(components, 'fact-check-context', -0.04, 'fact-check verdict needs context')
      break
    case 'in_review':
      push(components, 'fact-check-pending', -0.08, 'fact-check is still in review')
      break
    default:
      break
  }

  // --- Original reporting ---------------------------------------------------
  if (story.exclusive) push(components, 'exclusive', 0.1, 'original exclusive or investigation')
  if (story.dataStory) push(components, 'data-story', 0.06, 'data-journalism desk')
  if (story.editorPick) push(components, 'editor-pick', 0.05, 'editor-curated pick')

  // --- Supporting evidence --------------------------------------------------
  // Capped deliberately: production value is evidence of effort, not of
  // accuracy, and must not outweigh a byline.
  let evidenceDelta = 0
  if (story.heroImage?.url) evidenceDelta += 0.02
  if (story.hasGallery) evidenceDelta += 0.02
  if (story.hasVideo) evidenceDelta += 0.02
  if (story.province) evidenceDelta += 0.02
  if (story.district) evidenceDelta += 0.01
  if ((story.tags?.length ?? 0) >= 2) evidenceDelta += 0.02
  const cappedEvidence = Math.min(0.07, evidenceDelta)
  push(components, 'supporting-evidence', cappedEvidence, 'imagery, geo-tagging and topic tags')

  // Depth, saturating: a 12-minute piece is not four times the reporting of a
  // 3-minute one, and length is trivially gamed.
  const minutes = story.readingMinutes ?? 0
  if (minutes > 0) {
    push(components, 'depth', Math.min(0.06, Math.log1p(minutes) / 40), `${minutes} minute read`)
  }

  // --- Transparency and commercial pressure ---------------------------------
  // Issuing a correction is what an accountable newsroom does; it should not be
  // punished. It is recorded so the panel can show it, at zero weight.
  const correctionCount = evidence.corrections?.length ?? 0
  if (correctionCount > 0) {
    push(components, 'corrections-issued', 0, `${correctionCount} correction(s) published`)
  }

  if (evidence.sponsored) {
    push(
      components,
      'sponsored',
      -0.12,
      `sponsored content${evidence.sponsorName ? ` (${evidence.sponsorName})` : ''}`,
    )
  }

  const raw = components.reduce((total, component) => total + component.delta, BASELINE)
  return { score: Math.max(0, Math.min(1, raw)), components }
}

/** Convenience for callers that only want the number. */
export function trustScoreFor(story: StoryCardData, evidence: TrustEvidence = {}): number {
  return editorialTrustScore(story, evidence).score
}
