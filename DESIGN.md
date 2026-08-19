# DESIGN.md, Nagarik Watch

> Design system for the impeccable skill. Loaded with `PRODUCT.md` before every design
> task. Register: **brand** (portal surfaces) unless working in the CMS/admin (**product**).

This document is opinionated and complete enough to design from. Three full palette
proposals are below; **one must be chosen** before Phase 1 implementation. Everything else
(type, spacing, components, motion, bans) is fixed across all three palettes., -

## 1. Color strategy

**Register:** brand (portal). **Strategy: Committed.**

A single saturated brand color carries 30–60% of identity surfaces (masthead, section
labels, breaking ticker, links, category accents). Neutrals are tinted toward the brand
hue. There is no `#000` and no `#fff` anywhere, neutrals are tinted with chroma
0.005–0.02 toward the brand hue, per impeccable law. Chroma reduces as lightness
approaches 0 or 100 (high chroma at extremes looks garish).

Dark vs light is not a reflex. The physical scene: _a Nepali reader, often on a phone,
reading outdoors or in a lit room during the day, in transit, sometimes at night in bed_.
That forces **light, high-readability surfaces for article reading** (the core activity).
Dark mode is offered as a user toggle for night reading, not as a default.

### Anti-reflex check (done before settling)

- News portals → reflex says "lots of red, alarmist." Rejected: our red (if chosen) is a
  _civic, calm_ crimson, used with restraint, not as alarm wallpaper.
- Indian-subcontinent news → reflex says "yellow breaking-news bars." Rejected.
- The chosen direction must read as **a serious news brand**, not a tabloid and not a SaaS., -

## 2. Palette, chosen: A (Civic Crimson) ✅

All values in **OKLCH**. `oklch(L C H)` where L = lightness 0–1, C = chroma, H = hue °.
"Brand" = the committed accent; "Surface" = page background (tinted neutral, not white);
"Ink" = primary text; "Mute" = secondary text/borders.

> **Decision (2026-06-18): Palette A, Civic Crimson is chosen.** The token table under A
> below is the authoritative source of truth, encoded as CSS variables in `packages/ui`
> and the Tailwind theme extension. Palettes B and C are retained below only as rejected
> alternatives for the decision record.

### Palette A, Civic Crimson ✅ CHOSEN

A deep, serious crimson drawn from the crimson of Nepal's flag, desaturated enough to read
as civic and trustworthy rather than alarming. Distinct from Setopati (blue) and Ratopati.
This is the most ownable, most "news-appropriate" of the three.

| Role | OKLCH | Hex (approx) | Use |
|, , , , -|, , , , , , , -|, , , , |-, , , , , , , , , , |
| `brand` | `oklch(0.55 0.18 25)` | `#C02A2A`-ish| Masthead, links, section labels |
| `brand-strong` | `oklch(0.45 0.20 25)` | `#9E1F22`-ish| Hover, breaking ticker bar |
| `brand-tint` | `oklch(0.96 0.02 25)` | `#F9F1F0`-ish| Subtle backgrounds, section rules |
| `surface` | `oklch(0.985 0.004 25)` | `#FBFAF9`-ish| Page background (warm, not white) |
| `surface-raised`| `oklch(0.99 0.003 25)` | `#FEFDFD`-ish| Cards, article body container |
| `ink` | `oklch(0.22 0.02 25)` | `#3A3332`-ish| Primary text (warm near-black) |
| `ink-soft` | `oklch(0.40 0.015 25)` | `#6B5F5D`-ish| Secondary text, decks, meta |
| `mute` | `oklch(0.62 0.012 25)` | `#9C8E8C`-ish| Tertiary, captions, timestamps |
| `rule` | `oklch(0.90 0.008 25)` | `#E2DAD8`-ish| Hairline dividers, borders |
| `breaking` | `oklch(0.50 0.22 27)` | `#8E1B1B`-ish| Breaking-news bar (stronger than brand)|

**Why:** crimson is flag-native (no other national flag is a non-rectangular double-
pendant in crimson), it is gravely readable on warm neutrals, and it reads as _civic_
rather than _tabloid_ when desaturated and paired with warm-tinted ink.

