# नागरिक वाच — Nagarik Watch

> नेपालको डेवनागरी-प्रथम डिजिटल समाचार पोर्टल — Devanagari-first digital newsroom for Nepal.

**Structure:** `apps/web` is the reader portal and the newsroom desk (Next.js 16,
App Router, real routes, SSG + ISR). `apps/admin` is the Payload CMS, deployed as
its own service. Shared code lives in `packages/*`.

## Quick start

```bash
pnpm install                      # uses the committed pnpm-lock.yaml
pnpm dev                          # http://localhost:3000
```

No database is required to run the site locally. With `DATABASE_URL` unset,
authentication runs on an embedded PGlite database under
`apps/web/.data/auth-pglite`, and with `CONTENT_SOURCE` unset the article store
reads `apps/web/data/articles.json`.

**The newsroom starts empty.** No journalism ships as source-code fixtures — the
store stays empty until an editor publishes through the workflow at `/admin`, or
until you seed it. That is deliberate: it keeps fixture text from ever reaching
readers as if it were reporting.

Optional — demo newsroom state on Postgres:

```bash
export DATABASE_URL=postgres://…      # apps/web/prisma/schema.prisma is Postgres
pnpm db:push                          # create the schema
pnpm seed                             # demo journalists/reader + poll, banner, article
```

Demo accounts (password `demo1234`): `sushila@nagarikwatch.com` (editor), `manisha@`/`rajesh@` (reporters), `demo.reader@nagarikwatch.com` (subscriber).

Prisma is a development tool in this repo: the seed and cleanup scripts under
`apps/web/scripts` use it, and nothing on a request path does. The running app
talks to Postgres through Kysely (auth, engagement) and to the CMS through
`ContentSource`.

## Deploy to Vercel

1. Import the repo — root directory stays the repo root; `vercel.json` already sets install/build (`pnpm install --frozen-lockfile` + `pnpm --filter ./apps/web build`).
2. Set env vars (see `.env.example`): `DATABASE_URL` (Postgres for serverless), `NEXT_PUBLIC_SITE_URL`, `BETTER_AUTH_URL`, and `BLOB_READ_WRITE_TOKEN` when you want media uploads.
3. Run `pnpm db:push` once against the production `DATABASE_URL` (the Prisma schema is already `postgresql`) so the auth and engagement tables exist.
4. Check readiness: run `pnpm launch:gate`, or sign in at `/admin/login` and open **`/admin/launch`** — both read the same environment and name the items still missing.

Is it ready? [`docs/READINESS.md`](./docs/READINESS.md) · Operator runbook:
[`docs/launch-runbook.md`](./docs/launch-runbook.md) · Design contract:
[`DESIGN.md`](./DESIGN.md) · Everything else: [`docs/`](./docs/README.md)

## What's inside

- **Bilingual desks**: every route, category and article carries parallel Nepali and English fields; the desk taxonomy lives in the CMS, not in code.
- **Real routes + SEO**: per-article metadata/OG, JSON-LD (NewsArticle, NewsMediaOrganization, BreadcrumbList, ItemList), sitemap.xml, robots.txt, RSS, llms.txt, PWA manifest.
- **Newsroom CMS**: pitch → draft → review → publish → analytics; 21 newsroom roles from `contributor` to `super_admin`, enforced server-side on every route and handler; breaking-news control.
- **Readers**: accounts, synced bookmarks, comments, live polls, saved pages, reading history.
- **Monetization**: labeled ad slots (house-ad fallback, editor-managed campaigns with CTR), metered paywall (8 free stories/month, editor-tunable), subscriptions (monthly/yearly/patron, demo checkout, gateway-ready), view counts + trending.
- **Personalization**: transparent recommendation engine (desk affinity + tags + recency + trending).
- **Privacy**: cookie consent (necessary/analytics), cookie policy, gated beacons.
- **Live data**: BS पात्रो + panchanga (astronomy engine), NRB forex, gold/silver, NEPSE (labelled fallback), USGS earthquake feed.
- **Media**: staff uploads through `/api/admin/media/upload` — Cloudflare R2 binding, Vercel Blob, or local disk in development.
