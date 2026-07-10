# Nagarik Watch UI/UX and Authentication Remediation

## Applied design method

The redesign follows the repository's `design-anti-slop` and `impeccable` skills, plus the product context in `PRODUCT.md` and `DESIGN.md`.

Principles applied:

- News-first, not SaaS-dashboard aesthetics
- No gradient text, decorative glass, nested cards, side-stripe accents, or identical card grids
- Devanagari-first hierarchy and comfortable line-height
- Civic Crimson used as a functional brand color rather than alarm-red decoration
- Flat newsroom surfaces designed for long editorial sessions
- Strong keyboard focus states, semantic labels, hints, and error messaging
- Separate reader and newsroom identity flows

## Authentication fixes

- Auth singleton now resets after transient initialization failure instead of remaining permanently rejected.
- Boot-account provisioning is non-blocking.
- Boot-role assignment failures are isolated and logged.
- Added the Better Auth catch-all route at `app/api/auth/[...all]/route.ts`.
- Unavailable auth infrastructure returns a controlled 503 JSON response.
- Reader login and sign-up surfaces are separated from newsroom access.

## UI system changes

- Reworked admin primitives into a consistent product UI system.
- Replaced over-rounded generic buttons with compact newsroom controls.
- Added accessible input IDs, hints, labels, focus states, disabled states, status tones, and empty states.
- Added a newsroom-specific layout layer in `globals.css`.
- Removed decorative backdrop blur from the admin header.
- Increased navigation hit areas and clarified active states.
- Rebuilt staff login as a two-register editorial access screen.
- Added a reusable reader authentication shell and reader login/sign-up routes.
- Added privacy and expectation-setting copy to reader account screens.

## Archive recovery note

The source ZIP had all directory paths stripped and contained many duplicate filenames. The project in this delivery was reconstructed using TypeScript build metadata hashes, import paths, package manifests, and source inspection. It is materially more complete than the earlier recovery, but the archive still did not contain every route in a directly recoverable form.

## Verification limitation

Dependency installation and a full Next.js build could not be executed because this environment could not reach the npm registry and had no preinstalled pnpm cache. Source-level checks and targeted file verification were completed. Run the following in a networked environment:

```bash
pnpm install --frozen-lockfile
pnpm --filter @nagarikwatch/web typecheck
pnpm --filter @nagarikwatch/web lint
pnpm --filter @nagarikwatch/web build
pnpm --filter @nagarikwatch/web dev
```

Then verify reader sign-up, reader login, staff login, role gating, mobile navigation, keyboard navigation, and error states in Playwright.
