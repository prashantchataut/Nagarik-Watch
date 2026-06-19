# Phase 4, Monetization hardening

> Goal: turn the single Phase-1 ad slot into a **real ad business** that funds the
> newsroom without poisoning the reading experience. Upgrade AdSense → GAM, add direct-
> sold inventory, ship sponsored/native content as a labeled type, and give the team a
> view of ad performance.
>
> Governed by planning-and-task-breakdown: vertical slices, S/M tasks (≤5 files),
> acceptance + verification, checkpoints. Reference: ADR-006, editorial-workflow.md §6,
> PRODUCT.md principle 4 (ads never poison UX).

## Overview
Phase 1 proved the `AdSlot` pipeline on AdSense. Phase 4 widens the **inventory**, swaps
the **fill** to GAM (direct + programmatic), adds **sponsored content** as a first-class
labeled type, and installs an **ad-performance view**. Reader-side components stay the
same; configuration + fill logic evolve.

## Architecture decisions active this phase
- ADR-006 (phased ad stack: AdSense → GAM; sponsored as a type; ad-block recovery).
- Cookie consent / CMP is wired in Phase 5; here GAM runs in consent-aware mode
  (consent mode default-deny until the banner ships)., -

## Task list

### Task 4.1: Define canonical ad placements + sizes
**Description:** write `docs/ad-placements.md` (ADR-006 open item) listing every placement
key, its reader label, reserved sizes, lazy-load policy, and where it appears. Encode as
the `AdSlot` collection seed.
- **Acceptance:**
  - [ ] Placements: header leaderboard, in-feed (home), in-article ×2, sidebar (desktop),
    footer, and sponsored rails. Each has a reserved size.
  - [ ] No placement between every paragraph; no full-screen/interstitial/popup.
  - [ ] `AdSlot` collection seeded with these keys.
- **Verify:** review the doc with the founder; render each placement on a staging page.
- **Dependencies:** Phase 1 AdSlot.
- **Files:** `docs/ad-placements.md`, `apps/admin/src/collections/AdSlots.ts`, seed.
- **Size:** M.

### Task 4.2: Migrate fill from AdSense to GAM
**Description:** wire Google Ad Manager as the primary fill behind the same `AdSlot`
component; keep AdSense as a backfill. Lazy-load, reserved sizes, consent-aware.
- **Acceptance:**
  - [ ] GAM tags load lazily; slots fill; CLS unaffected.
  - [ ] AdSense backfills when GAM has no fill.
  - [ ] Ads load only after consent where consent is required.
- **Verify:** Lighthouse CLS still < 0.1 with full inventory; observe fills in GAM.
- **Dependencies:** 4.1, GAM account.
- **Files:** `apps/web/components/ad-slot.tsx`, `apps/web/lib/ads.ts`, AdsConfig global.
- **Size:** M.

### Task 4.3: Direct-sold / house / sponsorship line items
**Description:** support direct-sold and house (self-promo) campaigns via GAM line items
+ the `AdSlot.targeting` fields (category/tag/locale), so a sponsor can buy, say, "all
sports pages for a week."
- **Acceptance:**
  - [ ] A direct line item targets a category and renders in the right slots.
  - [ ] House promos fill otherwise-empty inventory.
- **Verify:** create a test line item; confirm targeting + delivery.
- **Dependencies:** 4.2.
- **Files:** GAM setup (out of repo), `AdSlot.targeting` usage in components.
- **Size:** S.

### Task 4.4: Sponsored content type end to end
**Description:** implement `SponsoredContent` (content-model.md §8): inherits the Article
model, hard-sets `isSponsored=true` (read-only), mandatory `sponsor` + optional logo/URL,
and a `SponsoredBadge` rendered on the card, page header, and sponsored rails.
- **Acceptance:**
  - [ ] Creating a SponsoredContent requires the sponsor field; `isSponsored` cannot be unset.
  - [ ] Badge is unmissable; blind-test distinguishable (SPEC.md criterion).
  - [ ] Sponsored items **excluded** from breaking ticker, most-read, and lead hero.
