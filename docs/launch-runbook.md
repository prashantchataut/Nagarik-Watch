# Launch runbook — Nagarik Watch

Operator guide for soft → hard launch. Product rules: free-to-read Option A; Payload
canonical (ADR-014); origin = **Vercel Node + Cloudflare DNS/CDN** (ADR-004).

Public pages never show this checklist. Drive it from `/admin/launch` on the **Node** host
and `pnpm launch:gate`.

## Status (2026-08-02)

| Layer                                                                          | State        |
| ------------------------------------------------------------------------------ | ------------ |
| In-repo (code, gates, ADR-004, honesty, CI smoke)                              | **Complete** |
| Operator Phase 0 (DNS → Vercel, Postgres, email, Blob)                         | Remaining    |
| Operator Phase Soft (`CONTENT_SOURCE=json` + Postgres desk, ≥30 stories, cron) | Remaining    |
| Operator Phase Hard (`CONTENT_SOURCE=payload` cutover + `live`)                | Remaining    |

`/admin/launch` shows an env **readiness %**, soft/hard phase badges wired to probes, and a
**current stage** + next action. A high score on localhost does not mean production is live.

Soft launch may ship on **Postgres `nw_articles` / JSON desk** while
`NEXT_PUBLIC_LAUNCH_STATUS=preview`. Payload cutover is a **hard-launch** requirement
(`CONTENT_SOURCE=payload`), not a soft-launch gate.

## Topology (locked)

```
Reader → Cloudflare (DNS/CDN) → Vercel (apps/web Node)
                                      ├─ Postgres (auth, engagement, ops, soft desk nw_articles)
                                      └─ Payload REST (hard cutover: CONTENT_SOURCE=payload)
Payload (apps/admin) → same Postgres + object storage (Blob/R2)
```

**Do not** point apex at Cloudflare Pages static `out` for launch. Static export removes
APIs (`scripts/build-pages-static.mjs`).

## Env matrix (minimum)

