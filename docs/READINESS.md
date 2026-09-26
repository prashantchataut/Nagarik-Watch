# Nagarik Watch: launch readiness

**Status as of 2026-09-26.** The single page to read before asking "is it ready?".

This used to be one of ten. `ROADMAP.md`, `docs/LAUNCH-ROADMAP.md`,
`docs/roadmap-next.md`, `docs/roadmap-reader-first.md`, `LAUNCH-GUIDE.md`,
`docs/hard-launch-operator.md`, `docs/implementation-status.md`,
`docs/READINESS-ROADMAP-2026-09-25.md` and two backend sweeps each described
readiness from a different date, and no reader could tell which was current.
They have been deleted; what was still true in them is here. Git keeps the
originals if anyone needs to see what was believed on a given day.

Before adding another roadmap, ask whether the content belongs in this page or
in an executable gate. A gate is a paragraph that cannot go stale.

---

## Verdict

**The application is not what is blocking launch.** The build is green, the
gates pass, and the newsroom tooling is materially complete. What remains is
operator work (production secrets, Payload cutover, monitoring), editorial work
(actual verified journalism), and legal work (DoIB registration, masthead
identity). None of those can be finished by writing code, and none of them
should be simulated in order to make the site look finished.

The honest one-line summary: **engineering is close to done; the publication is
not yet a publication.**

---

## What is verifiably true today

Every row below was run on this tree. Re-run them; do not trust the table.

| Claim                           | Command              | Result                           |
| ------------------------------- | -------------------- | -------------------------------- |
| Formatting is clean             | `pnpm format:check`  | pass                             |
| Types check across all packages | `pnpm typecheck`     | 8/8 packages                     |
| Lint is clean                   | `pnpm lint`          | clean                            |
| Static gates pass               | `pnpm verify:static` | 19/19 gates                      |
| Unit tests pass                 | `pnpm test`          | 983 tests, 138 files, 5 packages |

The 19 gates in `verify:static`, in order:

```
verify:workspaces    verify:repo-invariants  verify:lockfile   verify:overrides
audit:dependency-lockstep                    audit:script-refs audit:e2e-coverage
audit:env-docs       audit:payload-routes    audit:public      audit:ads
audit:architecture   audit:ui-bans           audit:contrast    audit:design-tokens
audit:font-budget    audit:internal-links    launch:origin     launch:gate
```

This chain is the repository's strongest asset and is worth understanding before
changing anything. It encodes design law (`audit:ui-bans`, `audit:contrast`,
`audit:design-tokens`, `audit:font-budget`), architectural boundaries
(`audit:architecture`, `verify:repo-invariants`), public-surface honesty
(`audit:public`, `launch:origin`) and documentation truth (`audit:env-docs`) as
executable rules rather than as prose nobody re-reads. **Prefer adding a gate
over adding a paragraph.**

Two checks are deliberately outside the chain because they need something
`verify:static` cannot assume:

- `pnpm test:e2e` and `... --config=playwright.admin.config.ts` need browsers and
  a dev server, and the two runners cannot run concurrently (`next dev` refuses a
  second instance from the same project directory, whatever port you give it).
- `pnpm audit:live-ux --base <origin>` checks the rendered result — Devanagari
  letter-spacing, touch targets, transfer weight, accessibility — against a
  running **production** build. A dev server reports roughly double the transfer
  size, so its weight numbers are not comparable. Run this before calling any UI
  change done.

### What exists

- **Reader portal** (`apps/web`) on Next.js 16 App Router, bilingual Nepali and
  English, with the edition front page, article pages, latest, search, market
  boards, NEPSE, and the Nepali calendar (`patro`) computed astronomically
  rather than transcribed from a table.
- **Newsroom desk** (`apps/web/app/admin`): 34 desk routes plus login, covering
  articles, wire, submissions, media, polls, live blogs, comments, corrections,
  authors, journalists, roles, users, categories, tags, topics, provinces, ads,
  paywall, newsletter, SEO, search analytics, session quality, experiments,
  algorithms, audit log, settings, and a launch console at `/admin/launch`.
