# CHANGES.md — Revision 2 (August 2026)

Everything changed in this revision of the Nagarik Watch (नागरिक वाच) redesign,
relative to the previous preview build. See `DESIGN.md` for the full design
contract.

---

## 1. Typography — spaced letters abandoned completely

The single biggest complaint: spaced-out letters ("N A G A R I K  W A T C H")
in both the Latin eyebrow and Devanagari labels.

- Removed **every** `letter-spacing` declaration and Tailwind `tracking-*`
  class from the entire codebase (21 files: all nagarik components, the shadcn
  primitives we ship, and `globals.css`).
- `.kicker` is now uppercase + weight + crimson — no letter spacing.
- The masthead eyebrow renders "Nagarik Watch" with normal tracking.
- Devanagari never had a legitimate use for letter-spacing (it breaks conjunct
  consonants and matras); now the codebase enforces zero spacing everywhere.
- Verified in the rendered DOM: `getComputedStyle` returns `normal` for kicker,
  headlines and body.
- **DESIGN.md §3 now forbids letter-spacing outright.**

## 2. Backend (new)

The app is no longer a pure front-end. Prisma (SQLite) + a real API surface:

| Model | Purpose |
|---|---|
| `Reader` | पाठक accounts (email, scrypt password hash) |
| `Journalist` | पत्रकार accounts — **a separate table/login** with desk, bio |
| `Session` | httpOnly cookie sessions (30 days), kind = reader \| journalist |
| `NewsletterSubscriber` | साँझ ब्रिफिङ email list |
| `DeskPitch` | story pitches from journalists (status + editor notes) |

API routes (all server-side, cookie auth):

- `POST /api/auth/reader/signup` · `POST /api/auth/reader/login`
- `POST /api/auth/journalist/login` (separate flow, separate UI)
- `POST /api/auth/logout` · `GET /api/auth/me`
- `POST /api/newsletter`
- `GET/POST /api/desk/pitches` (journalist-only)
- `GET /api/patro?year&month` — full month panchanga
- `GET /api/market/summary` · `/forex` · `/metals` · `/nepse`

Passwords: `node:crypto` scrypt with per-user salt (no external deps).
Sessions: random 256-bit tokens, httpOnly + sameSite=lax cookies.

Demo journalists seeded (`scripts/seed_auth.ts`):
`sushila@`/`rajesh@`/`manisha@nagarikwatch.com`, password `demo1234`.

## 3. पात्रो (calendar) — rewritten, no more vibes

The old patro used fixed festival dates (wrong every year) and a fake
"panchanga" computed with modulo arithmetic. Both are gone.

- **Astronomical panchanga engine** (`src/lib/news/panchanga.ts`,
  astronomy-engine): tithi, paksha, nakshatra, yoga and karana computed from
  the apparent geocentric ecliptic longitudes of the Moon and Sun at
  **sunrise in Kathmandu** (the classical convention).
  Verified against published dates: Janai Purnima 2083 = Aug 28 2026 ✓,
  Teej = Sep 14 ✓, Rishi Panchami = Sep 16 ✓, Indra Jatra = Sep 25 ✓,
  Vijaya Dashami = Oct 21 ✓ (Shukla Dashami at sunrise), Bhai Tika = Nov 11 ✓,
  Chhath = Nov 15 ✓, Buddha Jayanti = May 1 ✓.
- **Festival engine** (`src/lib/news/festivals.ts`): lunar festivals (all
  Dashain/Tihar days, Teej, Purnimas, Janmashtami, Shivaratri, Holi, Lhosars…)
  are DERIVED from the computed tithis within calibrated month windows, with
  purnima guards and viddha-tithi (two-sunrise tithi) deduplication. They
  resolve correctly for **any** BS year — fully automatic, nothing hardcoded.
  Fixed solar observances (Republic Day, Constitution Day, Martyrs Day…) and
  AD-anchored days (Labour Day, Christmas, Women's Day…) are converted per
  year.
- **Sunday is now a weekly holiday alongside Saturday** (2082 Saun onward) —
  red in the grid, counted in holiday flags, and stated in the UI.
- The month grid shows each day's **tithi under the date** (like a real
  Nepali patro); the day panel lists tithi/nakshatra/yoga/karana.
- Served by `GET /api/patro` and fetched by the client (loading skeletons,
  retry, month/year navigation, आजमा जानुहोस् jump).
