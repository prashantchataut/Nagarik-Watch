# Nagarik Watch deletion manifest

Date: 2026-08-28

This file separates **content/data that was safe to remove now** from **compatibility code that
should be deleted only after the Payload cutover is proven**. The distinction matters: deleting
recovery code before verifying every deployment would turn architecture cleanup into an outage.

## Deleted now — source-code journalism and obsolete calendar authoring

These files existed in the phase-1 redesigned archive and are removed in this phase:

1. `apps/web/data/articles.json`
2. `apps/admin/src/seed/fixtures.ts`
3. `apps/web/lib/content/seed/articles-1.ts`
4. `apps/web/lib/content/seed/articles-2.ts`
5. `apps/web/lib/content/seed/articles-3.ts`
6. `apps/web/lib/content/store/seed-edition/photo-story.ts`
7. `apps/web/lib/content/store/seed-edition/society.ts`
8. `apps/web/lib/content/store/seed-edition/index.ts`
9. `apps/web/lib/content/store/seed-edition/interview.ts`
10. `apps/web/lib/content/store/seed-edition/august.ts`
11. `apps/web/lib/content/store/seed-edition/video.ts`
12. `apps/web/lib/content/store/seed-edition/diaspora.ts`
13. `apps/web/lib/content/store/seed-edition/sports.ts`
14. `apps/web/lib/content/store/seed-edition/business.ts`
15. `apps/web/lib/content/store/seed-edition/education.ts`
16. `apps/web/lib/content/store/seed-edition/service.ts`
17. `apps/web/lib/content/store/seed-edition/literature.ts`
18. `apps/web/lib/content/store/seed-edition/world.ts`
19. `apps/web/lib/content/store/seed-edition/politics.ts`
20. `apps/web/lib/content/store/seed-edition/technology.ts`
21. `apps/web/lib/content/store/seed-edition/entertainment.ts`
22. `apps/web/lib/content/store/seed-edition/opinion.ts`
23. `apps/web/lib/content/store/seed-edition/health.ts`
24. `apps/web/lib/content/store/seed-edition/_longform.ts`
25. `apps/web/lib/content/store/seed-edition/_helpers.ts`
26. `apps/web/lib/content/store/seed-original.ts`
27. `scripts/generate-seed-edition-modules.mjs`
28. `scripts/reseed-edition.ts`
29. `scripts/seed-articles.mjs`
30. `scripts/seed-articles.ts`
31. `apps/web/components/admin/CalendarScheduleEditor.tsx`

Why these were removed:

- the article files were mutable editorial content disguised as application source;
- they could repopulate or visually pad a newsroom without an editor publishing through the CMS;
- the generation/reseed scripts preserved that failure mode;
- the calendar editor made operators transcribe a provider/government dataset by hand.

`apps/web/lib/content/store/json-store.ts` also rejects legacy `art-nw-*` and `art-ed-*` rows so
old seeded records cannot silently reappear from an existing fallback database.

## Delete after Payload cutover proof — local CMS compatibility layer

These are not normal production architecture anymore. They remain only because
`CONTENT_SOURCE=json` is an explicitly documented emergency/local recovery mode.

After every deployment has run Payload-only for an agreed observation window, there are no
recovery exercises depending on the local store, and ADR-014's cutover checklist is complete,
delete/refactor the following.

### Store implementation — delete

- `apps/web/lib/content/store/json-store.ts`
- `apps/web/lib/content/store/store-source.ts`
- `apps/web/lib/content/store/article-store-fallback.ts`
- `apps/web/lib/content/store/article-store-fallback.test.ts`

Then simplify `apps/web/lib/content/resolve-content-source.ts` to Payload only and remove the JSON
content-authority branch/tests.

### Duplicate local article CMS routes — delete

- `apps/web/app/admin/(desk)/articles/page.tsx`
- `apps/web/app/admin/(desk)/articles/new/page.tsx`
- `apps/web/app/admin/(desk)/articles/[id]/edit/page.tsx`
- `apps/web/app/api/admin/articles/route.ts`
- `apps/web/app/api/admin/articles/[id]/route.ts`

Today those pages redirect to Payload (or their write APIs block) whenever Payload is canonical,
so deleting them is a post-cutover cleanup, not a prerequisite for launch.

