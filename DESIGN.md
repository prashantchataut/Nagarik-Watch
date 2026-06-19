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

Dark vs light is not a reflex. The physical scene: *a Nepali reader, often on a phone,
reading outdoors or in a lit room during the day, in transit, sometimes at night in bed*.
That forces **light, high-readability surfaces for article reading** (the core activity).
Dark mode is offered as a user toggle for night reading, not as a default.

### Anti-reflex check (done before settling)
- News portals → reflex says "lots of red, alarmist." Rejected: our red (if chosen) is a
  *civic, calm* crimson, used with restraint, not as alarm wallpaper.
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

| Role            | OKLCH                       | Hex (approx) | Use                                   |
|, , , , -|, , , , , , , -|, , , , |-, , , , , , , , , , |
| `brand`         | `oklch(0.55 0.18 25)`       | `#C02A2A`-ish| Masthead, links, section labels       |
| `brand-strong`  | `oklch(0.45 0.20 25)`       | `#9E1F22`-ish| Hover, breaking ticker bar            |
| `brand-tint`    | `oklch(0.96 0.02 25)`       | `#F9F1F0`-ish| Subtle backgrounds, section rules     |
| `surface`       | `oklch(0.985 0.004 25)`     | `#FBFAF9`-ish| Page background (warm, not white)     |
| `surface-raised`| `oklch(0.99 0.003 25)`      | `#FEFDFD`-ish| Cards, article body container         |
| `ink`           | `oklch(0.22 0.02 25)`       | `#3A3332`-ish| Primary text (warm near-black)        |
| `ink-soft`      | `oklch(0.40 0.015 25)`      | `#6B5F5D`-ish| Secondary text, decks, meta           |
| `mute`          | `oklch(0.62 0.012 25)`      | `#9C8E8C`-ish| Tertiary, captions, timestamps        |
| `rule`          | `oklch(0.90 0.008 25)`      | `#E2DAD8`-ish| Hairline dividers, borders            |
| `breaking`      | `oklch(0.50 0.22 27)`       | `#8E1B1B`-ish| Breaking-news bar (stronger than brand)|

**Why:** crimson is flag-native (no other national flag is a non-rectangular double-
pendant in crimson), it is gravely readable on warm neutrals, and it reads as *civic*
rather than *tabloid* when desaturated and paired with warm-tinted ink.

### Palette B, Editorial Ink (navy/charcoal)

A confident editorial navy-blue, classic and trustworthy. **Caveat:** Setopati is
associated with a blue; this risks looking derivative unless we lean the hue toward teal-
ink and keep chroma restrained. Most "safe," least ownable.

| Role            | OKLCH                       | Hex (approx) | Use                                   |
|, , , , -|, , , , , , , -|, , , , |-, , , , , , , , , , |
| `brand`         | `oklch(0.42 0.11 245)`      | `#1F3A7A`-ish| Masthead, links, section labels       |
| `brand-strong`  | `oklch(0.33 0.12 245)`      | `#172C66`-ish| Hover, breaking ticker bar            |
| `brand-tint`    | `oklch(0.96 0.015 245)`     | `#EEF1F9`-ish| Subtle backgrounds                    |
| `surface`       | `oklch(0.985 0.004 240)`    | `#F9FAFB`-ish| Page background (cool, not white)     |
| `surface-raised`| `oklch(0.99 0.003 240)`     | `#FDFEFE`-ish| Cards, body container                 |
| `ink`           | `oklch(0.24 0.02 245)`      | `#2A2F3A`-ish| Primary text (cool near-black)        |
| `ink-soft`      | `oklch(0.42 0.018 245)`     | `#5A6173`-ish| Secondary text                        |
| `mute`          | `oklch(0.62 0.014 245)`     | `#8C92A0`-ish| Tertiary, captions                    |
| `rule`          | `oklch(0.90 0.01 245)`      | `#DDE1EA`-ish| Hairline dividers                     |
| `breaking`      | `oklch(0.38 0.18 27)`       | `#8E1B1B`-ish| Breaking-news bar (kept crimson)      |

**Why:** navy is the global newspaper default (NYT, Guardian-leaning). Safe, readable,
serious. **Why not first choice:** least differentiated in the Nepali market; reads as
generic "newspaper website."

### Palette C, Forest / Hills (deep green)

A deep forest green, evoking the Nepali landscape (hills, Terai) and signaling growth,
stability, and civic life. Rare among Nepali news portals, so **most visually ownable**.
Slight risk of reading as "agriculture/environment niche" if not handled with editorial
gravitas; mitigated by pairing with serious ink and strong type.

