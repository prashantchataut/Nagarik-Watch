# Algorithm & capability inventory

Statuses live in `apps/web/lib/algorithms/catalog.ts` and the `/admin/algorithms` desk.
Runtime: `apps/web/lib/algorithms/runtime.ts` via the typed registry in
`apps/web/lib/algorithms/capabilities/registry.ts`.

## Current state

**All 232 capabilities are product-functional** under the local-complete standard:

- Every catalog id has a **dedicated** registry handler (no `genericHeuristic` / hash fallback).
- `runAlgorithm` returns honest `ok` / `reason` (throws become `ok: false`, never silent success).
- Modes: `production` · `local` · `adapter-ready` · `adapter-disabled`.
- Fixtures in `apps/web/lib/algorithms/fixtures.ts` make every handler runnable without inventing traffic.
- Product modules under `apps/web/lib/algorithms/product/` and surface wiring (ranking, search,
  recommend, moderation, notify, reader, journalist AI, SEO, ads, ops, e-paper) call the same math.

External vendors (CDN, WAF, AMP cache, AV, payments, MFA) **enhance** when configured; local paths
remain useful and honest when adapters are disabled.

## Activation prerequisites (disabled adapters)

| Capability | Env / wiring | Ready when |
|---|---|---|
| Payments | `PAYMENT_PROVIDER`, secrets, checkout/webhook adapter | Adapter `ready === true` (env alone is insufficient) |
| Payload durable media | Storage plugin import + `S3_*` / `BLOB_*` | `isPayloadStorageWired()` true |
| Google auth | `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` + client id/secret | Better Auth `socialProviders.google` configured |
| Turnstile | `CAPTCHA_PROVIDER=turnstile` + site/secret keys | `getCaptchaState().enabled` |
| Staff MFA | Better Auth 2FA plugin + staff policy | `twoFactorConfigured()` |
| Email / newsletter | Resend or newsletter API + verified from addresses | `getEmailProviderState().ready` |
| Web Push | VAPID public key + provider URL/API key + `CRON_SECRET` | Launch gate push check passes |
| First-party RUM | `NEXT_PUBLIC_RUM_ADAPTER=beacon` + analytics consent | Beacon posts after consent |
| Local semantic blend | `SEARCH_SEMANTIC_LOCAL=1` | Search blends BM25 with local term-vector cosine |
| Ops schema | `DATABASE_URL` + `pnpm migrate:ops` | `/admin/launch` ops-migrations = pass |
| E-paper | `EPAPER_ENABLED=true` + replica config | `/[locale]/epaper` lists local pages |

## Cron jobs

### Vercel Hobby (`vercel.json`) — once per day only

| Path | Job heartbeat | Purpose |
|---|---|---|
| `/api/notifications/deliver` | `notifications-deliver` | Quiet-hours / fatigue-aware push delivery |
| `/api/cron/interactions-rebuild` | `interactions-rebuild` | Materialize consented CF matrix stats (no invented traffic) |
| `/api/cron/digest-compose` | `digest-compose` | Rank live digest candidates |
| `/api/cron/ops-probe` | `ops-probe` | Pool saturation + cron-miss anomalies |

### GitHub Actions (`.github/workflows/ops-crons.yml`) — sub-daily

Hobby Vercel rejects `*/5`, `*/15`, and hourly schedules. These hit production with `Authorization: Bearer $CRON_SECRET`:

| Path | Schedule | Purpose |
|---|---|---|
| `/api/cron/scheduled-publish` | every 5 min | Publish scheduled articles |
| `/api/cron/breaking-auto-boost` | every 15 min | Optional breaking boost |
| `/api/cron/house-ad-promote` | every 6 h | Promote house-ad A/B winners |

Repo secrets: `CRON_SECRET` (≥32 chars), optional `CRON_BASE_URL` (default `https://www.nagarikwatch.com`).

All require `Authorization: Bearer $CRON_SECRET` (≥32 chars).

## Deploy checklist (ops)

1. `PAYLOAD_DB_PUSH=false` + Payload migrations
2. `pnpm migrate:ops` (includes interaction matrix / RUM tables when present)
3. `AUTH_AUTO_MIGRATE=false` in production
4. `pnpm test:a11y` / `pnpm test:e2e` when CI browsers available
5. `NEXT_PUBLIC_LAUNCH_STATUS=live pnpm launch:gate`

## Honesty note

Runtime/fixture success ≠ production traffic. Impressions, ranking events, ad yield, and reader
metrics must come from real consented telemetry — never invented for demos. Duplicate catalog
numbers may share one capability module (bot quality, streaks, offline SW, social preview, etc.).