- **Payload CMS** (`apps/admin`) at 3.85.1 with seven collections: `Articles`,
  `Authors`, `Categories`, `Tags`, `Media`, `Users`, `EditorialAuditEvents`.
- **Content source abstraction**: `CONTENT_SOURCE` selects `payload` or `json`,
  with a homepage snapshot fallback, so the reader portal can run before the CMS
  is cut over and can survive the CMS being briefly unreachable.
- **Auth**: Better Auth 1.7.2 over Postgres, Kysely on request paths, with an
  embedded PGlite fallback used only by local development and the authenticated
  e2e runners.

---

## Who is blocking what

The most common mistake in reading a roadmap for this repository is treating
every open item as engineering work. Most of it is not. Sorting by owner is the
difference between a plan and a wish.

### Operator: the launch gates

The canonical list lives in `apps/web/lib/hard-launch-gates.ts` and renders at
`/admin/launch`. It is code rather than prose so it cannot drift from what the
build actually checks. Reproduced here because it is the definition of "ready":

1. Production Postgres reachable; `pnpm migrate:ops` reports no pending migrations
2. Payload deployed at `admin.nagarikwatch.com` with `PAYLOAD_DB_PUSH=false`
3. `BLOB_READ_WRITE_TOKEN` present on the Payload Vercel project
4. Desk to Payload migration applied; `DESK_TO_PAYLOAD_MIGRATED=true`
5. Web `CONTENT_SOURCE=payload` while still preview; `/api/health` status `ok`
6. CMS `/healthz`: media ready, `categories>0`, `publicArticles>0`, `publicationDrift=0`
7. `STAFF_MFA_ENABLED=true` and Turnstile keys live
8. `PARTNER_FEED_TOKENS`, `SUBMISSION_IP_SALT`, `CRON_SECRET`, `SENTRY_DSN` set
9. Verified legal/DoIB/contact env (operator-owned; never fabricated)
10. `NEXT_PUBLIC_LAUNCH_STATUS=live` and `pnpm launch:gate` exits 0

Do not flip gate 10 until the preceding nine are true. `launch:gate` is wired
into `verify:static`, so a premature flip fails the build rather than shipping a
half-configured site, which is the correct behaviour.

**Operator items outside the gate list, currently unresolved:**

- **`ops-crons.yml` has been failing every five minutes for days.** It hard-exits
  when `CRON_SECRET` and `CRON_BASE_URL` are unset, which they are. This is the
  loudest signal in the repository and it is pure noise, which is worse than
  silence: it trains everyone to ignore a red workflow badge. Either set the
  secrets or make the workflow skip cleanly when they are absent. The fix is
  written and waiting in `docs/pending/workflow-fixes.patch`; applying it needs a
  token with `workflow` scope, which no agent branch has.
- **Cloudflare `Workers Builds: nagarik-watch` fails on every pull request**,
  including documentation-only ones. Same problem: a permanently red check that
  carries no information. Repair it or remove it.
- **Secret scanning and Dependabot security updates are both disabled.** Both are
  free and should be on before the site holds a single reader account.
- **Decide the canonical platform** (Vercel vs Cloudflare) and delete the loser's
  config. The root `wrangler.jsonc` claims the same Worker name as the app's own
  and points at `apps/web/out`, a directory this app cannot produce. Every
  canonical URL, OG tag, sitemap entry and JSON-LD `@id` is built from
  `NEXT_PUBLIC_SITE_URL`; publishing on the wrong host poisons the index.
- **Set `CRON_BASE_URL`** to the real deployed origin.

### Editorial

- **Thirty verified stories** before launch. This is the item most likely to be
  quietly skipped, and the one that most determines whether the site is a
  publication or a template. No engineering shortens it, so start recruiting
  before the cutover rather than after.
- Masthead, editorial policy and corrections policy published and reachable.
- At least one correction issued end to end in staging, so the workflow is
  exercised before it matters in public.
- **Seed the desk taxonomy and author pages with real people.** Author pages
  resolve authors from the taxonomy store, so with an empty taxonomy every byline
  link is a 404. That is correct fail-closed behaviour, and it makes this a
  launch blocker rather than a nicety.