### Palette B, Editorial Ink (navy/charcoal)

A confident editorial navy-blue, classic and trustworthy. **Caveat:** Setopati is
associated with a blue; this risks looking derivative unless we lean the hue toward teal-
ink and keep chroma restrained. Most "safe," least ownable.

| Role | OKLCH | Hex (approx) | Use |
|, , , , -|, , , , , , , -|, , , , |-, , , , , , , , , , |
| `brand` | `oklch(0.42 0.11 245)` | `#1F3A7A`-ish| Masthead, links, section labels |
| `brand-strong` | `oklch(0.33 0.12 245)` | `#172C66`-ish| Hover, breaking ticker bar |
| `brand-tint` | `oklch(0.96 0.015 245)` | `#EEF1F9`-ish| Subtle backgrounds |
| `surface` | `oklch(0.985 0.004 240)` | `#F9FAFB`-ish| Page background (cool, not white) |
| `surface-raised`| `oklch(0.99 0.003 240)` | `#FDFEFE`-ish| Cards, body container |
| `ink` | `oklch(0.24 0.02 245)` | `#2A2F3A`-ish| Primary text (cool near-black) |
| `ink-soft` | `oklch(0.42 0.018 245)` | `#5A6173`-ish| Secondary text |
| `mute` | `oklch(0.62 0.014 245)` | `#8C92A0`-ish| Tertiary, captions |
| `rule` | `oklch(0.90 0.01 245)` | `#DDE1EA`-ish| Hairline dividers |
| `breaking` | `oklch(0.38 0.18 27)` | `#8E1B1B`-ish| Breaking-news bar (kept crimson) |

**Why:** navy is the global newspaper default (NYT, Guardian-leaning). Safe, readable,
serious. **Why not first choice:** least differentiated in the Nepali market; reads as
generic "newspaper website."

### Palette C, Forest / Hills (deep green)

A deep forest green, evoking the Nepali landscape (hills, Terai) and signaling growth,
stability, and civic life. Rare among Nepali news portals, so **most visually ownable**.
Slight risk of reading as "agriculture/environment niche" if not handled with editorial
gravitas; mitigated by pairing with serious ink and strong type.

| Role | OKLCH | Hex (approx) | Use |
|, , , , -|, , , , , , , -|, , , , |-, , , , , , , , , , |
| `brand` | `oklch(0.42 0.09 155)` | `#1E5E47`-ish| Masthead, links, section labels |
| `brand-strong` | `oklch(0.33 0.10 155)` | `#154435`-ish| Hover, breaking ticker bar |
| `brand-tint` | `oklch(0.96 0.015 155)` | `#ECF5F0`-ish| Subtle backgrounds |
| `surface` | `oklch(0.985 0.005 150)` | `#F9FBF9`-ish| Page background (warm-cool, not white)|
| `surface-raised`| `oklch(0.99 0.003 150)` | `#FDFEFD`-ish| Cards, body container |
| `ink` | `oklch(0.24 0.015 160)` | `#2A332E`-ish| Primary text |
| `ink-soft` | `oklch(0.42 0.015 160)` | `#556459`-ish| Secondary text |
| `mute` | `oklch(0.62 0.012 160)` | `#8B958C`-ish| Tertiary, captions |
| `rule` | `oklch(0.90 0.008 155)` | `#DDE3DE`-ish| Hairline dividers |
| `breaking` | `oklch(0.50 0.22 27)` | `#8E1B1B`-ish| Breaking-news bar (kept crimson) |

**Why:** distinct, ownable, gravitas-capable. **Why caution:** must avoid looking like a
niche sustainability site; requires a strong typographic masthead and editorial restraint.

> **Decision needed before Phase 1:** ~~pick A, B, or C.~~ **DECIDED: A.** The chosen
> palette's tokens are encoded as CSS variables and the Tailwind theme extension in
> `packages/ui`. B and C below are the rejected alternatives for the record., -

## 3. Typography

**Devanagari-first.** Body and headlines optimize for Nepali conjuncts, matras, and
appropriate line-height (Devanagari needs ~1.6–1.7 line-height for body, more than Latin).

### Font stacks

