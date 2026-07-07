# Nagarik Watch v13 implementation report

Scope: second follow-up pass over `nagarik-watch-v12-production-solved.zip`, focused on the exact requested items: desktop secondary nav, mobile account/language access, theme toggle, public copy cleanup, ad infrastructure, media kit, admin ad references, article monetization, empty states, live-data fallback wording, narrator support and audit hardening.

## Repo skill checklists applied

I reviewed and applied the local repo skill guidance from:

- `skills/impeccable/SKILL.md` for UI craft, color, layout, theming and production polish rules.
- `skills/design-anti-slop/SKILL.md` for anti-template copy and generic AI design detection.
- `skills/frontend-design/SKILL.md` for production-grade page/component implementation.
- `skills/accessibility-audit/SKILL.md` for mobile controls, aria labels, `aria-pressed`, touch target and visible navigation checks.
- `skills/nextjs-developer/SKILL.md` for route/component structure.
- `skills/seo-audit/SKILL.md` for language/canonical and public-surface concerns.
- `skills/codebase-auditor/SKILL.md` for registry drift, unmounted components and unfinished wiring.
- `skills/test-master/SKILL.md` for verification checklist and blocked-build reporting.

No external ChatGPT Skill was invoked because the only globally available skill in this environment is `skill-creator`, which is for creating skills, not implementing this app.

## Implemented items

### Navigation and mobile access

- Mounted the desktop `SecondaryNav` inside `Masthead` directly above the primary section nav.
- Fixed the secondary nav hub list to use the existing `sports-live` hub instead of the missing `sports` key.
- Added mobile drawer access to Saved stories, Profile and the Nepali/English language switch.
- Kept the existing top-bar language toggle visible on mobile.
- Rebuilt profile page navigation with profile/saved/login pills and reader shortcut cards.

### Theme toggle

- Reworked `ThemeToggle` to track current theme instead of only the next theme.
- Added `aria-pressed`, screen-reader text and `data-current-theme`.
- Synced `color-scheme` with the selected theme so native controls follow dark/light mode.
- Added storage-event sync so another tab changing theme updates the current tab.

### AI-slop and developer-facing copy cleanup

- Removed user-facing copies of the flagged utility phrase.
- Replaced `Connect provider`, `No live rate`, `Connect FOREX_API_KEY`, and API-key instructions in public UI.
- Replaced public fallback labels such as `Provider fallback` and `Fallback shown` with reader-facing wording: `Verified feed pending`, `Awaiting verified feed`, and Nepali equivalents.
- Changed live widget badge from `MOCK` / `नमुना` to `Feed pending` / `फिड प्रतीक्षामा`.
- Cleaned live-data source labels so they do not tell readers to configure env vars.

### Advertisement infrastructure

- Expanded `apps/web/lib/ads.ts` into a 20-slot registry covering: home, article, category, latest, trending, hub, sidebar, inline, native, mobile and billboard surfaces.
- Added placement metadata: surface, size, dimensions, label, Nepali/English description and page position.
- Added reusable `AdSlot` variants: standard, billboard, rail, inline, native and mobile.
- Updated `AdStack` to use generic sidebar registry keys.
- Added an ad placement key guard for body ad blocks.

### Ad placements wired into pages

- Homepage: top leaderboard, hero rail, billboard, mid leaderboard and sidebar stack.
- Article page: top billboard, automatic inline ad, manual body ad blocks, native related slot, sidebar rectangle and sticky sidebar tower.
- Category page: top leaderboard and native inline placement.
- Latest page: top leaderboard and native inline placement.
- Trending page: top leaderboard and native inline placement.
- Public hubs: top leaderboard and native inline placement.
- Mobile: existing sticky mobile dock now uses the expanded registry.

### Advertise/media kit

- Rebuilt `/advertise` from a generic trust-policy page into a real media-kit/commercial page.
- Added sales contact, commercial principles, featured inventory previews, full placement table and “what we will not sell” boundaries.
- Used live `AdSlot` previews from the same ad registry used by public pages and admin.

### Admin ad references

