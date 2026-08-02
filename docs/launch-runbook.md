# Launch runbook — Nagarik Watch

Operator guide for soft → hard launch. Product rules: free-to-read Option A; Payload
canonical (ADR-014); origin = **Vercel Node + Cloudflare DNS/CDN** (ADR-004).

Public pages never show this checklist. Drive it from `/admin/launch` on the **Node** host
and `pnpm launch:gate`.

## Topology (locked)

```
Reader → Cloudflare (DNS/CDN) → Vercel (apps/web Node)
                                      ├─ Postgres (auth, engagement, ops)
                                      └─ Payload REST (CONTENT_SOURCE=payload)
Payload (apps/admin) → same Postgres + object storage (Blob/R2)
```

**Do not** point apex at Cloudflare Pages static `out` for launch. Static export removes
APIs (`scripts/build-pages-static.mjs`).

## Env matrix (minimum)

| Concern | Variables |
|---------|-----------|
| Origin | `NEXT_PUBLIC_SITE_URL`, `BETTER_AUTH_URL` → production domain on Vercel |
| Status | `NEXT_PUBLIC_LAUNCH_STATUS=preview` until hard launch |
| DB | `DATABASE_URL` (Postgres); `pnpm migrate:ops`; `AUTH_AUTO_MIGRATE=false` in prod |
| Auth | `AUTH_SECRET` ≥32; staff MFA via `STAFF_MFA_ENABLED=true` before live |
| CMS | `CONTENT_SOURCE=payload`, `PAYLOAD_*`, `REVALIDATE_SECRET`, `PAYLOAD_DB_PUSH=false` |
| Email | `RESEND_API_KEY` (or newsletter API), `AUTH_EMAIL_FROM`, `NEWSLETTER_FROM` |
| Media | `BLOB_READ_WRITE_TOKEN` and/or `R2_*` + `STORAGE_PUBLIC_BASE_URL` |
| Ads (soft) | `NEXT_PUBLIC_ADS_MODE=house` + house creatives; sales email before network |
| Cron | `CRON_SECRET`; GitHub `ops-crons.yml` or Vercel cron hitting `/api/cron/*` |
| Abuse | `CAPTCHA_PROVIDER=turnstile` + site/secret keys when live |
| Observability | `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (or GA4), Sentry DSN |
| Legal | `NEXT_PUBLIC_PUBLICATION_LEGAL_NAME`, `EDITOR_IN_CHIEF`, `DOIB_NUMBER`, address, phone, email |
| Seed | Leave `ALLOW_STARTER_SEED` unset/false in production |

## Phase 0 — Topology

1. Add domain on Vercel; CF DNS CNAME `@`/`www` → Vercel (see `docs/CLOUDFLARE-DOMAIN.md`).
2. Set secrets on Vercel (DB, auth, email, storage). Keep `NEXT_PUBLIC_LAUNCH_STATUS=preview`.
3. Run `pnpm migrate:ops` against production Postgres.
4. Confirm `/admin/launch` loads on the Vercel origin (not Pages).

## Phase 1 — Payload cutover

1. Deploy `apps/admin`; apply Payload migrations; set `PAYLOAD_DB_PUSH=false`.
2. Complete cutover checklist on `/admin/launch` (URL, token, secret, revalidate, media).
3. Staging: set `CONTENT_SOURCE=payload`; publish one article → public URL ≤60s via revalidate.
4. Train desk: article CRUD in Payload; web `/admin` for ops (comments, ads, launch).
5. Publish ≥30 real Nepali stories; confirm no starter seed on homepage.

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
  `CRON_SECRET` + `CRON_BASE_URL` (Vercel production URL).
- **Daily** only on Vercel Hobby: see root `vercel.json` crons (notifications, digest,
  ops-probe, interactions-rebuild).

## Anti-goals

- Homepage polish instead of cutover
- `live` while apex is CF Pages static
- Seed inventory framed as real news
- Membership chrome (Option A stays off unless `NEXT_PUBLIC_MEMBERSHIP_PUBLIC=true`)
