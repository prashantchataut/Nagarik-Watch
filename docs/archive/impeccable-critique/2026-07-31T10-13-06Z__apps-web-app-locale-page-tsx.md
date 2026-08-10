---
target: homepage
total_score: 25
max_score: 40
na_heuristics:
p0_count: 1
p1_count: 2
timestamp: 2026-07-31T10-13-06Z
slug: apps-web-app-locale-page-tsx
---

# Critique: Homepage (`apps/web/app/[locale]/page.tsx`)

**Mode:** Read (scan + choose stories)  
**Design read:** Nepali Devanagari-first front page for mid-range Android scanners; Civic Crimson + Mukta packing at density ≈7 — editorial news rhythm, not a SaaS landing.

## Design Health Score

| #         | Heuristic                       |     Score | Key Issue                                                                                |
| --------- | ------------------------------- | --------: | ---------------------------------------------------------------------------------------- |
| 1         | Visibility of System Status     |         3 | Breaking ticker + datelines help; condensed masthead hides utilities without explanation |
| 2         | Match System / Real World       |         3 | Nepali desk language fits; "Editor's picks" / "More picks" feel CMS-exported             |
| 3         | User Control and Freedom        |         3 | Easy exits via nav; sticky sidebar + marquee compete for attention                       |
| 4         | Consistency and Standards       |         2 | Locale href builders inconsistent; PollOfDay duplicate IDs                               |
| 5         | Error Prevention                |         3 | Poll/newsletter validation OK; no guard against over-tagging breaking                    |
| 6         | Recognition Rather Than Recall  |         2 | Four overlapping "today importance" rails force re-parsing                               |
| 7         | Flexibility and Efficiency      |         2 | Focus exists; no strong shortcuts; crowded nav overflow                                  |
| 8         | Aesthetic and Minimalist Design |         2 | Soft rules good; module count + equal FeaturedBand trios compete                         |
| 9         | Error Recovery                  |         3 | Poll/newsletter errors clear; empty edition honest                                       |
| 10        | Help and Documentation          |         2 | Recs explain link exists; poll/newsletter microcopy light                                |
| **Total** |                                 | **25/40** | **Acceptable**                                                                           |

## Design Specificity Verdict

**Start here.** Mostly authored for Nagarik Watch, not fully ownable yet.

**LLM assessment:** Lead composition (Hero + आजका अन्य + soft brand underlines + desk/mosaic/stack SectionBlock + Devanagari-aware kickers) is Civic Crimson portal craft. Mid-scroll still reads like a generic news-CMS module conveyor: unlabeled equal FeaturedBand trios, four near-synonym "what matters today" lists, then newsletter + recs + history. Swap the logo and a mid-page stretch could belong to another modern portal theme.

**Deterministic scan:** `detect.mjs --json` on homepage + home components + Masthead + TopicsStrip + UtilityStrip + SectionHeader + StoryCard → **0 findings**, exit 0. Clean mechanical scan does not clear UX overchoice, mobile stream order, or duplicate IDs.

**Visual overlays:** No reliable user-visible overlay. Browser MCP tabs did not persist for navigate/mutation; local Next on :3000 hung, :3010 Ready but `/[locale]` render errors (`ArrayBuffer is not detachable`). Production `https://www.nagarikwatch.com/ne` returned HTTP 200 (non-MCP). Live-server never started.

## Overall Impression

The front peak is credible Nepali portal craft. The single biggest opportunity is cutting **module packing** (too many chooser widgets) so **story packing** (desks after the lead) can breathe — especially on mobile, where Latest burns attention before category desks arrive.

## What's Working

1. **Lead composition** — Hero text-then-photo + आजका अन्य hairline stack + short brand underline reads as a real edition, not a SaaS hero.
2. **SectionBlock layout policy** — desk/stack/mosaic with `data:` photo rejection and no sparse empty columns matches AGENTS anti-goals.
3. **Token discipline** — Civic Crimson kickers, Mukta display, soft `border-rule`, Devanagari kicker exceptions (`.category-pill[lang='ne']`, `.section-kicker:lang(ne)`).