| Role            | OKLCH                       | Hex (approx) | Use                                   |
|, , , , -|, , , , , , , -|, , , , |-, , , , , , , , , , |
| `brand`         | `oklch(0.42 0.09 155)`      | `#1E5E47`-ish| Masthead, links, section labels       |
| `brand-strong`  | `oklch(0.33 0.10 155)`      | `#154435`-ish| Hover, breaking ticker bar            |
| `brand-tint`    | `oklch(0.96 0.015 155)`     | `#ECF5F0`-ish| Subtle backgrounds                    |
| `surface`       | `oklch(0.985 0.005 150)`    | `#F9FBF9`-ish| Page background (warm-cool, not white)|
| `surface-raised`| `oklch(0.99 0.003 150)`     | `#FDFEFD`-ish| Cards, body container                 |
| `ink`           | `oklch(0.24 0.015 160)`     | `#2A332E`-ish| Primary text                          |
| `ink-soft`      | `oklch(0.42 0.015 160)`     | `#556459`-ish| Secondary text                        |
| `mute`          | `oklch(0.62 0.012 160)`     | `#8B958C`-ish| Tertiary, captions                    |
| `rule`          | `oklch(0.90 0.008 155)`     | `#DDE3DE`-ish| Hairline dividers                     |
| `breaking`      | `oklch(0.50 0.22 27)`       | `#8E1B1B`-ish| Breaking-news bar (kept crimson)      |

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
- **Devanagari display (headlines):** "Mukta" (Google Fonts, OFL) at heavier weights, or
  "Baloo 2 Devanagari" for a slightly more characterful display. To be A/B'd in Phase 1.
- **Latin / English section / UI numbers:** "Inter" (Google Fonts, OFL). Clean, neutral,
  excellent at small sizes.
- **Serif option for long-form/columns:** a serif for the opinion/columns section gives it
  a distinct editorial identity. Candidate: "Tiro Devanagari Sanskrit" + "Tiro Devanagari
  Hindi" (OFL) or fall back to the sans. Decision in Phase 1 columns work.

### Type scale (modular, ratio ~1.25, passes the impeccable ≥1.25 hierarchy test)

| Token        | Devanagari / Latin        | Size / Line-height | Weight | Use                         |
|, , , , |-, , , , , , , |-, , , , , -|, , |, , , , , , , -|
| `display`    | Mukta / Inter             | 44px / 1.15        | 700    | Lead-story headline (hero)  |
| `h1`         | Mukta / Inter             | 32px / 1.2         | 700    | Article headline            |
| `h2`         | Mukta / Inter             | 24px / 1.25        | 700    | Section headers, sub-leads  |
| `h3`         | Mukta / Inter             | 20px / 1.3         | 600    | Card titles                 |
| `body-lg`    | Noto Sans Devanagari/Inter| 19px / 1.7         | 400    | Article body (Devanagari)   |
| `body`       | Noto Sans Devanagari/Inter| 16px / 1.65        | 400    | Default body, cards         |
| `meta`       | Inter / Noto Sans         | 13px / 1.4         | 500    | Byline, date, timestamps    |
| `caption`    | Inter / Noto Sans         | 12px / 1.35        | 400    | Image captions, credits     |

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

**Layout primitives:**
- Page max-width: **1280px** for the homepage grid; **680px** for the article body
  column; **1200px** for section/category pages.
- Gutter: 24px desktop, 16px mobile.
- The article body is **not** wrapped in a card, it sits on the page surface with a
  hairline rule above the byline. Cards are used only where the card affordance is right
  (story grids, related stories, most-read). No nested cards, ever., -

## 5. Component inventory

The primitives in `packages/ui`. Each is accessible (keyboard, focus-visible, ARIA where
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

Dark mode tokens are derived from the chosen palette by inverting L and slightly reducing
chroma, with the brand hue preserved. Surfaces become deep warm-tinted (Palette A) /
cool-tinted (B/C) near-blacks, never pure black. Article body in dark mode uses a slightly
larger line-height and a touch lower contrast for comfortable night reading., -

## Open design questions (resolve in Phase 1)

- Mukta vs Baloo 2 for Devanagari display, A/B the lead-story headline.
- Do opinion/columns use a serif for editorial distinction, or stay in the system sans?
- Final masthead wordmark treatment (Devanagari-primary lockup vs bilingual stacked).
- Weather widget: include in masthead, or drop for simplicity?

## Decision log

| Date       | Decision                                   | Rationale            |
|, , , |, , , , , , , , , , , |, , , , , , |
| 2026-06-18 | **Palette A, Civic Crimson CHOSEN**       | Founder pick; civic fit, flag-adjacent, distinct from Setopati/Ratopati |
| 2026-06-18 | 3 palettes proposed; A recommended         | Ownability + civic fit |
| 2026-06-18 | Light-first, dark as toggle                | Reading scene forces it |
| 2026-06-18 | Noto Sans Devanagari + Mukta + Inter       | Free, OFL, best coverage |