- **Devanagari body:** "Noto Sans Devanagari" (Google Fonts, free, OFL). Best open-source
  coverage of Nepali matras and conjuncts. Fallback: "Mukta", system Devanagari.
- **Devanagari display (headlines):** **Mukta** (Google Fonts, OFL) at heavier weights.
  Locked 2026-07-26 (founder preference). Baloo 2 is retired as an A/B candidate.
- **Latin / English section / UI numbers:** "Source Sans 3" (Google Fonts, OFL). Editorial
  Latin companion to Mukta/Noto; deliberately not Inter (anti-slop / DESIGN decision 2026-07-19).
  CSS variable is `--font-source-sans` (historical `--font-inter` alias removed); the loaded
  face is Source Sans 3.
- **Serif option for long-form/columns:** a serif for the opinion/columns section gives it
  a distinct editorial identity. Candidate: "Tiro Devanagari Sanskrit" + "Tiro Devanagari
  Hindi" (OFL) or fall back to the sans. Decision in Phase 1 columns work.

### Type scale (modular, ratio ~1.25, passes the impeccable ≥1.25 hierarchy test)

| Token | Devanagari / Latin | Size / Line-height | Weight | Use |
|, , , , |-, , , , , , , |-, , , , , -|, , |, , , , , , , -|
| `display` | Mukta / Source Sans 3 | 44px / 1.15 | 700 | Lead-story headline (hero) |
| `h1` | Mukta / Source Sans 3 | 32px / 1.2 | 700 | Article headline |
| `h2` | Mukta / Source Sans 3 | 24px / 1.25 | 700 | Section headers, sub-leads |
| `h3` | Mukta / Source Sans 3 | 20px / 1.3 | 600 | Card titles |
| `body-lg` | Noto Sans Devanagari/Source Sans 3| 19px / 1.7 | 400 | Article body (Devanagari) |
| `body` | Noto Sans Devanagari/Source Sans 3| 16px / 1.65 | 400 | Default body, cards |
| `meta` | Source Sans 3 / Noto Sans | 13px / 1.4 | 500 | Byline, date, timestamps |
| `caption` | Source Sans 3 / Noto Sans | 12px / 1.35 | 400 | Image captions, credits |

**Rules:**

- Body line-length capped at **65–75ch** (impeccable law). Article column ~680px max.
- Hierarchy through **scale + weight contrast**, not color or decoration.
- No gradient text. No text effects. Emphasis via weight or size only.
- Numbers in headlines (e.g. "५ करोड") render in Devanagari numerals by default in the
  Nepali locale; Latin numerals in the English section. Locale-driven., -

## 4. Spacing & layout

A single 4px-based spacing scale, varied deliberately for rhythm (impeccable: same padding
everywhere is monotony).

```
0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128  (px)
```

Tokens: `space-1`=4 … `space-2`=8 … up to `space-12`=128.

### Density dial (homepage and section indexes)

**Decision (2026-07-26):** Portal surfaces target **dense editorial packing**, not gallery
whitespace. Readers come to scan many stories; blank mid-page voids read as unfinished.

| Dial            | Homepage target | Notes                                                                             |
| --------------- | --------------- | --------------------------------------------------------------------------------- |
| Visual density  | **7 / 10**      | Tight story rows, image+deck on rails, packed section bands                       |
| Design variance | **7 / 10**      | Explicit desk compositions with controlled asymmetry, not repeated card templates |
| Motion          | **3 / 10**      | Hover/focus only; no scroll theatre                                               |

Reference craft bar for packing: serious Nepali news portals (e.g. OnlineKhabar-class
information density). We match **story packing and scan rhythm**, never ad clutter,
autoplay, or interstitial traps. PRODUCT.md still bans tabloid chrome.

**Homepage editorial composition (2026-08-09):**

