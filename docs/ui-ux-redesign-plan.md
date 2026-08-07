# Nagarik Watch — Full UI/UX Redesign Plan

> Competitive audit + implementation blueprint for client-pitch readiness.  
> Anchors: PRODUCT.md, DESIGN.md (Civic Crimson), impeccable / redesign-existing-projects / design-taste-frontend.  
> Audited live: OnlineKhabar, Ratopati, TechPana, NepalKhabar, ArthaKhabar, calendar.onlinekhabar.com, calendar.ratopati.com, production nagarikwatch.com (desktop + mobile).  
> Date: 2026-08-07

---

## 0. Design Read (locked)

**Reading this as:** redesign-overhaul of a Devanagari-first Nepali news portal for mid-range Android readers (and client demos), with an incumbent portal craft language (OnlineKhabar → Ratopati packing), leaning toward Civic Crimson brand tokens + density 7–8 editorial grids — never SaaS landing aesthetics.

| Dial | Value | Why |
|------|------:|-----|
| DESIGN_VARIANCE | 4 | News portals win on predictable packing, not artsy asymmetry |
| MOTION_INTENSITY | 2 | Hover + ticker only; no scroll theater |
| VISUAL_DENSITY | 8 | Match OK/Ratopati story packing; kill SaaS whitespace |

**Copy themes/colors?** No. Keep Civic Crimson + Mukta/Noto/Source Sans.  
**Copy structure/layout language?** Yes. Aggressively.

---

## 1. Executive verdict (be critical)

Nagarik Watch has tokens, Devanagari type, and some desk craft — but **it does not speak the visual language of the Nepali portals your supervisor ranked**. That is why it feels “not navigatable” and “poor for pitch.”

The market leaders share one grammar:

1. **Centered mega-headline story feed** (64–68px Mukta, center-aligned) for top stories  
2. **Thin brand-colored primary nav (~50px)** with **utility CTAs** (पात्रो highlighted)  
3. **Trending topic pills** under nav (live topics, not static hub labels)  
4. **~1250px content stage** with hairline section bands  
5. **Utilities as a product** on a **calendar subdomain** with its own chrome

Nagarik Watch currently speaks a different grammar:

1. **Newspaper split hero** (left lead + side rail) that never matches the OK/Ratopati/NepalKhabar feed  
2. **~178px sticky masthead** with 4–5 chrome bands before the first story on mobile  
3. **Topics strip = static hubs** (ताजा / ट्रेन्डिङ / धेरै पढिएको) that compete with bottom nav  
4. **Mid-page module overload** + leftover SaaS spacing / side-stripe list accents (impeccable ban)  
5. **पात्रो on `/patro` under full news chrome**, thin widgets, empty gold/forex states — not a utility hub

**Pitch risk:** a client comparing you side-by-side with OnlineKhabar or Ratopati will score you as “modern CMS demo,” not “Nepali news brand.”

---

## 2. Competitive anatomy (site-by-site)

### 2.1 OnlineKhabar (rank #1) — primary structural reference

**Chrome stack (desktop, top → bottom)**
1. Optional full-bleed interstitial (SKIP) — **do not copy**  
2. Masthead: logo left + leaderboard ad right (~115px band)  
3. Primary nav: `rgb(34, 96, 191)`, ~50px — categories left; **orange पात्रो**, Share Market, Health, EN, profile, hamburger right  
4. Author/columnist avatar strip + search  
5. Stock ticker (“Trending..” + live NEPSE strip)  
6. Ad → content

**Hero / story pattern (verified via CDP)**
- Headlines: **Mukta, ~68px, weight 600, centered, color `rgb(16, 44, 87)`**  
- Red category pill centered above headline  
- Author avatar + comment count under headline  
- Full-width hero image below  
- Repeated as a **vertical centered feed** for top stories (not a 2-col newspaper desk)

**Mid-page after the big feed**
- Multi-column section packs (lifestyle/health carousels, category desks)  
- Dense thumb + headline rows; ads intercalated

**Mobile (~390)**
- Clean header: profile | centered logo + date | hamburger  
- Stock ticker under header  
- Same centered mega-headline feed on dark/light content plane  
- Bottom nav (4): ताजा अपडेट · ट्रेन्डिङ · प्रोफाइल · खोज्नुहोस्  
- Content starts fast; chrome is lean

**Fonts / width:** Mukta; content container ~1248px

