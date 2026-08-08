# Phase 1, MVP read experience

> Goal: ship the **credible launch**, the smallest site that reads like a real Nepali
> news portal, registered and legal. By the end of Phase 1 a reader can browse the home,
> section, and article pages in both locales, fast, on mobile, with one ad slot live.
> Editorial can publish via the CMS (full CMS polish lands in Phase 2, but publish works).
>
> Governed by planning-and-task-breakdown: vertical slices, S/M tasks (≤5 files),
> acceptance criteria + verification, checkpoints. Code style: SPEC.md. Design: DESIGN.md.

## Overview

Vertical slices: each task delivers a user-visible, testable capability end to end
(schema → query → component → route → SEO/perf check), not a horizontal layer.

## Architecture decisions active this phase

- ADR-002 (Payload), ADR-003 (edge+storage adapter, default Cloudflare), ADR-005 (Postgres) are applied.
- ADR-004 (origin) must be **decided** at the Phase 0 gate before deploy., -

## Task list

### Task 1.1: Article collection + seed data

**Description:** define the `Article` and `Category` Payload collections per
`docs/content-model.md` §1–2 with field validation (alt text, source attribution rules),
plus a dev seed of ~30 articles across seed categories.

- **Acceptance:**
  - [ ] `Article` + `Category` collections match content-model.md fields.
  - [ ] Cannot save an Article with `sourceType='aggregated'` and missing `sourceName`/`sourceUrl`.
  - [ ] Dev seed creates 5–6 categories + ~30 articles (mix of original/aggregated/wire).
- **Verify:** `pnpm, filter admin seed`; query via Payload Local API returns seeded data.
- **Dependencies:** Phase 0.
- **Files:** `apps/admin/src/collections/{Articles.ts,Categories.ts}`, `apps/admin/src/seed/index.ts`.
- **Size:** M.

### Task 1.2: Content query layer in web

**Description:** build typed data-fetching helpers in `apps/web/lib` that read Article/
Category via Payload Local API, returning shapes matching `packages/db` types.

- **Acceptance:**
  - [ ] `getArticleBySlug(category, slug, locale)`, `getCategoryPage(slug, page)`,
        `getHomepageBlocks()` return typed data.
  - [ ] Server-side only (no client fetch for above-the-fold).
- **Verify:** unit test the helpers against the seed; returns expected shape.
- **Dependencies:** 1.1.
- **Files:** `apps/web/lib/articles.ts`, `apps/web/lib/categories.ts`, `apps/web/lib/payload-client.ts`.
- **Size:** M.

### Task 1.3: Design-system primitives

**Description:** build the reader-facing primitives in `packages/ui`: `StoryCard` (variants
lead/standard/compact/text-only), `Hero`, `CategoryLabel`, `Byline`, `Dateline`,
`SectionHeader`. Match DESIGN.md (no banned patterns).

- **Acceptance:**
  - [ ] Each primitive renders with correct `lang`, semantic tags, keyboard focus.
  - [ ] `StoryCard` variants differ visually; no identical-card grids; no side-stripes.
  - [ ] Component tests assert a11y (role, alt, focusable order) and variant behavior.
- **Verify:** `pnpm test` green on components; visual check in a storybook-style page.
- **Dependencies:** Phase 0 tokens (0.4).
- **Files:** `packages/ui/src/{story-card.tsx, hero.tsx, category-label.tsx, byline.tsx, dateline.tsx, section-header.tsx}`, tests.
- **Size:** M.

### Task 1.4: Header, nav, footer, breaking ticker

**Description:** the chrome: `Masthead` (wordmark + date), `PrimaryNav` (categories +
locale toggle + search affordance), `Footer` (sections + DoIB placeholder + ethics/
privacy links), `BreakingTicker` (static in Phase 1, populated from a global).

- **Acceptance:**
  - [ ] Header is sticky with condensing behavior; nav keyboard-accessible.
  - [ ] Locale toggle switches `/` ↔ `/en` preserving context.
  - [ ] Footer shows a placeholder for the DoIB registration number (filled when granted).
  - [ ] Ticker pauses on hover/focus; static under `prefers-reduced-motion`.
- **Verify:** keyboard-tab through nav; toggle locale; check reduced-motion behavior.
- **Dependencies:** 1.3.
- **Files:** `apps/web/components/{masthead.tsx, primary-nav.tsx, footer.tsx, breaking-ticker.tsx}`.
- **Size:** M.

