# Spec: Nagarik Watch

> Master specification. Governed by the spec-driven-development skill:
> SPECIFY → PLAN → TASKS → IMPLEMENT, each gate reviewed before advancing.
> This document is the shared source of truth between the engineer(s) and the editor(s).
> Code without a spec is guessing; this spec is **living**, update it when reality changes., -

## Objective

Build **Nagarik Watch** (नागरिक वाच), a modern, web-only, Devanagari-first news portal for
Nepal, covering politics, society, business, sports, entertainment, world, and a signature
opinion/columns section, with a dedicated English section. Free to read. Ad-supported.
Hybrid editorial model (original + aggregated-with-attribution + wire/syndicated).

**Primary user:** a Nepali news reader on a mid-range Android phone over mobile data,
reading in Devanagari, arriving from social or search.
**Secondary user:** the diaspora reader on broadband.
**CMS user:** journalists and editors who live in the admin all day.

### Success criteria (specific, testable, how we know "done")

- Any article page reaches **LCP < 2.5s on a simulated mid-tier Android over 4G**, with
  **CLS < 0.1** and **INP < 200ms**, measured via Lighthouse CI in the pipeline.
- Homepage renders the lead story and first category block on the **first server render**
  (no client-side data fetch for above-the-fold).
- A journalist can take a tip to a **published story** (hero image + alt text, byline,
  category, tags, SEO fields, source attribution where applicable) in **under 10 minutes**
  in the CMS.
- The site is fully usable in **both `ne` and `en`** locales with correct `lang`
  attributes, no mixed-directional glitches, and Devanagari numerals in the Nepali locale.
- **The English toggle (`/en`) shows only author-reviewed English content** (ADR-007). No
  story appears in `/en` unless `hasEnglish = true`; the system never publishes machine
  translation. A Nepali-only story is absent from `/en`, with no "Read in English" CTA.
- Sponsored/native content is **visibly labeled** and distinguishable from editorial in a
  blind review.
- **The edge/CDN and object-storage layers are swappable** behind the `packages/infra`
  adapter interfaces (ADR-003): switching the default (Cloudflare) for AWS/Bunny/B2/MinIO
  is a config + adapter change, not an app rewrite.
- The site scores **WCAG 2.1 AA** on axe-core automated checks and passes a manual
  keyboard-only navigation audit.
- The registration number of Nepal's **Department of Information & Broadcasting** is shown
  in the site footer before public launch (legal norm for Nepali online news)., -

## Tech Stack

| Layer | Choice | Version target |
|, , , , , |-, , , , , , , , , , , , |-, , , , , -|
| Monorepo | pnpm workspaces + Turborepo | pnpm 9, turbo 2 |
| Language | TypeScript (strict) | 5.5+ |
| Web app | Next.js (App Router, Node runtime) | 15+ |
| Styling | Tailwind CSS + CSS variables for tokens | 3.4+ |
| CMS | Payload CMS (self-hosted, in-repo) | 3+ |
| Database | PostgreSQL | 16+ |
| ORM (Payload) | Payload's Drizzle adapter | bundled |
| Object storage | S3-compatible; default Cloudflare R2 (swappable, ADR-003) | n/a |
| Image pipeline | `next/image` + sharp, AVIF/WebP | bundled |
| Search | PostgreSQL full-text (Phase 2) → Meilisearch (later) | 16 / 1.8+ |
| Analytics | Plausible (self-hosted) + GA4 | n/a |
| Ads | Google AdSense (start) → GAM/DoubleClick (later) | n/a |
| Edge/CDN + WAF | Adapter interface; default Cloudflare (swappable, ADR-003) | n/a |
| Web push | OneSignal or self-hosted FCM | n/a |
| Email/newsletter | (Phase 3) Buttondown / Listmonk | n/a |
| Testing | Vitest (unit) + Playwright (e2e) | 2+ / 1.49+ |
| Lint/format | ESLint + Prettier | 9+ / 3+ |
| CI | GitHub Actions | n/a |
| Deploy | Origin: TBD (ADR-004). Edge + storage: adapter default Cloudflare, swappable (ADR-003). | n/a |

**Why these (summary; full rationale in ADRs):** Next.js App Router gives SSR/ISR for SEO
and speed, which are existential for news. Payload is TypeScript-native, self-hostable,
no per-editor pricing, schema lives in the repo. Postgres is the right default for
relational editorial data + full-text search. Cloudflare in front for global + Nepal-edge
latency. No vendor lock-in on the things that matter (CMS, DB)., -

## Commands

Full executable commands. Run from repo root unless noted.

````bash
# Install
pnpm install

# Dev (all apps)
pnpm dev
# Dev a single workspace
pnpm, filter web dev
pnpm, filter admin dev

# Build
pnpm build
pnpm, filter web build

# Type-check
pnpm typecheck            # tsc, noEmit across workspaces

