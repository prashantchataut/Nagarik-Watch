# Cloudflare Workers hosting (OpenNext) — Free tier

Nagarik Watch's public Next.js app (`apps/web`) deploys to **Cloudflare Workers Free** via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare).

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

## Cloudflare Pages (static export)

Dashboard settings:

| Setting | Value |
|---------|--------|
| Build command | `pnpm build` (routes to static export on Cloudflare CI) or `pnpm build:cf-pages` |
| Build output directory | `apps/web/out` |
| Root directory | `/` (repo root) |
| Deploy command | **leave empty** (Pages uploads `apps/web/out` automatically) |

If the host forces a Deploy command, use `pnpm deploy:cf-pages` — never `npx wrangler deploy` from the repo root (monorepo Workers detection fails).

Set `NEXT_PUBLIC_SITE_URL` in Pages → Settings → Environment variables (production domain). Without it, the build falls back to `CF_PAGES_URL` or `https://nagarik-watch.pages.dev`.

Do **not** point the output directory at `.next` — the Pages path is the static `out/` folder from `build:cf-pages`.

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
