# Advanced News Portal Scaffold

This implementation pass turns the early reader app into a broader production scaffold for a national-level Nepali news portal. It does not claim external integrations are live.

## Implemented Surfaces

- Public hubs: latest, trending, most-read, editor picks, exclusive, fact-check, opinion, reader corner, market, sports, live sports, election, results, disaster alerts, video, photos, data stories, archive, submit story, membership.
- Trust pages: team, editorial policy, corrections policy, fact-check policy, terms, advertise, plus existing about, ethics, privacy and contact.
- SEO endpoints: `/sitemap.xml`, `/news-sitemap.xml`, `/rss.xml`, `/robots.txt`, Organization JSON-LD and WebSite SearchAction JSON-LD.
- Regional/topic scaffolds: `/province/[slug]`, `/district/[slug]`, `/tag/[slug]`, existing `/topic/[slug]`.
- Admin shell: login scaffold, dashboard, article creation/edit routes, media, taxonomies, authors, users, roles, moderation, submissions, polls, live blogs/widgets, ads, newsletter, SEO, settings and audit log.

## Production Boundaries

- Mock live widgets are labelled `MOCK` and include source/timestamp metadata.
- Admin login is disabled until real auth is configured.
- Legal, registration, ownership and editor fields are placeholders until manually verified.
- ClaimReview schema is intentionally not emitted until real fact-check claim data exists.
- AI features are scaffolded as editor-approved workflow requirements only; AI must not auto-publish.

## Manual Integrations Required

- Register publication details and fill `NEXT_PUBLIC_DOIB_NUMBER`.
- Configure `DATABASE_URL`, Payload/Better Auth, role protection and admin route guards.
- Choose live-data providers for weather, AQI, NEPSE, forex, bullion, sports, disaster alerts, elections and exams.
- Verify Search Console, submit Google Publisher Center application, upload publication logo and validate structured data.
- Replace seed content with CMS-managed content and editorial workflow enforcement.

## Database Model Coverage

The TypeScript content model now includes article trust fields, author expertise fields, user/role/permission scaffolds, comments, polls, reader submissions, audit logs and API data cache interfaces. Persisted migrations still need to be added when the CMS/database adapter is finalized.
