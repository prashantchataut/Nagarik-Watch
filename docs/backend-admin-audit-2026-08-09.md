# Nagarik Watch Backend & Admin Production Audit

**Date:** 2026-08-09  
**Scope:** `apps/admin` Payload CMS, `apps/web` newsroom/reader integration, Postgres, media storage, publication/revalidation, performance-sensitive request paths, health/ops tooling.  
**Primary incident symptoms:** published stories missing from the reader, admin publishes not appearing on the reader, media upload 502, Next image 400, database-not-connected messaging, ~10 second public/admin loads.

## Executive conclusion

The production symptoms are not one bug. They are the result of **content-authority configuration drift plus several request-path and media defects**.

Nagarik Watch contains two editorial persistence paths:

1. `apps/admin` — Payload CMS, intended to be the canonical production newsroom.
2. `apps/web` — reader site plus an older/custom newsroom desk backed by the `nw_articles` operational store.

That split is valid for preview/migration, but unsafe in live mode unless the web deployment is explicitly configured with `CONTENT_SOURCE=payload` and the Payload URL. Before this audit, a production configuration could drift back to the local/shadow store and still accept editorial writes. An editor could therefore receive a successful save/publish response for a story that the public reader was never going to query.

The code now **fails closed for live editorial writes** when content authority is ambiguous. Live mode cannot silently publish into the shadow store.

The other large contributors were:

- `noIndex` was incorrectly treated as a publication visibility switch, hiding legitimately published stories.
- Payload publication has two state dimensions (`_status` and `workflowStage`) and the UI did not explain the second gate clearly.
- Payload's publish hook could wait up to five seconds for the reader revalidation webhook and did not invalidate unpublishes/old slugs completely.
- every anonymous public request could initialize Better Auth and touch Postgres just to discover there was no user session.
- the admin login page could bcrypt/rewrite boot-account passwords on every render.
- the homepage made redundant cross-service Payload reads.
- the admin dashboard put optional analytics/ad queries on its critical response path.
- the legacy media validator rejected valid WebP/AVIF content; storage-provider errors were too opaque; metadata could fall back to process memory after a production upload.
- the canonical Payload media deployment requires a Vercel Blob connection in the **Payload project**; generic S3/R2 env values do not wire the adapter currently configured in `payload.config.ts`.
- the web and Payload apps did not normalize the database connection/TLS configuration consistently.
- health diagnostics could report a configured-but-unreachable database as if `DATABASE_URL` were simply missing.
- old content containing `imgs.search.brave.com` URLs was outside Next Image's allowlist, producing the observed `_next/image` 400.

## Incident map

| Symptom | Root cause(s) found | Source resolution | Production action still required |
|---|---|---|---|
| Published stories missing | `noIndex` included in public access filter; dual `_status` + workflow gate; possible web/Payload content-source drift | Removed `noIndex` from public visibility; clarified publication gate; added publication-drift count; live source now fail-closed | Ensure web has `CONTENT_SOURCE=payload`; inspect CMS `/healthz` `publicationDrift`; republish drifted documents correctly |
| Admin publish does not appear on frontend | Shadow-store writes could succeed while reader used Payload; revalidation incomplete/slow; source env split across deployments | Blocked local writes in canonical/live-misconfigured mode; redirects content editing to Payload; revalidation covers publish/update/unpublish and old+new paths | Set matching Payload URLs/secrets on both projects, redeploy both, verify webhook |
| Image upload 502 | Mixed legacy uploader path; storage token/provider rejection; canonical Payload Blob token possibly absent | Better provider errors; production metadata fallback removed; Payload health reports storage readiness; docs corrected | Attach Vercel Blob to Payload project and confirm `BLOB_READ_WRITE_TOKEN`; use Payload Media in canonical mode |
| Next image 400 | `imgs.search.brave.com` not an allowed Next Image remote origin; Blob host family also needed | Added exact Brave compatibility host and Vercel public Blob host pattern | Migrate Brave-proxy images into owned media, then remove the Brave compatibility allowlist |
| Some WebP/AVIF uploads fail | Incorrect WebP magic-byte sniff; AVIF declared as allowed but not sniffed | Correct WebP RIFF/WEBP detection, AVIF `ftyp` detection, MIME mismatch validation + tests | Redeploy |
| “Database not connected” | Pool cooldown/failure was interpreted as missing URL; admin/web TLS behavior differed | Accurate probe state/code/detail; Payload DB alias/TLS normalization aligned with web | Verify actual `DATABASE_URL`, network/TLS, DB capacity on both deployments |
| ~10 second public loads | Anonymous session DB lookup; repeated Payload homepage calls; CMS timeout not bounded tightly | Cookie precheck bypasses Better Auth/DB for anonymous users; homepage article fetch consolidated; 4s bounded CMS reads | Redeploy, then measure cold/warm latency from production |
| ~10 second admin load/login | Boot-account password repair in login request; optional dashboard analytics on critical path; DB/CMS failures wait | Login repair no longer blocking by default; analytics streams behind Suspense; admin bridge timeouts bounded | Redeploy; run explicit password repair only when rotating/recovering boot accounts |

