import { classifyEditorialAuditEvents } from '@nagarikwatch/db'
import type { CollectionAfterChangeHook } from 'payload'

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
}

/**
 * Append the editorial ledger rows for one article change.
 *
 * Ordering and failure behaviour are deliberate, and they are the whole reason
 * this hook is not three lines shorter.
 *
 * `afterChange` runs *after* the article write has committed, so throwing from
 * here cannot undo the change -- it only aborts the rest of the hook chain.
 * `revalidatePublishedArticle` is in that chain, and it is what pushes a
 * published story to the reader site. So an unguarded audit write sitting ahead
 * of it means a failed ledger insert leaves the article saved, published, and
 * invisible to readers, with nothing pointing at the audit row as the cause.
 * That is the same shape as the 30-second publish 404 already fixed on this
 * branch, and it is worth avoiding twice.
 *
 * Hence: this hook is registered after revalidation, and it never throws. The
 * ledger is a convenience view over changes Payload's own versions already
 * retain, so losing a row degrades reporting; blocking the save would degrade
 * publishing. A failure is logged loudly rather than swallowed, because a
 * silently thinning audit trail is worse than a noisy one.
 *
 * Events are written sequentially rather than with `Promise.all`: a single
 * article save produces at most a handful, and sequential writes keep
 * `occurredAt` ordering intact and avoid a burst of concurrent inserts on a
 * connection pool this repo has already had to constrain.
 */
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
    try {
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
    } catch (error) {
      req.payload.logger.error(
        { err: error, eventType: event.eventType, resourceId: String(next.id ?? '') },
        'editorial audit event was not recorded',
      )
    }
  }

  return doc
}