- Every asset carries alt text, caption and credit — enforced in the collection,
  not in review.

### Legal and identity

- DoIB registration and the registration number displayed as required
  (`NEXT_PUBLIC_DOIB_NUMBER`). It is what makes the masthead lawful.
- `NEXT_PUBLIC_PUBLICATION_LEGAL_NAME`, `NEXT_PUBLIC_EDITOR_IN_CHIEF`, and
  `NEXT_PUBLIC_NEWSROOM_ADDRESS` / `_EMAIL` / `_PHONE`. Contactability is a
  Google News requirement. The codebase refuses to invent any of these
  (`launch:origin` enforces it), which is correct and should not be worked
  around.
- Privacy and cookie copy re-read against what actually fires: reader accounts,
  comments, bookmarks, poll votes, subscriptions, and `SUBMISSION_IP_SALT`-hashed
  submission addresses.

### Engineering

Comparatively small, and mostly hardening rather than construction:

- MFA enforcement for staff accounts (`STAFF_MFA_ENABLED`) verified under test,
  not merely configured. Turnstile likewise (`CAPTCHA_PROVIDER=turnstile`);
  contact, tips and poll votes are open endpoints.
- Backup and restore rehearsed with evidence. An untested restore is not a
  backup.
- Live verification of security headers against production, since
  `apps/web/lib/security/response-headers.ts` proves intent, not delivery.
- Manual accessibility testing with a screen reader. `audit:contrast` and the
  automated accessibility job catch a real fraction of defects and miss the ones
  that matter most to a reader who cannot see the page.
- **Corrections as their own collection** rather than an array inside the
  versioned article document. See the review on #36: an append-only ledger
  embedded in a document that has its own version history has no good answer to
  "restore a previous version". This is a migration, and it is the highest-value
  engineering item left.
- Decide explicitly which of the 32 desk surfaces move to Payload and which stay
  (ads, paywall, experiments and algorithms have no Payload counterpart), and
  write the boundary down.

---

## Hardening ledger

Items raised as "honest but weak" and where each one now stands. Unchanged does
not mean forgotten; it means the trade-off was examined and kept.

| Item                                                         | State                                                                                                                                                                                  |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CSP `'unsafe-inline'` in `script-src`                        | Unchanged, deliberate. Nonces force every route dynamic and give up SSG/ISR.                                                                                                           |
| `connect-src https:` is broad                                | Unchanged. Narrow once the Sentry, analytics and storage origins are final.                                                                                                            |
| Two unpatched `image-size` DoS advisories via Payload        | Unchanged. Reachable only through staff-authenticated upload. Tracked in `docs/security/audit-exceptions.md`.                                                                          |
| No Redis; presence and real-time counts are approximate      | Unchanged. The adapter is honest about what it is.                                                                                                                                     |
| Rate limits have never met real load                         | Unchanged. Review under traffic, not before it.                                                                                                                                        |
| e2e suites red                                               | **Fixed.**                                                                                                                                                                             |
| Per-layer module caches leaking across requests              | **Fixed**, with a test forbidding regressions.                                                                                                                                         |
| Admin **API** routes missing desk authorization              | **Fixed**, with a structural test over every handler.                                                                                                                                  |
| `MEDIA_MANAGER_ROLES` included an unreachable role           | **Fixed.**                                                                                                                                                                             |
| Home route had no loading skeleton                           | **Fixed.** Scoped to the `(home)` route group so the Suspense fallback cannot commit a 200 ahead of a `notFound()` on sibling routes.                                                  |
| `/district/[slug]` answered 200 for an unknown desk          | **Fixed.** The page calls `notFound()` itself, and the district catalog now carries real districts with Devanagari names rather than three city slugs title-cased into Latin headings. |
| `/tag/[slug]` answered 200 for an unknown tag                | **Was already correct.** `/tag/*` 308s to `/topic/*`, which calls `notFound()` when the tag does not resolve.                                                                          |
| `lib/observability/sentry.ts` keeps one module-scope boolean | Allowlisted in the process-scope test, with a reason: nobody makes a decision on that flag.                                                                                            |

