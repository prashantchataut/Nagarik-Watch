# Nagarik Watch Owner Manual

This manual separates what is functional in the repository from work that needs owner credentials, editorial approval, licensing, or a paid provider. Do not treat demo fallback data as live reporting.

## Required Environment

- `DATABASE_URL`: PostgreSQL connection string for Payload CMS.
- `PAYLOAD_SECRET`: minimum 32 characters, generated per environment.
- `PAYLOAD_PUBLIC_SERVER_URL`: public URL for the Payload admin app.
- `NEXT_PUBLIC_SITE_URL`: public reader-site URL.
- `AUTH_SECRET` and `BETTER_AUTH_SECRET`: generated session secrets.
- `REVALIDATE_SECRET`: shared secret for publish/revalidation hooks.
- `PAYLOAD_CONTENT_SOURCE`: set to `payload` only when the CMS database and collections are ready.
- `NEXT_PUBLIC_DOIB_NUMBER`: Department of Information and Broadcasting registration number when granted.
- `ENABLE_WEB_ADMIN_SCAFFOLD`: leave unset in production unless server-side auth guards are fully reviewed.

## Live Data Providers

- Weather: `WEATHER_PROVIDER=open-meteo` works without an API key for basic weather. If changing providers, set `WEATHER_API_KEY` and document the license.
- AQI: `AQI_PROVIDER=open-meteo-air-quality` works without an API key for basic air-quality readings.
- Disaster alerts: use a manual CMS feed or an official public warning source. Set `DISASTER_ALERT_PROVIDER` and `DISASTER_ALERT_API_KEY` only for a licensed or official provider.
- NEPSE: use an official or licensed market-data vendor. Do not rely on scraping for production market reporting. Set `NEPSE_PROVIDER` and `NEPSE_API_KEY` after contract approval.
- Gold/silver: use a licensed bullion-rate source or a verified manual editorial feed. Set `GOLD_SILVER_PROVIDER` and `GOLD_SILVER_API_KEY`.
- Forex: prefer Nepal Rastra Bank or a licensed provider. Set `FOREX_PROVIDER` and `FOREX_API_KEY`.
- Sports: set `SPORTS_PROVIDER`, `FOOTBALL_PROVIDER`, `CRICKET_PROVIDER`, and API keys only for licensed feeds that allow public redistribution.
- Elections: use Election Commission Nepal or a manual verified CMS feed. Never display unverified election numbers as live results.
- Exam results: use NEB or official result channels. Never publish unofficial SEE or Grade XII result data.
- Parliament and YouTube live: set `PARLIAMENT_LIVE_URL`, `YOUTUBE_PROVIDER`, and `YOUTUBE_API_KEY` after confirming embed rights.
- Cache: tune `LIVE_WIDGET_CACHE_TTL_SECONDS` by provider rate limits. Keep widgets non-blocking and visibly timestamped.

## CMS And RBAC Setup

- Create the first `super_admin` directly in the database or with a one-off trusted seed script, then remove the script.
- Assign `admin` for user/settings management and reserve `super_admin` for permanent deletion.
- Use `journalist` or `contributor` for draft/submission work.
- Use `copy_editor`, `fact_checker`, `seo_manager`, and editor roles for review queues.
- Keep reader accounts separate from newsroom accounts.
- Review Payload collection access before enabling public writes or staff invites in production.

## Google News And SEO

- Verify `sitemap.xml`, `news-sitemap.xml`, `rss.xml`, and `robots.txt` after the production domain is live.
- Configure Google Search Console and Google Publisher Center manually.
- Confirm publisher name, logo, contact, ownership, editorial policy, corrections policy, fact-check policy, privacy policy, terms, and accessibility pages.
- Use `ClaimReview` schema only for real fact-check articles with approved evidence.
- Do not index drafts, previews, admin routes, private routes, search filters, or unreviewed AI output.

## Email, Newsletter, Push And CAPTCHA

- Choose an email provider such as Resend, Buttondown, Listmonk, Postmark, or SES.
- Configure double opt-in before importing any newsletter list.
- Add unsubscribe and preference-center links to every campaign.
- Choose OneSignal or FCM for push. Confirm consent copy in Nepali and English.
- Configure `CAPTCHA_PROVIDER=turnstile`, `TURNSTILE_SITE_KEY`, and `TURNSTILE_SECRET_KEY` before opening comments, submissions, login/signup, or tips to untrusted traffic.

