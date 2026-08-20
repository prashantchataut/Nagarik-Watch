# Nagarik Watch — Roadmap

Living plan. Prefer [MANUAL.md](MANUAL.md) and [docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md)
when this file conflicts with shipped stack decisions.

**Stack decisions (2026-07-19):** Better Auth + Postgres (not NextAuth/Clerk), local BM25 (not
Meilisearch), Vercel Blob (not Cloudinary), free-to-read + ads with Stripe membership dormant
(not eSewa/Khalti), VAPID web-push when keys are set.

Status legend: ✅ shipped · 🔒 credential-blocked · 💤 dormant by product decision · ⛔ superseded ·
⏳ planned / external

## Phase 0 — Foundation ✅

- [x] Content model + seed corpus
- [x] Better Auth newsroom/reader sessions (Postgres)
- [x] Civic Crimson design system + bilingual public shell
- [x] Production security baseline (rate limits, CSP, origin checks, Turnstile gate)

## Phase 1 — Core newsroom ✅

- [x] Homepage edition, article page, listings, trust pages
- [x] Reader accounts, saves, recommendations (honest empty states)
- [x] SEO infra (sitemap, news-sitemap, RSS, robots, security headers)
- [x] Newsroom + admin operational surfaces

## Phase 2 — Depth & engagement ✅ (product-owned)

- [x] Photo gallery routes + ImageGallery JSON-LD
- [x] Article emoji reactions + comment upvotes (migration + API + UI)
- [x] Columns hub + newsletter public archive
- [x] Homepage today-in-history + photo-of-the-day (render only when corpus matches)
- [x] Print-friendly article styles + tools after body
- [x] Image/video sitemaps, JSON Feed, humans.txt, security.txt
- [x] Utility strip uses attributed real providers only (no invented scores)
- [x] Live blog route + newsroom desk + LiveBlogPosting schema
- [x] Nepali calendar month grid + festival/holiday inventory + utility desk
- [x] PWA service worker boot path (offline depth still incremental)

## Phase 3 — Scale & operations

- [x] Postgres operational stores + shared pool health
- [⛔] Meilisearch — superseded by local BM25
- [⛔] Cloudinary — superseded by Vercel Blob adapter
- [x] Ad placement model; network scripts load only when mode=network + credentials + ad consent
- [💤] Stripe membership — dormant unless `NEXT_PUBLIC_MEMBERSHIP_PUBLIC=true`
- [⛔] eSewa / Khalti — superseded for now
- [x] Web push (VAPID) — 🔒 until VAPID keys configured
- [💤] Redis presence / real-time counts — honest adapter until Redis is provisioned
- [x] Plausible analytics behind consent
- [x] Sentry boundary (`SENTRY_DSN`) — 🔒 console-only until DSN is configured
- [⏳] Plagiarism vendor — no production adapter yet; requires a contract and reviewed provider
- [x] Partner feed + cron jobs (digest, interactions, ops-probe, notifications)
- [x] Election/exam portals — empty/unconfigured until official/manual source
- [💤] Province host routing — dormant without real domains
- [x] Admin deploy docs (Node 22.x, `apps/admin`) — ops must create Vercel project + first deploy

## Phase 4 — Intelligence

- [x] Extractive AI summary/headlines/tags/FAQ drafts — never auto-publish
- [🔒] LLM rewrite path — needs `AI_PROVIDER_KEY` + audited provider
- [x] Digest compose cron → email adapter (honest `email-adapter-disabled`)
- [x] Speakable JSON-LD on eligible articles
- [x] TTS provider boundary — 🔒 until `TTS_PROVIDER` + `TTS_PROVIDER_KEY`
- [x] Semantic search: local BM25 + optional local vectors; hosted ANN 🔒
- [x] Comment sentiment assist in moderation queue (lexicon; not a publish gate)
- [x] Personalized "For you" feed with empty-state honesty

## How to use this roadmap

Ship against launch readiness and MANUAL.md. Mark credentials as blocked rather than claiming
features complete. Do not resurrect superseded vendors without an explicit product change.