- Homepage mini-patro now uses the same API (real tithi + upcoming
  festivals + "आज साप्ताहिक बिदा हो" on weekends).

## 4. बजार (market) — real data, honestly labelled

Replaced the demo-only NEPSE snapshot with a live market system:

- **विदेशी मुद्रा**: Nepal Rastra Bank's official API
  (`nrb.org.np/api/forex/v1`), 22 currencies, buy/sell, 2-hour server cache,
  labelled fallback snapshot. Live now (e.g. USD 152.37/152.97).
- **सुन–चाँदी**: international spot prices (gold-api.com XAU/XAG) × NRB USD
  rate × tola conversion (0.375 troy oz) with calibrated dealer premium —
  auto-updating सूचक मूल्य per tola and per 10g.
- **नेप्से**: the app attempts a live fetch from nepalstock.com.np (works when
  hosted in Nepal; geo-blocked elsewhere) and otherwise shows a labelled
  "अन्तिम उपलब्ध" snapshot. Never faked as live.
- **इन्धन**: NOC revision table with the revision date always displayed.
- Surfaces: masthead NEPSE chip (live), **बजार desk strip** (NEPSE, USD,
  gold, petrol chips), homepage market well, and the full **बजार ड्यासबोर्ड**
  at `#/nepse` — index cards, gold/silver cards, advancers/decliners, the
  full forex table, fuel prices, sector table, and market stories, with a
  refresh button and last-updated stamp.
- Shared client store (`market-store.ts`, useSyncExternalStore) so every
  surface shows the same numbers with one fetch + 5-minute polling.

## 5. Accounts — reader vs journalist, two different things

- **Masthead account chip** (desktop + mobile): greeting avatar with the
  reader's initial when signed in, "लगइन" button when signed out. Always
  visible in the header, as requested.
- **Reader drawer** (`AccountSheet`): login/signup tabs, profile view (name,
  email, saved count), साँझ ब्रिफिङ newsletter subscribe, logout, and a
  clear link to the journalist login.
- **Journalist login** `#/journalist` — deliberately separate: crimson
  newsroom band, demo-credential hint, and after login a **mini newsroom
  desk**: pitch submission form (headline, desk, summary, notes), pitch list
  with status chips (पठाइएको/समीक्षामा/स्वीकार/अस्वीकार) and editor notes,
  plus the journalist's desk stories.
- Footer and menu sheet link to पत्रकार लगइन; the विचार desk invites writers
  to pitch through it.
- Session state is shared across surfaces via an auth store; logout clears
  the cookie everywhere.

## 6. विचार (opinion) — editorial upgrade

- New essay-first desk layout: featured lead with a large pull-quote figure
  (crimson rule, oversized quote glyph, author attribution), then a
  three-column grid of crimson-edged column cards.
- "विचार लेख्न चाहनुहुन्छ?" panel routes writers to the journalist desk.

## 7. Default preview images — no more placeholder SVGs

- Generated **15 desk editorial illustrations** (1344×768, warm-paper +
  crimson + ink palette, no text) with the image-generation skill:
  `public/photos/desks/{desk}.jpg`.
- `heroFor()` fallback chain is now: assigned stock photo → real newsroom
  photograph → **desk editorial illustration**. No story renders a blank or
  SVG placeholder.
- Article hero figures credit "नागरिक वाच (सम्पादकीय चित्र)" for
  illustrations and keep the wire credit for photographs.
- New **OG share card** (`public/og-image.jpg`, 1200×630): generated
  editorial background composed with real Devanagari typography (Noto Sans
  Devanagari, raqm-shaped) via PIL. Wired into `layout.tsx` metadata
  (OpenGraph + Twitter card, `ne_NP` locale).

## 8. UI/UX polish

- Stronger lead-photo scrim (starts higher, darker at the bottom) + text
  shadows on the deck line — hero headline contrast fixed.
- `:focus-visible` crimson rings everywhere (keyboard navigation).
- Footer: full-width crimson **साँझ ब्रिफिङ** newsletter strip (wired to the
  API), पत्रकार लगइन button, desk contact chip.
- Menu sheet includes पत्रकार लगइन; masthead saved-bookmark hidden on the
  smallest screens to keep the account chip visible.
- Market strip loading skeletons; every market panel names its source.
- Mobile patro cells tuned (no clipping of day/tithi labels, verified at
  390px).

## 9. Verification (this revision)

