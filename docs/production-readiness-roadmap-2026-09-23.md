# Nagarik Watch production-readiness roadmap

Last verified: 2026-09-23  
Owner: product and engineering  
Launch architecture: Cloudflare DNS/CDN -> Vercel Node web app -> Postgres + Payload CMS

This is the execution roadmap for making Nagarik Watch operationally ready. It complements
`docs/launch-runbook.md`, which remains the operator procedure, and `PRODUCT.md`, which remains
the product source of truth. A checked item requires evidence from the named gate; code existing
in the repository is not sufficient by itself.

## Current assessment

| Area            | State | Evidence and remaining risk                                                                                                                                                 |
| --------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reader product  | Amber | Broad route coverage and mature news layout exist; real-content visual QA is still required.                                                                                |
| Payload CMS     | Amber | Collections, workflow, RBAC, versions, scheduling, media rules, and revalidation exist. This branch adds the missing immutable event ledger and repairs the REST catch-all. |
| Data authority  | Amber | Payload is the hard-launch authority, but production cutover and corpus migration are operator work.                                                                        |
| Security        | Amber | Security headers, rate limiting, staff roles, and launch checks exist; staff MFA and secret scanning must be enabled in production/GitHub.                                  |
| Reliability     | Amber | Health probes and cron heartbeats exist; a 48-hour production soak has not been evidenced.                                                                                  |
| Accessibility   | Amber | Automated gates exist; manual keyboard and screen-reader acceptance remains open.                                                                                           |
| Performance     | Amber | Static budgets exist; they have not been validated against a representative 500-story corpus.                                                                               |
| Legal/editorial | Red   | Real registration, address, editor, contact, privacy owner, and advertising values are intentionally absent and must be supplied by the operator.                           |
| CI/repository   | Amber | The committed lockfile was stale on 2026-09-23. This branch refreshes it; branch protection and security features remain repository settings.                               |

## Release definition

“Ready” means all P0 gates below are green in the production environment, a rollback has been
rehearsed, and the editor in chief and technical owner have signed the release record. It does not
mean every roadmap enhancement is complete.

### P0 launch gates

- [ ] `corepack pnpm install --frozen-lockfile` succeeds from a clean clone.
- [ ] `corepack pnpm verify:launch` succeeds at the release commit.
- [ ] Web and admin production builds succeed with production-shaped environment variables.
- [ ] Payload migrations apply to a clean database and to a staging copy of production data.
- [ ] `CONTENT_SOURCE=payload`; public pages contain no fixture or JSON-desk-only story.
- [ ] At least 30 reviewed Nepali stories cover every primary navigation desk.
- [ ] Staff MFA is enforced; disabled accounts cannot authenticate; least-privilege roles are sampled.
- [ ] Media used by published stories has alt text, caption, credit, and durable object storage.
- [ ] Scheduled publishing and cache revalidation run successfully for 48 consecutive hours.
- [ ] Production liveness, readiness, CMS health, error reporting, and analytics are observed.
- [ ] Legal/publication identity values are real, approved, and visible on the required pages.
- [ ] Keyboard, screen-reader, mobile, dark-mode, slow-network, and reduced-motion smoke tests pass.
- [ ] Backup restoration and web/CMS rollback are rehearsed and timed.

## Phase 1: repository and supply-chain baseline (P0)

Goal: every later phase starts from a reproducible, reviewable build.

1. Lock dependency state.
   - Keep root `packageManager`, CI pnpm, and lockfile pnpm versions identical.
   - Run frozen install in CI before all other jobs.
   - Review every audit exception in `package.json`; each needs an owner, rationale, and expiry.
   - Gate critical/high production advisories and report moderate advisories without hiding them.
   - Acceptance: clean clone, frozen install, lock verifier, and production dependency audit pass.
2. Protect the repository.
   - Require PRs, passing launch verification, accessibility, smoke, and build checks on `main`.
   - Enable secret scanning, push protection, Dependabot security updates, and branch deletion.
   - Require signed commits or vigilant mode for release commits.
   - Acceptance: GitHub settings screenshot or API evidence is attached to the release record.
