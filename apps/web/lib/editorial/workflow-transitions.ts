import type { WorkflowStage } from '@nagarikwatch/db'
import {
  canActorTransition as canActorTransitionCore,
  editorReviewStages as editorReviewStagesCore,
  isPublicWorkflowStage as isPublicWorkflowStageCore,
  isTerminalWorkflowStage as isTerminalWorkflowStageCore,
  reporterMayEditDraft as reporterMayEditDraftCore,
  type WorkflowActor,
} from '@nagarikwatch/db'
import type { NewsroomRole } from '@/lib/admin-roles'
import { CONTRIBUTOR_ROLES, EDITOR_ROLES, PUBLISHER_ROLES } from '@/lib/admin-roles'

export type { WorkflowActor }

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
  return canActorTransitionCore(actor, from, to)
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
  return reporterMayEditDraftCore(stage)
}

export function isPublicWorkflowStage(stage: WorkflowStage): boolean {
  return isPublicWorkflowStageCore(stage)
}

export function isTerminalWorkflowStage(stage: WorkflowStage): boolean {
  return isTerminalWorkflowStageCore(stage)
}

export function editorReviewStages(): ReadonlySet<WorkflowStage> {
  return editorReviewStagesCore()
}
