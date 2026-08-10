# Admin + full app hosting

## Live now

| Surface                             | URL                                          | Host                  |
| ----------------------------------- | -------------------------------------------- | --------------------- |
| **Full app** (admin + API + reader) | https://nagarik-watch.vercel.app             | Vercel                |
| **Admin login**                     | https://nagarik-watch.vercel.app/admin/login | same                  |
| Static reader (Cloudflare)          | https://nagarik-watch.pages.dev              | Cloudflare Pages Free |

## Cloudflare + your domain

See **[CLOUDFLARE-DOMAIN.md](./CLOUDFLARE-DOMAIN.md)**.

Workers Free **cannot** host the full admin app (gzip ~**3.15 MiB** vs Free limit **3.00 MiB**, error 10027).

To put the **domain on Cloudflare** today without Workers Paid:

1. Add the domain in Cloudflare DNS
2. Point it at Vercel (`cname.vercel-dns.com`) with orange-cloud proxy
3. Add the same domain in the Vercel project

Admin then works at `https://yourdomain.com/admin/login`.

Or attach the domain only to **Pages** for a static public site (no `/admin`).

For admin+API running _as_ a Cloudflare Worker, enable Workers Paid, then:

```bash
bash scripts/cf-deploy-app-wsl.sh
```

## Login

https://nagarik-watch.vercel.app/admin/login

Use Vercel production `NEWSROOM_SUPERADMIN_*` env vars.

## Redeploy

```bash
vercel deploy --prod --yes          # full app (admin)
pnpm deploy:web:static              # Cloudflare Pages static only
```
