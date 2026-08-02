# Implementation status — Nagarik Watch newsroom repair

Track user-visible capabilities only. `VERIFIED` requires the acceptance test named in Evidence.

## Launch readiness program (2026-08)

| Gate | Status | Evidence | Remaining work |
|---|---|---|---|
| ADR-004 origin decision | VERIFIED | `docs/adr/ADR-004-origin-hosting.md` Accepted | Point apex DNS at Vercel (operator) |
| Launch probes + `/admin/launch` stages | VERIFIED | `launch-readiness.ts`, `launch-phases.ts`, Turnstile check | Operator clears fails/warns on Node host |
| Launch gate + origin assert scripts | VERIFIED | `scripts/launch-gate.mjs`, `assert-launch-origin.mjs` | Run with `live` only after legal/MFA |
| Publication honesty (no fake contact) | VERIFIED | `site.ts`, Footer, contact, well-known routes | Fill verified `NEXT_PUBLIC_*` legal env |
| Payload cutover checklist | IN PROGRESS | `payload-cutover.ts`, runbook Phase 1 | Flip `CONTENT_SOURCE=payload` + corpus ≥30 |
| Soft launch product loops | IN PROGRESS | Auth, polls, comments, consent, crons in code | Soft traffic + 48h cron heartbeat on Vercel |
| Hard launch (DoIB, MFA, analytics, Turnstile) | NOT STARTED | Runbook Phase 3 | Operator secrets + `launch:gate` then `live` |

Operator source of truth: [`docs/launch-runbook.md`](launch-runbook.md). Do not claim hard live from repo score alone.

## Newsroom repair gates

| Gate | Status | Evidence | Remaining work |
|---|---|---|---|
| Local dev stack (Postgres + web + Payload CMS) | IN PROGRESS | `pnpm dev:newsroom`, `docker-compose.yml`, `scripts/validate-newsroom-env.mjs` | Docker optional when hosted Postgres is configured |
| Boot accounts (reporter, editor, publisher, admin) | IN PROGRESS | `boot-accounts.ts`, `.env.example` | Verify first-login on fresh Postgres |
| Reporter draft create + persist | IN PROGRESS | `JournalistArticleDraftForm`, `/api/journalist/articles` | Full Playwright gate |
| Thumbnail upload (local adapter) | IN PROGRESS | `/api/admin/media/upload`, `/api/media/local/[filename]` | JPEG/WebP policy E2E variants |
| Reporter submit for review | IN PROGRESS | workflow transition `draft→submitted` | Block edits while `submitted` — implemented |
| Editor request changes | IN PROGRESS | `/api/admin/journalist-feedback`, `/admin/journalists` | Playwright gate |
| Publisher publish + public propagation | IN PROGRESS | `updateArticle` publish timestamps, `revalidatePublishedArticle` | Playwright gate |
| Editorial state machine (server) | IN PROGRESS | `lib/editorial/workflow-transitions.ts` | Slug redirect on rename |
| Integration tests (Payload REST contract) | IN PROGRESS | `pnpm test:integration`, `payload-source.contract.test.ts` | Live Payload/Postgres job in CI |
| Newsroom Playwright E2E | IN PROGRESS | `playwright.newsroom.config.ts`, `e2e/newsroom-lifecycle.spec.ts` | Requires Docker Postgres locally |
| Scheduled publish worker | IN PROGRESS | `/api/cron/scheduled-publish`, `lib/editorial/scheduled-publish.ts`, `.github/workflows/ops-crons.yml` (every 5 min; Vercel Hobby is daily-only) | Deploy + heartbeat verify |
| Morning brief → newsletter draft | IN PROGRESS | `/api/cron/digest-compose` (draft by default; `DIGEST_SEND_NOW` to send) | Desk review UI polish |
| Breaking auto-boost + kill switch | IN PROGRESS | `/api/cron/breaking-auto-boost`, setting `editorial.breakingAutoBoost` | Tune thresholds with live traffic |
| House-ad A/B + winner promote | IN PROGRESS | `house-ads` challenger, `/api/cron/house-ad-promote`, admin Promote button | Live CTR volume for Bayesian winners |
| Slug redirect on rename | IN PROGRESS | `lib/content/slug-redirects.ts`, article page `permanentRedirect` | Payload-mode rename path |
| Province heat strip | IN PROGRESS | `lib/content/province-heat.ts`, homepage `ProvinceHub` | Needs tagged province + live readers |
| Payload canonical cutover checklist | IN PROGRESS | `lib/content/payload-cutover.ts`, `/admin/launch`, `docs/launch-runbook.md` | Flip `CONTENT_SOURCE=payload` on Vercel after desk training |
| Origin hosting (ADR-004) | VERIFIED | `docs/adr/ADR-004-origin-hosting.md` Accepted: Vercel Node + CF edge | Point apex DNS; do not launch on Pages static |
| Revision compare UI | IN PROGRESS | journalist edit overlap % + body preview | Side-by-side admin diff optional |

## Commands

```bash
pnpm dev:stack          # Postgres only (Docker)
pnpm dev:newsroom       # full stack: validate env → migrate → web :3000 + Payload :3001
pnpm validate:newsroom  # env gate before boot
pnpm db:reset:test      # clear articles JSON + ops tables + uploads
pnpm test               # unit tests incl. workflow + media validation
pnpm test:integration   # Payload REST contract + content-source resolution
pnpm test:e2e:newsroom  # full editorial lifecycle (JSON store; PGlite or Postgres)
```
