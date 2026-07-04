# Nagarik Watch quality sprint, reader chrome, auth, article experience

## Critical diagnosis

The prior pass still felt like a prototype because the public chrome was cramped, the live utility band looked bolted on, the article page exposed two separate bookmark controls, and reader auth was visually and conceptually confused with newsroom access.

Real Nepali news portals separate these jobs clearly:

- public masthead: brand, date, search, language, primary sections;
- utility data: present, but not louder than headlines;
- article page: headline, source, date, body and sharing first, account tools second;
- reader account: saved stories and history;
- newsroom admin: staff CMS only.

## Shipped changes

### Header and navigation

- Rebuilt the masthead into a three-layer news pattern: slim date/contact row, centered brand lockup, sticky section navigation.
- Removed the cramped account icon from the masthead. Saved stories remains an explicit desktop reader link, and mobile users use the bottom nav.
- Kept search, theme and language controls on the right with 44px touch targets.
- Kept mobile hamburger left, logo centered, actions right.

### Utility strip

- Moved live weather/AQI/NEPSE data below the masthead instead of above it.
- Made it a quiet desktop-only civic data ribbon labeled "आज / Today".
- Avoided shouting chips, raw provider jargon and mobile chrome bloat.

### Article reading experience

- Enlarged the headline scale and improved vertical rhythm around breadcrumb, deck, byline and hero.
- Widened the hero image treatment while keeping the body column capped for readability.
- Increased article paragraph size and line-height for Devanagari reading comfort.
- Made the tools row calmer and structured: share first, then save, reader view and font size.
- Removed the duplicate bookmark button from `ReaderArticleControls`. Bookmarking is now handled only by `BookmarkButton`.

### Reader tools

- `ReaderArticleControls` now only tracks reading progress, reading history and reader-view mode.
- It no longer has a second localStorage-only bookmark affordance that disagreed with the API-backed bookmark button.

### Reader auth

- Redesigned reader login/signup into a more news-native split layout.
- Clarified that accounts are optional, free and for saved stories/history, not a paywall.
- Removed the old generic card-centered feel.
- Made newsroom login visibly staff-only instead of treating it like a reader-membership surface.

### Newsroom admin login

- Rewrote `/admin/login` as a staff CMS entry point.
- Replaced reader benefit bullets with newsroom workflow bullets: drafting, attribution, moderation, SEO, widgets and audit history.
- Clarified that redirecting from `/admin` to `/admin/login`, and then to `/admin/dashboard` after staff login, is normal CMS behavior.

## Validation

Passed:

```bash
node --check scripts/audit-public-surface.mjs
node scripts/audit-public-surface.mjs
```

Blocked by environment:

```bash
pnpm --filter @nagarikwatch/web typecheck
```

Corepack attempted to download pnpm 9.12.0 but DNS failed with `EAI_AGAIN registry.npmjs.org`. Full verification still needs to run in a dependency-enabled environment.

## Skills used

- Header/nav redesign: impeccable, design-anti-slop, frontend-design, accessibility-audit, nextjs-developer.
- Utility strip redesign: impeccable polish, design-anti-slop, performance-optimization, accessibility-audit.
- Article reading experience: impeccable typography/layout, frontend-design, accessibility-audit, design-anti-slop.
- Duplicate bookmark fix: karpathy-guidelines, incremental-implementation, nextjs-developer, test-master reasoning.
- Reader auth redesign: impeccable clarify, frontend-design, accessibility-audit, secure-code-guardian principles.
- Newsroom login clarification: product-register thinking, secure-code-guardian principles, UX writing, nextjs-developer.
- Verification: verification-before-completion.
