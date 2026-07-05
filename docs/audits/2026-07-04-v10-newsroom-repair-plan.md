# Nagarik Watch V10 Newsroom Repair Plan

Date: 2026-07-04

## What this pass fixed

1. Removed the public external-source rail. The homepage now surfaces Nagarik Watch stories from the content store instead of raw headlines from other publishers.
2. Removed Kathmandu Post from the RSS ingest registry.
3. Kept RSS/wire intake as a staff-only lead discovery tool, not a public content substitute.
4. Fixed the likely Better Auth invalid-origin failure by deriving trusted origins from `SITE_URL`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL`, Vercel deployment URLs and localhost.
5. Added password visibility controls to admin login, reader login and reader signup.
6. Removed public admin links from empty homepage and category empty states.
7. Redesigned `/utilities` as a daily service desk with provider labelling, market glance, calendar and converter tools.
8. Redesigned `/fact-check` as a verification desk with verdict labels, workflow and claim submission path.
9. Improved article recommendations by using title/deck term overlap, category match, freshness, diversity and trust scoring.
10. Corrected recommendation scoring so quality/trust is a positive signal, not a penalty.
11. Gated analytics behind explicit cookie consent.
12. Refined the SVG logo and generated a model prompt for a proper transparent PNG brand mark.

## Editorial rule for researched news

Do not copy competitor body text, images or ledes. Do not relabel another publisher's work as Nagarik Watch reporting. The correct flow is:

1. Editors browse source headlines in the staff-only wire desk.
2. A source item can become a draft only with source URL and source name retained in metadata.
3. A Nagarik Watch editor writes an original summary or original reporting from primary sources.
4. Public pages show Nagarik Watch content only after review and publication.
5. Aggregated/wire articles must retain source attribution. If attribution is not acceptable, do not publish the article.

## P0 remaining before launch

- Run the full pnpm gate in an environment with dependencies installed.
- Deploy with real `SITE_URL`, `BETTER_AUTH_URL`, auth secret, database and content source.
- Verify admin login on the deployed domain after env changes.
- Remove any public route that has no real reader function.
- Confirm every footer/nav route returns 200.
- Fill fact-check with real claim checks only after editorial review.

## Page-by-page next plan

### Homepage
- Lead story, secondary desk, utility desk and province desk are the correct top-level modules.
- Remove empty ad slots until a real ad provider exists.
- Add an editor-curated top story control in CMS.

### Article pages
- Keep one bookmark/save control only.
- Preserve clear byline, published time, source attribution, image credit and correction link.
- Add key-points only when edited by humans.

### Utilities
- Keep weather, AQI, NEPSE, metals, forex, calendar and converters.
- Add timestamps and provider labels to every data point.
- Do not show fake widgets or raw provider implementation labels.

### Fact-check
- Use a specific content type with claim, verdict, evidence, sources, correction path and editor.
- Do not mix ordinary news with fact-check once CMS supports the type.

### Auth
- Reader login is for saved stories and reading history.
- Newsroom login is staff-only and redirecting to `/admin/dashboard` after staff login is normal.
- Self-service password reset remains a launch blocker.

### Admin
- `Invalid origin` is an env/trusted-origin issue. Set `SITE_URL` and `BETTER_AUTH_URL` to the deployed origin.
- Staff accounts should be provisioned by env or a super-admin, not public signup.

### Recommendations
- Current version is deterministic content/freshness/category scoring.
- Next version should persist view, save, share and completion events in Postgres.
- Future versions can add collaborative filtering only after there is enough reader signal.

## Skills used

- impeccable: UI hierarchy, typography, form quality, trust surfaces.
- design-anti-slop: removal of generic source rail, card-grid slop, public scaffold language and side-stripe accents.
- karpathy-guidelines: surgical changes, no fake features, no speculative rewrite.
- incremental-implementation: independent slices for auth, public homepage, utilities, fact-check, cookies, recommendation.
- verification-before-completion: no full completion claim without pnpm gate.
- frontend-design: masthead, utilities, fact-check, auth and article reading surfaces.
- accessibility-audit: password controls, labels, aria state, no public admin dead ends.
- secure-code-guardian: auth origins, staff-only admin separation, cookie consent.
- seo-audit: public sources, canonical/env risks, noindex for auth.
- test-master: public-surface audit and launch gate plan.
- logo-design: refined mark direction and image-model prompt.
- content-strategy/copywriting: honest sourcing, no fake wire relabeling, page-specific functionality.
