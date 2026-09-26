# Nagarik Watch readiness roadmap

Verified on 2026-09-25 against `main` at `d2d8647`. This document separates
code readiness from launch readiness. A green repository is necessary, but it
does not prove that the newsroom, production data, DNS, or incident response are
ready.

## Executive status

| Area | Current evidence | Status | Exit condition |
| --- | --- | --- | --- |
| Repository integrity | Frozen install, static audits, lint, typecheck and 894 tests pass | Green | Required checks protect `main` |
| Public application | `https://nagarikwatch.com` serves the Next application through Cloudflare | Green with follow-up | Production headers and live probes pass |
| Reader UI | Dense, responsive Devanagari-first system exists | In review | Manual mobile, keyboard, dark mode and 200% zoom sign-off |
| Payload CMS | Canonical CMS exists; correction ledger hardened in this branch | In progress | Live migration, backup drill and two trained editors |
| Content | Source tree intentionally ships no journalism | Blocked on newsroom | At least 30 editor-verified published stories |
| Identity | Better Auth and newsroom RBAC are implemented | In progress | Production secrets, MFA and recovery drill |
| Observability | Health and launch surfaces exist; production evidence is incomplete | In progress | Error alerts, cron alerts and release correlation verified |
| Legal identity | Environment-gated, not present in this checkout | Blocked on owner | Verified DoIB and newsroom details supplied |
| Security | Code gates pass; dependency audit has known transitive findings | In progress | Exceptions reviewed, CSP verified live, restore and access drills pass |

## Evidence baseline

Commands run successfully on 2026-09-25:

```bash
pnpm install --frozen-lockfile
pnpm verify:static
pnpm lint
pnpm typecheck
pnpm test
```

The test baseline is 142 database tests and 756 web tests, plus package tests,
for 894 assertions in the main unit run. `pnpm audit --prod` reports two ignored
high findings and seven moderate findings. The moderate findings are transitive
through Payload, Monaco, Better Auth, and an old Drizzle toolchain. Treat them as
tracked risk, not as proof of an exploitable production path.

## Phase 0: repository governance

Owner: engineering lead. Target: before any public launch announcement.

- Require frozen install, lint, typecheck, unit tests, static audits, web build,
  admin build, and a smoke test on pull requests.
- Enable branch protection and require review for workflow, auth, CMS schema,
  migration, and security-header changes.
- Close or supersede stale PRs after preserving unique work. PRs #25, #26 and
  #29 conflict with current `main` and substantial parts were already ported by
  #32 and #35. PR #34 remains useful documentation but its 2026-09-23 production
  claims must be refreshed before merge.
- Review dependency majors independently. Next 16, Prisma 7 and GraphQL 17 are
  migrations, not routine patch upgrades.
- Turn on GitHub secret scanning, push protection and Dependabot security
  updates. The repository settings API reported all three disabled.

Acceptance:

1. Two consecutive clean-clone CI runs pass.
2. Direct pushes to `main` are blocked.
3. Every open dependency PR has an owner and written merge or close decision.

## Phase 1: production origin and edge

Owner: platform operator. Target: before editorial staging.

- Record the canonical origin in one ADR and use it for `NEXT_PUBLIC_SITE_URL`,
  Better Auth, Payload, feeds, sitemaps, cron calls and redirects.
- Confirm apex and `www` behavior with a permanent redirect for the non-canonical
  host.
- Verify the deployed response, not only repository configuration. The
  2026-09-25 `HEAD /` response exposed Cloudflare headers but did not expose the
  expected CSP, HSTS, referrer, permissions, frame, or nosniff headers.
- Purge stale edge cache after security-header deployment and probe HTML, API,
  image and error responses independently.
- Verify TLS renewal, IPv4/IPv6, Kathmandu and diaspora latency, and origin
  failover behavior.

Acceptance:

```bash
curl -sSI https://nagarikwatch.com/
curl -sSI https://nagarikwatch.com/robots.txt
curl -sSI https://nagarikwatch.com/api/health
```

