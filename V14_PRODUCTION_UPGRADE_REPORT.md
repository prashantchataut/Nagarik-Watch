# Nagarik Watch V14 Production Upgrade Report

Date: 2026-07-06

## Executive summary

This pass converts the v13 build from a stronger visual/news shell into a more production-governed portal architecture. The most important upgrades are not cosmetic: the project now has hard launch gates, durable-storage paths for engagement/newsletter features, stricter newsroom access controls, stale-test cleanup, ad inventory enforcement, and a clearer CMS source-of-truth decision.

This does **not** mean the portal is launch-ready by itself. A production news portal still needs real legal registration data, editor identity, newsroom contact details, real content volume, a real Payload/Postgres deployment, real ad-provider/sales configuration, analytics, and provider health checks. The new code makes those gaps explicit and blocks a live launch when required values are missing.

## Skill lenses used

I used the repository's local skill/checklist material as the operating framework for this pass:

- `codebase-auditor`: structure scan, duplicate systems, stale tests, TODO/fallback searches.
- `nextjs-production-engineer`: route/API review, middleware/header fix, static verification scripts.
- `cms-content-architect`: canonical CMS decision, admin content queue, workflow stages.
- `security-hardening`: auth secret hard-fail, origin checks, role escalation removal, admin path authorization.
- `ad-ops-commercialization`: placement audit, ad registry verification, monetization surfaces.
- `editorial-product-strategist`: hub filtering, content-tag taxonomy, honest empty states.
- `trust-launch-review`: launch-readiness checks, legal/editor/commercial blockers.
- `accessibility-ux-review`: public copy cleanup, reader-facing fallback wording, admin navigation clarity.

These are project-local skill/checklist lenses, not separate ChatGPT tool calls.

## Major fixes implemented

### 1. Canonical CMS decision and launch gate

- Added `docs/adr/ADR-014-canonical-cms.md`.
- Declared Payload CMS as the canonical production CMS.
- Kept the custom web admin as operations/dev fallback rather than pretending there are two equal CMS systems.
- Added launch-gate requirements around `PAYLOAD_CONTENT_SOURCE=payload` for live deployments.

### 2. Durable reader engagement storage

- Rebuilt `apps/web/lib/engagement/store.ts`.
- Comments, poll votes, bookmarks, and reading history now use Postgres when `DATABASE_URL` is available.
- Dev/preview memory fallback remains for local work only.
- Added `engagementStorageMode()` so runtime/admin surfaces can tell what storage mode is active.
- Added `docs/adr/ADR-015-durable-engagement-storage.md`.

### 3. Durable newsletter storage

- Rebuilt `apps/web/app/api/newsletter/store.ts`.
- Newsletter pending/confirmed subscribers now use Postgres when `DATABASE_URL` exists.
- Updated newsletter subscribe/confirm routes to use async durable functions.
- Removed development-only confirm-link logging from the subscribe API.

### 4. Security hardening

- Production now fails fast if `AUTH_SECRET` / `BETTER_AUTH_SECRET` is missing or shorter than 32 characters.
- Public role self-escalation was removed by making the auth `role` field non-inputtable.
- Bootstrapped admin/editor accounts are assigned roles server-side after account creation.
- Added same-origin write protection for comments, bookmarks, reading history, poll votes, and newsletter subscription.
- Added admin path authorization rules so sensitive admin sections are role-gated on the server.
- Fixed middleware request-header stamping so admin layouts can reliably know the current path.

### 5. Admin and newsroom workflow repair

- Rebuilt `/admin/articles` from a broken duplicated editor-like page into a real article queue.
- Added workflow filters for idea, assigned, draft, editing, fact check, legal, scheduled, published, and archived.
- Added Payload canonical CMS notice and editor action links.
- Extended article workflow-stage support in admin article APIs.
- Added admin list support to the JSON article store.

### 6. Public editorial product upgrades

- Added editorial tags for editor picks, exclusive reports, data stories, reader submissions, video reports, and photo stories.
- Changed hub pages to filter by real content traits/tags instead of filling every hub with generic articles.
- Hubs with no matching content now show honest empty states rather than fake density.

### 7. Ad/commercial enforcement

- Added `scripts/audit-ad-placements.mjs`.
- The audit verifies all required placement keys exist and are rendered somewhere in the app.
- Required surfaces include home, article, category, latest, trending, hub, sidebar, inline, native, mobile, and billboard placements.
- Existing v13 commercial/ad page work is now protected by a static placement audit.