### Duplicate local taxonomy/media CMS routes — delete after replacing remaining local references

- `apps/web/app/admin/(desk)/categories/page.tsx`
- `apps/web/app/admin/(desk)/tags/page.tsx`
- `apps/web/app/admin/(desk)/topics/page.tsx`
- `apps/web/app/admin/(desk)/authors/page.tsx`
- `apps/web/app/admin/(desk)/media/page.tsx`
- `apps/web/app/api/admin/media/route.ts`
- `apps/web/app/api/admin/media/upload/route.ts`
- `apps/web/lib/taxonomy-admin.ts`
- `apps/web/lib/media-library.ts`

Before deleting the libraries, move any operational preference/reference use to Payload-backed
queries. Do not delete them just because the canonical nav already redirects to Payload.

### Fallback branches to remove, files to keep

These files have real Payload/operations responsibilities and must **not** be deleted wholesale:

- `apps/web/app/api/journalist/articles/route.ts` — remove the `createArticle` JSON fallback branch;
  keep the Payload journalist draft bridge.
- `apps/web/app/api/journalist/articles/[id]/route.ts` — remove local find/update fallback; keep
  Payload draft ownership/workflow handling.
- `apps/web/app/[locale]/journalist/articles/[id]/edit/page.tsx` — remove local article fallback;
  keep the journalist editor.
- `apps/web/lib/editorial/scheduled-publish.ts` — remove local-store scheduling branch; keep the
  Payload scheduled-publish job.
- `apps/web/lib/editorial/breaking-auto-boost.ts` — either implement a reviewed Payload mutation
  path or retire the auto-boost feature; do not leave a hidden local-CMS mutation path.
- `apps/web/lib/content/admin-dashboard.ts` — remove the local snapshot branch; keep canonical
  dashboard metrics.
- `apps/web/lib/content/revalidate-published.ts` — remove local store cache invalidation only.

### Legacy media compatibility — delete after migration

- `apps/web/lib/content/media-compat.ts`

Delete it only after existing legacy hero URLs have been migrated to canonical Payload Media and
no Patro/article code depends on URL normalization.

## Optional deletion — static Pages preview deployment

The live publication is dynamic CMS software. A static Cloudflare Pages build cannot reflect a
new Payload publish without rebuilding, so it must never be the launch authority.

If the team no longer needs static preview/recovery packaging, remove the preview-only path as a
separate cleanup, including its scripts/documentation references. Start with:

- `apps/web/scripts/build-pages-static.mjs`
- `apps/web/scripts/restore-pages-stash.mjs`
- `apps/web/scripts/static-desk-gateway.mjs`
- the `build:pages`, `deploy:pages`, and `restore:stash` package scripts
- legacy Cloudflare Pages helper scripts under `scripts/` after confirming they are not used by
  CI/operator runbooks.

Do **not** remove `apps/web/scripts/deploy-app-worker.mjs` or current dynamic deployment tooling
merely because their names contain Cloudflare.

## Keep — these are not hardcoded news

Do not delete these simply because they are code constants:

- `apps/web/lib/content/seed/categories.ts` — stable product taxonomy/default navigation;
- `apps/web/lib/content/seed/authors.ts` — shared desk identities, explicitly not fictional people;
- `apps/web/lib/content/seed/tags.ts` — intentionally empty; volatile topics are CMS-created;
- BS month names, zodiac identifiers, route IDs, validation bounds and ad placement IDs;
- tests and test fixtures that cannot become reader-facing production content;
- redirect routes such as `/nepse`, `/login`, `/register`, `/sports/live`, `/tag` while old links
  may exist externally.

## Cleanup that should be a refactor, not a deletion

`apps/web/app/globals.css` plus `editorial-redesign.css` are large and overlapping. They are real
technical debt, but deleting either without a dependency-backed build and browser regression pass
is unsafe. Consolidate them incrementally after visual tests are available.

The operational snapshot table/module is still named `nw_live_manual` / `live/manual.ts` even
though it now stores some provider-synchronized last-known-good data (notably the calendar). A
future migration should rename that storage concept to `live_snapshot`/`operational_live_record`.
That is a schema migration; do not delete the table while it contains the current validated
calendar/service snapshot.