## Analytics And Consent

- Configure Plausible and optionally GA4.
- Confirm cookie-consent copy with legal counsel before using non-essential tracking.
- Track article views, search, share, bookmark, comment, newsletter signup, notification preferences, poll vote, ad impression/click, reading progress, completion, and utility interactions.

## Media And Licensing

- Replace temporary external images with owned, licensed, or agency-cleared assets.
- Require alt text, captions, credits, source, and license fields for published images.
- Strip EXIF for sensitive images when legally and ethically required.
- Reserve layout space for ads and embeds to prevent Cumulative Layout Shift.

## Production Database Checklist

- Provision PostgreSQL with backups, point-in-time recovery, monitoring, and least-privilege credentials.
- Run Payload migrations in a staging environment before production.
- Disable development schema push when migrations are the source of truth.
- Verify seed data is not presented as live reporting.

## Launch Blockers

- Confirm legal registration, publisher identity, address, phone, and DoIB number.
- Replace placeholder contact data in `apps/web/lib/site.ts`.
- Contract or approve official providers for market, bullion, sports, election, and exam widgets.
- Create and verify the first `super_admin` account.
- Review RBAC with the newsroom owner and editor-in-chief.
- Configure production database, storage, CDN purge, email, CAPTCHA, analytics, and push providers.
- Replace placeholder/demo imagery and verify media licenses.
- Run production `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` on the deployment environment.

## Functional Versus Scaffolded

- Functional: Next.js public portal routes, RSS, sitemap, news sitemap, seed-backed content source, Payload core collections, RBAC helper, reading-time utility, search tests, ranking utilities, live-widget envelope contracts, and visible mock status boundaries.
- Scaffolded: reader accounts, synced bookmarks/history, comments, polls, push notifications, newsletter campaigns, payment/subscription flows, real market/sports/election/exam providers, AI editorial assistants, advanced analytics, and production moderation queues.
- Mock/demo fallback: seed articles, some live data widgets, placeholder legal/contact details, and provider health surfaces until credentials and approved providers are configured.

## Newsroom Admin + Reader Auth (Better Auth)

The newsroom admin and reader accounts are powered by Better Auth. The auth
database is **Postgres when `DATABASE_URL` is set** (production, shared with
Payload CMS), and **PGlite (in-memory Postgres via WASM) when it is not**
(dev/preview — sessions reset on restart, which is fine for the seed-backed demo).

### First-boot admin setup

1. Set `ENABLE_WEB_ADMIN_SCAFFOLD=true` in your environment.
2. Set `NEWSROOM_ADMIN_EMAIL`, `NEWSROOM_ADMIN_PASSWORD` (min 8 chars), and
   `NEWSROOM_ADMIN_NAME`.
3. Visit `/admin/login` and sign in with those credentials.
4. **Change the password immediately** via the profile screen, then remove
   the `NEWSROOM_ADMIN_*` env vars so they cannot leak.

If you do NOT set the env vars: sign up as a reader at `/auth/signup`, then
manually elevate that account's `role` column to `super_admin` in the
`user` table (Better Auth stores additional fields as JSON columns). After
elevation, log out and back in at `/admin/login`.

### Reader accounts

Reader signups are open at `/auth/signup` (Nepali) and `/en/auth/signup`
(English). Readers get bookmarks, reading history, and can comment + vote in
polls. Reader accounts never see `/admin/*` — the session gate rejects any
account whose role is `reader`.

### Engagement backend

- **Comments**: `POST /api/comments` (rate-limited 5/min/IP). Comments are
  created in `pending` status; approve in `/admin/comments`.
- **Polls**: `POST /api/polls/vote`. One vote per fingerprint per poll.
- **Bookmarks**: `GET/POST /api/bookmarks`. Logged-in readers sync across
  devices; anonymous readers use a localStorage fingerprint.
- **Reading history**: `POST /api/reading` (called by ReadingProgress). 50
  most-recent entries per reader.
- **Newsletter**: `POST /api/newsletter/subscribe` (double opt-in). Confirm
  via `GET /api/newsletter/confirm?token=…`. Requires `NEWSLETTER_API_KEY`
  + `NEWSLETTER_API_BASE` to send the confirmation email; without them the
  confirm link is logged to the server console in dev.

All engagement data lives in the same in-memory/Postgres store. When
`DATABASE_URL` is set, migrate these to Postgres tables (the store module
is the single seam to update).