All applicable responses carry the expected security headers, the canonical
redirect is deterministic, and `/api/health` reports no internal secrets.

## Phase 2: CMS and data cutover

Owner: platform engineer plus editor in chief. Target: staging first.

- Provision production Postgres and Blob storage with least-privilege accounts.
- Apply checked-in Payload and ops migrations with automatic schema push off.
- Import categories, authors, tags, media and articles into Payload.
- Run an inventory reconciliation: source count, destination count, published
  count, media count, missing alt text, missing credits and broken relations.
- Flip `CONTENT_SOURCE=payload` only after reconciliation succeeds.
- Exercise create, assign, draft, submit, fact-check, copy edit, SEO review,
  schedule, publish, update, correct, archive and retract transitions.
- Verify correction records are publisher-only and append-only. Attempting to
  edit or delete an issued correction must fail, while a new correction receives
  server time and authenticated actor attribution.
- Perform a point-in-time restore into isolated staging and serve an article from
  the restored database and media store.

Acceptance:

1. At least 30 real stories are published and editor-verified.
2. A publish or correction reaches the public page and distribution feeds within
   the documented cache window.
3. Restore time and recovery point are recorded.

## Phase 3: newsroom security and operations

Owner: newsroom administrator and security owner.

- Generate unique production secrets of at least 32 random bytes for auth,
  revalidation, cron signing, submission hashing and partner feeds.
- Enforce staff MFA and enroll every privileged account.
- Verify Payload unlock access remains restricted to user managers, addressing
  the current upstream account-unlock advisory in the application policy.
- Disable or rotate boot credentials immediately after first login.
- Review every role using real tasks. Reporters cannot publish; publishers do
  not need super-admin; ad and analytics roles cannot edit journalism.
- Test account disable, session revocation, password recovery, lost-MFA recovery,
  and staff departure procedures.
- Confirm audit events for workflow transitions, publication changes,
  corrections, and AI-assisted fields.

Acceptance: a tabletop account-compromise drill completes without database
access, and every privileged action has an attributable audit event.

## Phase 4: editorial and trust readiness

Owner: editor in chief.

- Supply the verified publication legal name, DoIB number, editor, address,
  phone, newsroom email, tips email and corrections email through production
  configuration.
- Review ethics, privacy, corrections, attribution, sponsored-content and
  fact-check policies in both language contexts.
- Publish a correction drill against a staging article and verify the article,
  RSS/distribution representation, updated timestamp, audit trail and reporter
  submission status.
- Verify every launch article has byline, dateline, source type, hero alt text,
  caption/credit where needed, desk, tags and accurate SEO metadata.
- Define breaking-news authorization, expiry, kill switch and correction rules.
- Ban demo, fixture and placeholder journalism from the production inventory.

Acceptance: two editors independently take a story from pitch to publication in
under ten minutes, then issue a visible correction without engineering help.

## Phase 5: reader experience and accessibility

Owner: product and accessibility reviewer.

- Test the homepage first, then section indexes, then articles, matching the
  repository's one-surface-at-a-time redesign policy.
- Test 360, 390, 768, 1024 and 1440 pixel widths in Nepali and English, light and
  dark themes.
- Complete keyboard order, focus visibility, skip link, mobile drawer, dialog,
  form error, screen-reader landmark and heading checks.
- Test at 200% zoom, reduced motion, high contrast, Save-Data and slow 4G.
- Run axe/Lighthouse on rendered production pages, but do not claim WCAG
  conformance from automated scores alone.
- Validate Devanagari line breaking, conjuncts, matras, truncation and search
  input on mid-range Android hardware.
- Ensure every public state has loading, empty, failure and recovery behavior.

Acceptance: no critical or serious WCAG issue remains; any exception has a
documented owner, workaround and deadline.

## Phase 6: performance and resilience

Owner: web performance engineer.