### Task 1.5: Homepage (vertical slice)

**Description:** assemble the homepage: `Hero` (lead story) + category `SectionBlock`s
with varied-density grids + a "थप" link per section.

- **Acceptance:**
  - [ ] Above-the-fold rendered on the server (no client data fetch).
  - [ ] Section blocks vary card sizes (no identical-card grids).
  - [ ] Lighthouse mobile LCP < 2.5s, CLS < 0.1 on a seeded DB (local throttled).
- **Verify:** Lighthouse run against the seeded local homepage; E2E `home → article`.
- **Dependencies:** 1.2, 1.3, 1.4.
- **Files:** `apps/web/app/[locale]/(home)/page.tsx`, `apps/web/components/{hero.tsx, section-block.tsx}`.
- **Size:** M.

### Task 1.6: Category/section page (vertical slice)

**Description:** `/[locale]/[category]` page with a paginated story grid, category
header + description, and SEO meta.

- **Acceptance:**
  - [ ] Paginated list (page 2 via `?page=2`); canonical tags on page 1; `noindex` on
        page 2+.
  - [ ] Unknown category → 404 (not a soft 200).
- **Verify:** visit `/politics`, `/politics?page=2`, and `/nonexistent`; assert status + canonical.
- **Dependencies:** 1.2, 1.3.
- **Files:** `apps/web/app/[locale]/[category]/page.tsx`, `apps/web/components/story-grid.tsx`.
- **Size:** M.

### Task 1.7: Article page (vertical slice)

**Description:** `/[locale]/[category]/[slug]` page rendering hero, byline/dateline,
attribution line for aggregated/wire, rich-text body (paragraph/heading/image/pullQuote/
embed/list blocks), inline ad slot, related stories, tags, share bar (inline, no modal),
and a visible correction notice when present.

- **Acceptance:**
  - [ ] All body blocks render correctly; images served via `next/image` with alt.
  - [ ] Aggregated/wire articles show the linked attribution line.
  - [ ] Inline ad slot has a **reserved size** (no CLS) and a "विज्ञापन" label.
  - [ ] Share bar is inline links (no modal, per impeccable ban).
- **Verify:** E2E reads an original and an aggregated article; assert attribution + ad slot + alt text.
- **Dependencies:** 1.1–1.4.
- **Files:** `apps/web/app/[locale]/[category]/[slug]/page.tsx`, `apps/web/components/{article-body.tsx, ad-slot.tsx, related-stories.tsx, share-bar.tsx, correction-notice.tsx}`.
- **Size:** M (split ad-slot + related into 1.7a/1.7b if it grows past 5 files).

### Task 1.8: Author + tag/topic pages (vertical slice)

**Description:** `/[locale]/author/[slug]` and `/[locale]/topic/[slug]` listing pages.

- **Acceptance:**
  - [ ] Author page shows bio, photo, and their stories.
  - [ ] Topic page shows the tag/topic blurb + matching stories across categories.
- **Verify:** visit a seeded author/topic; assert list + meta.
- **Dependencies:** 1.1, 1.2.
- **Files:** `apps/web/app/[locale]/author/[slug]/page.tsx`, `apps/web/app/[locale]/topic/[slug]/page.tsx`.
- **Size:** S.

### Task 1.9: i18n dictionary + locale routing

**Description:** centralize reader-facing strings in `apps/web/lib/i18n/dictionaries.ts`
(ne + en); wire middleware for locale routing with `ne` at `/` and `en` at `/en`.

- **Acceptance:**
  - [ ] No hardcoded reader-facing English in JSX.
  - [ ] `html[lang]` is `ne` or `en` per route; mixed runs use `<span lang>`.
  - [ ] Unknown locale → falls back to `ne`.
- **Verify:** grep for hardcoded common strings; toggle locale and inspect `html[lang]`.
- **Dependencies:** 1.4.
- **Files:** `apps/web/lib/i18n/{dictionaries.ts,middleware.ts}`, `apps/web/middleware.ts`.
- **Size:** M.

### Task 1.10: SEO, meta, JSON-LD, sitemap, RSS, robots

**Description:** per-page `<title>`/meta/OG/Twitter, `NewsArticle` JSON-LD, sitemaps
(per-locale + per-section, paginated), RSS feed, `robots.txt`, canonical + hreflang.

- **Acceptance:**
  - [ ] Article page emits valid `NewsArticle` JSON-LD (Rich Results test passes).
  - [ ] Sitemap lists published, non-`noIndex` articles; valid hreflang.
  - [ ] RSS feed valid (W3C validator).
