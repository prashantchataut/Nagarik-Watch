# Algorithm & capability inventory

Generated as the handoff for the code-actionable backlog. Statuses live in
`apps/web/lib/algorithms/catalog.ts` and the `/admin/algorithms` desk.

## Ground rules

- **live** — library + durable path + real surface + tests
- **partial** — real code path incomplete or provider-gated
- **scaffold / planned** — not end-to-end yet
- **blocked** — needs vendors, accounts, production traffic, or ML

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
| Ops schema | `DATABASE_URL` + `pnpm migrate:ops` | `/admin/launch` ops-migrations = pass |

## Deploy checklist (ops)

1. `PAYLOAD_DB_PUSH=false` + Payload migrations
2. `pnpm migrate:ops`
3. `AUTH_AUTO_MIGRATE=false` in production
4. `pnpm test:a11y` / `pnpm test:e2e` when CI browsers available
5. `NEXT_PUBLIC_LAUNCH_STATUS=live pnpm launch:gate`

## Explicitly blocked (not claimed live)

CDN/HTTP3/WAF, Apple News, clean rooms, header bidding / TrueCPM, embeddings /
semantic search, trained ML toxicity/misinformation, session replay vendors,
monetary LTV models, e-paper operations, multi-CDN.
