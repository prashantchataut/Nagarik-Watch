# नागरिक वाच — Launch Guide (how to complete this site properly)

You are at **94% (launch check)**. Everything code-side is done; the last 6%
is operator configuration only. Follow this in order.

---

## 1. Database (production) — 15 minutes

The dev app uses SQLite (fine for local + demo). On Vercel the filesystem is
ephemeral, so production needs Postgres.

1. Create a free Postgres: [Neon](https://neon.tech) or Vercel Postgres.
2. `apps/web/prisma/schema.prisma` → change `provider = "sqlite"` to
   `provider = "postgresql"`.
3. Locally: `DATABASE_URL="postgres://…" pnpm db:push` (creates all tables).
4. Seed journalists + demo content (optional): `DATABASE_URL="postgres://…" pnpm seed`.
5. Add `DATABASE_URL` in Vercel → Settings → Environment Variables, redeploy.

## 2. Cloudflare R2 media uploads — 15 minutes

The journalist editor + `/api/uploads` are R2-ready (S3-compatible, SigV4,
no extra dependencies). Configuration only:

1. Cloudflare dashboard → **R2 Object Storage** → Create bucket
   (e.g. `nagarik-watch-media`).
2. Bucket → Settings → **Public access** → enable the `r2.dev` URL, or
   (better) attach a custom domain like `media.nagarikwatch.com`.
3. R2 → **Manage API Tokens** → Create token (Object Read & Write).
4. Set env vars (Vercel + local `.env`):
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET=nagarik-watch-media`
   - `R2_PUBLIC_BASE_URL=https://media.nagarikwatch.com` (no trailing slash)
5. Verify: `/journalist` → लेख लेख्नुहोस् → **"R2 मा तस्वीर अपलोड"** — uploads now
   return a public CDN URL that is stored on the article.

No Cloudinary needed anywhere — R2 replaces that plan entirely.

## 3. Site URL — 2 minutes

Set `NEXT_PUBLIC_SITE_URL=https://nagarikwatch.com` (Vercel env var + DNS).
This powers canonical URLs, OG tags, sitemap and RSS links.

## 4. Payments (when ready to charge) — optional

The subscription flow is complete with a demo checkout. To go live:

- eSewa / Khalti merchant account → use their "ePay" form redirect flow.
- Replace the demo branch in `apps/web/src/app/api/subscribe/route.ts`
  (the `method` field already accepts `esewa | khalti | bank`).
- Add a webhook route to confirm payments; store the transaction id on
  `Subscription`. Amounts are already modelled (300/2500/5000 NPR).

## 5. SEO — after the first deploy

- **Google Search Console**: add the domain → verify → submit
  `https://nagarikwatch.com/sitemap.xml`. Request indexing for the home page.
- **Bing Webmaster Tools** (feeds DuckDuckGo): import from GSC.
- **Google News Publisher Center**: submit the site (news sitemap is at
  `/sitemap.xml`; articles carry NewsArticle structured data, which is what
  Google News parses).
- **Social**: validate OG with the Meta Sharing Debugger once; the JSON-LD
  and cards are already emitted.
- Keep publishing: fresh content + the hourly sitemap revalidation is what
  actually moves rankings.

## 6. Content operations

- Log in at `/journalist` (editor). Tabs: पिच → लेख → मेरा लेख → सम्पादक डेस्क.
- सम्पादक डेस्क: publish/decline queue, breaking-news banner, ads manager,
  launch check, analytics, subscribers CSV, comment moderation.
- विपद् केन्द्र (`/disaster`) is a static-data hub — update the numbers in
  `apps/web/src/lib/news/disaster.ts` when the situation changes (it has an
  as-of date label, so readers always see freshness).
- The static archive (99 stories) lives in `src/lib/news/data.ts` —
  new daily reporting goes through the CMS, not the archive.

## 7. The last 6% (why 94%)

| Check | What completes it |
|---|---|
| Cloudflare R2 (4 pts) | The five `R2_*` env vars above |
| Production site URL (2 pts) | `NEXT_PUBLIC_SITE_URL` + real domain |

Set those two and the panel reads **100%**.

## 8. Optional next steps (not required to launch)

- Swap plain `<a>` navigation to `next/link` prefetching for snappier SPA feel.
- Move the USGS/NRB fetchers to Vercel Cron caching if traffic grows.
- News sitemap split (`news-sitemap.xml` with `<news:news>` tags) once you
  publish >1000 URLs.
- Hire real reporters 🙂 — the desk structure, workflow and ethics pages are
  waiting for them.
