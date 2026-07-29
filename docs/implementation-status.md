# Implementation status — Nagarik Watch newsroom repair

Track user-visible capabilities only. `VERIFIED` requires the acceptance test named in Evidence.

| Gate | Status | Evidence | Remaining work |
|---|---|---|---|
| Local dev stack (Postgres + web + Payload CMS) | IN PROGRESS | `pnpm dev:newsroom`, `docker-compose.yml`, `scripts/validate-newsroom-env.mjs` | Docker optional when hosted Postgres is configured |
| Boot accounts (reporter, editor, publisher, admin) | IN PROGRESS | `boot-accounts.ts`, `.env.example` | Verify first-login on fresh Postgres |
| Reporter draft create + persist | IN PROGRESS | `JournalistArticleDraftForm`, `/api/journalist/articles` | Full Playwright gate |
| Thumbnail upload (local adapter) | IN PROGRESS | `/api/admin/media/upload`, `/api/media/local/[filename]` | JPEG/WebP policy E2E variants |
| Reporter submit for review | IN PROGRESS | workflow transition `draft→submitted` | Block edits while `submitted` — implemented |
| Editor request changes | IN PROGRESS | `/api/admin/journalist-feedback`, `/admin/journalists` | Playwright gate |
| Publisher publish + public propagation | IN PROGRESS | `updateArticle` publish timestamps, `revalidatePublishedArticle` | Playwright gate |
| Editorial state machine (server) | IN PROGRESS | `lib/editorial/workflow-transitions.ts` | Schedule worker, slug redirect |
| Integration tests (Payload REST contract) | IN PROGRESS | `pnpm test:integration`, `payload-source.contract.test.ts` | Live Payload/Postgres job in CI |
| Newsroom Playwright E2E | IN PROGRESS | `playwright.newsroom.config.ts`, `e2e/newsroom-lifecycle.spec.ts` | Requires Docker Postgres locally |
| Scheduled publish worker | NOT STARTED | — | Cron/worker + idempotency |
| Revision compare UI | NOT STARTED | revision list on journalist edit | Admin diff view |

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
