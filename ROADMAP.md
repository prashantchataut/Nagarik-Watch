# Nagarik Watch — Roadmap

A living, prioritised plan. Items marked ✅ are shipped; 🚧 in progress; ⏳ planned.

## Phase 0 — Foundation ✅

- [x] Prisma schema (Article, Author, Category, Tag, Province, Comment, Poll, Newsletter, Breaking,
      LiveWidgetConfig, ContactMessage, ReaderTip, Correction, AuditLog, User, Reader, Bookmark,
      ReadingHistory, AuthorFollow)
- [x] NextAuth newsroom auth + self-managed JWT reader auth (separate cookies)
- [x] Seed content (32 articles, 8 authors, 9 categories, 7 provinces, 16 tags)
- [x] Branding (logo, favicon, OG image, PWA icons, manifest)
- [x] Design system (crimson news palette, Devanagari fonts, dark mode)
- [x] Production security (rate limiting, zod validation, env-based admin, secure cookies)

## Phase 1 — Core newsroom ✅

- [x] Homepage (breaking ticker, lead/secondary grid, category sections, most-read, live widgets,
      poll, newsletter, today brief)
- [x] Article page (byline, BS date, reading time, views, share, font-size, reading progress,
      hero w/ caption+credit, source attribution, corrections, tags, author bio, comments, related,
      NewsArticle + Breadcrumb + Speakable JSON-LD)
- [x] Listing pages (category, author, province, tag, search, video, opinion, province index)
- [x] Utilities (date converter, market board, horoscope, weather)
- [x] Trust pages (about, contact, ethics, corrections, ownership, privacy, terms, membership,
      newsletter)
- [x] FAQ topic pages (NEPSE, Nepali date, forex) with FAQPage schema
- [x] Admin CMS (dashboard, article editor w/ workflow + scheduling, comments, polls, breaking,
      authors/categories/tags/provinces managers, newsletter CSV, contacts, tips, audit, users,
      live-widgets)
- [x] Reader accounts (signup/login, bookmarks, history, follows)
- [x] SEO infra (sitemap, news-sitemap, RSS, llms.txt, robots, security headers)

## Phase 2 — Depth & engagement 🚧 (this phase)

- [ ] Photo gallery section + ImageGallery schema
- [ ] Live blog block + LiveBlogPosting schema
- [ ] Article reactions (emoji) + nested comments with upvote
- [ ] Topic/collection hub pages + tag description pages
- [ ] Homepage modules: editor's picks, trending, today in history, photo-of-the-day
- [ ] Author columns page + improved author profiles (follow count, stats)
- [ ] AQI widget + multi-city weather + cricket score widget
- [ ] Full Nepali calendar page with festivals
- [ ] Newsletter archive + editions
- [ ] Print-friendly article view
- [ ] Service worker (PWA offline reading)
- [ ] Image sitemap + video sitemap + JSON Feed + humans.txt + security.txt + hreflang

## Phase 3 — Scale & monetisation ⏳

- [ ] Postgres migration + Redis (sessions/cache)
- [ ] Meilisearch-powered search (replaces DB LIKE)
- [ ] Cloudinary image CDN + media library in admin
- [ ] Google Ad Manager integration + sponsored content
- [ ] eSewa / Khalti membership payments
- [ ] Web push notifications (VAPID)
- [ ] Real-time reader count + trending algorithm (Redis sorted sets)
- [ ] Analytics dashboard for editors (Plausible/PostHog)
- [ ] Sentry error monitoring
- [ ] Automated fact-check / plagiarism checker integration
- [ ] Web Stories (Google Discover)
- [ ] Election portal template (activated during polls)
- [ ] Exam results tracker (activated during result season)
- [ ] Multi-tenant province sub-portals (e.g. koshi.nagarikwatch.com.np)

## Phase 4 — Intelligence ⏳

- [ ] AI article summaries (TL;DR) via LLM skill — server-side, editor-reviewed
- [ ] Auto-generated FAQ per article (AEO)
- [ ] "For you" personalised feed (based on reading history)
- [ ] Topic/author digest emails (scheduled)
- [ ] Audio article (TTS) via TTS skill
- [ ] Voice news (Speakable optimised for assistants)
- [ ] Semantic search (embeddings)
- [ ] Comment sentiment moderation assist

## Inspiration sources

- **ekantipur** — province hub, e-paper, multi-author bylines, NEPSE/forex/gold/weather/rashifal.
- **setopati** — breaking top strip, opinion with author profiles, NEPSE live graph.
- **onlinekhabar** — Nepali date, AD-BS converter, most read, trending, date converter.
- **ratopati** — simple category homepage, mobile tile layout, video thumbnail cards.
- **annapurnapost** — integrated utility footer (calendar/forex/NEPSE/gold/rashifal).
- **the himalayan times** — global nav, weather, horoscope, newsletter popup, footer trust links.
- **BBC / Guardian / NYT** — reading progress, "most read", "explainers", fact-check labels,
  clean typography, related articles.

## How to use this roadmap

The 15-minute `webDevReview` cron reads `worklog.md` and this file, picks the next reasonable item
from Phase 2/3, and ships it. To reprioritise, edit this file and move items between phases.
