# Nagarik Watch — Production Launch Checklist (env)

Generated 2026-08-24 from `scripts/launch-gate.mjs` run against the **real
production environment** (`vercel env pull`). Core stack is already live:
DATABASE_URL, BETTER_AUTH_SECRET/URL, NEXT_PUBLIC_SITE_URL, CONTENT_SOURCE,
PAYLOAD_SECRET, NEWSLETTER_API_KEY/BASE, NEXT_PUBLIC_LAUNCH_STATUS,
legacy `ALLOW_STARTER_SEED` (remove it if it is still present).

Add each key with `vercel env add <KEY> production`, then redeploy.
Do NOT commit real values anywhere. `.env.example` documents local dev.

## 1. Legal identity (Nepal DoIB norm — blocks footer compliance)

| Key | Example shape | Owner |
|-----|---------------|-------|
| `NEXT_PUBLIC_PUBLICATION_LEGAL_NAME` | Registered company/publisher name | Client |
| `NEXT_PUBLIC_EDITOR_IN_CHIEF` | Person named by the client | Client |
| `NEXT_PUBLIC_DOIB_NUMBER` | Registration number from DoIB | Client |
| `NEXT_PUBLIC_NEWSROOM_ADDRESS` | Full postal address | Client |
| `NEXT_PUBLIC_NEWSROOM_EMAIL` | e.g. news@nagarikwatch.com | Client |
| `NEXT_PUBLIC_NEWSROOM_PHONE` | Landline/mobile | Client |

## 2. Security hard launch (gate-enforced when LAUNCH_STATUS=live)

| Key | Notes |
|-----|-------|
| `REVALIDATE_SECRET` | ≥32 chars; powers deterministic cache revalidation |
| `CRON_SECRET` | ≥32 chars; GitHub Actions ops-crons (scheduled publish every 5 min) |
| `SUBMISSION_IP_SALT` | ≥32 chars non-placeholder; anonymises submission IPs |
| `PARTNER_FEED_TOKENS` | Prevents unauthenticated syndication feed access |
| `CAPTCHA_PROVIDER` | `turnstile` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | From Cloudflare Turnstile dashboard |
| `STAFF_MFA_ENABLED` | `true` — enforce staff MFA before launch |
| `AUTH_SECRET` | Gate lists it separately from BETTER_AUTH_SECRET; set if auth warns |

## 3. Post-boot hygiene (immediately after first admin login)

- Clear `NEWSROOM_ADMIN_PASSWORD` and `NEWSROOM_SUPERADMIN_PASSWORD` from
  Vercel env (boot-account provisioning only needs them once).

## 4. Services (feature-enabling, not blockers)

| Key | Unlocks |
|-----|---------|
| `BLOB_READ_WRITE_TOKEN` (or R2 + `STORAGE_PUBLIC_BASE_URL`) | Media uploads / photo desk |
| `SENTRY_DSN` | Error tracking (currently console-only) |
| `AUTH_EMAIL_FROM` + `NEWSLETTER_FROM` | Branded From addresses |
| TTS provider | Article listen feature |
| Semantic search provider | Upgraded search relevance |
| VAPID keys | Web push (P2, post-soft-launch) |

## 5. Hard cutover (Payload CMS — only when editorial workflow moves to CMS)

| Key | Notes |
|-----|-------|
| `PAYLOAD_PUBLIC_SERVER_URL` | Admin app URL |
| `PAYLOAD_API_TOKEN` | Reader fetch token |
| `CONTENT_SOURCE` | Flip `json` → `payload` last, after migration + verification |

## 6. Editorial declaration (not env)

- Mark **30 verified published articles** in the admin launch desk
  (`/admin/launch`) — real CMS stories are live; the verification step is the
  newsroom's sign-off.

## 7. Already verified live (no action)

Security headers (CSP/HSTS/XFO/nosniff/referrer/permissions), rate limiting on
every public POST endpoint (token bucket), auth rate limiting, partner-feed
auth scaffolding, health endpoint, sitemaps/feeds, PWA, analytics gate.