3. Retire stale PRs safely.
   - Close #25 and #26 after useful changes are superseded; both are currently conflicted.
   - Review Dependabot PRs individually against Payload/Next peer ranges; do not batch major upgrades.
   - Acceptance: no open PR claims passing verification when its checks are red.

## Phase 2: CMS and editorial operations (P0)

Goal: a reporter can create a story and an accountable editor can publish, correct, or retract it.

1. Deploy Payload as the canonical newsroom.
   - Deploy `apps/admin` to `admin.nagarikwatch.com` on Vercel Node.
   - Set `PAYLOAD_DB_PUSH=false`; run reviewed migrations explicitly.
   - Configure durable Blob storage and verify upload, transform, delete, and CDN delivery.
   - Acceptance: `/healthz` is healthy and nested REST paths under `/api/*` work.
2. Validate role boundaries.
   - Test reporter, fact checker, copy editor, SEO manager, managing editor, publisher, and admin accounts.
   - Confirm contributors only edit assigned work and cannot publish or change assignments.
   - Confirm only publishing roles schedule, publish, archive, retract, or control homepage placement.
   - Confirm only administrators manage roles and only super admins hard-delete.
   - Acceptance: an RBAC test matrix records allow/deny evidence for each sensitive action.
3. Validate the story lifecycle.
   - Exercise Idea -> Assigned -> Draft -> Submitted -> Fact Check -> Copy Edit -> SEO Review.
   - Exercise Legal/Sensitivity Review -> Ready -> Scheduled -> Published -> Updated -> Archived.
   - Verify illegal jumps are rejected and review timestamps are written once the stage changes.
   - Acceptance: one staging article completes the full lifecycle without direct database edits.
4. Validate accountability.
   - Payload versions retain article-body revisions.
   - `editorial-audit-events` records creation, workflow/publication transitions, corrections, and AI use.
   - Audit events are manager-readable and cannot be created, edited, or deleted through normal access.
   - Export and retention policy are documented before production data is created.
   - Acceptance: staging evidence links each lifecycle action to actor, time, resource, and transition.
5. Train the desk.
   - Publish a one-page role guide and workflow guide in Nepali/English as appropriate.
   - Rehearse correction, retraction, embargo, breaking-news, image-credit, and account-disable flows.
   - Name on-call editorial and technical owners for launch week.
   - Acceptance: every launch-week staff member completes a recorded rehearsal.

## Phase 3: data cutover and integrity (P0)

Goal: one authoritative content path with measurable parity and a reversible cutover.

1. Prepare production data.
   - Provision pooled Postgres with backups, point-in-time recovery, connection alerts, and least privilege.
   - Apply ops and Payload migrations to staging; measure duration and lock behavior.
   - Seed taxonomies and real authors, never invented legal or staff identities.
2. Migrate the soft desk.
   - Run `pnpm migrate:desk-to-payload` in dry-run mode.
   - Compare counts, slugs, publication state, authors, taxonomy, media, corrections, and redirects.
   - Apply once; do not introduce dual writes.
3. Prove reader parity.
   - Compare homepage, desk, article, search, feeds, sitemap, and structured data before/after cutover.
   - Publish, update, unpublish, correct, and retract one staging story; verify reader state within 60s.
   - Acceptance: migration report has zero unexplained missing or duplicate records.
4. Cut over.
   - Set `CONTENT_SOURCE=payload` while launch status remains `preview`.
   - Keep the prior desk corpus read-only for the documented rollback window.
   - Set `DESK_TO_PAYLOAD_MIGRATED=true` only after signed count/parity approval.

## Phase 4: security and privacy (P0)

Goal: protect sources, staff, readers, and operational credentials.

1. Authentication and authorization.
   - Enforce staff MFA, secure cookies, trusted origins, account lockout, and session revocation.
   - Test horizontal and vertical access on CMS, web admin, journalist, comments, and partner feeds.
   - Rotate bootstrap credentials and verify no default/test account remains active.
2. Application security.
   - Run secrets, dependency, and static scans in CI; manually review auth and mutation routes.
   - Validate CSRF/origin defenses, rate limits, upload type/size checks, and outbound URL restrictions.
   - Move CSP from `unsafe-inline` to nonces only after ad, analytics, Turnstile, and Payload testing.