- The opening package is **one dominant lead + one support lead + two support briefs + a compact top-story pulse**. Never stack multiple centered mega-heroes.
- Category sections choose a composition by **editorial role**, not by array index or modulo rotation: news desk, split desk, photo desk, voices, or compact desk.
- Lists are reserved for information that is genuinely sequential or ranked (`Latest`, `Most read`). Editorial category sections must compose stories rather than render interchangeable rows.
- Homepage category kickers are typographic brand labels, not repeated filled pills. Trending topics are plain newsroom links with separators, not chips.
- Reader personalization and province engagement analytics stay out of the main pitch homepage. The homepage foregrounds reporting, freshness, geography, photography and editorial judgment.
- Ads follow completed editorial units: the first inline placement comes only after three populated desks; the closing billboard sits after the category stream. No ad-story-ad cadence.
- Mobile removes the persistent live utility strip and keeps the first screens focused on masthead, breaking news, the lead package and a compact latest package.

**Layout primitives:**

- Page max-width: **1280px** for the homepage grid; **680px** for the article body
  column; **1200px** for section/category pages.
- Gutter: 16–20px desktop, 12–16px mobile (tighter than SaaS defaults).
- Homepage section stack: prefer `space-y-6`–`8`, not `10`–`12`.
- The article body is **not** wrapped in a card, it sits on the page surface with a
  hairline rule above the byline. Cards are used only where the card affordance is right
  (story grids, related stories, most-read). No nested cards, ever.

### Section separation

**Do not** use full-width heavy ink rules (`border-*-2/3 border-ink`) as the default
section divider. Those shout “wireframe” and chop the page into sparse bands.

**Preferred:**

1. Hairline `border-rule` under the section header row.
2. A short brand underline under the section title only (≈2–3rem wide, `brand` or
   `brand-strong`), not a page-wide bar.
3. Vertical rhythm + background tint (`surface-raised` / `brand-tint`) when a module
   needs a stronger boundary (poll, live reference).

### Nepali kickers and labels

Devanagari must never inherit Latin “tracked uppercase” costume.

- **Banned on `lang="ne"`:** `text-transform: uppercase` and `letter-spacing` above
  `0.02em` (prefer `0`).
- Category kickers: brand color + weight + optional short underline. Sentence case.
- Latin-only micro-labels (EN locale, ISO codes) may use modest tracking ≤ `0.06em`.

## 5. Component inventory

Editorial card primitives live in `packages/ui` (`StoryCard`, `StoryGrid`, `Hero`,
`SectionHeader`, `CategoryLabel`, `Byline`, `Dateline`, `LiveWidget`, skeletons).

**Chrome and article surfaces live in `apps/web/components/`** (Masthead, Footer,
BreakingTicker, ArticleBody, ShareBar, AdSlot, PublicShell, HubIndexHeader, etc.).
Each is accessible (keyboard, focus-visible, ARIA where needed) and themable via the
chosen palette tokens.

**Editorial (apps/web + packages/ui):**

The primitives in `packages/ui` and chrome in `apps/web/components`. Each is accessible (keyboard, focus-visible, ARIA where
needed) and themable via the chosen palette tokens.

**Editorial:**

- `Masthead`, wordmark "नागरिक वाच / Nagarik Watch", date in BS (बिक्रम सम्बत) + AD, weather
  optional. Sticky on scroll with condensing behavior.
- `PrimaryNav`, category nav, Devanagari labels, with language toggle (ने/EN) and search.
- `BreakingTicker`, horizontal scrolling strip, brand-strong background, used **only**
  for genuinely breaking items.
- `StoryCard`, image, category label, headline (h3), meta. Variants: `lead` (large, h2),
  `standard`, `compact` (no image, list-style), `text-only`.
- `StoryGrid`, varies card sizes for rhythm; never identical-card grids.
- `Hero`, the single lead story with display headline, large image, deck.
- `SectionBlock`, a labeled category section on the homepage (e.g. "राजनीति") with a
  mixed grid + a "थप" (more) link.
- `ArticleBody`, long-form column, 680px, rich-text rendered, inline elements: pull
  quote, image, embed, ad slot.
- `Byline`, `Dateline`, `Tags`, `ShareBar` (no modal, inline), `RelatedStories`.
- `PullQuote`, full-bleed within the article column, brand-tint background, no
  side-stripe border (impeccable ban).
- `CorrectionNotice`, dated, visible, set in `meta` size with a clear label.

**Media (Phase 3):**

- `ImageGallery`, `VideoEmbed`, `LiveBlogFeed`, `EpaperViewer`.

