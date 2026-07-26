# AGENTS.md — Nagarik Watch

Guidance for coding agents working in this repo. Product truth lives in `PRODUCT.md`;
visual system in `DESIGN.md`; public vs staff rules in
`.cursor/skills/nagarik-watch-product/SKILL.md`.

## What this product is

Nepali, Devanagari-first **news portal** (नागरिक वाच). Readers are intellectuals and
citizens scanning for credible information. Surfaces must feel **informative and packed**,
not like a minimal SaaS landing page.

## Design stack priority (frontend)

1. `design-taste-frontend` (anti-slop) — then
2. `nagarik-watch-product` — then
3. `DESIGN.md` tokens (Civic Crimson, Mukta + Noto + Source Sans 3)

Never name competitor portals in UI copy or code comments.

## Active redesign program (2026-07)

Work **one surface at a time**. Current focus: **homepage**, then section indexes, then
article. Do not spray cosmetic edits across the whole tree in one pass.

### Homepage goals

- Dense, structured multi-column packing (density dial ≈ 7).
- Latest / ताजा: thumbnail + headline + short deck + category/dateline.
- Soft section separators (hairline `rule` + short brand title underline), not full-width
  heavy ink bars.
- Nepali labels: no Latin uppercase + wide letter-spacing costume.
- Polls: real editorial questions only; gate demo/placeholder content from public UI.
- One live/reference band; do not duplicate weather/NEPSE/forex in strip + card grid.
- Mukta for Devanagari display; Noto for body; Source Sans 3 for Latin UI.

### Explicit anti-goals

- Gallery whitespace and headline-only rails.
- Demo strings (`test`, `demo`, `what is this ?`) on public surfaces.
- Thick `border-ink` page-wide section chops as default.
- SaaS hero / metric / glass patterns on reader pages.

## Engineering guardrails

- Prefer existing stack: Next App Router, Tailwind, `@nagarikwatch/ui` primitives.
- No inline imports. Exhaustive `switch` defaults with `never`.
- Public copy: honest empty states; no fake reader data; no em dashes.
- Monetization Option A: free to read; membership chrome stays behind
  `NEXT_PUBLIC_MEMBERSHIP_PUBLIC`.
- Static / Cloudflare Pages: publish `apps/web/out`, never `.next`. If a page looks
  “HTML only,” check stylesheet 404 / deploy skew before rewriting CSS imports.
- Do not commit unless the user asks.

## Where to edit (homepage)

| Concern | Primary paths |
|---------|----------------|
| Composition | `apps/web/app/[locale]/page.tsx` |
| Latest rail | `apps/web/components/home/LatestRail.tsx` |
| Section headers | `packages/ui/src/SectionHeader.tsx` |
| Story cards | `packages/ui/src/StoryCard.tsx` |
| Polls | `apps/web/components/home/PollOfDay.tsx`, `apps/web/lib/polls-admin.ts` |
| Live reference | `apps/web/components/live/UtilityStrip.tsx`, `HomeLiveBoard.tsx` |
| Tokens / kickers | `apps/web/app/globals.css`, `packages/ui` tokens |
| Fonts | `apps/web/app/fonts.ts` |

## Verification

After UI edits: visual check on mobile + desktop, light + dark. Prefer real CMS content
over mock. Run Impeccable detect when finishing a UI pass:

`node <impeccable-skill>/scripts/detect.mjs --json <changed targets>`
