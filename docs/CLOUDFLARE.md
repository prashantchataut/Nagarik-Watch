# Cloudflare Workers hosting (OpenNext) — Free tier

> **Not the launch origin.** Production reader+API runs on **Vercel Node** with Cloudflare
> DNS/CDN (ADR-004). This document covers the optional Workers Free / OpenNext path and
> its size limits. For launch topology see `docs/CLOUDFLARE-DOMAIN.md` and
> `docs/launch-runbook.md`.

Nagarik Watch's public Next.js app (`apps/web`) can deploy to **Cloudflare Workers Free** via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) when the gzip bundle fits.

## Requirements (all free)

1. **Workers Free plan** — script must stay under **3 MiB gzip**. Use `pnpm deploy:free` (`CF_WORKERS=1` + `wrangler deploy --minify`). No paid Workers upgrade needed if the slim build fits.

2. **Build on WSL/Linux** — Windows native OpenNext builds fail on symlink `EPERM`; use `bash scripts/cf-build-wsl.sh` then deploy from `~/nagarik-watch/apps/web`.

3. **Postgres for auth/newsroom** — PGlite does not run on Workers. Use a free external Postgres (Neon, Supabase, etc.) and set `DATABASE_URL` as a Worker secret. Cloudflare D1 is another free option with adapter work.

4. **R2 for media (optional)** — enable R2 in the dashboard (free tier includes storage): [R2 Overview](https://dash.cloudflare.com/?to=/:account/r2/overview). Until then, JSON-seed content works without uploads.

## Free-tier limits to know

| Limit | Workers Free | Impact |
|-------|--------------|--------|
| Worker gzip size | 3 MiB | Slim build + `--minify` required |
| CPU per request | 10 ms | Favor cached/static pages; heavy SSR may timeout |
| Requests | 100k/day | Fine for launch/preview |
| KV / R2 | Free tiers exist | ISR cache + media |

## Architecture

```
WSL build (CF_WORKERS=1) → wrangler deploy --minify
                 ↓
         OpenNext worker (nagarik-watch)
                 ↓
    Static assets + slim handler | Postgres (secret) | R2 (optional)
```

Payload CMS (`apps/admin`) stays separate until a second Worker is added. Keep `CONTENT_SOURCE=json` on the reader until then.

## One-time setup

```bash
pnpm --filter @nagarikwatch/web exec wrangler login
pnpm --filter @nagarikwatch/web exec wrangler whoami
```

KV namespace for non-free builds is in `wrangler.jsonc`. Free deploys use static-assets ISR and do not require KV.

Set secrets:

```bash
cd apps/web
pnpm exec wrangler secret put AUTH_SECRET
pnpm exec wrangler secret put BETTER_AUTH_SECRET
pnpm exec wrangler secret put REVALIDATE_SECRET
pnpm exec wrangler secret put DATABASE_URL
```

Vars in `wrangler.jsonc`: `CONTENT_SOURCE=json`, `NEXT_PUBLIC_LAUNCH_STATUS=preview`, plus override `NEXT_PUBLIC_SITE_URL` / `BETTER_AUTH_URL` to your real domain after first deploy.

## Cloudflare Workers Builds (this is what is failing)

Your dashboard is using **Workers Builds**, not classic Pages upload.

| Setting | Set to exactly this |
|---------|---------------------|
| Build command | `pnpm build` |
| Deploy command | `pnpm run deploy` |
| Root directory | `/` (empty / repo root) |

`pnpm run deploy` runs `wrangler deploy --no-autoconfig` against root `wrangler.jsonc` (static assets from `apps/web/out`).

Do **not** leave Deploy as `npx wrangler deploy` unless you are on a commit that includes the assets-only root `wrangler.jsonc` (that path also works after that commit). Prefer `pnpm run deploy`.

**Production branch:** set Workers Builds / Pages to build **`main` only**. Dependabot PRs that bump TypeScript 7 break Next’s `next.config.ts` loader (`fileExists` crash). Config is now `next.config.mjs` and TypeScript is pinned to 5.9.x.

### Classic Pages (optional alternative)

| Setting | Value |
|---------|--------|
| Build command | `pnpm build` |
| Build output directory | `apps/web/out` |
| Deploy command | *(leave empty)* |

Set `NEXT_PUBLIC_SITE_URL` in project env. Without it, the build falls back to `CF_PAGES_URL` or `https://nagarik-watch.pages.dev`.

Do **not** point the output directory at `.next`.

## Deploy (free)

From WSL after `bash scripts/cf-build-wsl.sh`:

```bash
cd ~/nagarik-watch/apps/web
pnpm deploy:free
```

From repo root (same WSL tree):

```bash
pnpm deploy:web:cf
```

Check bundle size without deploying:

```bash
cd apps/web
CF_WORKERS=1 pnpm exec opennextjs-cloudflare build
pnpm exec wrangler deploy --dry-run --minify
```

## Custom domain

Workers → `nagarik-watch` → Custom domains (zone on Cloudflare).

## Cron

`POST` `/api/cron/*` with `Authorization: Bearer $CRON_SECRET` via Cron Triggers (5 free) or an external scheduler.