- Rebuilt `/admin/ads` to group placements by surface.
- Added delivery mode status, credential-pending wording, editor shorthand instructions and placement position references.
- Documented `[ad:article-inline-1]` style body shorthand for editors.

### Article monetization and narrator

- Added a top article billboard between article header and media.
- Changed article content layout into a reading column plus desktop ad rail.
- Added sticky desktop sidebar ad slot.
- Made manual body `adSlot` blocks render real `AdSlot` components instead of returning null.
- Preserved the existing browser Speech Synthesis narrator/listen support and `data-narrator-body` article targeting.

### Empty state and live-data wording

- Rewrote category empty states to say a section remains empty until reviewed newsroom stories are published.
- Updated utility and market fallback copy so unavailable data does not look official or developer-configured.
- Cleaned converter fallback copy to explain that NPR conversion appears when a licensed foreign-exchange feed is enabled.

### Audit hardening

- Strengthened `scripts/audit-public-surface.mjs` to scan public app/components plus live-data labels.
- Added banned patterns for the exact flagged utility phrase, `Connect provider`, `No live rate`, env-var instruction copy, `Provider fallback`, `Fallback shown`, `Mock football`, `Mock cricket`, and related public-surface leaks.

## Files changed from v12

- `apps/web/lib/ads.ts`
- `apps/web/components/AdSlot.tsx`
- `apps/web/components/Masthead.tsx`
- `apps/web/components/MobileNav.tsx`
- `apps/web/components/ThemeToggle.tsx`
- `apps/web/components/PublicHubPage.tsx`
- `apps/web/components/article/ArticleBody.tsx`
- `apps/web/components/live/HomeLiveBoard.tsx`
- `apps/web/components/live/LiveWidgets.tsx`
- `apps/web/components/utilities/UtilityTools.tsx`
- `apps/web/app/[locale]/page.tsx`
- `apps/web/app/[locale]/[category]/page.tsx`
- `apps/web/app/[locale]/[category]/[slug]/page.tsx`
- `apps/web/app/[locale]/latest/page.tsx`
- `apps/web/app/[locale]/trending/page.tsx`
- `apps/web/app/[locale]/advertise/page.tsx`
- `apps/web/app/[locale]/auth/profile/page.tsx`
- `apps/web/app/[locale]/utilities/page.tsx`
- `apps/web/app/[locale]/market/page.tsx`
- `apps/web/app/admin/ads/page.tsx`
- `apps/web/lib/i18n/dictionaries.ts`
- `apps/web/lib/live-data.ts`
- `apps/web/lib/live/mock.ts`
- `apps/web/lib/live/real.ts`
- `apps/web/lib/live/sports.ts`
- `apps/web/lib/site.ts`
- `scripts/audit-public-surface.mjs`
- supporting docs: `MANUAL.md`, `docs/admin-deploy.md`, `docs/sports-api-setup.md`, `docs/session-2026-06-22.md`, `AUDIT_PRODUCTION_REVIEW.md`, `PRODUCTION_FIX_REPORT.md`

## Verification performed here

Passed:

```bash
node scripts/audit-public-surface.mjs
node --check scripts/audit-public-surface.mjs
JSON parse check for package.json, apps/web/package.json, apps/web/data/articles.json
custom ad-placement key audit: all JSX placementKey values exist in AD_PLACEMENTS
public grep scan for flagged AI-slop/developer-facing phrases
```

Blocked:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Reason: this sandbox has no `node_modules` and `pnpm` is not installed. I did not claim a full production build is green.

## Remaining production blockers

- Real newsroom/legal data: editor-in-chief, publication registration, owner, address, phone and corrections log.
- Real ad serving or direct campaign management, including campaign creative upload, click-through URL validation, reporting and billing workflow.
- Real CMS/database deployment and editorial QA for every story.
- Real live-data provider agreements and monitoring.
- Full CI run in the deployment environment.
- Hindi must still be implemented as a full locale (`hi`) with dictionaries, routes, content fields, hreflang, sitemap and editorial workflow; it should not be added as a cosmetic toggle.