---

## Phased plan

### Phase 0: make a red check mean something (days)

| Item                                                   | Owner    | State    |
| ------------------------------------------------------ | -------- | -------- |
| `ops-crons.yml` failing every five minutes             | Operator | **Open** |
| Cloudflare Workers check failing on every PR           | Operator | **Open** |
| Enable secret scanning and Dependabot security updates | Operator | **Open** |
| Set `CRON_BASE_URL` to the deployed origin             | Operator | **Open** |

Phase 0 is finished when a red check on this repository carries information.

### Phase 1: infrastructure and production cutover (1 to 2 weeks)

Nothing after this validates until the site is actually serving. Decide the
platform, provision Postgres, run `pnpm db:push` then `pnpm migrate:ops`, point
the domain and pick apex or `www` with a 301 on the other, set
`BETTER_AUTH_SECRET` / `SUBMISSION_IP_SALT` / `CRON_SECRET` / `REVALIDATE_SECRET`
(≥32 chars, non-placeholder — the gate fails closed on placeholders), attach blob
storage, set `SENTRY_DSN`. Then operator gates 1 through 8, in order.

Gate 5 is the meaningful checkpoint: `CONTENT_SOURCE=payload` while still in
preview proves the CMS can serve the reader portal without exposing a
half-migrated site. Do not shorten the gap between gates 5 and 10.

For the Payload cutover itself: deploy `apps/admin` and confirm `/healthz`, set
`PAYLOAD_SECRET` / `PAYLOAD_API_TOKEN` / `PAYLOAD_PUBLIC_SERVER_URL`, set
`PAYLOAD_DB_PUSH=false` and run the checked-in migrations, run
`pnpm migrate:desk-to-payload` against real data, then `pnpm test:integration` —
the contract test is what proves parity — and finally flip `CONTENT_SOURCE` and
verify `/admin/cutover/status`.

Exit criteria: `/api/health` reports `ok`, CMS `/healthz` reports
`publicationDrift=0`, a staff account can sign in at `/admin/launch` and see no
red items, and the site runs on production infrastructure for a full week in
preview without intervention.

### Phase 2: fill the publication (2 to 4 weeks, parallel with Phase 1)

Thirty verified stories, real authors with real bylines, taxonomy populated,
media pipeline exercised with real images at real sizes. The empty-edition
surface exists precisely so this phase can be honest in public rather than
hidden behind fixtures.

Exit criteria: the front page renders a real edition from Payload, and every
link on it resolves to reporting somebody is willing to sign.

### Phase 3: launch (1 week)

Legal identity in place, MFA enforced, Turnstile live, monitoring receiving
events, backup restore rehearsed, headers verified against production,
accessibility pass completed by a person. Then, and only then, gate 10.

Exit criteria: `NEXT_PUBLIC_LAUNCH_STATUS=live` with `pnpm launch:gate` exiting 0
on the production configuration.

### Phase 4: discovery (after the domain is final, never before)

Submitting a publication and then changing its canonical host is the most
expensive self-inflicted SEO wound available. Google Search Console and Bing
Webmaster verification; Google News Publisher Center submission (unblocked now
that unknown URLs answer 404 rather than a soft 200); confirm
`/news-sitemap.xml` carries only recent news URLs; validate `NewsArticle`,
`Organization` and `BreadcrumbList` against the Rich Results Test on live URLs;
analytics behind consent with no beacon firing pre-consent; spot-check OG and
Twitter cards on real articles.

### Phase 5: first ninety days

- **Days 1 to 30:** daily health checks, error-budget review, first correction
  issued in public, reader feedback triaged rather than accumulated.
- **Days 31 to 60:** performance work against real traffic rather than synthetic
  runs, search quality tuned against real queries, comment moderation load
  measured before it is automated.
- **Days 61 to 90:** restore drill repeated, dependency majors taken in their
  lockstep groups, accessibility re-tested against the content that now exists.

Revenue and growth are post-launch and flag-gated throughout: house ads to
network (`NEXT_PUBLIC_ADS_MODE=network`), paywall tuning, newsletter
(`RESEND_API_KEY`), memberships, web push (VAPID).

