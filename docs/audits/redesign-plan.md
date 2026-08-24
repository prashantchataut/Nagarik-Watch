# Nagarik Watch — Full-Site Redesign Plan (2026-08-24)

Audit basis: 29 full-page captures of production, reviewed against DESIGN.md
(density 7, variance 7, packed broadsheet), PRODUCT.md trust rules, and
impeccable/ui-ux-pro-max laws. Scores are design quality /10.

## Verdict

The site is three templates wearing 40 URLs: one competent article page (6.5),
one decent utility page (patro, 6), one acceptable listing family (tag, 5),
and everything else is either a bare sentence above a void, a monotonous
hairline-row list, or a broken route. The failure is architectural, not
cosmetic: there is no fallback-composition system, no listing-family template,
and no styled empty-state language for data modules.

---

## WAVE 0 — Credibility blockers (ship before any redesign)

These make the site feel broken regardless of design quality.

| # | Item | Evidence | Fix |
|---|------|----------|-----|
| 0.1 | Cookie consent modal occludes content on 13/14 pages | Covers list rows, preeti's primary CTA, utilities items 05+07, footers | Rebuild as bottom-anchored banner (or corner card), z-index below nav, dismissal persists |
| 0.2 | /membership returns 404 | Live capture | Ship gated membership page (tiers, benefits, FAQ) or a composed "सदस्यता आउँदैछ" capture page. Never 404 |
| 0.3 | /archive returns 502 | Live capture | Restore route; add to Wave 2 rebuild |
| 0.4 | Author page crashes to unstyled Times error | /author/nagarik-watch-desk | Fix the thrown fetch; error boundary must inherit full chrome, Nepali-only |
| 0.5 | /nepse crashes on client navigation | Capture failure: "execution context destroyed" | Diagnose RSC/navigation error |
| 0.6 | Raw debug strings on public UI | disaster-alerts shows literal "empty"; live-scores shows "Football provider is not configured" | Provider/config errors render as designed "आउँदैछ" plates, never raw text |
| 0.7 | Error templates broken | "40"/"4" and "50"/"0" numeral wrap; English leakage | Numeral nowrap + fluid size; Nepali-first error copy; full chrome |
| 0.8 | Broken copy | "फिंड" transliteration; duplicate "लोड गिरएको छैन" boxes on patro; market "उपलब्ध छैन" bare cells | Copy sweep of all data modules |
| 0.9 | Broken white thumbnails in patro ताजा strip | Capture | Media pipeline: never render empty thumb boxes (same policy as homepage fix) |

## WAVE 1 — Shared systems (build once, apply everywhere)

| # | System | Spec |
|---|--------|------|
| 1.1 | **Listing family** (the tag-page template, codified) | Lead package (image+deck) → 2-col secondary grid WITH thumbs → fallback band pulling desk-adjacent stories so N<6 still fills the page. Persistent right rail ≥1024px: most-read 5, poll, newsletter, section nav |
| 1.2 | **Holding-page system** (for empty desks) | Composed, never a bare sentence: editor note card + 6 evergreen stories from sibling desks + archive strip + subscribe CTA. One component, per-desk config |
| 1.3 | **Data-module empty language** | Styled plates for "no data": icon + label + source/timestamp chrome + last-known-good value when available. Kills bare "उपलब्ध छैन" cells everywhere (market, widgets, live-scores) |
| 1.4 | **Rail system** | Right rail module set (most-read, live reference, poll, newsletter, tags) that pages compose; a page may not ship a rail with <3 modules |
| 1.5 | **Widget row rule** | Cards with no data collapse out; a widget band never renders >2 apology cards (election page shows 4) |
| 1.6 | **Stray-rule bug** | Double hairline under page intros (submit-story, utilities) — one shared header component |

## WAVE 2 — Page-by-page rebuilds

### Tier A — High-traffic index pages