## Priority Issues

### [P0] Mobile stream order: LatestRail before category desks

- **What:** On `<xl`, DOM dumps Latest (up to 8) before SectionBlock desks.
- **Why it matters:** Primary Android-4G persona scans desks after the lead; a long Latest grid feels like a wire feed and buries desk identity.
- **Fix:** On mobile, render category stream first; keep Latest as xl sticky only, or collapse Latest to ≤4 compact rows after the first desk.
- **Suggested command:** `$impeccable layout`

### [P1] Four overlapping "today" choosers

- **What:** आजका अन्य + ताजा + आजका मुख्य कुरा + धेरै पढिएको all answer the same question.
- **Why it matters:** Extraneous cognitive load; hierarchy credibility drops when lists disagree.
- **Fix:** Keep lead rail + one recency rail + one social-proof rail. Demote or remove Brief _or_ Most-read from the homepage sticky stack.
- **Suggested command:** `$impeccable distill`

### [P1] PollOfDay duplicate `id={`poll-${id}`}`

- **What:** Kicker `<p>` and question `<h2>` share the same id; aria-labelledby is ambiguous.
- **Why it matters:** Invalid HTML; assistive tech confusion on a live interactive module.
- **Fix:** Unique ids (`poll-${id}-label` vs `poll-${id}`); labelledby points at the question.
- **Suggested command:** `$impeccable harden`

### [P2] FeaturedBand equal 3-col thumbs

- **What:** `md:grid-cols-3` equal `thumb="md"` peers; visually unlabeled (`aria-label` only).
- **Why it matters:** Closest on-page match to banned identical feature-card grids; mid-scroll valley feels templated.
- **Fix:** Asymmetric 1+2 stack, or require a soft SectionHeader; never three equal peers.
- **Suggested command:** `$impeccable layout`

### [P3] Lower-third engagement stack

- **What:** Billboard → newsletter → recs → history/photo after desks.
- **Why it matters:** Peak-end rule: end does not earn the open; conversion aftertaste dilutes editorial close.
- **Fix:** Cap to one post-desk conversion module above history/photo; lazy-mount recs.
- **Suggested command:** `$impeccable quieter`

## Persona Red Flags

**Mid-range Android Nepali reader (flaky 4G):** Pays for Latest + Spotlight + mosaic images before desks; sticky xl rail irrelevant; marquee + hover-scale cost for little Read value.

**First-time diaspora scanner:** Brand peak is good; English "Editor's picks" / "More picks" feel productized; equal bands do not teach what this paper stands for beyond the lead.

**Trust-first citizen scanner (PRODUCT primary):** Option A respected (no membership meter). Risk is structural overchoice / cry-wolf hierarchy, not chrome. Rails that strip decks speed scan but starve verification cues.

## Minor Observations

- LatestRail "सबै" and Also-today "ताजा अपडेट" both hit `/latest` — redundant CTAs on xl.
- HomeEmptyEdition still uses `uppercase tracking-[0.18em]` + thick ink border vs soft-rule doctrine.
- Newsletter placeholder `namaste@example.com` feels toyish.
- FromWires / HomeDeskRail deprecated and unmounted — good.
- No UtilityStrip on homepage in current page.tsx — avoids live-band duplication.
- Hero/CategoryLabel href builders vs DenseStoryItem `localizeHref` inconsistency.

## Questions to Consider

1. If you deleted TodayInBrief _and_ MostReadRail from the homepage for a week, would bounce rise — or would category desks finally feel like the paper's spine?
2. Is FeaturedBand quiet mid-scroll packing, or filler when desks cannot sustain rhythm?
3. For the Android-4G reader, is "density 7" currently story packing — or module packing because every CMS widget showed up?
