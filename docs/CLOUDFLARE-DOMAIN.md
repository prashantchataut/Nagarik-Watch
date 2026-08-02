# Cloudflare domain cutover

## Locked launch topology (ADR-004)

**Production origin = Vercel (full Next.js Node app).**  
Cloudflare provides DNS, CDN, and WAF in front of Vercel.

| What | Where |
|------|--------|
| Public reader + `/api` + auth + engagement | **Vercel** |
| Payload CMS | **Vercel** (or sibling project) at `PAYLOAD_PUBLIC_SERVER_URL` |
| Edge / DNS | **Cloudflare** proxied to Vercel |
| Cloudflare Pages `out` | Preview/mirror **only** — **not** launch origin |

Static Pages export (`pnpm deploy:web:static` / `build-pages-static.mjs`) **strips** `app/api`
and `app/admin`. Auth, comments, polls, reading, contact, and cron do not work there.
Do not set `NEXT_PUBLIC_LAUNCH_STATUS=live` on a static-only apex.

## Option A — Domain on Cloudflare DNS → Vercel origin (launch path)

1. Add your domain to Cloudflare (DNS only or Proxied).
2. Keep production app on Vercel (e.g. `https://nagarik-watch.vercel.app`).
3. In Cloudflare DNS:
   - `CNAME` `@` → `cname.vercel-dns.com` (or Vercel’s shown target), **Proxied** for CDN/WAF
   - `CNAME` `www` → same
4. In Vercel → Project → Domains → add apex + `www`
5. Set `NEXT_PUBLIC_SITE_URL` / `BETTER_AUTH_URL` to `https://yourdomain.com`
6. Admin ops: `https://yourdomain.com/admin/login`  
   Payload desk: `NEXT_PUBLIC_CMS_ADMIN_URL` / `PAYLOAD_PUBLIC_SERVER_URL`

Follow `docs/launch-runbook.md` for soft → hard launch.

## Option B — Cloudflare Pages static (preview only)

```bash
pnpm deploy:web:static
```

- Public HTML/CSS: on Pages  
- `/admin`, `/api`, login, engagement: **unavailable**  
- Use for design/content previews — **never** as the declared live product origin

## Option C — Everything on Cloudflare Workers (Paid)

Requires Workers Paid and a bundle under platform limits. Not the default launch path.
See historical notes in deploy scripts; prefer Option A unless you intentionally migrate.

## Current reference URLs

- Vercel (full app — launch candidate): https://nagarik-watch.vercel.app  
- Cloudflare Pages (static preview): https://nagarik-watch.pages.dev  
- Cloudflare Worker full app: not the default launch target

## Scripts

| Command | Result |
|---------|--------|
| Vercel Git deploy / `vercel --prod` | Full Node app (launch origin) |
| `pnpm deploy:web:static` | Static Pages preview only |
| `pnpm deploy:web:cf` | Full Worker (Paid / size constraints) |