3. Privacy and retention.
   - Inventory personal data, purpose, consent, processors, retention, export, and deletion paths.
   - Salt submission identifiers, avoid reader PII in logs, and document audit-ledger retention.
   - Acceptance: privacy owner signs the inventory and deletion/export rehearsal.
4. Edge controls.
   - Configure Cloudflare WAF/rate rules for auth, comments, submissions, search, and feeds.
   - Do not cache authenticated/admin/API responses; verify cache keys for locale and consent variants.

## Phase 5: reader UX, accessibility, and content quality (P0/P1)

Goal: credible, fast news reading across Nepal’s real devices and networks.

1. Complete visual QA one surface at a time: homepage, section index, article, search, utilities.
2. Test 360px/390px mobile, tablet, 1280px/1440px desktop, light/dark, 200% zoom, and long Nepali copy.
3. Run automated axe checks plus keyboard-only and NVDA/VoiceOver smoke tests.
4. Verify focus order, skip links, dialogs, menus, form errors, live regions, and reduced motion.
5. Replace every placeholder/demo/public fixture with reviewed CMS content or an honest empty state.
6. Validate article trust signals: byline, location, timestamps, provenance, correction, and retraction.
7. Acceptance: no critical/serious axe findings and no blocker in the manual journey checklist.

## Phase 6: performance, SEO, and distribution (P1)

Goal: discovery and responsiveness remain healthy at realistic content volume.

1. Load at least 500 representative articles and 5,000 media assets in staging.
2. Measure LCP, CLS, INP, TTFB, image bytes, JS, and database queries on key routes.
3. Test cold/warm cache, slow 4G, Save-Data, and low-end Android behavior.
4. Validate canonical/hreflang, robots, news/image/archive sitemaps, RSS/Atom/JSON feeds, and schema.
5. Register Search Console, Bing Webmaster Tools, and publisher/news surfaces when operator-owned data exists.
6. Acceptance: budgets pass at representative volume, not only against an empty fixture build.

## Phase 7: reliability and launch operations (P0)

Goal: failures are detected, owned, and recoverable.

1. Monitor web/API latency, error rate, saturation, DB pool, CMS health, revalidation, and cron freshness.
2. Alert on readiness failures, publication drift, cron staleness, email failure, and storage errors.
3. Create dashboards and page routing with severity, owner, acknowledgement, and escalation times.
4. Rehearse DB restore, CMS rollback, web rollback, secret rotation, and Payload outage fallback.
5. Run 48-hour preview soak followed by a controlled soft launch and first-hour checklist.
6. Acceptance: recovery objectives are measured and the rollback decision can be made in under 10 minutes.

## Phase 8: post-launch completeness (P1/P2)

- P1: corrections workflow UI and correction propagation into every feed/distribution channel.
- P1: editorial audit export, retention job, and anomaly dashboard.
- P1: comment/submission distributed-abuse detection modeled on credential-stuffing detection.
- P1: full-archive related-story graph without request-time O(n²) rebuilding.
- P1: analytics event governance, consent validation, and newsroom outcome dashboards.
- P2: editorial calendar, assignment SLA, source/contact CRM, and syndication partner management.
- P2: disaster/live coverage runbooks, live-blog verification, and incident templates.
- P2: localization workflow for human-reviewed English publication.

## Release evidence bundle

Store these artifacts for each release candidate:

- Git commit, PR, reviewer approval, and CI URLs.
- Dependency audit and secret-scan summaries.
- Migration dry-run/apply logs and parity report.
- RBAC and full editorial lifecycle results.
- Accessibility manual/automated results and viewport screenshots.
- Performance report using representative content volume.
- Health/cron/revalidation 48-hour soak evidence.
- Backup restore and rollback timings.
- Legal/editorial/technical sign-offs and named launch owners.

## Explicit non-code dependencies

Engineering cannot invent or silently approve these: Nepal publication registration details, DoIB
number, legal entity and address, editor in chief, public phone/email, privacy contact, ad sales
terms, analytics account, email sender domain, staff roster, production domains/secrets, and the
final launch decision. Until supplied and verified, the site can be technically preview-ready but
must not be described as fully production-ready.