**Commerce / chrome:**

- `AdSlot`, labeled "विज्ञापन / Advertisement", lazy-loaded, viewability-tracked, never
  between every paragraph.
- `SponsoredBadge`, unambiguous labeling for native/sponsored content.
- `Footer`, registration number (DoIB), Press Council listing, sections, about, contact,
  ethics policy, privacy.

**Feedback:**

- `Toast` (transient), `InlineMessage` (persistent, e.g. "यो लेख अपडेट भएको छ")., -

## 6. Elevation

Minimal. News sites should feel flat and typographic, not app-like.

- `flat`, default. Hairline `rule` border only.
- `raised`, `surface-raised` background + 1px rule. Used for cards and the article
  container.
- `sticky`, sticky header gets a subtle bottom hairline + tiny backdrop tint, not a
  heavy shadow.
- `overlay`, used only for the search panel and mobile menu. Soft shadow
  `0 8px 32px oklch(0.2 0.02 25 / 0.12)`, no glassmorphism.

No element uses a drop shadow deeper than the overlay token. No fake-3D, no bevels., -

## 7. Motion

- **Never animate layout properties** (width, height, top, left). Animate `transform` and
  `opacity` only (impeccable law).
- Ease **out** with exponential curves: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-quint)
  is the default. No bounce, no elastic.
- Durations: `fast`=120ms (hover, focus), `base`=200ms (toggles, menu), `slow`=320ms
  (overlays). Nothing longer than 400ms.
- `prefers-reduced-motion`: all non-essential motion disabled.
- The breaking ticker scrolls horizontally at a calm, readable pace; pauses on hover and
  on focus; stops under reduced-motion (replaced with a static "ब्रेकिङ:" label + first
  item + arrow)., -

## 8. Iconography

- Line icons, 1.5px stroke, 20/24px boxes, drawn on the same grid. Source: Lucide (ISC) or
  hand-drawn to match. No filled "app-icon" style, no emoji as UI.
- Icons sit on a 4px grid; sized 16/20/24 only.
- Each icon has a Devanagari-accessible `aria-label` (e.g. search icon → `खोज्नुहोस्`)., -

## 9. Absolute bans (impeccable, enforced, non-negotiable)

If any of these appear, the element is rewritten with different structure.

1. **No side-stripe borders.** No `border-left`/`border-right` > 1px as a colored accent
   on cards, list items, callouts, or alerts. Use full borders, background tints, leading
   icons/numbers, or nothing.
2. **No gradient text.** No `background-clip: text` + gradient. Single solid color;
   emphasis via weight or size.
3. **No glassmorphism as default.** No decorative blurs/glass cards. Rare and purposeful,
   or nothing.
4. **No hero-metric template.** No big-number + small-label + supporting-stats + gradient
   accent blocks. This is a news brand, not a SaaS landing page.
5. **No identical card grids.** Story grids vary card sizes and densities for rhythm.
6. **No modal as first thought.** Share, search, and newsletter default to inline or
   overlay panels; modals only when truly necessary.
7. **No em dashes in copy.** Use commas, colons, semicolons, periods, or parentheses. Not
   `, `., -

## 10. AI-slop test (impeccable)

Two-altitude category-reflex check, run on every key surface:

- **First-order:** if someone could guess palette + theme from "Nepali news portal" alone
  (alarm-red tabloid, or default-newspaper-navy), it's the training-data reflex. Rework.
- **Second-order:** if "Nepali news portal that's not tabloid-red" leads predictably to
  "safe navy SaaS-y newsroom," that's the trap one tier deeper. Rework toward a
  typographic, civic, Devanagari-confident identity.

The design passes when neither answer is obvious from the domain. Palette A (Civic
Crimson) paired with strong Devanagari display type and a flat, typographic layout
clears both altitudes; Palette C (Forest) clears them even more strongly., -

## 11. Accessibility (baseline, hard requirements)

- **WCAG 2.1 AA** contrast for all text on all surfaces in both palettes.
- Semantic HTML: `<article>`, `<header>`, `<nav>`, `<main>`, `<time>`, `<figure>`.
- `lang="ne"` on Devanagari content, `lang="en"` on English content, mixed runs use
  `<span lang>`.