- **Verify:** Google Rich Results test on a staging article; sitemap RSS validators.
- **Dependencies:** 1.5–1.8.
- **Files:** `apps/web/app/{sitemap.ts,robots.ts,rss.xml/route.ts}`, `apps/web/lib/seo.ts`, JSON-LD component.
- **Size:** M.

### Task 1.11: Analytics + performance budget in CI

**Description:** wire Plausible + GA4 (cookie-banner deferred to Phase 5 but GA4 consent
mode default-deny), and add Lighthouse CI thresholds to the workflow.

- **Acceptance:**
  - [ ] Plausible fires on all pages; GA4 loads only after consent (Phase 5 wires the
        banner; here: consent mode `denied` by default).
  - [ ] Lighthouse CI fails the PR if LCP ≥ 2.5s or CLS ≥ 0.1 on home + a canonical article.
- **Verify:** open a PR; Lighthouse check runs; Plausible event visible in dashboard.
- **Dependencies:** 1.5, 1.7.
- **Files:** `apps/web/app/[locale]/layout.tsx` (analytics), `.github/workflows/lighthouse.yml`, `lighthouserc.json`.
- **Size:** S.

### Task 1.12: First ad slot (AdSense) end to end

**Description:** a single in-article AdSense slot behind the `AdSlot` component, reserved
size, labeled, lazy-loaded, with the fill gated behind consent.

- **Acceptance:**
  - [ ] One labeled ad renders in the article body; reserved size prevents CLS.
  - [ ] Does not load until near viewport (lazy) and until consent (where applicable).
- **Verify:** Lighthouse CLS still < 0.1 with the ad present; ad loads on scroll.
- **Dependencies:** 1.7, 1.11.
- **Files:** `apps/web/components/ad-slot.tsx`, `apps/web/lib/ads.ts`, AdsConfig global in admin.
- **Size:** S.

### Task 1.13: Accessibility pass (axe + keyboard)

**Description:** run axe-core via Playwright on home/category/article; fix violations to AA;
manual keyboard-only walkthrough.

- **Acceptance:**
  - [ ] Zero serious/critical axe violations on key templates.
  - [ ] Skip-to-content link present; focus order logical; visible focus ring.
  - [ ] Color contrast AA in both locales and light/dark.
- **Verify:** `pnpm test:e2e` includes the a11y suite; all green.
- **Dependencies:** 1.5–1.7.
- **Files:** `e2e/a11e.spec.ts`, fixes across components.
- **Size:** M.

### Task 1.14: Deploy to staging (origin per ADR-004) behind Cloudflare

**Description:** deploy web + admin to the chosen origin (ADR-004), front with Cloudflare,
wire the publish→revalidate webhook, and verify ISR + cache purge work.

- **Acceptance:**
  - [ ] Site reachable at the staging domain; HTTPS; security headers present.
  - [ ] Publishing an article in CMS revalidates it on the site within seconds.
- **Verify:** publish a test article; observe edge revalidate.
- **Dependencies:** ADR-004 decided; 1.10.
- **Files:** deploy config (Vercel/Dockerfile), webhook route, Cloudflare purge logic.
- **Size:** M., -

## Checkpoint: Phase 1 → launch readiness

- [ ] All critical reader flows (home/category/article/author/topic/search affordance)
      work in both locales, mobile + desktop.
- [ ] Lighthouse budgets green on home + article (mobile throttled).
- [ ] a11y AA on key templates; zero serious axe violations.
- [ ] SEO artifacts valid (JSON-LD, sitemap, RSS, hreflang).
- [ ] One ad slot live and CLS-safe.
- [ ] Staging deployed behind Cloudflare; publish revalidates correctly.
- [ ] DoIB registration granted (Phase 0 task 0.10) → number placed in footer.
- [ ] **Soft launch** to a small audience; collect real-device feedback before push.

## Risks this phase surfaces

| Risk | Mitigation |
|, -|, -|
| DoIB still pending → can't legally launch | Hold public launch; staging can still proceed for testing |
| Devanagari FTS tokenizer issues (ADR-005) | Defer search to Phase 2 if needed; ship without search in MVP worst case |
| AdSense rejected / slow approval | Ship with the slot reserved but empty; backfill with house promo |
| Real-device perf worse than emulated | Use WebPageTest from Nepal + real-phone testing before launch |