# Lint + format
pnpm lint                 # eslint .
pnpm lint:fix             # eslint ., fix
pnpm format               # prettier, write .

# Tests
pnpm test                 # vitest run (unit)
pnpm test:watch           # vitest
pnpm test:e2e             # playwright test
pnpm test:e2e:ui          # playwright test, ui

# Performance + a11y gates
pnpm lighthouse           # lighthouse-ci against a local build

# Database / Payload
pnpm, filter admin dev:path    # next-payload dev
pnpm, filter admin seed        # seed sample content (dev only)

# Turborepo
pnpm turbo run build, filter=...
```, -

## Project Structure

````

nagarik-watch/
├── apps/
│ ├── web/ # Next.js portal (the site readers see)
│ │ ├── app/
│ │ │ ├── [locale]/ # 'ne' (default) and 'en'
│ │ │ │ ├── (home)/page.tsx
│ │ │ │ ├── [category]/[...slug]/page.tsx # category + article routes
│ │ │ │ ├── author/[slug]/page.tsx
│ │ │ │ ├── search/page.tsx
│ │ │ │ └── layout.tsx
│ │ │ ├── api/ # ISR revalidate webhook, og image, rss
│ │ │ ├── sitemap.ts
│ │ │ └── robots.ts
│ │ ├── components/ # StoryCard, Hero, Ticker, AdSlot, etc.
│ │ ├── lib/ # payload client, i18n, date (BS/AD), url
│ │ ├── styles/ # globals.css, devanagari font imports
│ │ └── public/ # fonts, icons, manifest
│ └── admin/ # Payload CMS (the editorial tool)
│ ├── src/ # payload.config.ts, collections, blocks, hooks
│ ├── migrations/ # Drizzle migrations (versioned)
│ └── seed/ # dev seed data
├── packages/
│ ├── db/ # shared schema types, validation zod schemas
│ ├── ui/ # design system: tokens (CSS vars), primitives
│ └── ingest/ # RSS/wire ingestion scripts (cron jobs)
├── docs/ # architecture, ADRs, content-model, workflow, phases
├── PRODUCT.md
├── DESIGN.md
├── SPEC.md # this file
├── turbo.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── .github/workflows/ # CI: lint, typecheck, test, lighthouse

````, -

## Code Style

One real snippet beats paragraphs. This is the canonical shape of a React component in
this repo. Match it.

```tsx
// apps/web/components/story-card.tsx
import { cn } from '@nagarikwatch/ui/cn'
import { formatDate } from '@/lib/date'
import type { StoryCardData } from '@nagarikwatch/db'

type Variant = 'lead' | 'standard' | 'compact' | 'text-only'

interface StoryCardProps {
  story: StoryCardData
  variant?: Variant
  locale?: 'ne' | 'en'
}

/**
 * A story preview. Variant controls density; 'lead' uses an h2 + large image,
 * 'compact' drops the image. Never wraps the whole card in a button, the
 * headline is the link (accessibility + SEO).
 */
export function StoryCard({ story, variant = 'standard', locale = 'ne' }: StoryCardProps) {
  const title = locale === 'ne' ? story.titleNe : story.titleEn ?? story.titleNe
  const href = `/${story.category}/${story.slug}`

  return (
    <article className={cn('group', variantClass[variant])}>
      {(variant === 'lead' || variant === 'standard') && story.heroImage && (
        <a href={href} tabIndex={-1} aria-hidden>
          <img src={story.heroImage.url} alt={story.heroImage.alt} loading="lazy" />
        </a>
      )}
      <span className="category-label">{story.categoryLabel}</span>
      <h3 className="headline">
        <a href={href} lang={locale}>{title}</a>
      </h3>
      <p className="meta">
        <span>{story.byline}</span>
        <time dateTime={story.publishedAt}>{formatDate(story.publishedAt, locale)}</time>
      </p>
    </article>
  )
}
````

### Conventions

- **TypeScript strict**, no `any` without a justification comment. Zod for runtime
  validation at trust boundaries (API input, CMS ingestion).
- **Naming:** `PascalCase` components/types, `camelCase` functions/vars, `kebab-case`
  files for components (`story-card.tsx`), `UPPER_SNAKE` for env constants.
- **Server Components by default.** Add `'use client'` only when interactivity is needed.
  Data fetching in server components, not in client hooks.
- **No barrel files** that re-export everything, keep imports explicit and tree-shakable.
- **i18n:** reader-facing strings via a dictionary (`lib/i18n/dictionaries.ts`), never
  hardcoded English in JSX. `lang` attribute set per content run.
- **Date:** all stored as UTC ISO. Display via `lib/date` which formats **BS (Bikram
  Sambat)** in the `ne` locale and AD elsewhere, using `nepali-date-converter` or
  equivalent.
- **URLs:** lowercase, Nepali slugs transliterated to Latin for safety
  (`/politics/...`), with the category as the first path segment. Article slugs unique
  within a category.
