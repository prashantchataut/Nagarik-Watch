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
