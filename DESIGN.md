# DESIGN.md — नागरिक वाच Design Contract

The design contract for the Nagarik Watch news portal rebuild. Every surface
in this app is answerable to the rules below. When code and this document
disagree, this document wins.

---

## 1. Principle

A Devanagari-first newsroom, not a dashboard. Two bands of chrome, then the
edition. The page is the navigation: topics live inside the edition, not in
extra nav rows. Facts (date, weather, market) sit in the masthead as facts,
not as menus. One color does the pointing — Civic Crimson — and it is rationed
to the rail, kickers, and links.

## 2. Surface

| Token | Light (paper) | Dark (ink) |
|---|---|---|
| `--paper` | `#F4F1EC` warm paper | `#17120F` deep ink |
| `--surface` | `#FFFFFF` card | `#211A16` card |
| `--ink` | `#1A1012` | `#EDE6DC` |
| `--ink-soft` | `#5C5148` | `#A99D91` |
| `--crimson` | `#C02A2A` | `#E8484B` |
| `--crimson-deep` | `#8E1F22` | — rail gradient |
| `--rule` | `#E2DCD2` hairlines | `#322A24` |

Warm paper everywhere; pure white only for cards. Dark mode is the same
newspaper printed at night — deep ink, warm cream text, crimson unchanged in
spirit.

## 3. Type

- **Headlines**: Mukta (Devanagari-strong), weight 700–800.
- **Body**: Noto Sans Devanagari, 18–19px, line-height 1.85–1.95.
- **Latin/numerals**: Mukta + Noto Sans Devanagari fallback stack.
- Lead headline **38–56px** (fluid `clamp`), support pair ~24–30px, rails and
  cards 16–19px, kickers 12–13px uppercase.
- **letter-spacing is FORBIDDEN everywhere** — no tracking utilities, no
  spaced-out wordmarks, in either Devanagari or Latin. Devanagari conjuncts
  and matras require zero inter-glyph spacing to render correctly, and
  spaced Latin small caps read as artificial. Hierarchy comes from weight,
  size and color only. ("NAGARIK WATCH", never "N A G A R I K  W A T C H".)

Measure: article body **680px, centered**. Homepage edition container
**1180px**. Never justify body text; ragged right.

## 4. Chrome — two bands only

1. **Paper masthead** — logo lockup left (नागरिक वाच + NAGARIK WATCH eyebrow);
   to the right, facts: BS date, काठमाडौं weather, NEPSE close, and पात्रो as
   the single solid crimson button. Search + theme + सेभ as quiet icons.
2. **Sticky crimson desk rail** — full-width crimson band (`crimson →
   crimson-deep` gradient), white Mukta desk labels, active desk underlined
   with a white caret. Sticks below the masthead on desktop.

Mobile: one masthead row (logo + पात्रो + menu), the crimson rail becomes a
horizontal swipe strip, and a **five-item bottom nav** (गृह · विषय · खोज ·
पात्रो · सेभ) replaces the rail. Bottom nav respects safe-area insets.

No third band. No mega-menus. No topic rows above stories.

## 5. The edition (homepage order)

1. **Lead** — full-width photograph, centered Mukta headline over a
   bottom-anchored ink gradient, kicker + deck. OnlineKhabar grammar with more
   air.
2. **Support pair** — two secondary stories, photo cards side by side.
3. **Latest rail (ताजा)** — dense timestamped list, left; पात्रो mini + poll
   right (desktop), stacked (mobile).
4. **Desks by role** —
   - news desks (राजनीति, समाज): text-forward list + one photo;
   - market desk (बजार): NEPSE market well + movers;
   - photo desks (खेलकुद, मनोरञ्जन): large photograph cards;
   - voices (विचार): pull-quote typography, no photos.
5. **Province strip** — seven provinces, story counts, crimson numerals.
6. **Labeled ad slot** — bordered, labeled "विज्ञापन", never disguised.
7. **Evening briefing (साँझ ब्रिफिङ)** — numbered digest of the day.
8. Remaining desks close the page (स्वास्थ्य, शिक्षा, प्रविधि, विश्व …).