| Concern       | Variables                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------ |
| Origin        | `NEXT_PUBLIC_SITE_URL`, `BETTER_AUTH_URL` → production domain on Vercel                          |
| Status        | `NEXT_PUBLIC_LAUNCH_STATUS=preview` until hard launch                                            |
| DB            | `DATABASE_URL` (Postgres); `pnpm migrate:ops`; `AUTH_AUTO_MIGRATE=false` in prod                 |
| Auth          | `AUTH_SECRET` ≥32; staff MFA via `STAFF_MFA_ENABLED=true` before live                            |
| Soft CMS      | Unset/`json` CONTENT_SOURCE + Postgres desk (`nw_articles`) until cutover                        |
| Hard CMS      | `CONTENT_SOURCE=payload`, `PAYLOAD_*`, `REVALIDATE_SECRET`, `PAYLOAD_DB_PUSH=false`              |
| Email         | `RESEND_API_KEY` (or newsletter API), `AUTH_EMAIL_FROM`, `NEWSLETTER_FROM`                       |
| Media         | `BLOB_READ_WRITE_TOKEN` and/or `R2_*` + `STORAGE_PUBLIC_BASE_URL`                                |
| Ads (soft)    | Ads off OK for Option A; or `NEXT_PUBLIC_ADS_MODE=house` + creatives                             |
| Cron          | `CRON_SECRET`; GitHub `ops-crons.yml` or Vercel cron hitting `/api/cron/*`                       |
| Abuse         | `CAPTCHA_PROVIDER=turnstile` + site/secret keys when live                                        |
| Observability | `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (or GA4), Sentry DSN                                              |
| Legal         | `NEXT_PUBLIC_PUBLICATION_LEGAL_NAME`, `EDITOR_IN_CHIEF`, `DOIB_NUMBER`, address, phone, email    |
| Seed          | Leave `ALLOW_STARTER_SEED` unset/false in production                                             |
| Admin nav     | Soft preview hides algorithms/experiments extras; set `NEXT_PUBLIC_ADMIN_FULL_NAV=1` to show all |

## Phase 0 — Topology

1. Add domain on Vercel; CF DNS CNAME `@`/`www` → Vercel (see `docs/CLOUDFLARE-DOMAIN.md`).
   Optional: add `calendar.` on the same project and set `NEXT_PUBLIC_CALENDAR_HOST`
   so पात्रो can live on its own host.
2. Set secrets on Vercel (DB, auth, email, storage). Keep `NEXT_PUBLIC_LAUNCH_STATUS=preview`.
3. Run `pnpm migrate:ops` against production Postgres.
4. Confirm `/admin/launch` loads on the Vercel origin (not Pages).

## Phase 1 — Soft desk (before Payload)

1. Keep `CONTENT_SOURCE` unset or `json` with `DATABASE_URL` so desk publish writes `nw_articles`.
2. Publish ≥30 real Nepali stories from web desk; confirm no starter seed on homepage.
3. Confirm `/admin/launch` soft phase: desk-publish, corpus, auth/email, cron (not Payload).

## Phase 1b — Payload cutover (hard gate)

1. Deploy `apps/admin`; apply Payload migrations; set `PAYLOAD_DB_PUSH=false`.
2. Complete cutover checklist on `/admin/launch` (URL, token, secret, revalidate, media).
3. Migrate soft-desk inventory (dry-run first):
   `pnpm migrate:desk-to-payload` then `pnpm migrate:desk-to-payload -- --apply`
4. Staging: set `CONTENT_SOURCE=payload`; publish one article → public URL ≤60s via revalidate.
5. Train desk: article CRUD in Payload; web `/admin` for ops (comments, ads, launch).
6. Confirm hard-phase **Payload cutover** item is green before flipping live.

## Phase 2 — Soft launch (still `preview`)

1. Auth signup/login/reset; consent cookie present (`ensureConsentCookie`).
2. Comments → moderation queue; polls vote; contact form; reading sync with consent.
3. Cron scheduled-publish heartbeat green for 48h.
4. House ads labeled; English only when author-reviewed.
5. Soft traffic only; watch Sentry/email bounce.

Exit: reader journeys work; do **not** claim hard live yet.

## Phase 3 — Hard launch

1. Fill verified legal env (no `pending` / `placeholder` strings).
2. `STAFF_MFA_ENABLED=true`.
3. Analytics + Sentry receiving events.
4. Turnstile on public writes.
5. `NEXT_PUBLIC_LAUNCH_STATUS=live pnpm launch:gate` → 0 blockers.
6. Flip `live` on Vercel; announce; Search Console / news sitemap.

## Commands

```bash
pnpm launch:gate                    # strict only when LAUNCH_STATUS=live
pnpm migrate:ops                    # ops tables
pnpm validate:newsroom              # local stack env
# On Node host:
# open /admin/launch
```

## Cron topology

- **Sub-daily** (scheduled-publish every 5 min, house-ad-promote, breaking boost): GitHub
  Actions [`.github/workflows/ops-crons.yml`](../.github/workflows/ops-crons.yml) with
  repo secrets `CRON_SECRET` (≥32 chars) + `CRON_BASE_URL` (Vercel production URL, no trailing slash).
- **Daily** only on Vercel Hobby: see root `vercel.json` crons (notifications, digest,
  ops-probe, interactions-rebuild).

Until those schedulers hit the Node host, `/admin/launch` shows cron heartbeats as **NEVER**
(not a false outage). **STALE** means a job ran before but missed its interval. Pool **1/1**
with waiting 0 is expected (max 1 connection per instance).

Manual smoke (once secrets exist):

```bash
curl -X POST "$CRON_BASE_URL/api/cron/scheduled-publish" \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Anti-goals

- Homepage polish instead of cutover
- `live` while apex is CF Pages static
- Seed inventory framed as real news
- Membership chrome (Option A stays off unless `NEXT_PUBLIC_MEMBERSHIP_PUBLIC=true`)