### 8. Launch-readiness enforcement

- Rebuilt `apps/web/lib/launch-readiness.ts`.
- Added hard checks for legal name, editor, registration, phone, address, canonical CMS, database, auth secret, ad provider/sales email, analytics, and content thresholds.
- Added `scripts/launch-gate.mjs`.
- Live mode now has explicit blockers instead of relying on a manual checklist.

### 9. Static architecture audits and CI integration

- Added `scripts/audit-architecture.mjs`.
- Added `audit:ads`, `audit:architecture`, `launch:gate`, and `verify:static` package scripts.
- Updated CI to run static product audits.
- Strengthened verification around banned public phrases, launch gates, auth posture, middleware behavior, ad coverage, and durable-storage tables.

### 10. Stale test cleanup

- Updated E2E article/search tests so they no longer assume fake seeded published articles.
- Removed stale seeded-content assumptions from search code comments.

## Files changed or added

Key files changed:

- `apps/web/lib/engagement/store.ts`
- `apps/web/app/api/newsletter/store.ts`
- `apps/web/app/api/newsletter/subscribe/route.ts`
- `apps/web/app/api/newsletter/confirm/route.ts`
- `apps/web/lib/auth/index.ts`
- `apps/web/lib/security/origin.ts`
- `apps/web/lib/admin-roles.ts`
- `apps/web/app/admin/layout.tsx`
- `apps/web/middleware.ts`
- `apps/web/lib/launch-readiness.ts`
- `apps/web/lib/content/store/json-store.ts`
- `apps/web/app/api/admin/articles/route.ts`
- `apps/web/app/api/admin/articles/[id]/route.ts`
- `apps/web/app/admin/articles/page.tsx`
- `apps/web/lib/content/seed/tags.ts`
- `apps/web/components/PublicHubPage.tsx`
- `e2e/article.spec.ts`
- `e2e/search.spec.ts`
- `package.json`
- `.github/workflows/ci.yml`

New files:

- `docs/adr/ADR-014-canonical-cms.md`
- `docs/adr/ADR-015-durable-engagement-storage.md`
- `scripts/audit-ad-placements.mjs`
- `scripts/audit-architecture.mjs`
- `scripts/launch-gate.mjs`
- `V14_PRODUCTION_UPGRADE_REPORT.md`

## Verification completed in this environment

The following checks passed:

```bash
node scripts/audit-public-surface.mjs
node scripts/audit-ad-placements.mjs
node scripts/audit-architecture.mjs
node scripts/launch-gate.mjs
```

Results:

- Public surface audit passed.
- Ad placement audit passed: 20 placements / 20 rendered.
- Architecture audit passed with one expected warning: memory fallback still exists for dev/preview, but launch gate blocks live without `DATABASE_URL`.
- Launch gate skipped strict live checks because `NEXT_PUBLIC_LAUNCH_STATUS` is not `live`.

Additional syntax checks passed on changed TypeScript and JavaScript files using:

```bash
node --check --experimental-strip-types <changed-file.ts>
node --check <changed-file.mjs>
```

## Verification blocked here

The following could not be run in this sandbox because project dependencies are not installed and `pnpm`/workspace packages are unavailable here:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm verify:launch
```

Run these in the real development environment before deployment. Do not consider this production-green until those pass.

## Remaining production blockers

These are not code-only tasks and still require real operational inputs:

1. Set real legal organization name, registration number, editor-in-chief, newsroom address, and contact phone.
2. Deploy and configure Payload CMS as the canonical production CMS.
3. Configure production Postgres via `DATABASE_URL`.
4. Configure a strong `AUTH_SECRET` / `BETTER_AUTH_SECRET`.
5. Configure ad provider, ad sales email, and campaign delivery/reporting workflow.
6. Configure analytics and privacy/legal documents.
7. Add a real newsroom content base before launch: minimum article count, recent content, and category coverage.
8. Configure live-data providers for weather, AQI, market and sports data.
9. Add real newsletter email delivery provider and bounce/unsubscribe handling.
10. Decide Hindi support properly as a full locale/content/SEO project, not a cosmetic toggle.

## Hard recommendation

Do not deploy as `live` until `pnpm verify:launch` passes with `NEXT_PUBLIC_LAUNCH_STATUS=live`. The new gate should be treated as the minimum launch contract.
