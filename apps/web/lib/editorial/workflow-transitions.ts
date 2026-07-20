import type { WorkflowStage } from '@nagarikwatch/db'
import type { NewsroomRole } from '@/lib/admin-roles'
import {
  CONTRIBUTOR_ROLES,
  EDITOR_ROLES,
  PUBLISHER_ROLES,
} from '@/lib/admin-roles'

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
const PUBLISHER_ONLY_STAGES: ReadonlySet<WorkflowStage> = new Set(['scheduled', 'published', 'updated'])

/** Allowed transitions keyed by from-stage. */
const TRANSITIONS: Readonly<Record<WorkflowStage, readonly WorkflowStage[]>> = {
  idea: ['assigned', 'draft'],
  assigned: ['draft', 'submitted'],
  draft: ['submitted', 'draft'],
  submitted: ['draft', 'fact_check', 'copy_edit', 'seo_review', 'legal_review', 'ready', 'archived'],
  fact_check: ['copy_edit', 'seo_review', 'legal_review', 'ready', 'draft', 'submitted', 'archived'],
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

export function workflowActorForRole(role: NewsroomRole): WorkflowActor | null {
  if (PUBLISHER_ROLES.has(role) || role === 'admin' || role === 'super_admin') return 'publisher'
  if (EDITOR_ROLES.has(role)) return 'editor'
  if (CONTRIBUTOR_ROLES.has(role) && !EDITOR_ROLES.has(role)) return 'reporter'
  return null
}

export function canActorTransition(
  actor: WorkflowActor,
  from: WorkflowStage,
  to: WorkflowStage,
): boolean {
  if (from === to) return true
  const allowed = TRANSITIONS[from]
  if (!allowed?.includes(to)) return false

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

export function assertWorkflowTransition(input: {
  role: NewsroomRole
  from: WorkflowStage
  to: WorkflowStage
}): void {
  const actor = workflowActorForRole(input.role)
  if (!actor) throw new Error('Permission denied for this newsroom role.')
  if (!canActorTransition(actor, input.from, input.to)) {
    throw new Error(`Invalid workflow transition: ${input.from} → ${input.to}`)
  }
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

export function editorReviewStages(): ReadonlySet<WorkflowStage> {
  return EDITOR_REVIEW_STAGES
}
