/**
 * Shared in-memory store for the newsletter double-opt-in flow.
 *
 * Both `/api/newsletter/subscribe` and `/api/newsletter/confirm` need to reach
 * the same pending/confirmed sets within a single server process. Next.js
 * resolves those two URLs to two separate route files, so without this shared
 * module each would get its own copy of the maps and confirmations would never
 * land.
 *
 * Singleton via `getSubscriberStore()` — first call creates, subsequent calls
 * return the same instance.
 *
 * PRODUCTION NOTE: This is process-local. On serverless (Vercel), each
 * instance has its own maps, so a subscribe and its confirm may not land on
 * the same instance. For real traffic, back this with Postgres (a
 * `newsletter_subscriber` table with status pending/confirmed) or Redis. The
 * call sites in subscribe/route.ts and confirm/route.ts won't change — only
 * the bodies of pendingSubscribers/confirmedSubscribers operations will.
 */

type PendingSubscriber = { email: string; token: string; createdAt: number }

type SubscriberStore = {
  pendingSubscribers: Map<string, PendingSubscriber>
  confirmedSubscribers: Set<string>
}

let cached: SubscriberStore | null = null

export function getSubscriberStore(): SubscriberStore {
  if (!cached) {
    cached = {
      pendingSubscribers: new Map(),
      confirmedSubscribers: new Set(),
    }
  }
  return cached
}