## Critical and high-severity defects fixed

### 1. Live content authority could split between two stores — CRITICAL

The repo deliberately contains a soft desk and a canonical Payload CMS. The failure mode was that a live web deployment could still run with `CONTENT_SOURCE=json`. The custom admin APIs would then write `nw_articles`, while another deployment/configuration could read Payload. This is the cleanest explanation for “publish succeeded but frontend did not change.”

**Fix:**

- `isPayloadSourceMisconfigured()` now treats `NEXT_PUBLIC_LAUNCH_STATUS=live` + non-Payload source as invalid.
- reader content resolution fails closed instead of falling through to the shadow store.
- local article/media writes return `503` for live misconfiguration and `409` when Payload is canonical.
- article/media admin pages redirect editors to launch diagnostics or Payload rather than letting them edit the wrong store.
- a regression test covers the live + JSON-store failure mode.

**Invariant after fix:** a declared live deployment cannot claim success for a local editorial write that the public reader is not supposed to consume.

### 2. `noIndex` incorrectly hid public journalism — CRITICAL

Both Payload access control and the web Payload source required `noIndex != true` for public reads. `noIndex` is an SEO/distribution directive, not an editorial visibility state. A published story marked no-index could disappear from homepage/category/direct public API results.

**Fix:** public visibility is now based on:

- Payload `_status = published`
- `workflowStage` in `scheduled | published | updated`
- `publishAt <= now`

`noIndex` is no longer a public-read gate.

A related distribution inconsistency was also fixed: card projections now carry `noIndex` / `includeInNewsSitemap`, the normal sitemap excludes no-index article URLs, the Google News sitemap also respects `includeInNewsSitemap`, and image/video distribution uses only distributable stories.

### 3. Publication had an under-explained double gate — HIGH

Payload documents use both `_status` (draft/published) and Nagarik Watch's editorial `workflowStage`. An editor could select a workflow label that reads “Published” while leaving the Payload document itself in Draft. The public API correctly hides such a row, but the admin UI made the state model easy to misunderstand.

**Fix:** the workflow field now explicitly states that the Payload **Publish** action is also required. Admin `/healthz` reports `publicationDrift`: documents whose workflow looks public/scheduled while `_status` is still draft.

This keeps the editorial workflow model without pretending a workflow label is the same thing as Payload publication state.

### 4. Revalidation blocked the CMS and missed state transitions — HIGH

The Payload `afterChange` hook previously waited as long as five seconds for the web origin. A slow/cold reader deployment therefore made Publish itself feel slow. It only invalidated the current public location and did not correctly cover unpublish/archive/retract or an old URL after a slug/category change.

**Fix:**

- webhook timeout defaults to 1.5s (`NW_REVALIDATE_TIMEOUT_MS`, bounded 0.5–5s).
- hook runs when the previous **or** current document is reader-visible.
- webhook payload carries old and new slug/category location.
- web revalidation invalidates both locations.
- unpublish does not create a reader notification.
- author/tag relationship lookups run concurrently.
- `REVALIDATE_SECRET` readiness threshold is aligned to the 32-character runtime requirement.

Publishing remains successful if the reader webhook is temporarily unavailable; normal short reader cache intervals remain a backstop.

### 5. Canonical media storage was easy to configure incorrectly — HIGH

`apps/admin/src/payload.config.ts` uses `@payloadcms/storage-vercel-blob`. The old deployment guidance implied generic S3-compatible variables were enough. They are not connected to the current Payload adapter.

**Fix:** deployment documentation and health checks now reflect the implementation. Payload `/healthz` reports `mediaStorage`, `mediaUploadReady`, and a configuration hint if Blob is missing. Production health is degraded when canonical media storage is unwired.

**Required production action:** attach a Vercel Blob store to the Payload project so that project's environment receives `BLOB_READ_WRITE_TOKEN`.