- **Formatting:** Prettier defaults, 100-col, single quotes, trailing commas. No
  prettier-vs-eslint conflicts, eslint-config-prettier applied.
- **Comments:** explain _why_, not _what_. Public functions get a JSDoc summary.
- **No em dashes in UI copy** (impeccable ban), use commas, colons, parentheses., -

## Testing Strategy

| Level | Tool | What it covers | Where |
|, , , , |-, , , |, , , , , , , , , , , , , -|, , , , , -|
| Unit | Vitest | Pure functions: date conversion, slugify, i18n, content helpers | `*.test.ts` next to source |
| Component | Vitest + Testing Library | Component rendering, a11y assertions, variant behavior | `*.test.tsx` next to source |
| Integration | Vitest | Payload hooks, ingestion, revalidate paths | `__tests__/` |
| E2E | Playwright | Critical reader flows: home→article, search, category nav, locale toggle, breaking ticker | `e2e/` |
| A11y | axe-core (via Playwright) + manual keyboard audit | WCAG 2.1 AA on key pages | `e2e/a11y/` |
| Performance | Lighthouse CI | LCP/CLS/INP budgets on home + article | `.github/workflows`|
| Visual | Playwright screenshots (light regression) | Layout breakage on key templates | `e2e/visual/` |

**Coverage targets (guidelines, not gates):**

- `packages/db`, `lib/`, `ingest`: ≥80%, these are pure logic, bugs are costly.
- Components: focus on behavior and a11y assertions rather than % coverage.
- E2E covers the happy paths; edge cases handled in component/integration tests.

**What gets tested, by phase:**

- Phase 1: date/slug helpers, StoryCard variants, home→article E2E, a11y on key pages,
  Lighthouse budget.
- Phase 2: Payload hooks (slug generation, search-index update), workflow transitions,
  ingestion attribution.
- Phase 3+: each signature feature brings its own E2E (ePaper nav, gallery keyboard
  support, live-blog updates).

**Run before every commit:** `pnpm typecheck && pnpm test && pnpm lint`. CI runs the full
matrix including Lighthouse and Playwright on PRs., -

## Boundaries

### Always do

- Run `pnpm typecheck && pnpm test && pnpm lint` before committing.
- Keep server/client component boundaries explicit and minimal.
- Validate all external input (CMS webhooks, ingestion feeds, search queries) with Zod.
- Require alt text on every editorial image (CMS-enforced).
- Set `lang` and `dateTime` attributes; format dates via `lib/date`.
- Update `SPEC.md` and the relevant ADR **before** implementing a decision change.
- Write the ADR when making any architecture-level decision (skill: architecture-designer).

### Ask first

- Database schema changes / new Drizzle migrations.
- Adding a new runtime dependency (justify in the PR; check license + maintenance).
- Changing CI configuration or the performance/a11y budgets.
- Changes to the content model (see `docs/content-model.md`), they ripple into CMS,
  web, and search.
- Any change to the i18n dictionary structure.
- Introducing a new ad placement or a new sponsored-content surface.

### Never do

- Commit secrets, `.env` files, or production credentials.
- Edit `node_modules`, build output, or any vendored directory.
- Remove or `it.only`/`skip` a failing test to make CI green.
- Disable TypeScript strict checks or add `// @ts-ignore` without a comment.
- Use `any` to silence a type error (fix the type or justify in a comment).
- Hardcode reader-facing English strings in JSX.
- Ship an editorial image without alt text.
- Use any of the impeccable absolute bans (side-stripe borders, gradient text,
  glassmorphism-as-default, hero-metric template, identical card grids, modal-as-first-
  thought, em dashes in copy)., -

## Open Questions

1. **Origin hosting**, Nepal VPS vs managed Vercel (deferred to **ADR-004**, decided
   before Phase 1 deploy).
2. **Devanagari display font**, Mukta vs Baloo 2 for headlines (A/B in Phase 1).
3. **Columns serif**, does the opinion section use a distinct serif or stay in system sans?
4. **Comments**, none in v1, but if added: pre-moderated? Via which provider?
5. **Search backend**, start with Postgres FTS, move to Meilisearch at what threshold?
6. **Newsletter provider**, decided in Phase 3.
7. **Numerals**, Devanagari numerals in `ne` by default confirmed, but dates in
   bylines: BS only, or BS + AD?
8. **Masthead lockup**, bilingual stacked vs Devanagari-primary (DESIGN.md open question)., -

## Verification (this spec is "done" when)

- [x] Covers all six core areas (Objective, Stack, Commands, Structure, Code Style,
      Testing, Boundaries).
- [ ] Human has reviewed and approved the spec.
- [x] Success criteria are specific and testable.
- [x] Boundaries (Always / Ask first / Never) defined.
- [x] Spec saved in the repository root (`SPEC.md`).
