# ADR-004: Origin hosting, decision deferred (framework recorded)

- **Status:** Proposed (decision deferred to before Phase 1 deploy)
- **Date:** 2026-06-18
- **Decision owner:** Founder + Architect
- **Supersedes:** none

## Context

Two locked decisions are in tension:

- The **tech stack is Next.js App Router** (SPEC.md), which requires a Node runtime, it
  **cannot run on cPanel/shared hosting**, the kind of hosting most commonly sold by
  Nepal-local providers.
- The **hosting posture is "Nepal-local"** (founder's choice), motivated by latency to
  Nepali readers and local support.

"Local hosting + modern Next.js" is therefore not a single button; it must be resolved
into one of a few concrete shapes. The **edge/CDN layer is Cloudflare by default** but
swappable (ADR-003), so the **origin** is the only open piece: where the Next.js Node
process runs, and where Postgres lives.

The full decision matrix lives in `docs/architecture.md` §4. Summary ("Cloudflare" below
means the default edge/CDN per ADR-003; the origin choice is independent):

| Option | Origin | Postgres | Nepal latency | Ops burden | Cost | Solo-dev fit |
|, -|, -|, -|, -|, -|, -|, -|
| **A** Managed Vercel + default edge | Vercel | Managed (Neon/Supabase) | CDN masks on HIT | ★★★★★ none | $$$ usage | ★★★★★ |
| **B** Nepal VPS (Babal/Vianet/Subisu) + default edge | VPS (Docker) | Self-host on VPS | ★★★★★ origin in-country | ★★ high | $ flat | ★★ |
| **C** Hybrid: managed origin (Vercel) + default edge, Postgres co-region | Vercel | Managed | CDN masks on HIT | ★★★★ | $$$ | ★★★★ |

## Decision

**No final pick yet.** This ADR records the framework and defers the choice to **just
before Phase 1 deploy**, when we can make a cheaper, better-informed decision.

Concretely, the choice will be made by:

1. Running a one-week **latency probe** from Nepali networks (NTC + Ncell, mobile + fixed)
   against a temp Vercel deployment vs a temp Nepal-VPS deployment, measuring TTFB on
   cache MISS (the only case where origin location matters).
2. Confirming the **ops budget** the founder is willing to carry (backups, updates, SSL,
   uptime), if "near zero," Option A/C; if "I'll manage a box," Option B.
3. Confirming any **data-residency** requirement (regulatory or preferential). If Nepal
   residency is required for editorial data, Option B becomes mandatory.

## Interim recommendation (to be confirmed by the probe + ops budget)

**Option A (Managed Vercel + Cloudflare)** as the default, because the solo-dev reality
makes ops burden the dominant constraint, and the Cloudflare CDN serves the hot read path
from edges near Nepal regardless of origin location.

If the latency probe shows Nepali MISS performance is materially worse with a far origin,
**upgrade to Option C (hybrid)**, keep the managed origin, put media on R2 (already
planned), and co-locate Postgres in a region with good connectivity to Nepal.

**Option B (Nepal VPS)** is the right answer only if (a) Nepal data residency becomes
mandatory, or (b) the founder explicitly wants to operate infrastructure and accept the
ops load.

## Why defer (not just pick A now)

- The CDN already serves Nepali readers from nearby edges; origin location affects only
  cache-miss performance, which we can't estimate well without measurement.
- The founder's "Nepal-local" intent may be satisfied by a Nepal-edge CDN presence +
  Nepal domain (`.com.np`) without a Nepal origin, worth confirming before committing to
  the ops cost of Option B.
- Deferring costs nothing: the Next.js app is origin-agnostic; deploy targets are a config
  change.

## Consequences (of deferring)

- **Positive:** the app stays origin-agnostic; we decide with data; no premature lock-in.
- **Negative:** one open item on the launch critical path; must be closed before Phase 1
  deploy (it is the explicit gate for Phase 1).

## Trade-offs

Decision quality over decision speed. The cost of the probe (a week, trivial spend) is
far smaller than the cost of operating an unwanted Nepal VPS for a year, or discovering
latency problems after launch.

## Triggers to force the decision

- Phase 1 deploy gate (hard).
- Any regulatory signal that Nepal data residency is required for online news (force B).
- Founder resolution of ops budget (force A/C).
