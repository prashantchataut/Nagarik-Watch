# Cloudflare domain cutover (free)

## Reality check

The **full** Next.js app (admin + API + auth) is **~3.15 MiB gzip**.  
Workers Free allows **3.00 MiB**. Deploy fails with error **10027** until that changes.

So on Cloudflare Free you can host:

| What | Where | Custom domain |
|------|--------|----------------|
| Public reader (static) | **Pages** `nagarik-watch` → https://nagarik-watch.pages.dev | Yes (free) |
| Admin + API + full SSR | **Not on Workers Free** | Needs Workers Paid ($5/mo) **or** origin elsewhere |

## Recommended free setup (domain on Cloudflare today)

### Option A — Domain on Cloudflare DNS → Vercel origin (full app including admin)

1. Add your domain to Cloudflare (DNS only or Proxied).
2. Keep production app on Vercel: https://nagarik-watch.vercel.app  
3. In Cloudflare DNS:
   - `CNAME` `@` → `cname.vercel-dns.com` (or Vercel’s shown target), **Proxied** (orange cloud) if you want CF CDN/WAF  
   - `CNAME` `www` → same
4. In Vercel → Project → Domains → add `nagarikwatch.com` / `www`
5. Admin: `https://yourdomain.com/admin/login`

This puts the **domain and CDN on Cloudflare** while the Node app runs where it fits.

### Option B — Domain on Cloudflare Pages (public site only)

```bash
pnpm deploy:web:static
```

Then: Dashboard → **Workers & Pages** → **nagarik-watch** → **Custom domains** → add your domain.

- Public articles/homepage: on Cloudflare  
- `/admin`, `/api`, login: **not available** on this static export  

### Option C — Everything native on Cloudflare Workers

1. Upgrade Workers Paid: https://dash.cloudflare.com/e3c305786313db99f7500835501638a2/workers/plans  
2. Redeploy:

```bash
# WSL
bash scripts/cf-deploy-app-wsl.sh
```

3. Set secrets in Dashboard → Worker `nagarik-watch` → Settings → Variables  
   (copy `DATABASE_URL`, `AUTH_SECRET`, `BETTER_AUTH_SECRET`, `NEWSROOM_*` from Vercel)  
4. Custom domains on the **Worker** (same dashboard)  
5. Set `NEXT_PUBLIC_SITE_URL` / `BETTER_AUTH_URL` to `https://yourdomain.com`

## Current live URLs

- Cloudflare Pages (static): https://nagarik-watch.pages.dev  
- Vercel (full admin): https://nagarik-watch.vercel.app/admin/login  
- Cloudflare Worker (full app): **not deployed** (size limit)

## Scripts

| Command | Result |
|---------|--------|
| `pnpm deploy:web:static` | Static Pages (domain-ready, no admin) |
| `pnpm deploy:web:cf` / `bash scripts/cf-deploy-app-wsl.sh` | Full Worker (needs ≤3 MiB or Paid) |
