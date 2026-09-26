# Nagarik Watch — launch readiness roadmap

**Purpose.** A single, ordered plan that takes the repository from _"the code is
close"_ to _"the site is live and we can prove it"_, and then to _"we can present
it as ready"_. Every gate has an owner, an acceptance test and a command that
produces evidence. Nothing here is marked done because it is written down.

- Status legend: **✅ verified on this branch** · **🟡 in progress** · **⛔ blocked (external)** · **⏳ planned**
- Evidence column always names a command or an artefact, never an opinion.
- Baseline for every "current state" claim: branch `agent/deep-readiness-pass`
  (2026-09-23) and `docs/audits/2026-09-23-deep-readiness-audit.md`.

> **Read this first if you are presenting the site:** §0 (state of the world),
> then §10 (the presentation pack). Everything between is the work that makes
> §10 defensible.

---

## 0. Where the project actually stands (verified 2026-09-23)

| Area                                | State                          | Evidence                                                                   |
| ----------------------------------- | ------------------------------ | -------------------------------------------------------------------------- |
| Install / CI integrity              | ✅ after this branch           | `pnpm install --frozen-lockfile`, `node scripts/verify-workspace-lock.mjs` |
| Web build                           | ✅                             | `pnpm build:web` (211+ routes, ISR/SSG mixed)                              |
| Admin (Payload) build               | ✅ after this branch           | `pnpm build:admin`                                                         |
| Unit tests                          | ✅ 655                         | `pnpm test`                                                                |
| Static product audits               | ✅ 11 gates                    | `pnpm verify:static`                                                       |
| Reader e2e + a11y                   | ✅ desktop + mobile            | `pnpm test:e2e`, `pnpm test:a11y`                                          |
| Reader-facing 404 semantics         | ✅ real 404s                   | production probe list in the audit                                         |
| Cookie consent reachable on mobile  | ✅ after this branch           | `pnpm test:e2e --project=mobile-chromium`                                  |
| Staff CMS hardening                 | ✅ baseline headers + noindex  | `apps/admin/next.config.ts`                                                |
| **Deployed site**                   | ⛔ **not attached**            | `curl -s https://nagarikwatch.com/` → `Hello world` (11 bytes)             |
| **DNS for `www` / `admin` / `cms`** | ⛔ NXDOMAIN                    | `getent hosts www.nagarikwatch.com`                                        |
| **CMS cutover**                     | ⏳ still `CONTENT_SOURCE=json` | `pnpm launch:gate` output                                                  |
| **Published journalism**            | ⏳ 0 / 30                      | `pnpm launch:gate` → "0/30 verified published articles declared"           |
| **Cron heartbeat**                  | ⛔ red every 5 min             | GitHub Actions `Ops crons` history                                         |

**The honest one-line summary:** the _application_ is in good shape and is now
verifiably buildable and testable; the _deployment, DNS, CMS cutover, legal
identity and content_ are not done. Those are operator tasks, not code tasks, and
they are what §1–§9 sequence.

---

## 1. Phase 0 — Repository and CI integrity

**Goal:** a red pipeline means a real defect, and a green pipeline means the
artefact is shippable.

