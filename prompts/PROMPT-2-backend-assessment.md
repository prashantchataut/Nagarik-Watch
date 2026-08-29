# PROMPT 2 — Nagarik Watch: Backend + CMS Assessment, Hardening & True Completion

Paste this into ChatGPT (browser edition, no tools, no file system). The zip file
`nagarik-watch-src.zip` is attached. Read everything from it.

---

## Your role

You are a senior backend/platform engineer and production-reliability specialist for
**Nagarik Watch (नागरिक वाच)**, a Nepali-first news portal (nagarikwatch.com) built as a
pnpm/Turborepo monorepo. The reader app is Next.js (App Router) in `apps/web`; the
editorial CMS is **Payload CMS 3** in `apps/admin`; shared contracts live in
`packages/db`, storage/CDN in `packages/infra`, ingestion in `packages/ingest`.
Postgres is the operational database (Better Auth + ops stores), Vercel Blob is media
storage, Vercel Node + Cloudflare DNS/CDN is the launch origin (ADR-004).

Your job: **assess the entire backend for real, then improve it for real.** You are
suspicious by default. Assume half-measures, hollow adapters, latent failure modes, and
"works in dev" claims. Prove everything from the code. Implement truly — no stubs.

## Constraints (very important)

1. You have **no tools** — you cannot run commands, build, hit endpoints, or delete files.
   You work by reading files in the attached zip and writing complete code.
2. For **every file** you create, modify, or delete, output the **full final file content**
   in a labelled code block with the exact path, e.g.
   `### FILE: apps/web/lib/content/payload-source.ts`. For deleted files just list paths.
   Never use `...` placeholders — output real, complete, working code.
3. You **cannot delete files** in this session. Produce the complete **DELETE LIST**
   (exact paths + one-line reason each) so the human can delete them manually. Produce it
   after the audit and again as a final consolidated list.
4. Do not invent credentials, API keys, provider contracts, or fake data. Keep honest
   empty states. Never write "demo"/"test"/"placeholder" into production code or copy.
5. Never mention competitor portal names in code comments or copy.
6. Assume the human will apply your output and run verification themselves.

## Skills — load these BEFORE anything else

Read each skill's `SKILL.md` before using it (paths are inside the zip):

- `skills/codebase-auditor/SKILL.md` — root-cause + integration-debt + architecture audit
- `skills/spec-miner/SKILL.md` — reverse-engineer the actual spec from the code
- `skills/agentic-engineering/SKILL.md` and `skills/ecc-universal/agentic-engineering/SKILL.md`
- `skills/security-reviewer/SKILL.md`, `skills/secure-code-guardian/SKILL.md`, `skills/security-and-hardening/SKILL.md`
- `skills/error-handling/SKILL.md` — error boundaries, retries/backoff, RFC 7807-ish shapes, graceful degradation
- `skills/caching-strategies/SKILL.md` — HTTP headers, CDN, SWR, invalidation, thundering herd
- `skills/database-optimizer/SKILL.md` and `skills/postgres-pro/SKILL.md` — queries, pools, indexes, EXPLAIN, connections
- `skills/api-and-interface-design/SKILL.md` and `skills/api-designer/SKILL.md` — stable public/API contracts
- `skills/architecture-designer/SKILL.md` — boundaries, ADRs, tradeoffs
- `skills/devops-engineer/SKILL.md` — Docker, CI/CD, deploy, GitOps
- `skills/ci-cd-and-automation/SKILL.md` — quality gates in CI
- `skills/monitoring-expert/SKILL.md` — logs, metrics, alerts, health endpoints
- `skills/sre-engineer/SKILL.md` — SLIs/SLOs, error budgets, reliability
- `skills/clutter-management/SKILL.md` — dead code/orphaned file detection (never auto-delete)
- `skills/code-reviewer/SKILL.md` — PR-grade review of the whole backend
- `skills/karpathy-guidelines/SKILL.md` — think before coding, simple, surgical
- `skills/doubt-driven-development/SKILL.md` — adversarial review before committing decisions
- `skills/incremental-implementation/SKILL.md` — land changes incrementally
- `skills/verification-before-completion` (`.agents/skills/verification-before-completion/SKILL.md`)
- `skills/council/SKILL.md` / `skills/ecc-universal/council/SKILL.md` — for ambiguous architecture calls
- `.cursor/skills/nagarik-watch-product/SKILL.md` — product truth (must read)
- `.opencode/skills/nagarik-watch-newsroom/SKILL.md` — newsroom editorial/CMS standard (must read)
- `.opencode/skills/newsroom-cms-architecture-skill/SKILL.md` — CMS/admin architecture rules
- `.opencode/skills/news-seo-google-news-skill/SKILL.md` — Google News/SEO backend (sitemaps/RSS/schema)
- `.opencode/skills/live-data-widget-integration-skill/SKILL.md` — live widget APIs/data contracts
- `.opencode/skills/moderation-and-trust-safety-skill/SKILL.md` — comments/trust backend
- `skills/nextjs-developer/SKILL.md` — route handlers/server components/ISR semantics

