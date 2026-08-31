# नागरिक वाच — Nagarik Watch

> नेपालको डेवनागरी-प्रथम डिजिटल समाचार पोर्टल — Devanagari-first digital newsroom for Nepal.

**Structure:** one canonical app — `apps/web` (Next.js 16, App Router, real routes, SSG + ISR).

## Quick start

```bash
pnpm install                      # uses the committed pnpm-lock.yaml
pnpm db:push                      # create the SQLite schema (dev)
pnpm seed                         # demo journalists/reader/ads/poll/breaking
pnpm dev                          # http://localhost:3000
```

Demo accounts (password `demo1234`): `sushila@nagarikwatch.com` (editor), `manisha@`/`rajesh@` (reporters), `demo.reader@nagarikwatch.com` (subscriber).

## Deploy to Vercel

1. Import the repo — root directory stays the repo root; `vercel.json` already sets install/build (`pnpm install --frozen-lockfile` + `pnpm --filter ./apps/web build`).
2. Set env vars (see `.env.example`): `DATABASE_URL` (Postgres for serverless), `NEXT_PUBLIC_SITE_URL`, and the R2 keys when you want uploads.
3. For Postgres: flip `provider` in `apps/web/prisma/schema.prisma` to `postgresql`, run `pnpm db:push` once against the production URL.
4. `launch check` → log in as the editor at `/journalist` → **सम्पादक डेस्क → लन्च चेक** — the score explains exactly which env items remain.

Full walkthrough: [`LAUNCH-GUIDE.md`](./LAUNCH-GUIDE.md) · Design contract: [`DESIGN.md`](./DESIGN.md) · Change log: [`CHANGES.md`](./CHANGES.md)

## What's inside

- **99 stories** across 17 desks (incl. विपद् disaster hub + तथ्य जाँच fact-check), full Nepali + English bodies, real Aug-2026 Bhote Koshi flood coverage.
- **Real routes + SEO**: per-article metadata/OG, JSON-LD (NewsArticle, NewsMediaOrganization, BreadcrumbList, ItemList), sitemap.xml (159+ URLs), robots.txt, RSS, llms.txt, PWA manifest.
- **Newsroom CMS**: pitch → draft → review → publish → analytics; reporter/editor roles; breaking-news control.
- **Readers**: accounts, synced bookmarks, comments, live polls, saved pages, reading history.
- **Monetization**: labeled ad slots (house-ad fallback, editor-managed campaigns with CTR), metered paywall (8 free stories/month, editor-tunable), subscriptions (monthly/yearly/patron, demo checkout, gateway-ready), view counts + trending.
- **Personalization**: transparent recommendation engine (desk affinity + tags + recency + trending).
- **Privacy**: cookie consent (necessary/analytics), cookie policy, gated beacons.
- **Live data**: BS पात्रो + panchanga (astronomy engine), NRB forex, gold/silver, NEPSE (labelled fallback), USGS earthquake feed.
- **Media**: Cloudflare R2 uploads (S3-compatible, SigV4, zero-dependency).
