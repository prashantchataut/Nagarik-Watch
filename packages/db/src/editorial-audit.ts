export type EditorialAuditEventType =
  | 'article_created'
  | 'workflow_transition'
  | 'publication_status_changed'
  | 'correction_changed'
  | 'ai_assistance_changed'

export interface EditorialAuditEvent {
  eventType: EditorialAuditEventType
  fromValue?: string
  toValue?: string
  metadata?: Record<string, unknown>
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
}

function stableJson(value: unknown): string {
  return JSON.stringify(value ?? null)
}

/** Classify the small set of article changes that must be retained outside mutable versions. */
export function classifyEditorialAuditEvents(
  previousValue: unknown,
  nextValue: unknown,
  operation: 'create' | 'update',
): EditorialAuditEvent[] {
  const previous = asRecord(previousValue)
  const next = asRecord(nextValue)

  if (operation === 'create') {
    return [
      {
        eventType: 'article_created',
        toValue: String(next.workflowStage ?? 'idea'),
        metadata: { status: String(next._status ?? 'draft') },
      },
    ]
  }

  const events: EditorialAuditEvent[] = []
  const previousStage = String(previous.workflowStage ?? 'idea')
  const nextStage = String(next.workflowStage ?? previousStage)
  if (previousStage !== nextStage) {
    events.push({
      eventType: 'workflow_transition',
      fromValue: previousStage,
      toValue: nextStage,
    })
  }

  const previousStatus = String(previous._status ?? 'draft')
  const nextStatus = String(next._status ?? previousStatus)
  if (previousStatus !== nextStatus) {
    events.push({
      eventType: 'publication_status_changed',
      fromValue: previousStatus,
      toValue: nextStatus,
    })
  }

  if (stableJson(previous.corrections) !== stableJson(next.corrections)) {
    events.push({
      eventType: 'correction_changed',
      metadata: {
        previousCount: Array.isArray(previous.corrections) ? previous.corrections.length : 0,
        nextCount: Array.isArray(next.corrections) ? next.corrections.length : 0,
      },
    })
  }

  if (
    previous.aiSummary !== next.aiSummary ||
    previous.aiSummaryApproved !== next.aiSummaryApproved
  ) {
    events.push({
      eventType: 'ai_assistance_changed',
      metadata: {
        hadSuggestion: Boolean(previous.aiSummary),
        hasSuggestion: Boolean(next.aiSummary),
        wasApproved: previous.aiSummaryApproved === true,
        isApproved: next.aiSummaryApproved === true,
      },
    })
  }

  return events
}