| Page | Score | Rebuild |
|------|-------|---------|
| /latest | 4 | 12-col: lead package (7-col, thumb+deck) → 3-col thumb mosaic (items 4-12) → 2-col compact tail. One card anatomy, three size tiers. Persistent rail. Kill mixed thumb/no-thumb anatomy |
| /trending | 4 | Own identity: top-3 ranked package (#1 large, #2-3 half-width) → dense 2-col ranked grid. Rename H1 ("ट्रेन्डिङ") — currently duplicates most-read's title |
| /most-read | 4 | Ranked board: #1 full-width lead card, #2-5 as 2×2 mosaic with rank chips + read-count meta, #6-15 two-column compact. Rail: 24-hour stats module |
| /columns | 4 | Author-first: lead column package (large image + author block) → columnist roster band (portrait/monogram chips) → 3-col column cards with avatar + name + column title + per-author archive. 12-15 items minimum |
| /search | 4 | 2-col: result cards (thumb, kicker, headline, deck) + rail (related tag chips, trending searches). Filter chips under input. Empty state: desk links + latest 5. Kill the gray "NW" placeholder tile and off-palette blue clear button |
| /tag/* | 5 | Codify as the 1.1 template (it is already the best listing); add tag header furniture: story count, related-tags row, follow action |

### Tier B — Product/utility pages (currently dead ends)

| Page | Score | Rebuild |
|------|-------|---------|
| /market | 2 | Proper board: NEPSE index card (delta arrows, gainers/losers mini-table), bullion/forex table with source+timestamp chrome, currency converter, market news strip. Styled empty states per 1.3. Fix "फिंड" copy |
| /patro | 6 | House-style benchmark. Fix: broken thumbs, merge duplicate चाडपर्व/बिदा boxes into one dated-rows module, close calendar grid with tinted adjacent-month cells, upgrade sidebar cards |
| /epaper | 2 | Product page: today's front-page thumb (or designed "आउँदैछ" plate), 7-day date navigator as page thumbs, subscribe card, archive grid |
| /rashifal | 2 | 12-cell rashi mosaic (glyph, name, 2-line prediction, lucky color/number), BS date band with हिजो/आज/भोलि tabs, yesterday-fallback when feed missing. Rail: पात्रो widget + मिति रूपान्तरण |
| /live-scores | 2 | Kill provider error strings → scorecard plates. Live/featured match plate + fixtures/results tabs + 3-col खेलकुद news grid as content floor |
| /election | 4 | Collapse 4 empty widgets (rule 1.5), hero + 2-col story stack (min 6, politics fallback), explainer module, results-when-live plate |
| /data-stories | 1 | Holding state must be data-flavored: "यो हप्ताको तथ्याङ्क" module pulling NEPSE/weather/AQI the site already has + chart plate + archive links |
| /disaster-alerts | 2 | Kill "empty" string. Status banner (green "कुनै सक्रिय सूचना छैन"), emergency contacts grid (प्रहरी १००…), USGS recent-quakes table, preparedness checklist |
| /photos | 2 | Never empty: fallback image-led grid from latest stories ("हप्ताको चयन"). Launched: 1 hero + 4-tile mosaic + filmstrip |
| /video | 2 | Poster-frame placeholder module + channel card + thumbs strip. Launched: featured player + 2×3 grid with duration badges |
| /newsletter/archive | 2 | Value-pitch hero + email capture + "के आउँछ" module + issue-card grid. The one conversion this page exists for is currently missing |
| /membership | 1 (404) | See 0.2 — tiers band, benefits grid, FAQ, value pitch, gated behind NEXT_PUBLIC_MEMBERSHIP_PUBLIC |
| /team | 2 | Masthead grid: editor band with portraits/monograms, desk cards listing reporters with author links, corrections/ethics contact cards |
| /utilities | 3 | 2×4 tool-card mosaic with icon + live teaser value (NEPSE level, gold price, USD rate). Kills the invisible-items problem |
| /preeti | 4 | Standard utility template: sticky tool rail, side-by-side panes, visible action row, sample text, 3-col "अरू उपकरण" band below |
| /reader-corner | 4 | Compose as 3-column dashboard (stats+streak | personalization | alerts), seed or hide empty modules, fix clipped teasers, single CTA strip |
| /submit-story | 4 | 2-col: form + "कसरी काम गर्छ" rail (3-step flow, SLA, good-tip examples, published reader stories). Kill stray rule |
| /how-recommendations-work | 5 | 4-step horizontal diagram band, signals/guardrails as icon card grids, notification stats as 4-cell mosaic, one worked example |
| /archive | 1 (502) | Restore (0.3), then: BS/AD date browser, filter row, dense result grid, pagination |
| /author/* | 1 (crash) | Fix crash (0.4), then: header band (monogram, name, role, beat, story count) + dense article grid + related-author chips |

### Tier C — Article page upgrades (6.5 → 9)

1. Sticky left share/save/listen/text-size rail appearing after hero scroll
2. Ad system placement: below-byline leaderboard, mid-body native after section 2, rail 300×250, post-article band (the monetization engine currently earns nothing)
3. Byline block upgrade: avatar/monogram, linked author, beat, date+read-time second line
4. Align hero image to headline measure (three different right edges today)
5. Keep everything else — this is the site's template

## Execution order

1. Wave 0 (0.1-0.9) — ~1-2 sessions
2. Wave 1 systems (1.1-1.6) — ~2-3 sessions
3. Wave 2 Tier A — ~2 sessions
4. Wave 2 Tier B — ~4-5 sessions
5. Tier C article upgrades — ~1 session

Each wave ships behind the existing verify gates + a fresh screenshot audit
against this plan's scores.