---

## Critical path

```
Phase 0 pipeline  →  platform  →  database  →  domain  →  Payload cutover
                                                   ↓
                                           legal identity
                                                   ↓
                                      30 real articles   ← longest lead
                                                   ↓
                                           Google News
```

Phase 2 is the critical path and it is the one no engineering shortens.

---

## Two different claims, and why conflating them is the failure this repo guards against

**Engineering-ready** can be signed off on code alone, and is true today:
formatting, lint, types, 983 unit tests, 19 static gates, both app builds, both
Playwright suites, a live-UX sweep with zero findings, and every unknown URL
answering 404 with no 200 producible by a render failure.

**Publication-ready** needs humans and credentials, and none of it is a code
problem: `pnpm launch:gate:live` passing with no suppressed warnings,
`/api/health` returning `ok` on the production host, CI green on `main` with the
deployed SHA equal to `main`, thirty real articles each with a real byline and a
resolving author page, a masthead naming a real legal entity and a real
editor-in-chief and a real DoIB number, staff MFA enforced, Turnstile live, and
Sentry receiving events.

**Do not present the site as ready on the strength of the first alone.** The
first is what makes it safe to point a domain at. The second is what makes it a
publication.

---

## Risk register

| Risk                                                        | Likelihood            | Impact | Mitigation                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | --------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Pressure to seed sample articles so the site "looks ready"  | High                  | Severe | The no-fixture-journalism policy is enforced by `launch:origin`, `audit:public` and `verify:repo-invariants`. Fabricated reporting about Nepal reaching production is a harm no deadline justifies. The empty-edition surface is the sanctioned alternative. |
| Permanently red CI trains the team to ignore failures       | **Already happening** | High   | Phase 0. `ops-crons.yml` and the Cloudflare check are the offenders.                                                                                                                                                                                         |
| Corrections ledger rewritten by a version restore           | Medium                | Severe | Move corrections to their own collection. A trust control that can be undone by a UI button is not a trust control.                                                                                                                                          |
| Payload cutover exposes a half-migrated site                | Medium                | High   | Operator gate 5 exists for this. Do not skip the preview window.                                                                                                                                                                                             |
| Dependency majors break `postinstall` and therefore deploys | Medium                | High   | Dependabot groups lockstep families. Longer term, retire Prisma: it is imported by a handful of scripts while request paths use Kysely.                                                                                                                      |
| Untested backups                                            | Medium                | Severe | Rehearse a restore before launch and every 90 days after.                                                                                                                                                                                                    |
| Staff account compromise                                    | Low                   | Severe | `STAFF_MFA_ENABLED` plus Turnstile, verified under test rather than assumed from config.                                                                                                                                                                     |

---

## Where the detail lives

| Document                            | Owns                                                                   |
| ----------------------------------- | ---------------------------------------------------------------------- |
| This page                           | Status, owners, phases.                                                |
| `apps/web/lib/hard-launch-gates.ts` | The operator gate list. Code, not prose, so it cannot drift silently.  |
| `docs/launch-runbook.md`            | Step-by-step cutover procedure.                                        |
| `docs/env-launch-checklist.md`      | Environment variables and secrets.                                     |
| `docs/pending/`                     | Changes that need a token scope no agent branch has. Apply and delete. |
| `DESIGN.md`                         | The design contract. Binding, and enforced by seven gates.             |
| `PRODUCT.md`                        | Who this is for and what it refuses to be.                             |
| `docs/architecture.md`              | System structure and the decisions behind it.                          |
| `docs/content-model.md`             | Collections, fields, and what each one is for.                         |
| `docs/editorial-workflow.md`        | Pitch to publish, roles, corrections.                                  |
| `docs/ALGORITHM_INVENTORY.md`       | Capability statuses, adapter activation prerequisites, cron wiring.    |
| `docs/adr/`                         | Decisions, dated, with the reasoning that produced them.               |
| `docs/security/audit-exceptions.md` | Accepted advisories, each with a reason and a reachability argument.   |
