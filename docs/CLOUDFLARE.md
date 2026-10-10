# Cloudflare Workers hosting (OpenNext)

> **This is the origin.** Production reader+API is the `nagarik-watch` Worker
> built with `@opennextjs/cloudflare`. Cloudflare Workers Builds runs it on every
> push to `main`. DNS and CDN are Cloudflare (ADR-004).

Nagarik Watch's public Next.js app (`apps/web`) deploys to Cloudflare Workers via
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare).

## Requirements

1. **Build on Linux** — Windows native OpenNext builds fail on symlink
   `EPERM`. Cloudflare Workers Builds is Linux, so CI is unaffected; for local
   deploys use `bash scripts/cf-build-wsl.sh` or WSL.

2. **Postgres for auth/newsroom** — PGlite does not run on Workers. Use an
   external Postgres (Neon, Supabase, Aiven) and set `DATABASE_URL` as a Worker
   secret. Cloudflare D1 is another option with adapter work.

3. **R2 for media (optional)** — enable R2 in the dashboard (free tier includes
   storage): [R2 Overview](https://dash.cloudflare.com/?to=/:account/r2/overview).
   Until storage is configured, do not substitute source-code article fixtures
   for newsroom media.

## Free-tier limits that actually bind

Verified against Cloudflare's limits documentation (updated 2026-10-08). Earlier
revisions of this file described a **3 MiB gzip** Worker limit. **That limit does
not exist any more** and was never the constraint.

| Limit                      | Workers Free | Note                                                     |
| -------------------------- | ------------ | -------------------------------------------------------- |
| Worker size (uncompressed) | **64 MiB**   | There is no compressed-size limit; gzip is not enforced. |
| CPU time per request       | **10 ms**    | **This is the binding constraint.** See below.           |
| Requests                   | 100k/day     | Fine for launch/preview.                                 |
| Static asset files         | 20,000       | Prerendered pages and hashed assets count here.          |

The 10 ms CPU budget is why `CF_WORKERS=1` is set during deploy: it selects the
static-assets incremental cache and cache interception, so prerendered routes
are served straight from the asset store and never invoke the Worker. Only
genuinely dynamic routes spend CPU. Watch Error 1102 ("exceeded CPU time") in
Worker metrics; that, not bundle size, is what forces a paid plan.

## Architecture

```
Workers Builds (Linux) → opennextjs-cloudflare build → wrangler deploy
                  ↓
          OpenNext worker (nagarik-watch)
                  ↓
     Static assets + slim handler | Postgres (secret) | R2 (optional)
```

Payload CMS (`apps/admin`) stays a separate service. The live reader must reach
that service with `CONTENT_SOURCE=payload` (the default).

## One-time setup

```bash
pnpm --filter @nagarikwatch/web exec wrangler login
pnpm --filter @nagarikwatch/web exec wrangler whoami
```

Set secrets:

```bash
cd apps/web
pnpm exec wrangler secret put AUTH_SECRET
pnpm exec wrangler secret put BETTER_AUTH_SECRET
pnpm exec wrangler secret put REVALIDATE_SECRET
pnpm exec wrangler secret put DATABASE_URL
```

Override `NEXT_PUBLIC_SITE_URL` / `BETTER_AUTH_URL` in `apps/web/wrangler.jsonc`
if the canonical host is not the apex.

## Cloudflare Workers Builds

| Setting        | Set to exactly this     |
| -------------- | ----------------------- |
| Build command  | `pnpm build`            |
| Deploy command | `pnpm run deploy`       |
| Root directory | `/` (empty / repo root) |

`pnpm run deploy` runs `scripts/cf-ci-deploy.mjs`, which builds the OpenNext
Worker in `apps/web` and deploys it with `apps/web/wrangler.jsonc`.

**Do not set Deploy to `npx wrangler deploy`.** From the repo root there is no
Wrangler config on purpose: two configs previously claimed the same Worker name,
one of them pointing at a static export directory this app cannot produce. That
collision is what made the origin serve a site with no API routes.

**Production branch:** build `main` only. Dependabot PRs that bump TypeScript 7
break the Next config loader; TypeScript is pinned to 5.9.x.

## Static Pages preview (optional, preview-only)

`pnpm build:cf-pages` / `pnpm deploy:cf-pages` still produce and publish the
static export under `apps/web/out`. A static export has no server: it stashes
`app/api` and `app/admin` to make the build pass, so **every `/api/*` route
answers 404**. It must never be the live origin.

## Deploy (local)

From WSL after `bash scripts/cf-build-wsl.sh`:

```bash
cd ~/nagarik-watch && pnpm deploy
```

Check bundle size without deploying:

```bash
cd apps/web
CF_WORKERS=1 pnpm exec opennextjs-cloudflare build
pnpm exec wrangler deploy --dry-run
```

## Custom domain

Workers → `nagarik-watch` → the apex route, plus a `www` DNS record pointing at
the zone. A Worker keeps serving the previous version if a build fails, so a
broken push does not take the site down.

## Cron

`POST` `/api/cron/*` with `Authorization: Bearer $CRON_SECRET` via Cron Triggers
(5 free) or an external scheduler.
