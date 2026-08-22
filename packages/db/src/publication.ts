/**
 * Shared reader-publication contract used by Payload access control and the
 * reader REST query layer. Keeping the predicate in the shared package avoids
 * the two applications silently drifting apart.
 */

export const PUBLIC_ARTICLE_WORKFLOW_STAGES = ['scheduled', 'published', 'updated'] as const

export type PublicArticleWorkflowStage = (typeof PUBLIC_ARTICLE_WORKFLOW_STAGES)[number]

export type PublicArticleWhere = {
  and: [
    { _status: { equals: 'published' } },
    { workflowStage: { in: readonly PublicArticleWorkflowStage[] } },
    { publishAt: { less_than_equal: string } },
  ]
}

/**
 * Build the canonical Payload public-reader predicate.
 *
 * Current CMS writes normalize publishAt when `_status=published`. Public
 * reads fail closed if that timestamp is missing: a published workflow label
 * alone must never bypass the publication-time gate. A scheduled story remains
 * hidden until its timestamp is reached; once due, readers may see it even
 * before the scheduler promotes the workflow label.
 *
 * The publication clauses are intentionally nested under `and`. Consumers can
 * therefore add their own top-level `or` (for search fields, for example)
 * without accidentally replacing the publication-time gate.
 */
export function buildPublicArticleWhere(cutoffIso: string): PublicArticleWhere {
  const cutoffMs = Date.parse(cutoffIso)
  if (!Number.isFinite(cutoffMs)) {
    throw new Error('Public article cutoff must be a valid ISO date.')
  }

  return {
    and: [
      { _status: { equals: 'published' } },
      { workflowStage: { in: PUBLIC_ARTICLE_WORKFLOW_STAGES } },
      { publishAt: { less_than_equal: new Date(cutoffMs).toISOString() } },
    ],
  }
}

export type PublicationVisibilityInput = {
  status?: string | null
  workflowStage?: string | null
  publishAt?: string | null
}

export type PublicationVisibilityResult = {
  visible: boolean
  reasons: string[]
}

/** Explain the same publication gate without needing a Payload query. */
export function evaluatePublicationVisibility(
  input: PublicationVisibilityInput,
  now: Date = new Date(),
): PublicationVisibilityResult {
  const reasons: string[] = []

  if (input.status !== 'published') {
    reasons.push('article status is not published')
  }

  if (!PUBLIC_ARTICLE_WORKFLOW_STAGES.includes(input.workflowStage as PublicArticleWorkflowStage)) {
    reasons.push('workflow stage is not publicly visible')
  }

  if (!input.publishAt) {
    reasons.push('publish time is missing')
  } else {
    const timestamp = Date.parse(input.publishAt)
    if (!Number.isFinite(timestamp)) {
      reasons.push('publish time is invalid')
    } else if (timestamp > now.getTime()) {
      reasons.push('publish time has not arrived')
    }
  }

  return { visible: reasons.length === 0, reasons }
}