## 6. Article page

Centered 680px column: kicker (crimson), large Mukta headline (32–44px),
deck, byline + dateline + reading time, hero with caption/credit, body with
`h2` section heads, pull-quotes set large with crimson rule, lists with
crimson markers. **Save (सेभ) + share** controls above the fold and at the
end. Related stories under the column. Progress hairline on top (crimson).

## 7. Utilities (पात्रो, NEPSE, राशिफल, उपकरणहरू)

Tools keep the newspaper skin: same paper, same type, crimson reserved for
active states and numbers. **पात्रो runs an astronomical panchanga engine**
(astronomy-engine): tithi, nakshatra, yoga and karana are computed from the
apparent Moon/Sun ecliptic longitudes at Kathmandu sunrise and served by
`GET /api/patro?year&month`. Lunar festivals (Dashain, Tihar, Teej, Purnimas)
are DERIVED from those tithis for any year — never hardcoded dates. Weekly
public holidays: **Saturday AND Sunday** (since 2082 Saun). Preeti→Unicode is
a live two-way converter (ported newsroom algorithm). Date converter converts
both ways, Devanagari numerals out.

### बजार (market) — live data contract

`GET /api/market/summary` (also `/forex`, `/metals`, `/nepse`) powers the
masthead NEPSE chip, the बजार desk strip, the homepage market well and the
full `#/nepse` dashboard:

- **विदेशी मुद्रा** — Nepal Rastra Bank official API (nrb.org.np), 2-hour
  server cache, labelled fallback snapshot.
- **सुन–चाँदी** — international spot (gold-api.com XAU/XAG) × NRB USD rate ×
  tola conversion (0.375 oz) with calibrated dealer premium; auto-refreshed
  and labelled सूचक मूल्य.
- **नेप्से** — live fetch attempted from nepalstock.com.np (works when hosted
  in Nepal); otherwise an honestly-labelled अन्तिम उपलब्ध snapshot.
- **इन्धन** — NOC revision table, revision date always shown.

Never fake a live feed; every panel names its source. पात्रो is a real BS month grid (nepali-datetime)
**with an astronomical panchanga engine** (astronomy-engine): tithi,
nakshatra, yoga and karana are computed from the apparent Moon/Sun ecliptic
longitudes at Kathmandu sunrise, served by `GET /api/patro?year&month`.
Lunar festivals (Dashain, Tihar, Teej, Purnimas) are DERIVED from those
tithis for any year — never hardcoded dates. Weekly public holidays:
**Saturday AND Sunday** (since 2082 Saun). Preeti→Unicode is a live two-way
converter (ported newsroom algorithm). Date converter converts both ways,
Devanagari numerals out.

### बजार (market) — live data contract

`GET /api/market/summary` (also `/forex`, `/metals`, `/nepse`) powers the
masthead NEPSE chip, the बजार desk strip, the homepage market well and the
full `#/nepse` dashboard:

- **विदेशी मुद्रा** — Nepal Rastra Bank official API (nrb.org.np), 2-hour
  server cache, labelled fallback snapshot.
- **सुन–चाँदी** — international spot (gold-api.com XAU/XAG) × NRB USD rate ×
  tola conversion (0.375 oz) with calibrated dealer premium; auto-refreshed,
  labelled सूचक मूल्य.
- **नेप्से** — live fetch attempted from nepalstock.com.np (works when hosted
  in Nepal); otherwise an honestly-labelled अन्तिम उपलब्ध snapshot.
- **इन्धन** — NOC revision table, revision date always shown.

Never fake a live feed; every panel names its source.

## 8. Behavior contract

- Hash routes: `#/` home, `#/en` English home, `#/{desk}`, `#/{desk}/{slug}`,
  `#/patro`, `#/nepse`, `#/rashifal`, `#/scores`, `#/tools/preeti`,
  `#/tools/date`, `#/province/{slug}`, `#/saved`, `#/search`, `#/journalist`, legal pages
  `#/page/{slug}`.