**Steal:** chrome thinness, पात्रो CTA weight, centered feed for top stories, mobile bottom IA, utility prominence  
**Skip:** interstitials, ad wall before read, dark content plane as default

---

### 2.2 Ratopati (rank #2) — secondary structural reference + brand-nav twin

**Chrome**
1. Utility top bar: hamburger + BS date | **centered red wordmark block** | Games / Unicode / date converter + account / search / theme  
2. Primary nav ~57px (white or crimson depending on sticky state) — home icon + categories + dropdowns  
3. Right CTAs: **पात्रो**, रेडियो, ग्लोबल, नेपाली  
4. **Grey outline trending topic pills** (स्वास्थ्य, सर्वोच्च, कांग्रेस…) — live topics  
5. Content

**Hero pattern (CDP)**
- Same family as OK: **Mukta ~65px, centered, weight 600**  
- Red category badge → headline → author avatar + timestamp  
- Large image (often above or paired with dark band under image)

**Category page (`/category/news`)**
- Section kicker box (समाचार)  
- **Grid / List view toggle**  
- Lead: large image left + headline + deck right  
- Row of equal thumbs below

**Article**
- Reading column ~420px paragraph measure in some layouts; related present  
- Same chrome persists

**Steal:** centered feed, topic pills, category grid/list toggle, पात्रो as first-class CTA, centered logo lockup option  
**Skip:** Games chrome noise, ad density, dark-mode hero band inconsistency

---

### 2.3 TechPana (rank #3) — tech vertical variant

- Green brand; white nav ~50px; **utility CTAs**: मूल्य सूची · इभेन्ट्स · तुलना  
- Classic **hero image + right rail** (Gadgets list: thumb + headline) — closer to magazine, not mega-feed  
- Container ~1280px; Mukta  
- Shows that vertical portals still put **tools in the nav as colored buttons**

**Steal:** utility buttons as nav citizens; tight thumb+headline rails  
**Skip:** as primary homepage for general news (prefer OK/Ratopati feed)

---

### 2.4 NepalKhabar (rank #4) — confirms the shared grammar

- Blue masthead band with **centered logo**  
- White category nav + Unicode / ENGLISH / archive / search  
- **#hashtag trending row** under nav  
- Content: **64px centered Mukta headlines** in white cards on light grey stage  
- Same mega-headline language as OK/Ratopati

**Steal:** centered logo masthead option; hashtag/trending row; carded centered feed on grey stage  
**Skip:** weak utility CTAs vs OK/Ratopati

---

### 2.5 ArthaKhabar (rank #5) — business density

- Economic IA: Market Watch, Bullion, Vegetable Price as first-class links  
- Proves **live data utilities belong in primary navigation**, not buried in footer  
- Denser lists; less “hero theater,” more board

**Steal:** markets/utilities as nav destinations; honest data boards  
**Skip:** dated WP chrome aesthetics

---

## 3. Shared design language (what “looks right” means)

