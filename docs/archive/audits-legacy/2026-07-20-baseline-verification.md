# Baseline verification — 2026-07-20

Safety branch: `rebuild/2026-07-20-audit-backup` (created from `main` @ d5b6794)

## Commands

| Command                          | Result       | Notes                             |
| -------------------------------- | ------------ | --------------------------------- |
| `pnpm install --frozen-lockfile` | Pass         | Node v24.11.0 (repo expects 22.x) |
| `pnpm verify:static`             | Pass         | Launch gate skipped (not live)    |
| `pnpm test`                      | Pass         | 258 tests                         |
| `pnpm typecheck`                 | Fail → fixed | homepage-dedup lead type          |
| `node scripts/route-matrix.mjs`  | Pass         | 153 routes                        |

## Rollback

1. Remain on backup branch or return to `main`
2. Revert deploy via Vercel promotion of prior production deployment
3. Postgres: restore from latest snapshot when DATABASE_URL is configured

## Environment snapshot

Production reader URL: https://nagarik-watch.vercel.app

Required for live gate (see `scripts/launch-gate.mjs`):

- `CONTENT_SOURCE=payload`
- `PAYLOAD_PUBLIC_SERVER_URL`
- `DATABASE_URL`
- Publisher `NEXT_PUBLIC_*` identity fields
- Auth and revalidation secrets (32+ chars)

Postgres snapshot: not available in this environment (no DATABASE_URL configured locally).