- Seed a representative corpus of at least 500 articles before measuring.
- Capture mobile LCP, INP and CLS at p75 for homepage, desk and article routes.
- Budget image bytes, fonts, JavaScript, CSS and third-party requests separately.
- Run origin failure, CMS timeout, database saturation, stale live-data and media
  failure exercises. Public UI must degrade honestly.
- Load-test search, comments, bookmarks, homepage composition and scheduled
  publication with production-like concurrency.
- Verify cache invalidation, stampede protection and rate-limit fail-closed paths.

Targets: LCP under 2.5 s, INP under 200 ms, CLS under 0.1, and no unbounded
query or memory growth in a 30-minute load run.

## Phase 7: observability and incident response

Owner: on-call engineer.

- Wire error reporting for both apps with environment, release SHA and route
  tags. Strip user content and credentials before transmission.
- Alert on elevated 5xx, auth failures, publish failures, revalidation failures,
  database exhaustion, cron heartbeat gaps and stale critical data.
- Add synthetic probes for homepage, one desk, one article, login, CMS health,
  sitemap, RSS and scheduled publish.
- Write severity definitions, escalation contacts, rollback steps and reader
  communication templates.
- Run one restore drill and one failed-publish incident game day.

Acceptance: an injected staging failure pages the correct owner, links to a
useful trace, and is mitigated using the runbook.

## Phase 8: search, SEO and distribution

Owner: audience editor plus engineer.

- Validate canonical URLs, alternates, structured data, robots, sitemap shards,
  RSS and social cards against real content.
- Verify renamed slugs redirect permanently and missing article slugs return a
  true 404, not only `noindex` on a 200 response.
- Submit Search Console and News Publisher Center only after legal identity and
  content inventory are real.
- Test Nepali, English and romanized search queries, including zero-result and
  typo recovery.
- Confirm correction notes travel through every feed consumed by partners.

Acceptance: representative URLs pass rich-result validation and the crawl report
has no systemic soft-404, duplicate-canonical or blocked-resource problem.

## Phase 9: launch sequence

Owner: launch commander.

### Soft launch

1. Freeze schema changes.
2. Restore production data into staging and run the full evidence pack.
3. Launch to staff and invited readers with ads and optional features limited.
4. Observe two complete editorial days, including scheduled publishing and
   morning/evening workflows.
5. Resolve all severity-one and severity-two defects.

### Hard launch

1. Confirm legal, MFA, backups, alerts, content inventory and rollback owner.
2. Run `NEXT_PUBLIC_LAUNCH_STATUS=live pnpm launch:gate`.
3. Capture build SHA, migration version, environment checklist and smoke results.
4. Change launch status and monitor continuously for two hours.
5. Publish the launch only after the live evidence pack is green.

Rollback triggers: sustained 5xx, authentication failure, content corruption,
missing security headers, inaccessible primary navigation, or failed publication
with no manual workaround.

## Presentation pack

Present readiness in this order:

1. Mission and audience: credible Devanagari-first journalism on mobile data.
2. Reader journey: homepage to desk to article, including trust metadata.
3. Newsroom journey: pitch to publication, correction and audit event.
4. Operational proof: tests, launch gates, monitoring and restore evidence.
5. Honest gaps: operator configuration, real content and external approvals.

The defensible statement is: "The application baseline is green and the launch
path is explicit. Production readiness is complete only when every external gate
has current evidence." Do not describe the site as fully ready while a blocker in
this roadmap remains open.

## 30, 60 and 90 days after launch

- Days 0-30: daily incident and cron review, weekly accessibility sampling,
  reader feedback triage, Web Vitals baseline and first restore verification.
- Days 31-60: search tuning from real queries, revision comparison, newsroom
  workflow timing, ad viewability review and stale-content automation.
- Days 61-90: quarterly access review, dependency exception review, second
  restore drill, semantic-search decision and product roadmap reset from real
  audience evidence.
