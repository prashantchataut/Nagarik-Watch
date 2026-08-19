import type { EnglishStatus, WorkflowStage } from './types'

export type WorkflowActor = 'reporter' | 'editor' | 'publisher' | 'system'

const REPORTER_STAGES: ReadonlySet<WorkflowStage> = new Set(['idea', 'assigned', 'draft'])
const EDITOR_REVIEW_STAGES: ReadonlySet<WorkflowStage> = new Set([
  'submitted',
  'fact_check',
  'copy_edit',
  'seo_review',
  'legal_review',
  'ready',
])
const PUBLIC_STAGES: ReadonlySet<WorkflowStage> = new Set(['published', 'updated'])
const TERMINAL_STAGES: ReadonlySet<WorkflowStage> = new Set(['archived', 'retracted'])
const PUBLISHER_ONLY_STAGES: ReadonlySet<WorkflowStage> = new Set([
  'scheduled',
  'published',
  'updated',
])
const PUBLIC_CONTROL_STAGES: ReadonlySet<WorkflowStage> = new Set([
  'scheduled',
  'published',
  'updated',
  'archived',
  'retracted',
])

/** Allowed transitions keyed by from-stage. */
export const WORKFLOW_TRANSITIONS: Readonly<Record<WorkflowStage, readonly WorkflowStage[]>> = {
  idea: ['assigned', 'draft'],
  assigned: ['draft', 'submitted'],
  draft: ['submitted', 'draft', 'ready', 'scheduled', 'published'],
  submitted: [
    'draft',
    'fact_check',
    'copy_edit',
    'seo_review',
    'legal_review',
    'ready',
    'scheduled',
    'published',
    'archived',
  ],
  fact_check: [
    'copy_edit',
    'seo_review',
    'legal_review',
    'ready',
    'draft',
    'submitted',
    'archived',
  ],
  copy_edit: ['seo_review', 'legal_review', 'ready', 'draft', 'submitted', 'archived'],
  seo_review: ['legal_review', 'ready', 'draft', 'submitted', 'archived'],
  legal_review: ['ready', 'draft', 'submitted', 'archived'],
  ready: ['scheduled', 'published', 'draft', 'submitted', 'archived'],
  scheduled: ['published', 'ready', 'draft', 'archived'],
  published: ['updated', 'archived', 'retracted', 'draft'],
  updated: ['published', 'updated', 'archived', 'retracted', 'draft'],
  archived: ['draft'],
  retracted: ['draft', 'archived'],
}

export function isAllowedWorkflowTransition(from: WorkflowStage, to: WorkflowStage): boolean {
  if (from === to) return true
  return Boolean(WORKFLOW_TRANSITIONS[from]?.includes(to))
}

export function canActorTransition(
  actor: WorkflowActor,
  from: WorkflowStage,
  to: WorkflowStage,
): boolean {
  if (from === to) return true
  if (!isAllowedWorkflowTransition(from, to)) return false

  if (actor === 'reporter') {
    if (to === 'submitted' && REPORTER_STAGES.has(from)) return true
    if (to === 'draft' && (from === 'draft' || from === 'submitted')) return true
    return REPORTER_STAGES.has(from) && REPORTER_STAGES.has(to)
  }

  if (actor === 'editor') {
    if (to === 'draft' && from === 'submitted') return true
    if (PUBLISHER_ONLY_STAGES.has(to)) return false
    return true
  }

  if (actor === 'publisher') return true
  if (actor === 'system') {
    return from === 'scheduled' && to === 'published'
  }

  return false
}

export function reporterMayEditDraft(stage: WorkflowStage): boolean {
  return REPORTER_STAGES.has(stage)
}

export function isPublicWorkflowStage(stage: WorkflowStage): boolean {
  return PUBLIC_STAGES.has(stage)
}

export function isTerminalWorkflowStage(stage: WorkflowStage): boolean {
  return TERMINAL_STAGES.has(stage)
}

export function isPublicControlStage(stage: WorkflowStage): boolean {
  return PUBLIC_CONTROL_STAGES.has(stage)
}

export function editorReviewStages(): ReadonlySet<WorkflowStage> {
  return EDITOR_REVIEW_STAGES
}

export function reviewTimestampFieldForStage(
  stage: WorkflowStage,
):
  | 'submittedAt'
  | 'factCheckedAt'
  | 'copyEditedAt'
  | 'seoReviewedAt'
  | 'legalReviewedAt'
  | null {
  switch (stage) {
    case 'submitted':
      return 'submittedAt'
    case 'fact_check':
      return 'factCheckedAt'
    case 'copy_edit':
      return 'copyEditedAt'
    case 'seo_review':
      return 'seoReviewedAt'
    case 'legal_review':
      return 'legalReviewedAt'
    default:
      return null
  }
}

export function assertEnglishPublicationReady(input: {
  englishStatus?: EnglishStatus | string | null
  titleEn?: string | null
  bodyEn?: unknown
}): void {
  if (input.englishStatus !== 'published') return
  const hasTitle = Boolean(input.titleEn?.trim())
  const hasBody = Array.isArray(input.bodyEn) && input.bodyEn.length > 0
  if (!hasTitle || !hasBody) {
    throw new Error('English publication requires both titleEn and bodyEn.')
  }
}

export function assertPublishableHero(input: {
  status?: string | null
  workflowStage?: string | null
  heroImage?: unknown
}): void {
  const status = String(input.status ?? 'draft')
  const stage = String(input.workflowStage ?? 'draft')
  if (status !== 'published') return
  if (stage === 'archived' || stage === 'retracted') return
  if (!input.heroImage) {
    throw new Error('Published articles require a hero image.')
  }
}

export function isValidHttpUrl(value: unknown): boolean {
  if (typeof value !== 'string' || !value.trim()) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}