- `tsc --noEmit`: 0 errors. `eslint`: 0 errors (1 pre-existing font-link
  warning).
- Full route click-through (15 routes + article + 404): all render, zero
  console errors.
- Flows exercised in a real browser: reader signup → header chip → profile →
  logout; journalist login → desk → pitch submit (API + browser form) → pitch
  listed with status; newsletter subscribe; patro month navigation.
- Market APIs: NRB forex live (source: nrb), metals live, NEPSE fallback
  labelled; ~6s cold response, cached afterwards.
- VLM screenshot reviews: home 8-9/10 (contrast issue found → fixed),
  business/opinion desks 8/10, journalist desk 8/10, mobile home 8/10,
  mobile patro 8/10 after cell fix, article 9/10.

## 10. Files touched (summary)

New: `src/lib/auth.ts`, `src/lib/news/panchanga.ts`, `src/lib/news/festivals.ts`,
`src/lib/news/market.ts`, `src/lib/news/market-store.ts`,
`src/lib/news/auth-store.ts`, `src/components/nagarik/AccountSheet.tsx`,
`src/components/nagarik/JournalistView.tsx`, `src/app/api/**` (10 routes),
`public/photos/desks/*` (15 images), `public/og-image.jpg`,
`prisma/schema.prisma` (rewritten), `scripts/seed_auth.ts` + maintenance
scripts, `.env.example`.

Rewritten: `PatroView`, `NepseView` (→ बजार dashboard), `Masthead` (account
chip + live NEPSE fact), `Footer` (newsletter + journalist links),
`DeskPage` (market strip + opinion layout), `HomeEdition` (API patro mini +
live market well), `photos.ts` (desk hero fallbacks), `layout.tsx` metadata.

Removed: `src/lib/news/calendar-events.ts` fixed-date table (superseded by
the festival engine).

---

# Revision 3 (August 2026) — full-stack completion

The portal is now a complete three-tier product: **backend (Prisma + 20 API
routes), middle-end (typed API client, live stores, server-synced reader
state, CMS merge layer) and frontend (article CMS, editor newsroom,
reader engagement)**.

## 1. Backend — CMS pipeline (समाचार प्रकाशन प्रणाली)

New `Article` model with the full editorial workflow:
`draft → submitted → published / declined`, editor notes, slugs
(Devanagari-safe slugify with collision checks against the 87 archive
stories), denormalized view counters, and a markdown-lite body syntax
(`##` उपशीर्षक, `###` उप-उपशीर्षक, `>` उद्धरण, `-` बुँदा) parsed and
validated server-side into the same discriminated-union `Block[]` used by
the archive (`src/lib/blocks.ts`).

- `GET /api/articles` — public published list (merged into the edition)
- `GET /api/articles/[slug]` — single article (drafts visible to author/editor only)
- `POST /api/articles` — journalist creates draft/submission
- `PATCH /api/articles/[slug]` — author edits/submits/retracts; editor
  publishes/declines with a note (ownership + role enforced server-side)
- `DELETE /api/articles/[slug]` — author deletes own unpublished work, editor anything
- `GET /api/articles/mine` — my pipeline list

`Journalist` gained a `role` field: **reporter** files, **editor** decides.
`Sushila@nagarikwatch.com` is the demo chief editor (band badge, extra tab).

## 2. Backend — reader engagement

- **Comments** (`Comment`): reader-accounts-only, keyed by `desk/slug` so
  archive stories and CMS articles share one system; instant publish,
  editor hide/delete moderation. `GET/POST /api/comments`,
  `PATCH/DELETE /api/comments/[id]`.
- **Server-synced bookmarks** (`Bookmark`): anonymous readers keep
  localStorage; logged-in readers get a merge-on-login + full-list PUT sync
  (`GET/PUT /api/bookmarks`) — your saved stories follow your account.
- **Poll of the day** (`Poll`/`PollVote`): real server counts, one vote per
  person per poll (readers by account, everyone else by device key).
  The homepage poll is now live data — no more demo counts.
- **Trending engine** (`Pageview`): session-deduped view beacon
  (`sendBeacon`) increments daily counters + article views;
  `GET /api/trending` powers the धेरै पढिएको rail.
- **Contact form** (`ContactMessage`): `POST /api/contact`, rate-limited.

## 3. Backend — newsroom operations (editor-only)