### 6. Legacy upload validation rejected valid images — HIGH

The legacy web-desk media validator's WebP signature was wrong and AVIF had no signature implementation despite being listed as accepted.

**Fix:**

- proper `RIFF....WEBP` detection
- AVIF/AVIS `ftyp` brand detection
- declared MIME/content mismatch rejection
- test cases for PNG, empty input, executable masquerading as image, WebP, AVIF, and MIME mismatch

### 7. Storage errors were hidden or misleading — HIGH

The R2 adapter swallowed too broad a class of errors as “Cloudflare unavailable,” while the upload API returned a generic 502. If the uploaded object succeeded but media metadata could not persist, production could fall back to in-process memory and appear to work until the next cold start.

**Fix:**

- only true Cloudflare-context absence returns an R2 “not available” null.
- actual provider failures bubble to the upload route.
- Blob-token/configuration errors return actionable `503` diagnostics.
- generic provider rejection remains `502` with bounded detail.
- production refuses volatile in-memory media metadata fallback.
- legacy server-upload path returns `413` for >4MB on Vercel and directs editors to canonical Payload client uploads.

### 8. Web and CMS database behavior could disagree — HIGH

The web app normalized common database aliases and Aiven TLS behavior. Payload used the raw `DATABASE_URL`. The same database deployment could therefore behave differently between reader and CMS.

**Fix:** Payload now resolves the same common Postgres aliases and applies consistent Aiven/explicit TLS normalization. Production still requires a real DB and migrations.

### 9. Database diagnostics confused “configured but down” with “not configured” — HIGH

The shared pool intentionally enters a cooldown after failed connection attempts. The old operator probe treated a null pool during that state as if no DB URL existed.

**Fix:** shared-pool state now records the last connection error/code and cooldown. Health/login diagnostics distinguish missing URL, DNS, TLS, credentials/capacity where available, cooldown, and generic connection failure. The Payload health endpoint similarly returns a bounded diagnostic code/detail rather than only “database check failed.”

## Performance defects fixed

### 10. Anonymous readers could pay an auth/database cost on every page — HIGH

The public shell calls the reader session helper. Previously that could initialize Better Auth and hit Postgres even when the request had no Better Auth session cookie.

**Fix:** requests without Better Auth session/session-cache cookies return anonymous immediately, avoiding auth initialization and the DB entirely for the common public-reader path.

### 11. Admin login performed password repair in the request — HIGH

The admin login page forced newsroom boot-account password synchronization on every render. Password hashing plus SQL writes is intentionally expensive and should not be on a login-page GET.

**Fix:** production login no longer blocks on password repair. Normal boot provisioning is scheduled non-blockingly. `AUTH_BOOT_REPAIR_ON_LOGIN=true` is an explicit temporary recovery/rotation switch.

### 12. Admin dashboard waited for optional analytics — MEDIUM/HIGH

Most-read, trending, ad summaries and engagement aggregates all sat in the same initial `Promise.all` as the editorial snapshot. With a one-connection serverless shared pool, these could queue and delay the entire page.

**Fix:** the first response waits only for editorial snapshot/categories/pending reviews. Optional analytics/ad signals render behind a Suspense boundary.

### 13. Homepage multiplied CMS cold-start latency — HIGH

The Payload homepage source made several near-identical article REST calls (latest/lead/featured/secondary), and the page then made another general story fetch.

**Fix:** one bounded article request (up to 120) plus category request now composes the homepage in memory. The page reuses that edition catalog rather than issuing another generic story query. Reader CMS fetches default to a 4s timeout (`NW_PAYLOAD_READ_TIMEOUT_MS`). Privileged web→Payload calls use a separate 4s default (`NW_PAYLOAD_ADMIN_TIMEOUT_MS`).

### 14. Soft-store CRUD rewrote too much data — MEDIUM/HIGH

The legacy JSON/Postgres desk performed broad reads and could rewrite the whole article table for simple CRUD operations. It also issued a legacy cleanup delete during ordinary reads.

**Fix:** create/update/delete now use targeted mutations; admin list and dashboard snapshot use SQL filtering/count/aggregation when Postgres is available; indexes were added for workflow/published time and update time; cleanup work was removed from the read path.

The live system should still use Payload; this improves preview/migration and protects against operational latency.

## Other logical inconsistencies fixed

### Comments default mismatch

Payload defaulted article comments to false while the soft-store create path defaulted them to true. The web desk now only enables comments when explicitly requested.

### Updated-stage SEO mismatch

