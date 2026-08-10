---
timestamp: 2026-07-29T17-04-36Z
slug: apps-web-app-locale-page-tsx
---

# Homepage critique — apps/web/app/[locale]/page.tsx

**Mode:** Read (news portal scan)
**Date:** 2026-07-29
**Heuristic score (pre-fix):** ~25/36

## Verdict

Strong front-page lead + also-today composition and DenseStoryItem density. Mid-scroll ranking vocabulary collided (विशेष / मुख्य समाचार / आजका अन्य / ताजा / धेरै पढिएको all felt equally “must read”). Compact LatestRail dropped decks. Mobile buried ताजा after the full category stream. home-top ad sat above the lead.

## Fixes applied this pass

1. **Ranking grammar:** Spotlight → सम्पादकीय चयन / Editor's picks. FeaturedBand → quiet hairline pack, no “मुख्य समाचार” peak (aria: थप चयन / More picks).
2. **Latest density:** Compact LatestRail restores short deck (line-clamp-1 when compact).
3. **Mobile order:** LatestRail surfaces after spotlight, before category stream; Brief/Most-read stay at bottom on small screens.
4. **Commerce:** home-top AdSlot moves below front-page lead + also-today.

## Residual / next

- Visual verify on live localhost (was unreachable during assessment).
- Watch FeaturedBand cadence so quiet packs still feel intentional, not invisible.
- Optional: further distinguish Most-read vs Latest chrome if still competing after label pass.