- `GET /api/editor/queue` — review queue: submitted articles (with parsed
  body preview), open pitches, recent comments, pipeline counts.
- `PATCH /api/editor/pitches/[id]` — pitch triage (समीक्षामा / स्वीकार / अस्वीकार + note).
- `GET /api/editor/analytics` — traffic (today/7-day series), top stories,
  pipeline, audience, recent subscribers.
- `GET /api/editor/subscribers[?format=csv]` — साँझ ब्रिफिङ list + CSV export.
- `PUT/DELETE /api/editor/breaking` — set/clear the तत्काल banner; readers
  see it instantly site-wide (public `GET /api/breaking`).

## 4. Security hardening

- In-memory sliding-window **rate limiter** on every sensitive route:
  logins 10/5min, signup 6/h, comments 5/10min, contact 3/h, votes 20/min,
  pageviews 120/min (verified: 12 rapid logins → 429 after the 8th).
- **zod validation** on every POST/PATCH body with Nepali error messages.
- Ownership/role guards: `requireReader` / `requireJournalist` /
  `requireEditor` (verified: reader-publish → 401, reporter-editor-route → 403,
  anonymous comment → 401).
- `robots.ts` disallows `/api/editor`, `/api/auth`, `/api/bookmarks`;
  static `public/robots.txt` removed (was conflicting).

## 5. Middle-end

- `src/lib/news/api-client.ts` — typed fetch wrapper + ApiError.
- `article-store.ts` — shared live store of published CMS articles
  (useSyncExternalStore, 2-min refresh, cold-failure → empty, not stuck spinners).
- `poll-store.ts`, `breaking-store.ts` — live data hooks.
- `storage.ts` `useSaved` — transparent server sync when logged in.
- `engagement.ts` — view beacon + anonymous voter identity.
- **Story merge layer**: CMS articles surface in the home latest rail
  (ताजा badge), desk pages and the English edition — resolved through one
  `dbArticleToStory` mapper; the article route falls back archive → CMS → 404.

## 6. Frontend — new surfaces

- **BreakingBanner** — crimson तत्काल strip above the masthead with pulsing
  dot, link, per-session dismissal; fed by the editor desk.
- **धेरै पढिएको trending rail** — numbered 7-day most-read strip.
- **Article comments** — composer for logged-in readers, seeded discussion,
  login-prompt for anonymous visitors, moderation note.
- **JournalistView (tabbed newsroom)** — पिच तथा डेस्क · लेख लेख्नुहोस्
  (markdown-lite editor with live preview, word count, reading time, desk
  hero picker, EN version) · मेरा लेखहरू (status chips, edit/submit/retract/
  delete/view) · सम्पादक डेस्क (editors only).
- **EditorDashboard** — stat cards, publish/decline review with expandable
  body preview, pitch triage, breaking-banner control, 7-day traffic chart,
  top stories, subscriber list + CSV, comment moderation.
- Contact page now has a real (API-wired) सन्देश फारम.

## 7. Fixes found during verification

- `heroFor('')` returned an empty `src` for CMS articles without a photo →
  now falls back to the desk illustration (console error eliminated).
- Stale Prisma client in the dev server after `db push` → restart required.
- Rate limiter correctly blocked the test browser after 12 failed logins
  (working as intended — reset by restart).

## 8. Verification (this revision)

- `tsc --noEmit`: 0 errors · `eslint`: 0 errors (1 pre-existing font warning).
- **API smoke suite (curl)**: full pipeline — reporter login → create →
  submit → editor queue → publish → public list; reader signup → bookmark
  PUT/GET → comment POST/GET; poll vote (+409 duplicate); pageview →
  trending; contact; analytics; subscribers CSV; RSS XML; guards; rate-limit
  429s — all green.
- **Browser E2E (agent-browser)**: home (banner + live poll vote 781→782 with
  Devanagari percentages + trending rail + 2-3 ताजा badges); article
  comments (login prompt → reader login → composer → posted live); reporter
  flow (login → editor tab → live preview render → submit → my-articles
  status समीक्षामा); editor flow (login → dashboard → expand preview →
  publish with note → article on technology desk + home rail); breaking
  banner set from dashboard → live on home; mobile 390px: no horizontal
  overflow, banner + comments visible.
- VLM visual review: home 7-8/10, article 8/10, dashboard data confirmed
  fully rendered after load (early screenshot caught skeletons).
- Test artifacts cleaned (smoke reader/comments/contact removed).