- Keyboard navigable; visible focus ring (2px brand outline, offset 2px).
- All editorial images require alt text in the CMS (enforced, see content-model.md).
- Skip-to-content link on every page.
- Respect `prefers-reduced-motion` and `prefers-color-scheme` (dark-mode tokens defined)., -

## 12. Dark mode (user toggle, not default)

**Decision (2026-07-24):** Dark mode uses **true black** surfaces (`oklch(0 0 0)`), raised
panels at `oklch(0.14 0 0)`, and chroma-0 ink. Brand crimson is accents only (nav bar,
links, category rules), never a reddish-brown page wash and never pink body headlines.
Light mode remains warm-tinted Civic Crimson neutrals.

**Decision (2026-07-26):** Masthead/footer `--chrome` is **paper in light mode** and **black
in dark mode**, with `--on-chrome` for text. Only the crimson category desk stays dark in
both themes. This stops light mode reading as an inverted portal., -

## Open design questions

- Do opinion/columns use a serif for editorial distinction, or stay in the system sans?
- Final masthead wordmark treatment (Devanagari-primary lockup vs bilingual stacked).
- ~~Live reference: keep a single compact strip, or fold weather into the masthead?~~
  **Resolved 2026-07-26:** one compact Markets strip under masthead/topics (UtilityStrip).
  **Revised 2026-08-14:** folded into the masthead row (`MastheadReference`). Measured at
  1280px the standalone strip carried ~190px of content across a 1264px band while the
  masthead row held a 590px void, so the band read as an unfinished page. One band, one
  weather fetch, and the void now carries the date, weather and NEPSE.

## Decision log

| Date       | Decision                                                             | Rationale                                                                                           |
| ---------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 2026-06-18 | **Palette A, Civic Crimson CHOSEN**                                  | Founder pick; civic fit, flag-adjacent, distinct from Setopati/Ratopati                             |
| 2026-06-18 | 3 palettes proposed; A recommended                                   | Ownability + civic fit                                                                              |
| 2026-06-18 | Light-first, dark as toggle                                          | Reading scene forces it                                                                             |
| 2026-06-18 | Noto Sans Devanagari + Mukta + Inter                                 | Free, OFL, best coverage                                                                            |
| 2026-07-19 | Latin UI: **Source Sans 3** (not Inter)                              | Matches `fonts.ts`; Inter is anti-slop reflex-reject                                                |
| 2026-07-24 | Dark mode: **true black** surfaces                                   | Founder: reddish soft dark looked amateur; black + crimson accents                                  |
| 2026-07-26 | Light chrome: **paper masthead/footer**                              | Light mode felt dark because chrome was always black                                                |
| 2026-07-26 | **Mukta locked** for Devanagari display                              | Founder preference; end Baloo A/B                                                                   |
| 2026-07-26 | Homepage density **7/10**; soft section rules                        | Sparse SaaS spacing + thick ink rules felt unfinished vs Nepali portal craft                        |
| 2026-07-26 | Latest rail = image + deck + meta                                    | Headline-only lists read as blank wireframes                                                        |
| 2026-07-26 | Hide demo/placeholder polls on public                                | Real portal cannot show “test/demo” poll copy                                                       |
| 2026-07-26 | Category desks must **vary by editorial purpose**                    | text-led columns + giant SVG mosaics left empty cells and looked unfinished vs OnlineKhabar packing |
| 2026-08-09 | Homepage opening = **lead/support/pulse**, never stacked mega-heroes | First-screen story choice and hierarchy matter more than oversized presentation                     |
| 2026-08-09 | Homepage sections map to **editorial roles**, never modulo rotation  | Distinct politics, business, opinion, sports and media rhythms prevent template monotony            |
| 2026-08-09 | **No homepage dashboard layer**                                      | Personalization and reader-heat analytics compete with journalism on the pitch surface              |
| 2026-08-09 | Masthead primary bar is **news navigation only**                     | Calendar/market button clusters made the publication chrome feel app-like                           |
| 2026-07-26 | Treat `data:` heroes as soft media                                   | Never blow SVG stand-ins to full overlay cards; prefer packed horizontal desks                      |
