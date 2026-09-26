# Nagarik Watch: launch readiness

**Status as of 2026-09-26.** This is the single page to read before asking "is it ready?".

It is deliberately not another roadmap. The repository already carries
`ROADMAP.md`, `docs/LAUNCH-ROADMAP.md` (42 KB), `docs/roadmap-next.md`,
`docs/roadmap-reader-first.md`, `LAUNCH-GUIDE.md`, `docs/launch-runbook.md`,
`docs/hard-launch-operator.md` and `docs/implementation-status.md`, and two open
pull requests propose adding a ninth and tenth. When readiness is described in
ten places it is described in none, because no reader can tell which page is
current. This page states what is **true today**, with the command that proves
each claim, and points at the one document that owns the detail. See
[Document map](#document-map) for what is canonical and what is history.

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

Every row below was run on this tree at the stated commit. Re-run them; do not
trust the table.

| Claim                           | Command              | Result                         |
| ------------------------------- | -------------------- | ------------------------------ |
| Formatting is clean             | `pnpm format:check`  | pass                           |
| Types check across all packages | `pnpm typecheck`     | 8/8 packages                   |
| Lint is clean                   | `pnpm lint`          | 2/2                            |
| Static gates pass               | `pnpm verify:static` | 16/16 gates                    |
| Unit tests pass                 | `pnpm test`          | 756 web, 12 db suites          |
| Reader journeys pass            | `pnpm test:e2e`      | 76 passed, 8 skipped, 0 failed |

The 16 gates in `verify:static`, in order:

```
verify:workspaces   verify:lockfile     verify:overrides    audit:script-refs
audit:e2e-coverage  audit:env-docs      audit:payload-routes audit:public
audit:ads           audit:architecture  audit:ui-bans       audit:contrast
audit:design-tokens audit:internal-links launch:origin      launch:gate
```

This chain is the repository's strongest asset and is worth understanding
before changing anything: it encodes design law (`audit:ui-bans`,
`audit:contrast`, `audit:design-tokens`), architectural boundaries
(`audit:architecture`), public-surface honesty (`audit:public`,
`launch:origin`) and documentation truth (`audit:env-docs`) as executable
rules rather than as prose nobody re-reads. Prefer adding a gate over adding a
paragraph.

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

The most common mistake in reading the existing roadmaps is treating every open
item as engineering work. It is not. Sorting by owner is the difference between
a plan and a wish.

### Operator (deployment, secrets, infrastructure)

This is the critical path. The canonical list lives in
`apps/web/lib/hard-launch-gates.ts` and renders at `/admin/launch`; it is
reproduced here because it is the actual definition of "ready":

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

**Also operator-owned, and currently unresolved:**

- **`ops-crons.yml` has been failing every five minutes for days.** It hard-exits
  when `CRON_SECRET` and `CRON_BASE_URL` are unset, which they are. This is the
  single loudest signal in the repository and it is pure noise, which is worse
  than silence: it trains everyone to ignore a red workflow badge. Either set
  the secrets or make the workflow skip cleanly when they are absent. Fixing the
  workflow file requires a token with `workflow` scope.
- **Cloudflare `Workers Builds: nagarik-watch` fails on every pull request**,
  including documentation-only ones. Same problem: a permanently red check that
  carries no information. Repair it or remove it.
- **Secret scanning and Dependabot security updates are both disabled** on the
  repository. Both are free and should be on before the site holds any reader
  accounts.

### Editorial

- **Thirty verified stories** before launch. This is the item most likely to be
  quietly skipped, and the one that most determines whether the site is a
  publication or a template.
- Masthead, editorial policy, and corrections policy published and reachable.
- At least one correction issued end to end in staging, so the workflow is
  exercised before it matters in public.

### Legal and identity

- DoIB registration and the registration number displayed as required.
- Verified contact and ownership details. The codebase refuses to invent these
  (`launch:origin` enforces it), which is correct and should not be worked
  around.
- Privacy policy consistent with what is actually collected: reader accounts,
  comments, bookmarks, poll votes, subscriptions, and `SUBMISSION_IP_SALT`
  hashed submission addresses.

### Engineering

Comparatively small, and mostly hardening rather than construction:

- MFA enforcement for staff accounts (`STAFF_MFA_ENABLED`) verified under test,
  not merely configured.
- Backup and restore rehearsed with evidence, not assumed. An untested restore
  is not a backup.
- Live verification of security headers against production, since
  `apps/web/lib/security/response-headers.ts` proves intent but not delivery.
- Manual accessibility testing with a screen reader. `audit:contrast` and the
  automated accessibility job catch a real fraction of defects and miss the
  ones that matter most to a reader who cannot see the page.
- Corrections as a first-class collection rather than an array inside the
  versioned article document. See the review on #36: an append-only ledger
  embedded in a document that has its own version history has no good answer
  to "restore a previous version".

---

## Phased plan

### Phase 0: stop the bleeding (days)

| Item                                                   | Owner       | State        |
| ------------------------------------------------------ | ----------- | ------------ |
| Reader e2e suite running a staff-auth spec, `main` red | Engineering | Fixed in #37 |
| Dependabot splitting lockstep dependency families      | Engineering | Fixed in #38 |
| Front page reporting an outage when simply unpublished | Engineering | Fixed in #37 |
| `ops-crons.yml` failing every five minutes             | Operator    | **Open**     |
| Cloudflare Workers check failing on every PR           | Operator    | **Open**     |
| Enable secret scanning and Dependabot security updates | Operator    | **Open**     |

Phase 0 is finished when a red check on this repository means something.

### Phase 1: production cutover (1 to 2 weeks)

Operator gates 1 through 8 above, in order. Gate 5 is the meaningful
checkpoint: `CONTENT_SOURCE=payload` while still in preview proves the CMS can
serve the reader portal without exposing a half-migrated site. Do not shorten
the gap between gates 5 and 10.

Exit criteria: `/api/health` reports `ok`, CMS `/healthz` reports
`publicationDrift=0`, and the site runs on production infrastructure for a full
week in preview without intervention.

### Phase 2: fill the publication (2 to 4 weeks, parallel with Phase 1)

Thirty verified stories, real authors with real bylines, categories populated,
media pipeline exercised with real images at real sizes. The empty-edition
surface added in #37 exists precisely so this phase can be honest in public
rather than hidden behind fixtures.

Exit criteria: the front page renders a real edition from Payload, and every
link on it resolves to reporting somebody is willing to sign.

### Phase 3: launch (1 week)

Legal identity in place, MFA enforced, monitoring live, backup restore
rehearsed, headers verified against production, accessibility pass completed by
a person. Then, and only then, gate 10.

Exit criteria: `NEXT_PUBLIC_LAUNCH_STATUS=live` with `pnpm launch:gate`
exiting 0 on the production configuration.

### Phase 4: first ninety days

- **Days 1 to 30:** daily health checks, error-budget review, first correction
  issued in public, reader feedback triaged rather than accumulated.
- **Days 31 to 60:** performance work against real traffic rather than synthetic
  runs, search quality tuned against real queries, comment moderation load
  measured before it is automated.
- **Days 61 to 90:** restore drill repeated, dependency majors taken in the
  lockstep groups from #38, accessibility re-tested against the content that
  actually exists.

---

## Risk register

| Risk                                                            | Likelihood            | Impact | Mitigation                                                                                                                                                                                                                         |
| --------------------------------------------------------------- | --------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pressure to seed sample articles so the site "looks ready"      | High                  | Severe | The no-fixture-journalism policy is enforced by `launch:origin` and `audit:public`. Fabricated reporting about Nepal reaching production is a harm no deadline justifies. The empty-edition surface is the sanctioned alternative. |
| Permanently red CI trains the team to ignore failures           | **Already happening** | High   | Phase 0. `ops-crons.yml` and the Cloudflare check are the offenders.                                                                                                                                                               |
| Corrections ledger rewritten by a version restore               | Medium                | Severe | Move corrections to their own collection; see review on #36. A trust control that can be undone by a UI button is not a trust control.                                                                                             |
| Payload cutover exposes a half-migrated site                    | Medium                | High   | Operator gate 5 exists for this. Do not skip the preview window.                                                                                                                                                                   |
| Prisma major upgrades break `postinstall` and therefore deploys | Medium                | High   | #38 groups the family. Longer term, retire Prisma: it is imported by five scripts while request paths use Kysely.                                                                                                                  |
| Untested backups                                                | Medium                | Severe | Rehearse a restore before launch and every 90 days after.                                                                                                                                                                          |
| Staff account compromise                                        | Low                   | Severe | `STAFF_MFA_ENABLED` plus Turnstile, verified under test rather than assumed from config.                                                                                                                                           |

---

## Document map

**Canonical, keep current:**

| Document                                              | Owns                                                                                                |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `docs/READINESS.md`                                   | This page. Status and phase plan.                                                                   |
| `apps/web/lib/hard-launch-gates.ts`                   | The operator gate list. Code, not prose, so it cannot drift silently.                               |
| `docs/launch-runbook.md`                              | Step-by-step cutover procedure.                                                                     |
| `docs/env-launch-checklist.md`                        | Environment variables and secrets.                                                                  |
| `DESIGN.md`                                           | The design contract. Binding, enforced by `audit:ui-bans`, `audit:contrast`, `audit:design-tokens`. |
| `docs/architecture.md`                                | System structure.                                                                                   |
| `docs/content-model.md`, `docs/editorial-workflow.md` | The editorial domain.                                                                               |

**History, do not treat as current:** `ROADMAP.md`, `docs/LAUNCH-ROADMAP.md`,
`docs/roadmap-next.md`, `docs/roadmap-reader-first.md`, `LAUNCH-GUIDE.md`,
`docs/implementation-status.md`, `docs/backend-admin-audit-2026-08-09.md`,
`docs/final-backend-sweep-2026-08-21.md`, `docs/ui-ux-redesign-plan.md`,
`docs/audits/**`.

These are worth keeping. Audits are evidence of what was true on a date, and
dated audits age honestly. Roadmaps do not: an undated plan that has been
overtaken reads exactly like a current one. Before adding another roadmap, ask
whether the content belongs in this page, in a dated audit under
`docs/audits/`, or in an executable gate.