## 9. Files touched (this revision)

New: `src/lib/api.ts`, `src/lib/rate-limit.ts`, `src/lib/blocks.ts`,
`src/lib/news/cms.ts`, `src/lib/news/api-client.ts`,
`src/lib/news/article-store.ts`, `src/lib/news/poll-store.ts`,
`src/lib/news/breaking-store.ts`, `src/lib/news/engagement.ts`,
`src/components/nagarik/BreakingBanner.tsx`,
`src/components/nagarik/CommentsSection.tsx`,
`src/components/nagarik/EditorDashboard.tsx`,
`src/app/api/articles/**`, `src/app/api/bookmarks/**`,
`src/app/api/comments/**`, `src/app/api/poll/**`,
`src/app/api/trending/**`, `src/app/api/pageview/**`,
`src/app/api/contact/**`, `src/app/api/breaking/**`,
`src/app/api/editor/**`, `src/app/api/rss/route.ts`,
`src/app/sitemap.ts`, `src/app/robots.ts`, `scripts/seed_full.ts`,
`scripts/cleanup_smoke.ts`.

Rewritten: `prisma/schema.prisma` (7 new models), `JournalistView` (tabbed
newsroom), `HomeEdition` (live poll + trending + CMS merge),
`ArticleView` (comments + view beacon), `LegalView` (contact form),
`page.tsx` (breaking banner + CMS article routing), `DeskPage` /
`EnglishHome` (CMS merge), `storage.ts` (server-synced bookmarks),
`auth.ts` / `auth-store.ts` (role + onAuthChange).

Demo accounts: readers `demo.reader@nagarikwatch.com` / `demo1234`;
reporters `manisha@` / `rajesh@`; editor `sushila@nagarikwatch.com` —
all `demo1234`.

---

## Revision 4 — भद्र १५, २०८३ (31 Aug 2026): complete + deploy-ready

**Deployment fixed:** the repo now installs and builds cleanly on Vercel —
single canonical app (`apps/web`), regenerated `pnpm-lock.yaml`
(frozen-lockfile verified), `vercel.json` install/build updated, engines
relaxed (`>=22.12.0`), Prisma generate in postinstall. Verified with a local
Vercel-equivalent production build: 159/159 pages.

**Real routes + full SEO** (was: single hash page): every story, desk,
province, tool and info page is a server-rendered route with per-page
metadata, OG/Twitter cards, canonical + hreflang, JSON-LD
(NewsArticle/NewsMediaOrganization/WebSite/BreadcrumbList/ItemList),
sitemap.xml (159+ URLs, hourly), robots.txt, RSS 2.0, llms.txt, PWA manifest,
security headers. Legal pages moved to clean top-level URLs (/about, /privacy,
/terms, /ethics, /advertise, /contact, /cookies).

**विपद् विशेष (flood & calamity coverage):** 10 new stories on the real
26-Aug-2026 Bhote Koshi glacial flood (469 dead, ~1500 missing, 35 districts,
75k families) + 2 more fact-checks; विपद् केन्द्र hub with situation stats,
district impact table, event timeline, live USGS earthquake feed, helplines,
relief partners and a safety guide; breaking banner + home special band;
12 real photographs.

**Monetization:** labeled ad slots with house-ad fallback + editor campaign
manager (impressions/clicks/CTR); metered paywall (8 free/month,
server-enforced, editor-tunable) with premium flags; subscription plans
(monthly/yearly/patron, demo checkout, cancel flow); per-article view
counts; ads.txt.

**Personalization & privacy:** transparent recommendation engine (desk
affinity + tag overlap + recency + trending) powering तपाईंका लागि rails;
reading history (device + server mirror); cookie consent with gated
analytics/ad beacons + cookie policy page.

**Cloudflare R2:** zero-dependency S3 SigV4 client; journalist image
uploads go straight to R2; clear 501 guidance when unconfigured (replaces
the Cloudinary plan).

**Fact-check & profile:** dedicated तथ्य जाँच desk with verdict system
(सही/मिश्रित/गलत/सन्दर्भ), methodology, claim submission + editor triage;
full profile page (identity, subscription, bookmarks, history, cookie
choices).

**Launch check:** honest 23-probe readiness panel in the editor desk —
**94%** (the last 6% is operator env: R2 keys + site URL; the panel names
them). See LAUNCH-GUIDE.md.