- **Verify:** blind review with the founder: can they tell sponsored from editorial in 3
  seconds on a category page? They must.
- **Dependencies:** Phase 2 workflow.
- **Files:** `apps/admin/src/collections/SponsoredContent.ts`, `apps/web/components/sponsored-badge.tsx`, exclusion filters.
- **Size:** M.

### Task 4.5: Sponsored rails on home + category
**Description:** dedicated, clearly labeled sponsored rails ("प्रायोजित") on the home and
category pages, fed only by `SponsoredContent`.
- **Acceptance:**
  - [ ] Rails render only when sponsored items exist; labeled at the rail and item level.
  - [ ] No sponsored item appears in editorial rails.
- **Verify:** seed a sponsored item; confirm it appears only in the sponsored rail.
- **Dependencies:** 4.4.
- **Files:** `apps/web/components/sponsored-rail.tsx`, home/category wiring.
- **Size:** S.

### Task 4.6: Ad-block recovery (polite)
**Description:** a non-hostile message asking ad-block users to allowlist or fund via
newsletter/support; no anti-adblock warfare. Replaces blocked slots with a house message.
- **Acceptance:**
  - [ ] Ad-block users see a polite, on-brand message, not broken slots.
  - [ ] No hostile lockout or nag loops.
- **Verify:** enable an ad blocker; observe the message.
- **Dependencies:** 4.2.
- **Files:** `apps/web/components/ad-slot.tsx` (fallback), message component.
- **Size:** S.

### Task 4.7: Ad-performance dashboard
**Description:** an internal view (admin-only) surfacing fill rate, viewability, revenue
(by placement/category), pulling from GAM reporting. Plausible/GA4 for reader-side engagement.
- **Acceptance:**
  - [ ] Dashboard shows per-placement and site-wide metrics, refreshed daily.
  - [ ] Accessible only to `admin`/`publisher`.
- **Verify:** compare dashboard numbers to GAM's own UI for sanity.
- **Dependencies:** 4.2.
- **Files:** `apps/admin/src/views/AdsDashboard.tsx`, GAM reporting integration.
- **Size:** M.

### Task 4.8: Viewability + lazy-load tuning
**Description:** tune lazy-load thresholds and slot sizing for viewability (ads lazy enough
not to hurt perf, eager enough to count as viewable). Reserve sizes rigorously.
- **Acceptance:**
  - [ ] Viewability rate improves vs Phase-1 baseline without regressing LCP/CLS.
  - [ ] No slot causes layout shift on load or fill.
- **Verify:** before/after Lighthouse + GAM viewability over a week.
- **Dependencies:** 4.2.
- **Files:** `apps/web/components/ad-slot.tsx`, intersection-observer tuning.
- **Size:** S., -

## Checkpoint: Phase 4 → Phase 5 gate
- [ ] GAM live with direct + programmatic; AdSense backfilling.
  - [ ] Sponsored content shipped; blind-test distinguishable.
- [ ] No UX regression: Lighthouse budgets still green; no interstitials/popups.
- [ ] Internal ad dashboard usable by the founder.
- [ ] Founder + (if present) sales lead review the inventory + rate card process.

## Risks this phase surfaces
| Risk | Mitigation |
|, -|, -|
| GAM setup is complex for a solo dev | Treat as a focused, time-boxed task; lean on Google's docs; keep AdSense as fallback until GAM is verified |
| Sponsored content erodes trust if mislabeled | Structural labeling (read-only flag) + editorial policy + blind-test gate |
| Ad density creeps up over time | Quarterly UX review against PRODUCT.md anti-references |
| Low direct sales without a salesperson | Direct sold is aspirational at first; programmatic funds day-to-day; revisit when traffic justifies a hire |
