# Nagarik Watch critical hardening plan

Date: 2026-07-04

## Audit verdict

Nagarik Watch has a serious product direction, but the public site must not expose unfinished identity, route drift, provider scaffolding, or placeholder media. The hardening pass focuses on reader trust first, then utilities, then design polish.

## Competitor lessons applied

- Ratopati and Onlinekhabar condition Nepali readers to expect practical utilities near the news experience: date tools, calendar, market, rashifal, province sections and quick latest lists.
- Setopati demonstrates that a calmer editorial surface can still be dense when opinion, multimedia, blogs and feature stories are clearly separated.
- Nagarik Watch should compete on trust, source clarity, restrained density, mobile reading quality, and a civic Devanagari-first identity rather than copying clutter.

## Shipped in this pass

### 1. Brand and logo

- Replaced the older boxed eye mark with a sharper mountain-eye symbol inspired by the supplied brand board.
- Added a more usable horizontal lockup with Devanagari/Latin wordmark support.
- Regenerated SVG favicon, PNG icon, Apple icon and Open Graph image.
- Kept the mark in the Civic Crimson/navy/gold family without copying the supplied image exactly.

### 2. Public trust surface

- Removed public pending-registration exposure from the footer.
- Removed placeholder legal identity from publication config.
- Made legal name, editor, registration number and phone render only when environment values are real.
- Rewrote trust pages to be reader-facing policies rather than launch notes.
- Removed fake social links.

### 3. Hub-page hardening

- Removed the public production-integration note.
- Replaced uniform hub grids with a stronger editorial hierarchy: lead story, side rail, then compact/text-led follow-ups.
- Reworked reader-submission flow as a real newsroom process with a contact path.
- Utility hubs now pass locale to live widgets.

### 4. Live utility widgets

- Replaced old public mock-data widget rail with the provider-aware live-data layer.
- Weather and AQI use Open-Meteo; forex uses Nepal Rastra Bank when reachable; NEPSE uses best-effort public source; bullion remains clearly approximate.
- Hidden fallback badges remain controlled by `NEXT_PUBLIC_SHOW_MOCK_BADGE`.
- Public source strings are sanitized so readers do not see raw implementation language.

### 5. Video and photo pages

- Removed fake video cards and generated photo placeholders.
- Video page now surfaces only articles that actually contain video/embed blocks.
- Photo page now surfaces only articles with image material.
- Empty states are honest and reader-facing.

### 6. Newsletter honesty

- Footer newsletter now calls the real subscribe API.
- Production returns a 503 when a newsletter provider is not configured instead of pretending to send email.
- UI reports unavailable state instead of demo success.

### 7. SEO and deployment truth

- Centralized site URL usage around `SITE_URL` so production no longer needs to fall back to localhost in multiple surfaces.
- `llms.txt` no longer prints `DoIB: pending`; it emits registration only when configured.
- Added a launch verification script that fails on public scaffold/demo/mock/pending leakage.
- CI now runs public-surface audit, web build and DB tests in addition to existing format, lint, typecheck and unit tests.

## Remaining blockers before claiming launch-complete

1. Install dependencies and run the full verification gate.
2. Set production environment variables for final domain, database, auth secret, Payload content source, storage, newsletter provider and registration.
3. Deploy the patched repo and verify live routes.
4. Replace approximate bullion data with a licensed/updateable source or make the admin override path explicit.
5. Add real newsroom content and author-reviewed English only where ready.
6. Run mobile checks at 375px, 390px and 768px.
7. Run Lighthouse/Core Web Vitals on the deployed site.

## Verification commands

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm audit:public
pnpm --filter @nagarikwatch/web build
pnpm --filter @nagarikwatch/db test
```

The local container could run `node scripts/audit-public-surface.mjs`, but dependency-based pnpm commands were blocked because Corepack could not download pnpm from the npm registry in this environment.

## Skills used by workstream

- Critical audit and repo slicing: impeccable audit, design-anti-slop, karpathy-guidelines, incremental-implementation.
- Brand and logo work: logo-design, impeccable brand/craft/polish, frontend-design.
- Public trust and copy: impeccable clarify, seo-audit, accessibility-audit.
- Live widgets and page hardening: nextjs-developer, performance-optimization, accessibility-audit.
- Verification and CI gates: verification-before-completion, test-master, incremental-implementation.