All five sites (especially #1, #2, #4) converge on:

| Pattern | Spec | Nagarik Watch today |
|---------|------|---------------------|
| Typeface | Mukta Devanagari | Mukta (good) |
| Content max | ~1248–1280px | ~1280 (`max-w-page`) OK |
| Primary nav height | ~50–57px brand bar | Nested in ~178px sticky stack |
| Top story | Centered 64–68px headline + pill + avatar + image | Left-aligned ~42px + side rail |
| Secondary strip | Live topic pills / hashtags | Static hub icons (ताजा/ट्रेन्डिङ…) |
| Utility entry | Colored पात्रो / market buttons in nav | पात्रो present but competing with clutter |
| Section packing | Image+deck desks, tight rhythm | Mixed; mid-page overchoice + sparse bands |
| Mobile first paint | Logo + 1 ticker + story | 5 chrome bands + cookie crushing bottom |
| Utilities | Subdomain hub | `/patro` under news chrome |

**One sentence for the team:**  
If you swap logos on mid-scroll OnlineKhabar / Ratopati / NepalKhabar, the *layout family* still matches. Swap Nagarik Watch’s logo onto those pages and it does **not** match — that is the structural gap.

---

## 4. Nagarik Watch — page-by-page indictment

### 4.1 Global chrome (Masthead / PublicShell / BottomNav)

**Measured (production):** masthead ~178px; `main` starts ~219px; dark theme often active (`data-theme=dark`, true black surface).

**Problems**
1. **Chrome budget blown** — brand row + crimson nav + TopicsStrip + UtilityStrip + BreakingTicker before story. On mobile this is fatal.  
2. **TopicsStrip is the wrong content** — hubs duplicate bottom nav and “what matters” rails. Competitors use **trending topics**.  
3. **Search appears twice** on mobile (masthead + bottom nav).  
4. **Account buried** vs OK’s clear profile affordance.  
5. **Dark-as-default / system dark** fights DESIGN.md light-first reading scene.  
6. **Sticky condensation** hides utilities without teaching where they went.

**Target chrome (desktop)**
```
[ optional thin top: date | Unicode | EN | account | search | theme ]
[ logo lockup                    ] [ optional leaderboard ad ]
[ crimson primary nav ~48–52px: categories … | पात्रो | बजार | ताजा ]
[ trending topic pills — CMS tags, not hubs ]
[ UtilityStrip compact OR fold weather into masthead — not both + ticker + topics ]
[ BreakingTicker only when truly breaking ]
```

**Target chrome (mobile)**
```
[ hamburger | logo centered | search ]
[ horizontal category scroll — crimson ]
[ optional single live strip OR breaking — pick one ]
[ CONTENT ]
[ bottom nav: गृह · ताजा · पात्रो · खोज · खाता ]  // remove duplicate search from top OR from bottom
```

Kill TopicsStrip hubs on mobile. Move hubs into hamburger.

---

### 4.2 Homepage

**What works**
- Hero + आजका अन्य desk idea is editorial  
- SectionBlock desk/mosaic/stack policy is correct direction  
- Token kickers / soft rules better than thick ink bars  

**What fails (client eyes)**
1. **Wrong lead grammar** vs ranked sites — supervisors expect centered mega-feed energy for top stories  
2. **Four “today” choosers** (आजका अन्य + ताजा + मुख्य + धेरै पढिएको) — critique 25/40 still stands  
3. **FeaturedBand** still risks equal-card CMS look mid-scroll  
4. **Side-stripe red bars** on list items (seen mid-page) — impeccable absolute ban  
5. **Lower third** newsletter + recs + history dilutes editorial close  
6. Orphan components (`HomeLiveBoard`, etc.) risk reintroducing duplicate live bands  

**Homepage redesign (structure)**

**A. Opening edition (above fold)** — pick ONE lead system (recommend A1 for pitch parity):

- **A1 — “Portal Feed” (recommended for client pitch):**  
  3–5 top stories as **centered mega-headline blocks** (category pill → 40–52px headline on desktop / 28–34px mobile → meta → image). Cap at 5, then switch to desks.  
- **A2 — Hybrid:** Keep Hero+rail for story #1 only, then 2 centered mega stories, then desks.

**B. After fold**
- Category `SectionBlock` desks only (desk/stack/mosaic)  
- One sticky lens on xl: **either** Latest **or** Most-read (not both)  
- One FeaturedBand max, asymmetric 1+2, labeled  
- Province hub once  
- One conversion module  
- Close with photo/history — not three engagement widgets  

**C. Density**
- Section gap: portal rhythm (`py-6`–`py-10`), not SaaS `py-16+`  
- Every list row: thumb OR deck — never headline-only blank rails  

---

### 4.3 Category / topic / hub pages

| Surface | Now | Target |
|---------|-----|--------|
| Category | CategoryDesk (good) | Keep; add optional grid/list toggle like Ratopati |
| Topic | equal `StoryGrid` | Same desk language as category |
| Hubs (latest/trending…) | Ranked lists | Dense thumb rows; shared `HubIndexHeader` |

**Rule:** One list language across category, topic, province, hubs. No “sparse card grid” for topics.

---

### 4.4 Article page

**Keep:** trust ledger, sticky reader controls, mid-billboard after ~3 graphs, related stories, Option A no paywall.

**Fix**
- Headline: stronger display scale; ensure Devanagari line-height ≥1.2  
- Body measure ~65–75ch (already ~680px intent)  
- Aside “Also read”: dense thumb rows like TechPana gadgets rail  
- Share/react: keep inline (no modal-first)  
- Print styles already present — preserve  

---

### 4.5 Utilities & पात्रो (critical add-on)

#### Is a calendar subdomain good practice?

**Yes — adapt it.** Reasons:

1. **Product separation** — utilities are a different job (check date / gold / convert) than reading news  
2. **Chrome freedom** — utility nav (क्यालेन्डर · बिदा · साइत · पञ्चाङ्ग · सुन · विनिमय · मिति) without 14 news categories fighting for space  
3. **Performance** — cache/CDN independently; news JS not required for patro shell  
4. **SEO** — “nepali patro”, “सुन चाँदी”, date converter queries cluster on the utility host  
5. **Brand extension** — “OK Calendar”, “Ratopati Patro” are remembered products; `/patro` buried under news chrome is not  
6. **Cross-link** — prominent “समाचार” CTA back to main site (both calendars do this)

**Recommended hosts**
- Primary: `patro.nagarikwatch.com` or `calendar.nagarikwatch.com`  
- Keep `/patro` on main as **308 redirect** to subdomain (SEO + bookmarks)  
- Nav पात्रो button always points at subdomain  

#### Ratopati Patro structure (copy this skeleton)

```
[ logo पात्रो ] -------------------- [ रातोपाटी समाचार CTA ]
[ utility primary nav: क्यालेन्डर | शुभ साइत | बिदा | राशिफल | विनिमय | सुन | मिति | … | clock ]
[ breadcrumbs ]

[ LEFT ~25% ]                    [ MAIN ~75% ]
  upcoming festivals               today banner (big day # + BS + AD + tithi + sunrise)
  date converter widget            month grid (BS big, AD corner, Saturday red, today green/brand)
  gold/silver                      colorful utility tile grid (साइत, बिदा, पेट्रोल, तरकारी, राशिफल, EMI…)
  currency                         latest news thumbs
```

#### OK Calendar structure (copy widgets + bottom board)

```
[ thin news links + Login ]
[ blue→purple utility nav ]
[ breadcrumbs ]
[ LEFT: festival tags + upcoming events with countdown ]
[ MAIN: today circle + BS/AD pills + month/year selectors + calendar grid ]
[ BELOW: feature cards Events / Sait / Panchang / Rashifal ]
[ BOTTOM 4-col: Trending news | Gold/Silver table | Currency converter | Date converter ]
[ stock ticker ]
```

#### Nagarik Watch `/patro` today — gaps vs references

| Capability | Ratopati / OK | Nagarik `/patro` |
|------------|---------------|------------------|
| Own chrome / subdomain | Yes | No — full news masthead |
| Utility-only nav | Yes | Thin tabs under news chrome |
| Today banner (day # + AD + tithi) | Rich | Day badge + title only |
| Cell detail (tithi / festival text) | Yes | Mostly dual date only |
| Saturday red / today highlight | Yes | Partial |
| Upcoming events + countdown | Yes | Yes (weaker visual) |
| Date converter in sidebar | Yes | Link out |
| Gold / silver live | Yes | Empty: “समाचार कक्षले दर…” |
| Forex live | Yes | “प्रमाणित दर अहिले उपलब्ध छैन” |
| Color utility tile grid | Strong (Ratopati) | Weak 6-tile strip |
| Panchang / sait / holidays pages | Full IA | Missing or thin |
| News cross-promo | Yes | Latest list exists |
| Add-event / engagement | OK has + | No |

**Empty gold/forex on a pitch demo is fatal.** Either wire live feeds before demo or show last-known stamped rates with honest timestamp — never a blank widget labeled as if the desk forgot.

#### Utility pages (`/utilities/*`, `/market`, `/rashifal`)

- Market board: keep, but style like ArthaKhabar/OK boards (tables, up/down tokens)  
- Rashifal: keep entertainment disclaimer; present as 12-tile grid like OK  
- Converters: workspace + result in brand-tint; sidebar tool nav on desktop; chips on mobile  
- **Do not** reintroduce HomeLiveBoard duplicating UtilityStrip  

---

### 4.6 Auth / saved / trust / footer

- Auth chrome already separate — fine  
- Footer: registration number, Press Council, trust links — keep; declutter columns  
- Cookie banner: on mobile it **covers bottom nav** — shrink to one line + two actions; never block tab bar after first dismiss  

---

## 5. Component blueprint (build these)

### Chrome
1. `MastheadV2` — 2 bands desktop (brand+ad optional / primary nav), 1–2 mobile  
2. `PrimaryNav` — 48–52px; active underline; utility cluster `NavUtilityButton`  
3. `TrendingTopicsStrip` — CMS tags / trending entities (not hubs)  
4. `MobileBottomNav` — 5 items max; no duplicate search  
5. `PatroShell` — subdomain layout; independent header  

### Editorial
6. `MegaStoryBlock` — centered pill + display headline + byline + image (variants: lead / standard)  
7. `DeskSection` — existing SectionBlock, hardened  
8. `DenseStoryRow` — thumb + kicker + headline + deck  
9. `CategoryIndex` — lead split + grid/list toggle  
10. Remove side-stripe accents everywhere  

### Utilities
11. `PatroTodayBanner` — day numeral, BS, AD, tithi, sun times  
12. `PatroMonthGrid` — cell: BS, AD, tithi, festival, Saturday/holiday states  
13. `UpcomingEventsList` — date chip + title + days-left  
14. `UtilityTileGrid` — 8–12 colored tiles (structure from Ratopati; Civic Crimson family tones, not rainbow chaos)  
15. `BullionWidget`, `ForexWidget`, `DateConverterWidget` — always show data or last-updated empty state  

---

## 6. Phased delivery (client-pitch oriented)

### Phase 0 — Pitch freeze (3–5 days)
- Force light default for demos; dark remains toggle  
- Collapse masthead height; remove TopicsStrip hubs from mobile  
- Shrink cookie banner  
- Homepage: implement MegaStoryBlock for top 3–5; cut chooser rails to 2  
- Kill side-stripe list accents  
- Patro: fill gold/forex with real or stamped last rates; enlarge today banner  

**Exit:** side-by-side screenshot vs OnlineKhabar no longer embarrassing on mobile first screen.

### Phase 1 — Structural parity (1–2 weeks)
- MastheadV2 + TrendingTopicsStrip  
- Homepage A1 feed + desks  
- Category grid/list; topic pages use desk language  
- Article aside dense rail  

### Phase 2 — Patro subdomain (1–2 weeks)
- Stand up `patro.nagarikwatch.com` (or calendar.)  
- PatroShell + utility nav IA  
- Port calendar grid + widgets + tile grid  
- Redirect `/patro` → subdomain  
- Wire live gold/forex/NEPSE consistently with `/market`  

### Phase 3 — Polish for pitch deck (1 week)
- Empty/loading skeletons matching layouts  
- Mobile QA on mid Android Chrome  
- LCP budget: hero image priority; no interstitial  
- Capture before/after for supervisor  

**Do not** spray cosmetic edits tree-wide. Order: homepage → chrome → category → article → patro subdomain → rest.

---

## 7. Explicit anti-goals

- Do not clone OnlineKhabar blue or Ratopati red as brand fill  
- Do not add interstitials / autoplay / ad between every paragraph  
- Do not ship SaaS hero metrics, glassmorphism, gradient text, identical 3-card features  
- Do not keep four synonym “today” rails  
- Do not leave empty utility widgets on demo day  
- Do not put utility hub under full 14-item news nav forever  

---

## 8. Success criteria (testable)

1. Mobile first viewport: ≤2 chrome bands + story headline visible without scroll past fold chrome  
2. Top stories readable as OK/Ratopati-family **centered feed** (or documented hybrid)  
3. Primary nav ≤56px; पात्रो is the loudest utility CTA  
4. Trending strip shows **topics**, not hub synonyms of bottom nav  
5. Category/topic density matches homepage desks  
6. Patro subdomain loads with today banner + month grid + ≥1 live rate widget + utility tiles  
7. Critique homepage score ≥32/40; no P0 mobile stream/chrome issues  
8. Client blind test: “looks like a Nepali news portal” without being told the brand  

---

## 9. Locked decisions (2026-08-07)

| # | Decision | Choice |
|---|----------|--------|
| 1 | **Lead system** | **A1 — full portal feed** (centered mega-headline blocks for top 3–5, then desks) |
| 2 | **Subdomain** | **`patro.nagarikwatch.com`** (`/patro` → 308 redirect when live) |
| 3 | **Masthead** | **Left logo + ad leaderboard slot** (OnlineKhabar pattern) |
| 4 | **Trending source** | Still open: editorial tags vs automated entities (default to CMS tags until decided) |

---

## 9b. Previously open (resolved above)

~~1. Lead system~~ · ~~2. Subdomain~~ · ~~3. Masthead~~ · 4. Trending source TBD  

---

## 10. Skill / process notes

Applied: `redesign-existing-projects` audit order, `design-taste-frontend` brief inference + dials, `impeccable` PRODUCT/DESIGN context + shape discipline, `nagarik-watch-product` public/reader rules, prior homepage critique (25/40).

Implementation should proceed only after confirmation of §9 — then `impeccable craft` / layout / distill on homepage first.
