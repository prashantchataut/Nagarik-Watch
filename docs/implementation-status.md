# Implementation status — Nagarik Watch newsroom repair

Track user-visible capabilities only. `VERIFIED` requires the acceptance test named in Evidence.

| Gate | Status | Evidence | Remaining work |
|---|---|---|---|
| Local dev stack (Postgres + web + local media) | IN PROGRESS | `pnpm dev:stack`, `docker-compose.yml`, `LOCAL_MEDIA_DIR` | Optional Payload `:3001` in compose |
| Boot accounts (reporter, editor, publisher, admin) | IN PROGRESS | `boot-accounts.ts`, `.env.example` | Verify first-login on fresh Postgres |
| Reporter draft create + persist | IN PROGRESS | `JournalistArticleDraftForm`, `/api/journalist/articles` | Full Playwright gate |
| Thumbnail upload (local adapter) | IN PROGRESS | `/api/admin/media/upload`, `/api/media/local/[filename]` | JPEG/WebP policy E2E variants |
| Reporter submit for review | IN PROGRESS | workflow transition `draft→submitted` | Block edits while `submitted` — implemented |
| Editor request changes | IN PROGRESS | `/api/admin/journalist-feedback`, `/admin/journalists` | Playwright gate |
| Publisher publish + public propagation | IN PROGRESS | `updateArticle` publish timestamps, `revalidatePublishedArticle` | Playwright gate |
| Editorial state machine (server) | IN PROGRESS | `lib/editorial/workflow-transitions.ts` | Schedule worker, slug redirect |
| Integration tests (DB + store) | NOT STARTED | — | `test:integration` script |
| Newsroom Playwright E2E | IN PROGRESS | `playwright.newsroom.config.ts`, `e2e/newsroom-lifecycle.spec.ts` | Requires Docker Postgres locally |
| Scheduled publish worker | NOT STARTED | — | Cron/worker + idempotency |
| Revision compare UI | NOT STARTED | revision list on journalist edit | Admin diff view |

## Commands

```bash
pnpm dev:stack          # start Postgres
pnpm db:reset:test      # clear articles JSON + ops tables + uploads
pnpm test               # unit tests incl. workflow + media validation
pnpm test:e2e:newsroom  # full editorial lifecycle (Postgres required)
```
