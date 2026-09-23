import { classifyEditorialAuditEvents } from '@nagarikwatch/db'
import type { CollectionAfterChangeHook } from 'payload'

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
}

export const recordArticleAuditEvents: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  const next = asRecord(doc)
  const actor = asRecord(req.user)
  const events = classifyEditorialAuditEvents(previousDoc, doc, operation)

  for (const event of events) {
    await req.payload.create({
      collection: 'editorial-audit-events',
      overrideAccess: true,
      data: {
        occurredAt: new Date().toISOString(),
        eventType: event.eventType,
        resourceType: 'article',
        resourceId: String(next.id ?? ''),
        resourceLabel: String(next.titleNe ?? next.slug ?? next.id ?? 'Article'),
        actorId: actor.id == null ? undefined : String(actor.id),
        actorEmail: typeof actor.email === 'string' ? actor.email : undefined,
        fromValue: event.fromValue,
        toValue: event.toValue,
        metadata: event.metadata,
      },
    })
  }

  return doc
}
