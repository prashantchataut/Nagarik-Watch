# ADR-006: Ad stack, AdSense start, GAM later; free-to-read, labeled, lazy-loaded

- **Status:** Accepted
- **Date:** 2026-06-18
- **Decision owner:** Founder + Architect
- **Supersedes:** none

## Context

The day-one monetization model is **ad-supported, free to read** (locked decision). No
reader paywall, no membership in v1. The ad stack must therefore fund the newsroom
without poisoning the reading experience (PRODUCT.md principle 4). Constraints:

- Nepali digital ad market: programmatic fills most inventory at low CPMs; **direct sold
  deals** matter for real revenue but require a sales effort and inventory management.
- Reader experience is sacred: no full-screen interstitials, no auto-play video, no popup
  that blocks reading, no ad between every paragraph (PRODUCT.md anti-references).
- Solo-dev + small team → the ad stack must be **low-operational-complexity** at launch,
  with a path to more sophisticated direct sales later.
- Sponsored/native content is allowed but must be **unambiguously labeled** (PRODUCT.md
  success criterion: blind-test distinguishable).

## Alternatives considered

| Option | Pros | Cons |
|, -|, -|, -|
| **AdSense only, forever** | Zero ops; instant | Lowest CPMs; no direct-sold inventory; limited control |
| **GAM (Google Ad Manager) from day 1** | Industry standard; direct-sold + programmatic in one | Heavy setup; complex for a solo dev pre-revenue |
| **Third-party ad network (Taboola/Outbrain)** | Easy revenue | Toxic to UX (widget sprawl, clickbait); off-brand; rejected |
| **Self-built ad server** | Total control | Reinvents the wheel; unjustified |
| **Reader revenue / paywall** | Independent of ad market | Hard in Nepal (low willingness to pay); shrinks reach; out of scope for v1 |
| **No ads / donation only** | Cleanest UX | Unlikely to fund a newsroom; unsustainable as the sole model now |

## Decision

A **phased ad stack**, all under a free-to-read model:

1. **Phase 1 (launch): Google AdSense** in a small, controlled set of labeled slots.
   Lowest setup cost; gets the pipeline (slot components, lazy-load, viewability,
   labeling) built and proven on real traffic.
2. **Phase 4 (monetization hardening): upgrade to Google Ad Manager (GAM)** so we can run
   **direct-sold** campaigns alongside programmatic, with proper forecasting and
   targeting. The reader-side slot components are identical; only the tag/fill logic
   changes behind a unified `AdSlot` component.
3. **Sponsored/native content** as a **distinct content type** in the CMS (not a disguised
   article), with mandatory, visible labeling ("प्रायोजित / Sponsored") at the top and in
   cards, satisfying the blind-test distinguishability criterion.
4. **Ad-block recovery:** a polite, on-brand message asking readers to disable or
   allowlist; no hostile anti-adblock tactics.

## Rationale

- **AdSense first** trades a little CPM for near-zero ops at launch, which matches the
  solo-dev constraint. The work that matters, building `AdSlot`, lazy-load,
  viewability, labeling, reserved sizing to avoid CLS, is identical for GAM, so we don't
  throw anything away when we upgrade.
- **GAM later** unlocks the revenue that actually funds a newsroom (direct-sold,
  higher-CPM inventory), but only after we have the traffic and (ideally) a salesperson.
- **Sponsored as a content type** keeps editorial integrity: sponsored items go through
  the same CMS with a mandatory label field that cannot be hidden, so labeling is
  structural, not an editorial discretion.
- **Reserved ad slot sizes** are non-negotiable for our CLS < 0.1 budget (SPEC.md).
- **No Taboola/Outbrain**, their UX cost contradicts PRODUCT.md's anti-references and
  erodes the trustworthy-brand positioning.

## Consequences

- **Positive:** low-friction launch; clean upgrade path to GAM; editorial integrity
  preserved; reader experience protected by design.
- **Negative:** AdSense CPMs in Nepal are modest → direct sales (Phase 4) is where real
  revenue appears. Sponsored content requires a sales/relationships effort the team must
  plan for.
- **Negative:** ad scripts are third-party and can hurt performance; mitigated by
  lazy-loading, reserved sizes, and sandboxing via headers.

## Trade-offs

Day-one simplicity and UX integrity are prioritised over maximum revenue. The architecture
makes the Phase-4 GAM upgrade additive (a unified `AdSlot` component, slot configuration
in the CMS), so we don't pay a re-platforming cost to graduate from AdSense.

## Open items

- **Ad slot inventory + sizing:** define the canonical set of placements (header
  leaderboard, in-feed, in-article x2, sidebar, footer) and their reserved dimensions
  before Phase 1 (this is a `docs/` artifact: ad-placements.md).
- **Cookie consent:** GAM requires a consent layer; pick a CMP that works for Nepal +
  GDPR-lite (Phase 5, architecture.md §6).
- **Viewability + ad-performance dashboard:** decide whether to use GAM's own reporting or
  build a small internal view.
- **Sponsored content policy:** draft the labeling + disclosure rules in
  `docs/editorial-workflow.md` before selling the first unit.