| #   | Task                                                                      | Owner    | Acceptance                                                                 | Status                          |
| --- | ------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------- | ------------------------------- |
| 0.1 | Regenerate `pnpm-lock.yaml` so frozen installs work                       | eng      | `pnpm install --frozen-lockfile` exits 0                                   | ✅                              |
| 0.2 | Fix the Payload REST catch-all route so `build:admin` passes              | eng      | `pnpm build:admin` exits 0                                                 | ✅                              |
| 0.3 | Approve pnpm postinstall scripts explicitly (`onlyBuiltDependencies`)     | eng      | install log has no "Ignored build scripts" warning; `prisma generate` runs | ✅                              |
| 0.4 | Apply the `ops-crons` workflow patch from the audit doc                   | operator | `Ops crons` scheduled runs are green or annotated, never silently red      | ⛔ needs operator (token scope) |
| 0.5 | Protect `main`: require the `launch verification` check, no direct pushes | operator | GitHub branch protection enabled                                           | ⏳                              |
| 0.6 | Triage the 5 open Dependabot PRs (#8, #9, #10, #23, #24)                  | eng      | each merged with a green run, or closed with a written reason              | ⏳                              |
| 0.7 | Close or rebase stale PRs #25 and #26                                     | eng      | see the review comment on each PR                                          | 🟡                              |
| 0.8 | Nightly scheduled run of `launch verification`                            | eng      | `gh workflow list` shows the schedule; failures notify                     | ⏳                              |

**Acceptance for the phase:** two consecutive pushes to `main` produce green
`launch verification` runs, and `pnpm verify:launch` passes from a clean clone.

```bash
# Evidence pack for this phase
git clean -xdf && pnpm install --frozen-lockfile
pnpm verify:static && pnpm typecheck && pnpm test
pnpm build:web && pnpm build:admin
```

---

## 2. Phase 1 — Origin, DNS and hosting (the gate that unblocks everything)

**Decision needed:** apex (`https://nagarikwatch.com`) or `www`. The code's
fallback canonical origin is `https://www.nagarikwatch.com`
(`apps/web/lib/site.ts`, `apps/web/lib/auth/origin-config.ts`), `.env.example`
uses the apex, and **only the apex resolves today**. Pick one, write it down in
`docs/adr/`, then make code, env, DNS and the cron workflow agree.

| #   | Task                                                                         | Owner         | Acceptance                                                               | Status |
| --- | ---------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------ | ------ |
| 1.1 | Write ADR-005: canonical origin = apex or `www`, with the redirect direction | product + eng | ADR merged; one host is canonical everywhere                             | ⏳     |
| 1.2 | Create the Vercel project for `apps/web` (Node runtime, not Pages static)    | operator      | `curl -I https://<canonical>/` returns the reader homepage with CSP/HSTS | ⛔     |
| 1.3 | Create the Vercel project for `apps/admin`                                   | operator      | `curl -I https://<cms-host>/robots.txt` returns `Disallow: /`            | ⛔     |
| 1.4 | Add DNS records for `www`, `admin`/`cms`, and the media bucket host          | operator      | `getent hosts` resolves each; `dig +short` matches the ADR               | ⛔     |
| 1.5 | Redirect the non-canonical host → canonical (308) at the edge                | operator      | `curl -I https://www…` → 308 to the canonical origin                     | ⛔     |
| 1.6 | Set `NEXT_PUBLIC_SITE_URL` + `BETTER_AUTH_URL` to the canonical origin       | operator      | `pnpm launch:gate` clears both warnings                                  | ⛔     |
| 1.7 | TLS: certificates, HSTS preload, no mixed content                            | operator      | `curl -sI` shows HSTS; browser console has no mixed-content warnings     | ⛔     |
| 1.8 | Attach the media host to the CSP (`STORAGE_PUBLIC_BASE_URL`)                 | operator      | images load with no CSP violation in the console                         | ⛔     |

**Acceptance:** `https://<canonical>/`, `/robots.txt`, `/sitemap.xml`,
`/api/health` and an article URL all serve the application (not a placeholder),
and `pnpm launch:origin` passes against the live host.

---

## 3. Phase 2 — Data plane and CMS cutover

**Goal:** the reader is served by the CMS, on Postgres, with migrations under
review — not by the local desk store.

| #    | Task                                                                                                                           | Owner        | Acceptance                                                                                          | Status |
| ---- | ------------------------------------------------------------------------------------------------------------------------------ | ------------ | --------------------------------------------------------------------------------------------------- | ------ |
| 2.1  | Provision Postgres (Aiven/Neon) with `sslmode=require`                                                                         | operator     | `pnpm --filter @nagarikwatch/web migrate:ops` exits 0                                               | ⛔     |
| 2.2  | Run the ops migrations and record the version                                                                                  | operator     | `pnpm launch:gate` no longer warns "Ops migration status not probed"                                | ⛔     |
| 2.3  | Provision Payload: `DATABASE_URL`, `PAYLOAD_SECRET`, `PAYLOAD_PUBLIC_SERVER_URL`, `PAYLOAD_API_TOKEN`, `BLOB_READ_WRITE_TOKEN` | operator     | `curl <cms>/healthz` returns ok; media upload lands in Blob                                         | ⛔     |
| 2.4  | Apply checked-in Payload migrations; keep `PAYLOAD_DB_PUSH=false`                                                              | operator     | `pnpm launch:gate` clears the `PAYLOAD_DB_PUSH` blocker                                             | ⛔     |
| 2.5  | Migrate the desk corpus (`pnpm migrate:desk-to-payload`)                                                                       | editor + eng | `PUBLISHED_ARTICLE_COUNT` ≥ 30 and spot-checked by an editor                                        | ⏳     |
| 2.6  | Flip `CONTENT_SOURCE=payload` **last**, after a dry run                                                                        | eng          | `/api/health` reports `mode=hard`; no "misconfigured" state                                         | ⏳     |
| 2.7  | Verify on-demand revalidation end to end                                                                                       | eng          | publishing an article purges its ISR page within 60 s                                               | ⏳     |
| 2.8  | Seed the category/author/tag taxonomy in the CMS and re-check `/`                                                              | editor       | every nav desk resolves; no 404s in the nav                                                         | ⏳     |
| 2.9  | If the taxonomy stays CMS-managed, decide on `NEXT_PUBLIC_PERMISSIVE_PUBLIC_SEGMENTS`                                          | eng          | either the env list is maintained, or the flag is set and the soft-404 trade is accepted in writing | ⏳     |
| 2.10 | Backup + restore drill on Postgres and Blob                                                                                    | ops          | a restored database serves the site in staging                                                      | ⏳     |

**Acceptance:** `CONTENT_SOURCE=payload`, `/api/health` = `ok`, ≥30 published
articles, an editor can publish without engineering help, and a restore has been
demonstrated.

---

## 4. Phase 3 — Identity, access and secrets

| #   | Task                                                                                                                                                                                               | Owner  | Acceptance                                                            | Status                                       |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------- | -------------------------------------------- |
| 3.1 | Generate and store `AUTH_SECRET` (≥32 chars)                                                                                                                                                       | ops    | sign-in works; no 500 from a missing secret                           | ⛔                                           |
| 3.2 | Set `STAFF_MFA_ENABLED=true` and enrol every staff account                                                                                                                                         | ops    | a staff login without TOTP is refused                                 | ⏳                                           |
| 3.3 | Create the boot accounts, then rotate the seeded passwords                                                                                                                                         | ops    | `NEWSROOM_*_PASSWORD` are not the demo values; demo accounts disabled | ⏳                                           |
| 3.4 | Review newsroom RBAC against the actual desk structure                                                                                                                                             | editor | each staff member has the minimum role they need                      | ⏳                                           |
| 3.5 | Rotate every secret that has ever been in a shared environment (`CRON_SECRET`, `REVALIDATE_SECRET`, `SUBMISSION_IP_SALT`, `EXPERIMENT_HASH_SECRET`, `TURNSTILE_SECRET_KEY`, `PARTNER_FEED_TOKENS`) | ops    | all ≥32 chars, unique per environment, stored in the password manager | ⏳                                           |
| 3.6 | Confirm `/api/health` and `/admin/launch` leak nothing to anonymous callers                                                                                                                        | eng    | anonymous `GET /api/health` shows status, not internals               | 🟡 (baseline ok, re-verify on the live host) |
| 3.7 | Add explicit Payload auth hardening: `maxLoginAttempts`, `lockTime`, cookie options                                                                                                                | eng    | values are explicit in `collections/Users.ts`                         | ⏳                                           |
| 3.8 | Turn on secret scanning + push protection in the repo                                                                                                                                              | ops    | GitHub Security → secret scanning enabled                             | ⏳                                           |

---

## 5. Phase 4 — Editorial readiness (the product, not the plumbing)

| #   | Task                                                                                                                                                                                                                | Owner   | Acceptance                                                                         | Status |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------- | ------ |
| 4.1 | Fill the publication legal identity (`NEXT_PUBLIC_PUBLICATION_LEGAL_NAME`, `NEXT_PUBLIC_DOIB_NUMBER`, `NEXT_PUBLIC_EDITOR_IN_CHIEF`, `NEXT_PUBLIC_NEWSROOM_ADDRESS`, `_PHONE`, `_EMAIL`, corrections + tips emails) | product | the footer shows the registration line; `pnpm launch:gate` clears all six warnings | ⛔     |
| 4.2 | Have the editorial policy, ethics, corrections and fact-check pages reviewed by the desk                                                                                                                            | editor  | each page signed off; contact details real                                         | ⏳     |
| 4.3 | Exercise the corrections workflow once end to end                                                                                                                                                                   | editor  | a correction appears on the article and in `/corrections-policy`'s log             | ⏳     |
| 4.4 | Confirm no placeholder copy or mock data reaches readers                                                                                                                                                            | editor  | search the live HTML for `demo`/`test`/`MOCK`/`नमुना`; zero public hits            | ⏳     |
| 4.5 | Set the breaking-news kill switch and thresholds with the desk                                                                                                                                                      | editor  | a drill: boost a story, then kill it, in under 5 minutes                           | ⏳     |
| 4.6 | Train the desk on pitch → draft → review → publish and on the review queue                                                                                                                                          | editor  | two editors publish unaided                                                        | ⏳     |
| 4.7 | Verify bilingual coverage for the launch edition                                                                                                                                                                    | editor  | every launch story has a Nepali body; English is optional but labelled             | ⏳     |
| 4.8 | Live-data policy: which providers are real, which show "unavailable"                                                                                                                                                | editor  | every widget on `/` either has an attributed source or an honest empty state       | ⏳     |

---

## 6. Phase 5 — Trust, privacy and compliance

| #   | Task                                                                                                                                                 | Owner         | Acceptance                                                  | Status |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------- | ------ |
| 5.1 | Privacy policy matches reality: cookie consent, analytics behind consent, no third-party beacons from our infrastructure (Payload telemetry now off) | product + eng | policy text and network panel agree                         | 🟡     |
| 5.2 | Cookie consent reachable and correct on mobile and desktop                                                                                           | eng           | `pnpm test:e2e` consent tests pass on both projects         | ✅     |
| 5.3 | Serve `security.txt`, `humans.txt`, `llms.txt` on the live host                                                                                      | eng           | each returns 200 with the canonical origin                  | ⏳     |
| 5.4 | `ads.txt` / `sellers.json` reflect the real inventory decision                                                                                       | ad ops        | files match `NEXT_PUBLIC_ADS_MODE`                          | ⏳     |
| 5.5 | Terms, cookies, advertise, contact, help reviewed                                                                                                    | product       | sign-off recorded                                           | ⏳     |
| 5.6 | Confirm ad labelling and data-never-deceptive rules hold on the live site                                                                            | product       | no unlabelled promoted content; no dark patterns in consent | ⏳     |
| 5.7 | Decide the ads mode for launch: `off` (recommended for soft launch) or `house`                                                                       | product       | `NEXT_PUBLIC_ADS_MODE` set; CSP matches                     | ⏳     |
| 5.8 | Accessibility statement published with a contact route                                                                                               | product       | page linked from the footer                                 | ⏳     |

---

## 7. Phase 6 — Reliability, observability and operations

| #   | Task                                                                                     | Owner     | Acceptance                                                    | Status |
| --- | ---------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------- | ------ |
| 6.1 | Configure `SENTRY_DSN` and verify an error is captured                                   | eng       | a deliberate error appears in Sentry with a release tag       | ⛔     |
| 6.2 | Configure `CRON_SECRET` + `CRON_BASE_URL`, apply the workflow patch, observe a heartbeat | ops       | `Ops crons` green for 48 h; `/api/cron/*` returns 200         | ⛔     |
| 6.3 | Alerting: cron failure, 5xx rate, health degraded                                        | ops       | a forced failure pages someone                                | ⏳     |
| 6.4 | Uptime probe on `/api/health` and `/` from outside the platform                          | ops       | probe configured; dashboard shows 30 days of history          | ⏳     |
| 6.5 | Backups: Postgres PITR + Blob versioning; documented restore drill                       | ops       | drill completed and timed                                     | ⏳     |
| 6.6 | Incident runbook: rollback, cache purge, CMS outage, credential leak                     | eng + ops | `docs/launch-runbook.md` reviewed against the live topology   | 🟡     |
| 6.7 | Postgres pool sizing for serverless (`NW_DB_POOL_MAX`)                                   | eng       | no connection-limit errors under a 200-concurrency smoke test | ⏳     |
| 6.8 | Rate limits verified on write endpoints (contact, tips, comments, votes)                 | eng       | a burst test returns 429, not 500                             | ⏳     |

---

## 8. Phase 7 — Performance, accessibility and PWA

| #   | Task                                                                                            | Owner        | Acceptance                                     | Status |
| --- | ----------------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------- | ------ |
| 7.1 | Performance budget green                                                                        | eng          | `pnpm perf:budget` (67 chunks ≤ 500 KiB today) | ✅     |
| 7.2 | Field targets on the live host: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 (p75, mobile)              | eng          | Lighthouse/CrUX evidence attached              | ⏳     |
| 7.3 | Automated a11y audit green (axe, WCAG 2.1/2.2 AA)                                               | eng          | `pnpm test:a11y`                               | ✅     |
| 7.4 | Manual keyboard + screen-reader pass on `/`, an article, `/search`, consent, and the CMS editor | eng + editor | written notes; zero blockers                   | ⏳     |
| 7.5 | Dark mode, reduced-motion and Save-Data verified on the live host                               | eng          | screenshots + `data-save-data` behaviour       | 🟡     |
| 7.6 | PWA install + offline shell verified on a real phone                                            | eng          | install prompt works; offline page renders     | ⏳     |
| 7.7 | Devanagari rendering check on low-end Android (font loading, line height)                       | design       | sign-off with screenshots                      | ⏳     |

---

## 9. Phase 8 — SEO, distribution and monetization

| #   | Task                                                                                                                                     | Owner   | Acceptance                                               | Status                   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------- | ------------------------ |
| 8.1 | `robots.txt`, `sitemap.xml`, `news-sitemap.xml`, `image-sitemap.xml`, `video-sitemap.xml`, RSS/Atom/JSON feed live on the canonical host | eng     | each returns 200 and absolute canonical URLs             | ⏳                       |
| 8.2 | Google Search Console + Google News submission, sitemap submitted                                                                        | product | property verified; sitemap processed with 0 errors       | ⏳                       |
| 8.3 | Structured data validated (NewsArticle, NewsMediaOrganization, BreadcrumbList, FAQ/HowTo, ItemList)                                      | eng     | Rich Results test passes on 5 sample articles            | ⏳                       |
| 8.4 | Canonical + hreflang correct for `ne`/`en` on the live host                                                                              | eng     | spot-check 10 URLs                                       | ⏳                       |
| 8.5 | 404 semantics verified on the live host (real 404s, no soft 404s for unknown paths)                                                      | eng     | the probe list from the audit, run against production    | ✅ (locally) / ⏳ (live) |
| 8.6 | Ads: mode chosen, `ads.txt` correct, placements labelled, consent-gated                                                                  | ad ops  | inventory decision recorded; no ad loads without consent | ⏳                       |
| 8.7 | Paywall/membership decision recorded (Option A: free to read)                                                                            | product | `NEXT_PUBLIC_MEMBERSHIP_PUBLIC` matches the decision     | ⏳                       |
| 8.8 | Newsletter and web-push delivery tested to a real inbox/device                                                                           | eng     | one digest and one push received                         | ⏳                       |

---

## 10. Phase 9 — Soft launch → hard launch

| #   | Task                                                                                                                                                             | Owner     | Acceptance                                                           |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------- |
| 9.1 | Soft launch: `NEXT_PUBLIC_LAUNCH_STATUS=preview`, noindex optional, internal traffic only                                                                        | product   | 48 h with green crons, no 5xx spikes                                 |
| 9.2 | Invite a 50–200 reader cohort; watch engagement, comments, polls                                                                                                 | product   | no P0 bugs; feedback triaged                                         |
| 9.3 | Clear the live blockers: `NEXT_PUBLIC_LAUNCH_STATUS=live`, `CONTENT_SOURCE=payload`, ≥30 articles, legal identity, MFA, captcha, cron secret, partner-feed token | product   | `pnpm launch:gate` exits 0 **with `NEXT_PUBLIC_LAUNCH_STATUS=live`** |
| 9.4 | Submit to search engines, announce on socials, publish the launch story                                                                                          | product   | announcement live; GSC indexing confirmed                            |
| 9.5 | 7-day hypercare: daily health review, on-call rota, rollback ready                                                                                               | eng + ops | daily notes; no unresolved P0/P1                                     |
| 9.6 | Post-launch retro → next roadmap                                                                                                                                 | all       | retro doc merged                                                     |

**The single command that decides hard launch:**

```bash
NEXT_PUBLIC_LAUNCH_STATUS=live pnpm launch:gate    # must exit 0
```

---

## 11. The presentation pack — "present this site is ready"

Use this when someone asks _"is it ready?"_. It is a 20-minute demo plus a
one-page evidence sheet, and it is deliberately honest about what is not done.

### 11.1 One-page status sheet (fill from the live host)

| Claim                     | How it is proven                                                         |
| ------------------------- | ------------------------------------------------------------------------ |
| Builds from a clean clone | `git clean -xdf && pnpm install --frozen-lockfile && pnpm verify:launch` |
| Tested                    | `pnpm test` → 655 passing; `pnpm test:e2e` + `pnpm test:a11y` → green    |
| Audited                   | `pnpm verify:static` → 11 gates green                                    |
| Accessible                | axe: zero critical/serious on the audited routes                         |
| Fast                      | `pnpm perf:budget` + Lighthouse p75 numbers                              |
| Honest 404s               | unknown path → HTTP 404 with the recovery page                           |
| Privacy                   | consent banner reachable; analytics only after opt-in                    |
| CMS works                 | editor publishes a story live during the demo                            |
| Observable                | Sentry issue + cron heartbeat screenshots                                |

### 11.2 Demo script (20 minutes, in order)

1. **Open the homepage on a phone.** Point out density, Devanagari-first
   typography, no layout shift, bottom navigation, and that the utility strip
   only shows attributed real data.
2. **Search, then open an article.** Show the reading tools (progress, text size),
   the byline and dateline, related stories, reactions, comments behind consent.
3. **Type a URL that does not exist.** Show the real 404 (status 404, recovery
   links, search box) — this is the kind of detail that separates a real
   newsroom from a demo.
4. **Open the consent banner and change preferences.** Show that it works on a
   phone (the bug this branch fixed) and that nothing optional loads before
   opt-in.
5. **Sign in as a reporter in the CMS**, create a draft, submit it for review;
   then sign in as an editor, request a change, then publish. Show the story
   appear on the reader site after revalidation.
6. **Open `/admin/launch`.** Walk the readiness list — every remaining item is
   named with the exact env var or DNS record needed. This is the strongest
   trust signal in the demo: the product tells the truth about its own gaps.
7. **Close with the numbers**: test counts, audit gates, perf budget, and the
   three operator tasks left (DNS/origin, CMS cutover, content volume).

### 11.3 What to say about what is _not_ ready

Say it before you are asked:

- the production domain currently serves a placeholder; the app is not attached
  to it yet;
- `www`/`admin` DNS records do not exist, so the canonical origin must be decided;
- the CMS cutover and the ≥30-story corpus are pending;
- the `ops-crons` workflow patch needs an operator with workflow scope.

Framing: _"the application is ready and verified; the launch is blocked on
operator steps that are enumerated, not on unknowns."_

---

## 12. Definition of done — copy/paste checklist

```text
[ ] ADR-005 canonical origin merged; code, env, DNS and crons agree
[ ] Reader host + CMS host deployed on the canonical origin over TLS
[ ] Non-canonical host 308s to the canonical origin
[ ] Postgres provisioned; ops migrations applied; backup+restore drill done
[ ] Payload provisioned; migrations applied; PAYLOAD_DB_PUSH=false
[ ] CONTENT_SOURCE=payload; /api/health ok; revalidation verified
[ ] >=30 published articles, desk-reviewed; taxonomy seeded
[ ] Publication legal identity + DoIB + editor-in-chief set
[ ] STAFF_MFA_ENABLED=true; every staff account enrolled; demo accounts disabled
[ ] All secrets rotated, unique, >=32 chars, stored in the password manager
[ ] CAPTCHA_PROVIDER=turnstile with both keys
[ ] CRON_SECRET + CRON_BASE_URL set; ops-crons patch applied; 48h green heartbeat
[ ] PARTNER_FEED_TOKENS set (no unauthenticated syndication feed)
[ ] SENTRY_DSN set; an error captured with a release tag
[ ] SUBMISSION_IP_SALT set to a non-placeholder >=32-char secret
[ ] ads.txt / sellers.json match the ads decision; ads consent-gated
[ ] GSC + News submitted; sitemaps processed with 0 errors
[ ] Lighthouse p75: LCP <= 2.5s, INP <= 200ms, CLS <= 0.1
[ ] axe: zero critical/serious on the audited routes; manual SR pass done
[ ] NEXT_PUBLIC_LAUNCH_STATUS=live and `pnpm launch:gate` exits 0
[ ] Rollback rehearsed; incident runbook reviewed against the live topology
```

---

## 13. Risk register

| Risk                                               | Likelihood | Impact                                             | Mitigation                                                             | Owner         |
| -------------------------------------------------- | ---------- | -------------------------------------------------- | ---------------------------------------------------------------------- | ------------- |
| Lockfile/manifest drift returns                    | Medium     | CI red, deploy blocked                             | `verify-workspace-lock.mjs` first in CI + branch protection (§0.5)     | eng           |
| Canonical origin chosen differently in code vs DNS | Medium     | broken absolute URLs, 403 `INVALID_ORIGIN` on auth | ADR-005 + `launch:gate` origin assert                                  | product + eng |
| CMS cutover regresses the reader                   | Medium     | outage during switch                               | dry run, `CONTENT_SOURCE` flip last, instant rollback to `json`        | eng           |
| Soft 404s reappear for article slugs               | Low        | crawl budget, ranking                              | documented follow-up; `noindex` today; add a live probe                | eng           |
| Cron jobs silently stop                            | Medium     | missed scheduled publishing, stale caches          | patched workflow + alerting (§6.3)                                     | ops           |
| Secrets leaked via a shared environment            | Medium     | account takeover                                   | rotation checklist (§3.5), secret scanning (§3.8)                      | ops           |
| Payload/Next major upgrade breaks the CMS          | Medium     | editor downtime                                    | keep admin pinned to Next 15 until Payload supports 16; staged upgrade | eng           |
| Empty-store launch (0 stories)                     | Low        | 404s and empty desks                               | ≥30 stories gate; honest empty states verified                         | editor        |
| Consent/ads compliance gap                         | Low        | regulatory + trust                                 | consent reachable (fixed), ads off at launch, policy review            | product       |

---

## 14. Post-launch: 30 / 60 / 90 days

**Days 0–30 — stabilise.** Daily health and cron review; fix reader-reported
issues; monitor Core Web Vitals; publish the first correction and the first
investigation; review search-analytics for dead ends.

**Days 31–60 — depth.** Article-slug 404 fix with the Suspense refactor;
side-by-side revision compare in the CMS; trending on real telemetry instead of
recency; newsletter cadence; partner feed onboarding.

**Days 61–90 — scale.** Semantic search provider decision; web push; membership
chrome decision; province host routing if the domains exist; quarterly dependency
and audit-exception review; second restore drill.

---

## 15. Command index

```bash
# integrity
pnpm install --frozen-lockfile
node scripts/verify-workspace-lock.mjs && node scripts/verify-canonical-workspaces.mjs

# quality
pnpm lint && pnpm typecheck && pnpm test
pnpm verify:static            # 11 static gates incl. env-docs and payload-routes
pnpm perf:budget

# builds
pnpm build:web && pnpm build:admin

# launch gates
pnpm launch:gate
NEXT_PUBLIC_LAUNCH_STATUS=live pnpm launch:gate
pnpm launch:origin

# end to end
pnpm test:e2e
pnpm test:a11y
pnpm test:e2e:newsroom        # needs Docker Postgres

# one-shot launch verification
pnpm verify:launch
```
