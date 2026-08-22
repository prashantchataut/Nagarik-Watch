import { evaluatePublicationVisibility } from '@nagarikwatch/db'

/**
 * Explain why a CMS article is or is not visible to readers.
 *
 * Kept as a web-layer adapter so admin tooling and probes can import a stable
 * local function while the actual publication policy lives in @nagarikwatch/db.
 */
export type PublicationDiagnostic = {
  visible: boolean
  reasons: string[]
}

export function diagnosePublication(input: {
  status?: string | null
  workflowStage?: string | null
  publishAt?: string | null
  now?: Date
}): PublicationDiagnostic {
  return evaluatePublicationVisibility(
    {
      status: input.status,
      workflowStage: input.workflowStage,
      publishAt: input.publishAt,
    },
    input.now,
  )
}
