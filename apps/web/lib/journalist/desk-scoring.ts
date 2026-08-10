import { clamp01, jaccard, tokenSet } from '../algorithms/handlers/utils'

export type DeskAssignmentInput = {
  deadlineHours: number
  coverageGap: number
  checklistRemaining: number
  hoursLeft: number
}

export type DeskDraftInput = {
  deck?: string
  caption?: string
  claims?: number
  citations?: number
  slug?: string
  slugTaken?: boolean
  previousText?: string
  currentText?: string
}

export function assignmentPriority(deadlineHours: number, coverageGap: number): number {
  return clamp01((1 - Math.min(1, deadlineHours / 48)) * 0.5 + coverageGap * 0.5)
}

export function deadlineRisk(checklistRemaining: number, hoursLeft: number): number {
  return clamp01((checklistRemaining / 5) * 0.5 + (1 - Math.min(1, hoursLeft / 24)) * 0.5)
}

export function deckLengthScore(deck: string): number {
  const len = deck.trim().length
  if (len >= 40 && len <= 120) return 1
  return clamp01(1 - Math.abs(len - 80) / 80)
}

export function captionQuality(caption: string): number {
  const len = caption.trim().length
  return clamp01(len / 80) * (len < 8 ? 0.2 : 1)
}

export function citationCoverage(claims: number, citations: number): number {
  if (claims <= 0) return 1
  return clamp01(citations / claims)
}

export function revisionSimilarity(a: string, b: string): number {
  return jaccard(tokenSet(a), tokenSet(b))
}

export function resolveSlug(slug: string, taken: boolean): { score: number; resolved: string } {
  const base = slug.trim() || 'draft'
  return { score: taken ? 0.5 : 1, resolved: taken ? `${base}-2` : base }
}

export function scoreAssignment(input: DeskAssignmentInput) {
  const priority = assignmentPriority(input.deadlineHours, input.coverageGap)
  const risk = deadlineRisk(input.checklistRemaining, input.hoursLeft)
  return {
    priority,
    risk,
    deskScore: clamp01(priority * 0.55 + risk * 0.45),
  }
}

export function scoreDraft(input: DeskDraftInput) {
  const deck = deckLengthScore(input.deck ?? '')
  const caption = captionQuality(input.caption ?? '')
  const citations = citationCoverage(input.claims ?? 0, input.citations ?? 0)
  const slug = resolveSlug(input.slug ?? 'draft', Boolean(input.slugTaken))
  const revision = revisionSimilarity(
    input.previousText ?? '',
    input.currentText ?? input.deck ?? '',
  )
  return {
    deck,
    caption,
    citations,
    slug: slug.score,
    resolvedSlug: slug.resolved,
    revision,
    deskScore: clamp01((deck + caption + citations + slug.score) / 4),
  }
}