Read project source-of-truth docs in the zip too:
`AGENT.md`, `AGENTS.md`, `PRODUCT.md`, `SPEC.md`, `ROADMAP.md`, `MANUAL.md`,
`docs/architecture.md`, `docs/content-model.md`, `docs/editorial-workflow.md`,
`docs/implementation-status.md`, `docs/backend-admin-audit-2026-08-09.md`,
`docs/launch-runbook.md`, `docs/ADMIN-CLOUDFLARE.md`, `docs/admin-deploy.md`,
`docs/CLOUDFLARE.md`, `docs/CLOUDFLARE-DOMAIN.md`, `docs/VERCEL_DEPLOYMENT.md`,
`docs/ALGORITHM_INVENTORY.md`, `docs/NOTIFICATIONS.md`, `docs/sports-api-setup.md`,
`docs/adr/*`, and `design-system/nagarik-watch/MASTER.md` + `pages/*`.

## Phase 0 — Backend inventory + source-of-truth map

1. Map the backend end to end:
   - Payload CMS (`apps/admin/src`): collections, globals, hooks, access control,
     authentication, media/storage plugin, publishing, revisions, seed/boot scripts.
   - Reader ops backend (`apps/web/app/api/*`): journalist articles, admin media,
     editorial workflow, feedback, submissions, comments/moderation, polls, live widgets,
     ads events, crons, revalidation webhook, health/readiness, auth endpoints.
   - Shared infra (`packages/db`, `packages/infra`, `packages/ingest`): env validation,
     DB pools, storage/CDN adapters, feed normalization.
   - Postgres schema/migrations (`apps/web/migrations`, `packages/db`).
2. Build a **backend completion matrix** from `docs/implementation-status.md`,
   `docs/backend-admin-audit-2026-08-09.md`, `ROADMAP.md`, `SPEC.md`: every listed
   backend item marked ✅ / ⚠️ half-measure / ❌ hollow / 🔲 missing with file:line evidence.
3. Hunt for **hollow adapters and half-measures** with evidence:
   - Adapters that exist but always return empty/unsupported (storage, CDN purge, email,
     newsletter, analytics, payments/Stripe, TTS, AI provider, plagiarism, Redis presence,
     live-data providers: NEPSE, gold/silver, forex, weather, AQI, sports, football,
     cricket, election, exam, youtube, parliament).
   - Endpoints that accept writes but never persist or never propagate (e.g. shadow-store
     writes while `CONTENT_SOURCE=payload`, revalidation gaps).
   - `TODO`/`FIXME`/`stub`/`return null`/`not implemented`/`disabled`/`no-op` paths.
   - Error handling that swallows or hides failures; timeouts that are unbounded or
     wrongly bounded; retries without backoff; missing circuit breakers.
   - DB patterns: N+1 queries, unbounded pools, connection churn per request, no indexes
     on hot query paths, transactions missing where needed.
   - Auth/authorization gaps: role checks missing on admin actions, session handling,
     secret validation, boot-account password hygiene, MFA gating.
   - Cron jobs that are stubbed or fire-and-forget without verification or heartbeat.
4. Produce the first **DELETE LIST** for the backend (orphaned endpoints, dead adapters,
   superseded code — e.g. Cloudinary, Meilisearch, legacy upload paths, HomeLiveBoard
   remnants, shadow content store remnants) with one-line reasons.

## Phase 1 — Fix the known production incidents properly

`docs/backend-admin-audit-2026-08-09.md` lists incidents and source fixes. Verify each fix
is real and complete in the code, and harden further:

1. **Content-authority drift** — live editorial writes must fail closed when
   `CONTENT_SOURCE != payload`; no silent shadow-store writes. Verify
   `payload-cutover.ts`, `payload-source.ts`, admin redirects, and the regression test.
2. **Publication double gate** — `_status=published` AND `workflowStage` in
   scheduled/published/updated AND `publishAt<=now`; `noIndex` must never gate public
   visibility. Verify `payload-source.ts` queries and Payload access control.
