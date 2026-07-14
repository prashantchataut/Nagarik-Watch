/**
 * Compatibility re-export for newsletter route modules.
 * The canonical subscriber implementation lives in lib so admin and public
 * routes cannot create conflicting versions of the same database table.
 */
export {
  addPendingSubscriber,
  confirmSubscriber,
  getPendingSubscriber,
  isConfirmedSubscriber,
  listNewsletterSubscribers,
  removePendingSubscriber,
  upsertConfirmedNewsletterSubscriber,
} from '@/lib/newsletter-subscribers'
export type {
  NewsletterSubscriber,
  NewsletterSubscriberStatus,
  PendingSubscriber,
} from '@/lib/newsletter-subscribers'