The custom admin API only applied public SEO defaults for `published`, not `updated`. `updated` now receives the same public defaults.

### Next Image legacy-origin failure

The observed URL `/_next/image?url=https://imgs.search.brave.com/...` is a remote optimized image. The source origin was not in `remotePatterns`, so Next rejects it. The config now allows only the exact Brave image proxy host as a migration compatibility exception and allows Vercel's public Blob hostname family for canonical media. It does **not** open arbitrary HTTPS hosts.

No Brave proxy URL exists in the source tree; it is likely stored in existing content/data. Migrate those objects to licensed, owned media and remove the compatibility host later.

### Route audit was not fresh-checkout safe

`node scripts/route-matrix.mjs` assumed `docs/audits` already existed and crashed with `ENOENT`. It now creates the directory recursively before writing the 165-route matrix.

### Scheduling readiness wording overstated behavior

The reader access filter can eventually expose a due scheduled Payload story through a fresh query even when the worker has not promoted its workflow state. The old launch diagnostic said such stories simply “stay dark.” It now correctly states that without the sub-daily worker, workflow promotion, notifications and deterministic cache revalidation are not guaranteed.

## Production scheduling dependency

`/api/cron/scheduled-publish` is **not** in the sub-daily Vercel cron set. The repository intentionally runs it from `.github/workflows/ops-crons.yml` every five minutes because the documented Vercel plan constraints only permit the daily schedules configured in `vercel.json`.

This requires repository secrets:

- `CRON_SECRET` — at least 32 characters, matching the web deployment.
- `CRON_BASE_URL` — production web origin, or the workflow defaults to `https://www.nagarikwatch.com`.

The launch gate should show a fresh `scheduled-publish` heartbeat before relying on scheduled publishing.

## Required production environment matrix

These are two deployments. Setting a variable on one does not configure the other.

| Setting | Reader/web project | Payload CMS project | Requirement |
|---|---:|---:|---|
| `DATABASE_URL` | yes | yes | Same reachable managed Postgres unless intentionally separated with complete schema planning |
| `CONTENT_SOURCE=payload` | **yes** | n/a | Mandatory for a declared live reader |
| `PAYLOAD_PUBLIC_SERVER_URL` | CMS origin | self CMS origin | Must be HTTPS production CMS URL |
| `PAYLOAD_ADMIN_URL` | CMS `/admin` | optional | Used for newsroom redirects |
| `PAYLOAD_API_TOKEN` | yes for journalist bridge | token originates here | Least-privilege service account |
| `PAYLOAD_SECRET` | no | **yes** | 32+ random chars |
| `AUTH_SECRET` / `BETTER_AUTH_SECRET` | **yes** | no | 32+ random chars |
| `REVALIDATE_SECRET` | **same value** | **same value** | 32+ random chars |
| `NEXT_PUBLIC_SITE_URL` | reader origin | reader origin | Canonical public site |
| `NEXT_PUBLIC_LAUNCH_STATUS=live` | yes when actually live | n/a | Turns config drift into a hard failure |
| `BLOB_READ_WRITE_TOKEN` | only for legacy web uploader if used | **yes** | Canonical Payload Media requires it |
| `PAYLOAD_DB_PUSH=false` | n/a | **yes** | Production uses migrations |
| `CRON_SECRET` | **yes** | n/a | Must match GitHub Actions secret |
| `NW_PAYLOAD_READ_TIMEOUT_MS` | recommended `4000` | n/a | Reader→CMS bound |
| `NW_PAYLOAD_ADMIN_TIMEOUT_MS` | recommended `4000` | n/a | privileged bridge bound |
| `NW_REVALIDATE_TIMEOUT_MS` | n/a | recommended `1500` | CMS→reader webhook bound |

## Deployment order

1. Back up production Postgres and confirm provider reachability/capacity.
2. Configure the Payload project: database, Payload secret/URL, reader URL, shared revalidation secret, Blob attachment/token, `PAYLOAD_DB_PUSH=false`.
3. Apply reviewed Payload migrations.
4. Deploy Payload and verify `/healthz` before changing the reader.
5. Configure the reader project with `CONTENT_SOURCE=payload`, CMS URLs/API token, database/auth secrets, shared revalidation secret, and `NEXT_PUBLIC_LAUNCH_STATUS=live`.
6. Apply operational migrations (`pnpm migrate:ops`) rather than relying on first-request DDL.
7. Deploy the reader.
8. Confirm GitHub Actions `CRON_SECRET`/`CRON_BASE_URL` and a fresh scheduled-publish heartbeat.
9. Execute the verification protocol below.