3. **Revalidation** — bounded webhook (`NW_REVALIDATE_TIMEOUT_MS`), invalidate old+new
   slug/category, cover publish/update/unpublish/archive, no reader notification on
   unpublish. Verify `lib/content/` + Payload `afterChange` hook.
4. **Media/storage** — canonical path must be Payload Vercel Blob (`@payloadcms/storage-vercel-blob`);
   legacy uploader must not 502; WebP/AVIF sniffing correct; Next/Image allowlist includes
   the real Blob public host; production metadata never falls back to process memory.
5. **Postgres pool exhaustion** — one connection per warm instance; survive exhaustion
   without taking down readers; accurate "database not connected" diagnostics.
6. **Performance paths** — anonymous requests must not hit DB just to discover no session
   (cookie precheck); homepage must not do redundant cross-service Payload reads; CMS reads
   bounded; admin dashboard analytics behind Suspense, not on the critical path.

## Phase 2 — Harden the whole backend

- **Error handling** (`skills/error-handling`): consistent error shapes for API routes,
  bounded timeouts on all cross-service calls, retry with exponential backoff where
  appropriate, graceful degradation when Postgres/Payload are sick, structured logging,
  Sentry boundary only when DSN present.
- **Caching** (`skills/caching-strategies`): sensible `Cache-Control`/`stale-while-revalidate`
  on public content, ISR `revalidate` values, CDN purge on publish (Cloudflare adapter),
  cache invalidation correctness, no thundering herd on popular endpoints.
- **Database** (`skills/postgres-pro`, `database-optimizer`): review pools, indexes,
  hot queries, and the ops tables (`packages/db` schemas + `apps/web/migrations`).
  Recommend concrete indexes/query rewrites with evidence from the code.
- **Auth & authorization** (`skills/secure-code-guardian`, `security-reviewer`): audit
  every admin/journalist route's role gate; verify `requireNewsroomSession`, `admin-roles.ts`,
  `admin-role-groups.ts`, MFA, secrets (no real secrets in committed files), input
  validation, rate limiting, Turnstile gate.
- **Cron jobs**: verify scheduled-publish, digest-compose, breaking-auto-boost,
  house-ad-promote, notifications, ops-probe actually run, are idempotent, bounded, and
  report failures (healthz). Fix stubs.
- **Live-data providers**: for each provider in `.env.example`, confirm the adapter either
  integrates a real attributed source OR renders a truthful unavailable state with a
  last-updated stamp — never invented values. Add caching (TTL) and timeouts.
- **SEO backend** (`news-seo-google-news-skill`): sitemap, news-sitemap, RSS/Atom/JSON
  feed, robots, canonical/alternates, article/speakable/live-blog schema, image/video
  sitemaps, ads.txt/sellers.json honesty, llms.txt. Fix anything that emits wrong URLs,
  duplicates, or no-index gating.

## Phase 3 — Complete the missing backend work (semantic order)

Complete every 🔲 missing / ❌ hollow / ⚠️ half-measure item from Phase 0 that the docs
require for launch, in this order: content authority → publication/revalidation → media →
auth/roles → journalist workflow (draft→submitted→feedback→publish, scheduled publish,
slug redirect on rename) → ops tables/migrations → cron reliability → live widgets →
notifications/digest → partner feed → SEO backend → ad backend → observability/health.
Implement truly. If something is intentionally dormant (Stripe membership, hosted vector
search, TTS, etc.) per PRODUCT.md/ROADMAP, keep it honest and disabled — do not fake it.

## Phase 4 — Deliverables (exact structure)

1. **Backend completion matrix** — every item: status + file:line evidence + what you did.
2. **All changed/new files** — full file content per file, exact paths, in apply order.
3. **DELETE LIST (final)** — exact paths + one-line reason each, for the human to delete.
4. **Verification commands** the human must run:
   `pnpm install`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`,
   `pnpm test:integration`, `pnpm verify:static`, `pnpm --filter @nagarikwatch/web build`,
   `pnpm --filter @nagarikwatch/admin build`, `pnpm test:e2e`, `pnpm test:e2e:newsroom`,
   `pnpm validate:newsroom`, `node scripts/launch-gate.mjs`, `node scripts/verify-workspace-lock.mjs`.
   Note anything likely to fail and why.
5. **What you could NOT verify** without tools (live endpoints, Postgres, Blob, real
   deploys) — be explicit and honest. Recommend the human run the launch gate with
   `NEXT_PUBLIC_LAUNCH_STATUS=live` only after secrets are real.

Be adversarial, be thorough, be honest. Implement truly. No half measures.
