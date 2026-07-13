# CONTINUATION PROMPT — Nagarik Watch / नागरिक वाच

You are continuing a production-recovery session for the Nagarik Watch monorepo. Treat this as a real client newsroom platform, not a demo.

## Start here

Read, in order:

1. `FINAL_AUDIT.md`
2. `VERIFICATION_LOG_CURRENT.md`
3. `README.md`
4. `MANUAL.md`
5. `docs/adr/ADR-014-canonical-payload-content-boundary.md`
6. `docs/adr/ADR-015-durable-engagement-storage.md`

Inspect `git log --oneline`. The recovery implementation begins at commit `ed040dd`.

## Architecture you must preserve

- `apps/admin` is the canonical Payload CMS and editorial source of truth.
- `apps/web` is the reader site plus a role-gated operational newsroom UI.
- Production web content reads Payload REST through `PAYLOAD_PUBLIC_SERVER_URL`.
- Do not reintroduce Payload Local API imports into `apps/web`.
- Do not let the web admin write a shadow JSON content store in production.
- Production operational state requires Postgres and must fail loudly without it.
- Development may use PGlite and `.data/`; production may not.
- Never commit `.env`, credentials, Vercel metadata, generated runtime data, or API tokens.

## First task: establish a real runnable environment

```bash
corepack enable
corepack prepare pnpm@10.17.1 --activate
pnpm install --frozen-lockfile

docker compose up -d postgres
pnpm --filter @nagarikwatch/admin migrate
pnpm --filter @nagarikwatch/admin seed
```

Create local env files from `.env.example` with newly generated secrets. Do not reuse any credential from the original archive. Create a least-privilege Payload service account/API key for journalist draft creation.

Then run and save full output:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm verify:static
pnpm --filter @nagarikwatch/admin build
pnpm --filter @nagarikwatch/web build
pnpm test:e2e
```

Fix every failure before moving on. Add regression tests for each fix.

## Priority runtime verification

1. Admin boot provisioning and login, session persistence, logout, and role redirect.
2. Reader signup/login/profile/bookmarks/saved/reading history.
3. Journalist login, draft creation through Payload API key, and admin access denial.
4. Payload article publish → public page → sitemap/news sitemap/RSS/JSON-LD.
5. Contact, submission, comment, poll, newsletter, live override, and audit writes in Postgres.
6. Poll concurrency: one vote per user/fingerprint and correct grouped counts.
7. Production failure behavior with DB or Payload unavailable.
8. Strict launch gate with valid config and with each blocker intentionally removed.

## Required browser QA

Use Playwright plus manual screenshots at 360, 390, 768, 1024, and 1440 px for:

- homepage, category, article, search, latest, sports, NEPSE
- reader login/register/profile/saved
- journalist login/dashboard/new article
- admin login/dashboard/users/roles/submissions/contact/live/polls
- footer and trust pages

Run axe/WCAG 2.1 AA checks, keyboard-only navigation, focus visibility, skip links, labels, color contrast, reduced-motion behavior, image alt text, and screen-reader landmarks. Verify theme and locale toggles across client navigation without flash or cross-coupling.

## Remaining product work, in order

### P0

1. Rotate all original secrets outside the repository.
2. Replace lazy operational DDL with versioned Postgres migrations.
3. Complete journalist ownership: assigned article query, edit existing draft, revision history, editor feedback, resubmit.
4. Add Turnstile verification to public write endpoints and staff-login abuse protection.
5. Add staff 2FA, password-reset email, and verified-email lifecycle.
6. Add binary evidence/media upload with type/size limits, malware scanning, private storage, and retention rules.

### P1

7. Implement consent-aware first-party analytics ingestion for impressions, clicks, scroll depth, reading completion, search, conversion, and recommendation exposure.
8. Implement deterministic A/B assignment, experiment/variant storage, Bayesian posterior/credible intervals, guardrails, and stop rules. Do not show demo metrics as live.
9. Build unique live visitor/article performance views from actual events.
10. Define LTV from real subscription/revenue and engagement data; do not treat a heuristic engagement score as monetary LTV.
11. Integrate a real payment provider with checkout, webhook verification, entitlement, renewal, cancellation, refund, and invoice states.
12. Configure and test licensed/official NEPSE, bullion, football/FIFA, and cricket feeds. Preserve newsroom manual fallback and visible attribution.

### P2

13. Configure newsletter delivery worker/provider, unsubscribe, suppression, bounce handling, preview, scheduling, and delivery audit.
14. Replace placeholder legal/publication/team details with verified client data.
15. Validate all XML and structured data with Google tooling after deployment.
16. Run Lighthouse/PWA installability and offline-shell tests.
17. Review `docs/archive/legacy-reports`; retain only historically useful reports and remove the rest.
18. Consolidate duplicate loading components and perform dependency/dead-export analysis after a successful build.

## Acceptance criteria

Do not claim “done” unless all of the following are evidenced:

- clean git working tree
- `pnpm format:check`, `lint`, `typecheck`, `test`, both app builds, and E2E pass
- Payload and Postgres tested with real migrations
- no secret files or placeholder launch credentials
- strict live launch gate passes
- no invented live/analytics values
- no disabled production controls or “coming soon” copy
- all public write paths persist and expose errors
- screenshots and accessibility reports cover desktop and mobile
- every remaining limitation is written to an updated `FINAL_AUDIT.md`
