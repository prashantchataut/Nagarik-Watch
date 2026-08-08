# Nagarik Watch V11 — Mobile, personalization, cookies and notification repair

Date: 2026-07-05

## What the uploaded briefs still require

The frontend cannot be judged only by how the homepage looks. The briefs require a news portal with mobile-first speed, permanent article URLs, NewsArticle schema, a 48-hour news sitemap, server-rendered article bodies, CMS-backed workflow, trust pages, clean reading mode, personalized topic following, moderated comments, PWA/offline support and typo-tolerant Nepali search.

The major remaining gaps are:

1. Full Payload/Postgres production source of truth, not seed files as production content.
2. True background push notifications with VAPID/FCM/OneSignal credentials, subscription storage and unsubscribe flow.
3. Real PWA offline article saves, not just shell caching.
4. Full mobile QA on 320, 375, 390, 414 and 768 px breakpoints with device screenshots.
5. Real newsroom workflows: assignment, review, fact-check, copy edit, SEO review, scheduling, revisions and audit logs.
6. Real comment moderation and anti-spam controls.
7. Audio articles, reading mode controls and text-size controls across article pages.
8. Full provider configuration for weather, AQI, NEPSE, forex, bullion, sports, election and exam results.
9. Typeahead/fuzzy Nepali and Romanized Nepali search.
10. Every public page needs a unique job, not a generic card layout.

## Work completed in this pass

### Mobile frontend repair

- Hid dense desktop-only top masthead details on small screens.
- Removed mobile primary-nav overflow and handed small screens to the hamburger and bottom nav.
- Added safe-area bottom padding so fixed mobile nav does not cover content.
- Reduced oversized wordmark and headline scaling on mobile.
- Added global overflow protection for images, SVGs, videos and long headings.
- Tightened article hero and body spacing for narrow screens.
- Tuned utilities and fact-check hero typography with clamp-based sizing.

### Cookie and consent system

- Replaced the old single analytics consent with a reader privacy desk.
- Split consent into essential, personalization and analytics.
- Migrated the old v2 consent key safely.
- Added a cookie and localStorage state so SSR/client surfaces can understand consent.
- Personalization remains off until the reader explicitly enables it.
- Analytics still stays off unless separately accepted.

### Personalization and recommendation engine

- Added a local reader fingerprint only after personalization-related actions.
- Stored reading history locally only after personalization consent.
- Synced reading progress to `/api/reading` when available.
- Made bookmarks persist locally, so the saved page works without account sync.
- Added a homepage `Recommended for you` rail that uses bookmarks, categories, authors and reading history.
- Added a cold-start rail when personalization is off.
- Improved ranking to use editorial priority, freshness, category affinity, author affinity, dwell time, reading completion, bookmark signals, fatigue penalty, trust score and diversity caps.

### Notification status

- Added `/api/notifications/breaking`, which returns current breaking stories from the content source.
- Added a visible notification settings card on the homepage.
- Added foreground browser alerts that poll breaking stories while the site is open.
- Added `manifest.webmanifest` and `/sw.js` so the PWA/push surface exists.
- Added service-worker push and notification-click handlers.

This is not yet a complete production push system. Real background push still requires subscription capture, server-side subscription storage, VAPID or provider credentials, topic preferences, unsubscribe, fatigue rules and a staff publishing trigger.

## Verification attempted

The JavaScript public-surface audit passed. Full pnpm verification remains dependent on package installation in an environment with registry access.

## Skills used

- impeccable: mobile hierarchy, article rhythm, cookie UX and reader surfaces.
- design-anti-slop: removed technical cookie copy, reduced generic mobile clutter, avoided fake notification claims.
- karpathy-guidelines: surgical changes rather than replacing the whole app.
- frontend-design: masthead, article, utilities, fact-check, saved and homepage rail work.
- accessibility-audit: tap targets, safe area, labels, reduced overflow risk, user-gesture notification permission.
- secure-code-guardian: consent boundaries, no analytics/personalization before opt-in, no fabricated push claim.
- seo-audit: kept SSR public shell and added manifest without converting to client-only SPA.
- performance-optimization: service-worker shell caching, reduced mobile overflow, non-blocking client enhancements.
- test-master: public-surface audit and launch-gate documentation.
- recommendation-reading-history-bookmark: affinity, reading history, bookmarks and hybrid recommendation ranking.
- pwa-offline-push: manifest, service worker scaffold, notification readiness.