## Verification protocol after deploy

### Reader health

Request `/api/health` on the web origin. Expected:

- HTTP 200
- `status: "ok"`
- `contentMode: "payload"`
- `launchStatus: "live"`
- configuration pass
- database pass
- Payload pass
- canonical media is reported as owned by the Payload deployment

A 503 should now carry enough detail to distinguish source configuration, DB and CMS reachability instead of only “database not connected.”

### CMS health

Request `/healthz` on the Payload origin. Expected:

- HTTP 200
- `database: "reachable"`
- `mediaUploadReady: true`
- `content.categories > 0`
- `content.publicArticles` matches the expected published corpus
- `content.publicationDrift: 0`

If `publicationDrift > 0`, inspect those rows: their workflow stage claims scheduled/published/updated while Payload `_status` is still draft.

### Publish smoke test

Create a clearly identifiable test article in Payload with a valid category/author/body/hero. Keep it as draft first and verify it is absent publicly. Then use the Payload Publish action with a public workflow stage and a `publishAt` at or before now.

Verify:

- it appears in Payload public API;
- its direct reader URL returns the article;
- it appears in Latest and the appropriate category;
- homepage inclusion follows editorial placement rather than being required for basic publication;
- CMS save does not pause for multiple seconds waiting on revalidation.

Then change slug/category once and verify the new path is invalidated/rendered; archive/unpublish it and verify the old public cache no longer serves it.

### `noIndex` smoke test

Publish another test story with `noIndex=true`.

Expected behavior:

- direct public page remains readable;
- public article/list API may return it;
- HTML robots metadata is no-index;
- it is absent from the normal sitemap, Google News sitemap and media distribution sitemaps.

### Media smoke test

Upload JPEG, WebP and AVIF from Payload Media. Expected:

- upload succeeds;
- returned media URL is a durable Vercel Blob URL;
- article hero renders through Next Image without a 400;
- alt text is present;
- a cold redeploy does not lose the media library record.

For existing Brave-proxy images, verify the temporary compatibility host renders, then migrate the actual media into Payload/Blob and replace stored URLs.

### Performance smoke test

Measure cold and warm requests separately.

For an anonymous reader homepage, confirm no Better Auth/Postgres session query occurs when no Better Auth cookie exists. Check homepage server timing/logs for one article CMS request plus category/poll work rather than repeated lead/featured/latest calls.

For admin login, confirm a GET does not perform forced boot-account password rewrites. For dashboard, confirm core editorial content arrives before optional reader/ad analytics if those queries are slow.

A 10-second baseline after these changes should be treated as an infrastructure/cold-start/database problem, not normal application behavior; the critical cross-service waits are now bounded and several unnecessary DB/CMS calls have been removed.

## Remaining backend issues discovered but not fully removed in this incident pass

These are not blockers for fixing the reported production failure, but they should enter the next backend hardening milestone.

### A. Runtime lazy DDL in operational modules — MEDIUM

Several `nw_*` stores still call `ensureOperationalSchema()` on first use. On a cold instance that can execute `CREATE TABLE`/`ALTER`/`CREATE INDEX`, adding latency and requiring DDL privilege at runtime.

**Recommended next step:** production deploy runs `pnpm migrate:ops`; make lazy DDL development/preview-only and fail with a migration-readiness error in live mode.

### B. Gallery/video list pagination is sample-based — MEDIUM

Payload `getStories()` currently fetches a bounded larger sample for `hasGallery`/`hasVideo`, filters in application code, then derives pagination totals from that sample. Beyond the sample window, totals/pages can be wrong.

**Recommended next step:** materialize/index media-type flags in Payload or construct database-queryable criteria, then paginate server-side.

### C. Soft-store source provenance is weaker than Payload — LOW/MEDIUM

Payload requires source name, URL and source publication time for aggregated/wire content. The legacy `StoredArticle` path does not model `sourcePublishedAt` equivalently.

**Recommended next step:** either align the soft schema for migration fidelity or freeze it as preview-only and remove it after Payload cutover.

### D. Media permission surfaces are asymmetric — LOW/POLICY

The web media-library page is limited to media-manager roles while the upload API also permits editorial contributors. Payload similarly allows newsroom contributors to create media. This may be intentional for inline article uploads, but it should be documented as policy rather than accidental behavior.

### E. CMS outage fallback can look like an empty edition — MEDIUM

