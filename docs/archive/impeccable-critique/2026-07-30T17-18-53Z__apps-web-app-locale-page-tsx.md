---
target: homepage / site improve
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 6
p1_count: 6
timestamp: 2026-07-30T17-18-53Z
slug: apps-web-app-locale-page-tsx
---
# Critique: Homepage (`apps/web/app/[locale]/page.tsx`) + site-wide trust/logic

**Mode:** Read (scan + choose stories)  
**Live:** https://www.nagarikwatch.com/  
**Scope:** Homepage design + critical functional/logic findings that erode a news portal

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|------:|-----------|
| 1 | Visibility of System Status | 1 | Live UtilityStrip: "बजार डेटा उपलब्ध छैन"; weather often "मौसम…" |
| 2 | Match System / Real World | 2 | पात्रो and उपयोगी both route to `/utilities` |
| 3 | User Control and Freedom | 3 | Theme/locale/consent work; chrome stack can feel trapping on mobile |
| 4 | Consistency and Standards | 2 | Duplicate section IDs; `/ne/saved` title in English |
| 5 | Error Prevention | 2 | Soft `data:` heroes suppressed → lead often photo-less without explanation |
| 6 | Recognition Rather Than Recall | 3 | Categories help; FeaturedBand untitled except aria |
| 7 | Flexibility and Efficiency | 2 | Desktop sticky rail OK; mobile long duplicate-list scroll |
| 8 | Aesthetic and Minimalist Design | 2 | Same 4–5 stories recycled across rails (inventory theater) |
| 9 | Error Recovery | 3 | Honest market-unavailable copy; article `<title>` often brand-only |
| 10 | Help and Documentation | 2 | Cookie/policy exist; homepage doesn't explain recycled rails / archive band |
| **Total** | | **22/40** | **Acceptable — significant work needed** |

## Design Specificity Verdict

**Start here.** Partially ownable, still swap-ready. Civic Crimson, Devanagari labels, brand underlines, and province strip read Nepali-civic. Composition (lead + Also today + picks + desks + sticky Latest/Brief/Most read) is a portable news skeleton another outlet could rebrand.

**LLM assessment:** Specificity lives in language and tokens more than an unforgettable spatial idea. Live trust is undercut by a dead market strip, thin repeating inventory, and chrome that mislabels destinations.

**Deterministic scan:** `detect.mjs --json` on homepage targets + home components + Masthead + AdSlot + live + `packages/ui` → **0 findings**, exit 0 (38 files walked). Engine sanity-checked with synthetic Inter → overused-font hit. Puppeteer URL scan unavailable (puppeteer not installed). Zero regex hits does **not** mean the product is healthy; detector misses logic, stale cache, duplicate DOM, and failed feeds.

**Visual overlays:** No reliable user-visible overlay. IDE browser MCP could not hold a tab; detect.js injection skipped. Fallback: live HTML/HEAD fetches + `/api/health`.

## Overall Impression

The front page *knows* it is a Nepali news portal, but live it sells chrome confidence while delivering thin repeating inventory and a publicly failed live strip. Behind that, publishing/search/health paths can lie to editors and monitors. Fix status honesty, story uniqueness, and publish→read integrity before more section polish.

## What's Working

1. **Editorial hierarchy, not SaaS** — lead + Also today before commerce; soft brand underlines match DESIGN.md.
2. **Placeholder discipline in UI** — rails suppress `data:` SVG stand-ins instead of giant fake mosaics; no demo poll strings on live homepage.
3. **`/ne` is mostly Devanagari-first** — section titles, nav, consent copy avoid Latin costume; core nav links return 200.

## Priority Issues

### [P0] Dead market strip under the brand
- **What:** UtilityStrip shows "बजार डेटा उपलब्ध छैन" on every visit (also on utilities).
- **Why it matters:** First viewport status looks broken; undermines "live civic reference" and reader trust before any story is chosen.
- **Fix:** Collapse the markets row until NEPSE/forex is real, or show a calm "updated …" empty without a failure banner in the chrome.
- **Suggested command:** `$impeccable harden` (status honesty) / `$impeccable quieter` (remove noisy failure chrome)

### [P0] Story inventory collapse / heavy reuse across rails
- **What:** Same 4–5 stories repeat across lead, secondary, spotlight, latest, brief, most-read.
- **Why it matters:** Scan mode fails; density becomes theater; portal feels like a thin desk.
- **Fix:** Enforce uniqueness in homepage stream allocation; empty a rail honestly rather than cloning the lead set.
- **Suggested command:** `$impeccable distill` / `$impeccable layout`

### [P0] Search never invalidates after publish
- **What:** Search is `force-static`; `revalidatePublishedArticle` omits `/search`.
- **Why it matters:** Primary "did it publish?" check fails until redeploy; editors and readers lose trust.
- **Fix:** Make search dynamic (or revalidate locale search paths on publish).
- **Suggested command:** `$impeccable harden`

### [P0] Health API fails intentional JSON + Postgres production
- **What:** `/api/health` → HTTP 503 `degraded`; `configuration: fail` for `content=json; storage=postgres`. Commit `5f9b9e7c5722`. DB pass ~1.7s latency.
- **Why it matters:** Monitors scream while desk is the intended path; ops may "fix" by flipping Payload and reintroducing split-brain.
- **Fix:** Align health with real CONTENT_SOURCE policy; fail only on true misconfig.
- **Suggested command:** `$impeccable harden`