- Saved stories: **this device only** (localStorage), stated on the page.
- Poll: one vote per device, results as crimson bars.
- Theme: light/dark, persisted; default light paper.
- Every interactive element ≥44px touch target; focus-visible rings.
- Images: `alt` always; every story has a visual — a real newsroom
  photograph, an assigned stock photo, or the desk's editorial illustration
  (`/photos/desks/{desk}.jpg`). Never a blank or broken placeholder.

### Accounts — two separate systems (by design)

- **पाठक (reader)** — email+password via `/api/auth/reader/*`; the masthead
  shows an account chip; drawer with profile, saved count and साँझ ब्रिफिङ
  newsletter subscribe (`/api/newsletter`). scrypt password hashing, httpOnly
  cookie sessions (30 days, Prisma `Session` table).
- **पत्रकार (journalist)** — a DIFFERENT login at `#/journalist`
  (`/api/auth/journalist/login`) on the `Journalist` table. After login: a
  mini newsroom desk with the journalist's own pitches
  (`/api/desk/pitches` — submit, status, editor notes) and their desk's
  published stories. Reader and journalist sessions are mutually exclusive
  kinds, never mixed.

## 9. Voice

Nepali first, Devanagari numerals for Nepali surfaces, Latin numerals for
market/technical data. English edition mirrors the Nepali one at `#/en`.
Demo/live data is labelled honestly — never fake a live feed.

---

## Revision 3 additions — the full newsroom loop

### Breaking news (तत्काल)

- A crimson-deep full-width strip sits **above the masthead** (the only band
  allowed above the paper masthead): white "तत्काल" tab with a pulsing dot,
  bold headline, optional link, dismiss (per browser session).
- Controlled exclusively from the सम्पादक डेस्क (`/api/editor/breaking`);
  readers get `GET /api/breaking`. Dismissal never removes the news — only
  hides the strip for that session.

### The live edition layer (CMS merge)

- Published CMS articles merge into the same visual grammar as the 87-story
  archive: latest rail (with a small crimson **ताजा** badge), desk pages,
  English edition. No third card style — they reuse every existing card.
- Article heroes: CMS photo if provided, else the desk editorial
  illustration (`heroFor` never returns an empty src).

### Reader engagement surfaces

- **Comments** at the end of every article (archive + CMS alike, keyed
  `desk/slug`): paper-card list, composer for logged-in readers only,
  anonymous visitors get a login prompt; editors hide/delete from the
  सम्पादक डेस्क.
- **Poll of the day** — server counts, one vote per person (account for
  readers, device key for anonymous), crimson bars with Devanagari
  percentages; honest label: "मत सर्भरमा गणना हुन्छ".
- **धेरै पढिएको** — numbered most-read rail (7-day window) from the
  pageview engine; hidden when there is no data.
- **Saved stories** — localStorage for anonymous readers, account-synced
  (merge on login) for readers.

### The newsroom (#/journalist)

- Tabbed desk: **पिच तथा डेस्क** (pitches + desk content) ·
  **लेख लेख्नुहोस्** (markdown-lite editor, live preview with word count
  and reading time) · **मेरा लेखहरू** (pipeline with status chips:
  ड्राफ्ट / समीक्षामा / प्रकाशित / अस्वीकार + edit / submit / retract / delete) ·
  **सम्पादक डेस्क** (editors only, marked with a badge).
- Editor dashboard keeps the paper aesthetic: stat cards, review queue with
  expandable body preview, pitch triage, तत्काल control, 7-day traffic
  chart, top stories, subscribers + CSV, comment moderation.
- Roles: `reporter` files and edits own unpublished work; `editor`
  publishes/declines, moderates, controls तत्काल. Enforced server-side,
  never by hiding buttons.

### Data honesty (unchanged contract)

- Live: NRB forex, metals, पात्रो panchanga, poll counts, pageviews,
  breaking news, CMS pipeline. Demo-labelled: NEPSE fallback snapshot,
  scores fixtures, rashifal.
- Sensitive APIs are rate-limited and validated (zod, Nepali error
  messages); private surfaces (`/api/editor/*`, auth, bookmarks) are
  disallowed in robots.txt.