The homepage catches a CMS failure and can render the empty-edition state. On a cold cache during a CMS outage, readers may see “no edition” rather than the last known good journalism.

**Recommended next step:** keep a durable last-known-good homepage/category snapshot or edge cache that survives temporary CMS unavailability.

### F. One DB connection per web instance is protective but constraining — MEDIUM/OPS

The shared pool is deliberately capped at one connection per warm serverless instance after previous Postgres `53300` saturation. Increasing it blindly is not the answer, but DB-heavy admin screens can queue work.

**Recommended next step:** verify managed Postgres connection limits and pooler mode, use a transaction pooler where appropriate, keep optional admin work streamed/batched, and change `NW_DB_POOL_MAX` only after capacity testing.

## Files materially changed in this pass

Core CMS/publication:

- `apps/admin/src/access/rbac.ts`
- `apps/admin/src/collections/Articles.ts`
- `apps/admin/src/hooks/revalidate.ts`
- `apps/admin/src/payload.config.ts`
- `apps/admin/src/app/healthz/route.ts`
- `apps/web/lib/content/payload-source.ts`
- `apps/web/lib/content/payload-admin-client.ts`
- `apps/web/lib/content/resolve-content-source.ts`
- `apps/web/lib/content/payload-cutover.ts`
- `apps/web/app/api/revalidate/route.ts`

Reader/admin performance and DB:

- `apps/web/lib/auth/session.ts`
- `apps/web/lib/auth/index.ts`
- `apps/web/app/admin/(public)/login/page.tsx`
- `apps/web/app/admin/(desk)/dashboard/page.tsx`
- `apps/web/lib/content/store/json-store.ts`
- `apps/web/lib/pg-pool.ts`
- `apps/web/lib/db-url.ts`
- `apps/web/app/api/health/route.ts`
- `apps/web/app/[locale]/page.tsx`

Editorial write-boundary enforcement:

- `apps/web/app/api/admin/articles/route.ts`
- `apps/web/app/api/admin/articles/[id]/route.ts`
- `apps/web/app/admin/(desk)/articles/page.tsx`
- `apps/web/app/admin/(desk)/articles/new/page.tsx`
- `apps/web/app/admin/(desk)/articles/[id]/edit/page.tsx`
- `apps/web/components/admin/CmsCanonicalBanner.tsx`

Media:

- `apps/web/app/api/admin/media/route.ts`
- `apps/web/app/api/admin/media/upload/route.ts`
- `apps/web/app/admin/(desk)/media/page.tsx`
- `apps/web/lib/media-library.ts`
- `apps/web/lib/storage/media-validation.ts`
- `apps/web/lib/storage/media-validation.test.ts`
- `apps/web/lib/storage/r2-media-store.ts`
- `apps/web/next.config.mjs`

SEO/distribution/tooling:

- `packages/db/src/types.ts`
- `apps/web/lib/content/store/store-source.ts`
- `apps/web/lib/feeds/stories.ts`
- `apps/web/app/sitemap.ts`
- `apps/web/app/news-sitemap.xml/route.ts`
- `scripts/route-matrix.mjs`

Tests/config/docs:

- `apps/web/lib/content/content-source.test.ts`
- `apps/web/lib/content/payload-source.contract.test.ts` (existing coverage used for contract verification)
- `.env.example`
- `docs/admin-deploy.md`
- this audit

## Verification performed in the audit environment

- architecture static audit: pass
- public-surface audit: pass
- internal-link audit: pass
- route matrix: pass after making its output directory self-creating; 165 routes emitted
- `apps/web/next.config.mjs` syntax check: pass
- changed TypeScript/TSX parser pass: no TypeScript syntactic diagnostics after fixes

The environment does not contain the repository's installed `node_modules`, and external package installation is unavailable, so the full Next/Payload build, Vitest suite and migrations could not be executed here. Those remain deployment gates and must be run in CI/a dependency-complete checkout.

## Release gate

Do not call the incident resolved merely because a deploy succeeds. Call it resolved when all of the following are true in production:

- web `/api/health` is hard Payload mode with DB + Payload reachable;
- CMS `/healthz` is 200 with media upload ready and publication drift zero;
- a new Payload publication appears in direct URL/latest/category without using the shadow desk;
- JPEG/WebP/AVIF upload succeeds through Payload and renders through Next Image;
- scheduled-publish heartbeat is fresh;
- anonymous homepage no longer incurs auth DB work;
- cold and warm page/admin timings are measured and no unexplained ~10s waits remain.