### [P0] Desk vs Payload split-brain + lying publish hints (latent)
- **What:** When Payload is canonical, admin desk still writes json-store and can claim `visibility: public`.
- **Why it matters:** Classic newsroom killer: desk says live, public never shows the story.
- **Fix:** Block/redirect admin writes when Payload is canonical; never claim public for shadow store.
- **Suggested command:** `$impeccable harden`

### [P0] Empty DB auto-seeds published "edition" as real news
- **What:** Empty Postgres inserts seed articles as `workflowStage: 'published'`.
- **Why it matters:** Readers cannot tell demo from reporting; violates no-fake-inventory product rule.
- **Fix:** Gate seed behind explicit env; never auto-publish seed in production.
- **Suggested command:** `$impeccable harden`

### [P1] पात्रो → `/utilities` (same as उपयोगी)
- **What:** Masthead calendar label shares utilities destination.
- **Why it matters:** Wrong mental model; teaches chrome is unreliable.
- **Fix:** Point पात्रो at a real calendar/patro surface, or remove/rename the label.
- **Suggested command:** `$impeccable clarify`

### [P1] Duplicate mobile + desktop rails (duplicate element IDs)
- **What:** `latest-rail-title`, `today-in-brief`, `most-read-title` appear twice in homepage HTML.
- **Why it matters:** A11y failure, extra bytes on flaky data, screen-reader noise.
- **Fix:** Single DOM with CSS visibility, or distinct IDs + one landmark set.
- **Suggested command:** `$impeccable adapt` / `$impeccable optimize`

### [P1] Article / hub document titles weak or English-bleed
- **What:** Many article `<title>` values stay brand-only while H1/og:title are correct; `/ne/saved` title "Saved stories".
- **Why it matters:** Share tabs and social chrome look unfinished; locale bleed.
- **Fix:** Metadata title = headline + brand; localize saved/utilities titles.
- **Suggested command:** `$impeccable clarify`

### [P1] Author/topic/static hubs + thin Payload webhook revalidate
- **What:** Many hubs `force-static`; webhook skips most-read/trending/author/topic.
- **Why it matters:** Fresh publish invisible on profile/topic/ranking pages.
- **Fix:** Align revalidate parity; dynamic where CF static export can't purge.
- **Suggested command:** `$impeccable harden`

### [P1] Postgres read failure → empty public inventory
- **What:** Production DB errors return `{ articles: [] }` instead of failing loud.
- **Why it matters:** Looks like mass-unpublish, not outage.
- **Fix:** Serve 503 / honest outage UI; don't succeed with empty corpus.
- **Suggested command:** `$impeccable harden`

### [P1] `/en` lang vs Nepali body; hub hreflang always advertises `en`
- **What:** English locale can serve Nepali body with `lang="en"`; hubs claim EN alternates without editions.
- **Why it matters:** A11y/SEO/trust mismatch.
- **Fix:** Reflect actual content language; only emit hreflang when English exists.
- **Suggested command:** `$impeccable harden`

### [P2] House-ad shells without creatives; bookmarks fail-open empty; scheduled publish without cron
- House mode empty → dashed media-kit shells; bookmarks API errors → `[]`; scheduled stays dark without `CRON_SECRET`.
- **Suggested command:** `$impeccable harden`

## Persona Red Flags

**Nepali mobile reader (mid-range Android, flaky data):** Tall sticky chrome + BottomNav + consent; duplicate DOM weight; dead market row wastes above-the-fold trust; recycled headlines waste scroll.

**Diaspora / English switcher:** Structure mirrors (good), but English titles on Nepali saved, Latin newsletter placeholder (`you@email.com`), and EN pages that may still be Nepali body undermine "we took English seriously."

**Journalist / editor (desk):** Footer login exists; latent Payload/json split-brain and fake visibility hints; search doesn't show new publishes; health 503 on intentional json; seed-as-real on empty DB. Not a newsroom they'd proudly send sources to until harden lands.

## Minor Observations

- No active पाठक मतदान on live (correct gating).
- Ad slots collapsed (clean) but zero honest house texture.
- FeaturedBand visually untitled.
- संग्रहबाट admits archive fallback — honest, still filler when corpus is young.
- Newsletter privacy uses सदस्यता — easy to confuse with membership on Option A free site.
- Article SSR sometimes thin on `<img>` vs homepage.
- Deprecated `HomeLiveBoard` still has `showMock = true` if remounted.
- Detector clean ≠ product healthy.

## Questions to Consider

1. If three rails show the same five stories, is density 7 or inventory theater?
2. Why keep a Markets strip that mostly announces failure instead of collapsing until data is real?
3. Should पात्रो exist as a label if it does not open a calendar?
4. Would removing desktop duplicates from the mobile DOM cut more bytes than another CSS pass?
5. Is a lead without a photograph still a front page, or a wire brief in portal costume?
6. Should `/api/health` ever 503 when the desk is intentionally on json + Postgres?
