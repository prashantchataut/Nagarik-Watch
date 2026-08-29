# PROMPT 1 — Nagarik Watch: Full-Site Completion + Homepage Redesign + Ads System

Paste this into ChatGPT (browser edition, no tools, no file system). The zip file
`nagarik-watch-src.zip` is attached. Read everything from it.

---

## Your role

You are an elite, design-obsessed frontend engineer AND a complete full-stack product
engineer working on **Nagarik Watch (नागरिक वाच)**, a Nepali-first (Devanagari) news
portal at nagarikwatch.com. There is also a second brand, The Nagarik (thenagarik.com).

You are extremely critical. You are a design freak. You love the clean, dense, packed UI of
Nepali news portals: OnlineKhabar (onlinekhabar.com), Ratopati (ratopati.com),
ArthaKhabar (arthakhabar.com), TechPana, NepalKhabar. The current nagarikwatch.com UI is
broken: distorted blocks, broken structure, blank wide spaces, bad alignment, messy
homepage, hollow sections. This must be fixed for real.

## Constraints (very important)

1. You have **no tools** — you cannot run commands, cannot build, cannot delete files,
   cannot edit the file system. You work purely by reading files from the attached zip and
   writing complete code.
2. For **every file** you create, modify, or delete, output the **full final file content**
   in a clearly labelled code block with the exact path, e.g.:
   `### FILE: apps/web/app/[locale]/page.tsx` followed by the entire file.
   For deleted files just list the path. Never use placeholders like `...` — output real,
   complete, working code. If a change is small you may instead give a precise unified diff,
   but full-file output is preferred and expected for most files.
3. You **cannot delete files** in this session. You must still produce the complete
   **DELETE LIST** (exact paths) so the human can delete them manually. Do this twice:
   once after your audit, and again as a final consolidated list at the end.
4. Do not invent credentials, API keys, or fake reader data. Public copy must be honest.
5. Do not mention competitor portal names in UI copy or code comments. Never write
   "demo", "test", "what is this ?", "placeholder" or similar strings into any public
   surface, ad creative, or code comment.
6. Output must be self-contained. Assume the human will copy your output, apply it to the
   repo, and run the verification commands themselves.

## Skills — load these BEFORE doing anything

The zip contains a large skill library. Treat each skill as a mandatory operating manual.
Read the `SKILL.md` of each skill you activate before using it. The most important ones
(correct paths inside the zip):

- `.agents/skills/design-taste-frontend/SKILL.md` — primary anti-slop frontend taste skill (load first)
- `skills/impeccable/SKILL.md` and `.agents/skills/impeccable/SKILL.md` — design critique/audit/polish (use its `critique`, `audit`, `polish`, `distill`, `harden` sub-commands mentally)
- `.agents/skills/ui-ux-pro-max/SKILL.md` — UI/UX intelligence database (styles, palettes, fonts, UX guidelines, Next.js stack)
- `.agents/skills/frontend-design/SKILL.md` and `skills/frontend-design/SKILL.md` — production frontend craft
- `skills/agentic-engineering/SKILL.md` and `skills/ecc-universal/agentic-engineering/SKILL.md` — eval-first execution, task decomposition, cost-aware routing
- `skills/design-anti-slop/SKILL.md` — kill generic AI design patterns
- `skills/karpathy-guidelines/SKILL.md` — think before coding, simple, surgical, goal-driven
- `skills/incremental-implementation/SKILL.md` — land changes incrementally
- `skills/verification-before-completion` (see `.agents/skills/verification-before-completion/SKILL.md`) — evidence before claiming done
- `skills/doubt-driven-development/SKILL.md` — adversarial review before committing decisions
- `skills/council/SKILL.md` and `skills/ecc-universal/council/SKILL.md` — 4-voice debate for ambiguous calls
- `skills/clutter-management/SKILL.md` — dead-code scan, proposed deletions (never auto-delete)
- `skills/codebase-auditor/SKILL.md` — root-cause/architecture/integration-debt audit
- `skills/spec-miner/SKILL.md` — reverse-engineer specs from the existing code
- `skills/security-reviewer/SKILL.md`, `skills/secure-code-guardian/SKILL.md`, `skills/security-and-hardening/SKILL.md`
- `skills/error-handling/SKILL.md`, `skills/caching-strategies/SKILL.md`
- `skills/nextjs-developer/SKILL.md`, `skills/react-expert/SKILL.md`, `skills/typescript-pro/SKILL.md`
- `.agents/skills/vercel-react-best-practices/SKILL.md`, `.agents/skills/core-web-vitals/SKILL.md`, `skills/webapp-testing/SKILL.md`
- `.agents/skills/accessibility/SKILL.md`, `skills/accessibility-audit/SKILL.md`
- `.cursor/skills/nagarik-watch-product/SKILL.md` — **product truth: public vs staff rules (must read)**
- `.opencode/skills/nagarik-watch-newsroom/SKILL.md` — **newsroom product/editorial standard (must read)**
- `.opencode/skills/newsroom-cms-architecture-skill/SKILL.md` — CMS/admin architecture
- `.opencode/skills/news-seo-google-news-skill/SKILL.md` — Google News/SEO readiness
- `.opencode/skills/live-data-widget-integration-skill/SKILL.md` — live widgets
- `.opencode/skills/moderation-and-trust-safety-skill/SKILL.md` — comments/trust
- `skills/api-and-interface-design/SKILL.md`, `skills/api-designer/SKILL.md` (if you touch APIs)

Also read the project source-of-truth docs in the zip:
`AGENT.md`, `AGENTS.md`, `PRODUCT.md`, `DESIGN.md`, `SPEC.md`, `ROADMAP.md`,
`MANUAL.md`, `docs/implementation-status.md`, `docs/ui-ux-redesign-plan.md`,
`docs/architecture.md`, `docs/content-model.md`, `docs/editorial-workflow.md`,
`docs/launch-runbook.md`, `docs/backend-admin-audit-2026-08-09.md`,
`design-system/nagarik-watch/MASTER.md` and all files in `design-system/nagarik-watch/pages/`.

## Project layout (from the zip)

```
apps/web        Reader Next.js app (App Router) + journalist desk + web ops admin
apps/admin      Payload CMS 3 (editorial source of truth) — full backend
packages/db     Content contracts, schemas, ranking/recommendation utilities
packages/ui     Civic Crimson design system primitives
packages/infra  Storage + CDN adapters
packages/ingest Feed normalization/ingestion
docs            Architecture, ADRs, workflows, deployment
skills/         Skill library (97 skills) + .agents/skills + .cursor/skills + .opencode/skills
```

## Phase 0 — Audit and inventory (do this first, with skills loaded)

1. Read the zip fully. Map every page in `apps/web/app` and every admin surface in
   `apps/web/app/admin` and every Payload collection/global in `apps/admin`.
2. Cross-reference against `docs/implementation-status.md`, `docs/ui-ux-redesign-plan.md`,
   `ROADMAP.md`, `PRODUCT.md`, `SPEC.md` and produce a **completion matrix**:
   for every planned feature, mark ✅ done / ⚠️ half-measure / ❌ hollow / 🔲 missing, with
   file paths and line refs as evidence.
3. Hunt for **hollow implementations and half measures**: components that render but never
   get real data, adapters that always return empty, honest-empty-state strings that hide a
   missing feature, `TODO`/`FIXME`/`stub`/`placeholder`/`return null` paths, duplicate
   components, dead routes, unused exports, orphaned files, superseded code (e.g. old
   homepage components, legacy media/upload paths, Cloudinary leftovers, Meilisearch
   leftovers). List every one with evidence.
4. Hunt for **things that aren't done at all** that the docs imply: Phase 2 remaining
   items (Live blog block, full Nepali calendar/festivals page), Phase 3/4 items, patro
   utility hub completeness, ad system completeness, empty widgets (gold/forex/NEPSE),
   PWA depth, RSS/SEO completeness, missing `loading.tsx`, missing error boundaries.
5. Produce the first **DELETE LIST** (dead code / orphaned files / superseded components)
   with one-line reason per file. Do NOT delete anything yourself; just list it.

## Phase 1 — Fix the critical homepage problems FIRST (highest priority)

The user reports three serious, specific defects. Diagnose each from the zip and fix for real:

1. **The homepage points to two different pages / routing confusion.** Investigate
   `apps/web/app/page.tsx` (returns null — a typed safety net), `apps/web/app/[locale]/page.tsx`
   (the real homepage), `apps/web/middleware.ts` (rewrites `/` → `/ne`, `/en` handling),
   and any alternate homepage renderer. Pick ONE canonical homepage render path, make `/`
   deterministic, and remove whatever causes the double-page behaviour. Ensure `/en` and `/`
   are consistent and there is no fallback that renders a blank or wrong page.
2. **The page is not responsive.** Audit every homepage component
   (`apps/web/components/home/*`, `Masthead`, `PublicShell`, `BottomNav`, `AdSlot`) at
   mobile (390×844), tablet, and desktop (1280, 1440). Fix distortion, broken grids,
   blank wide spaces, misalignment, overflow, and giant gaps. Read `DESIGN.md` density
   guidance (density dial 7/10) and `docs/ui-ux-redesign-plan.md` (≤2 chrome bands on
   mobile first viewport; no duplicate search; no TopicsStrip hub clutter on mobile).
3. **Sometimes shows a "Service temporarily unavailable" page.** Read
   `apps/web/app/global-error.tsx`, `apps/web/app/[locale]/error.tsx`,
   `apps/web/app/[locale]/__not-found/page.tsx`, `apps/web/app/[locale]/not-found.tsx`, and
   the content source stack (`apps/web/lib/content/source.ts`, `payload-source.ts`,
   `store/json-store.ts`, `payload-source.contract.test.ts`). Find what throws when
   Payload/Postgres is slow or unreachable, and make the homepage degrade gracefully
   (bounded timeouts, cached fallback, honest but NON-breaking empty states) instead of a
   full-page service-unavailable error. Never let a CMS hiccup take down the homepage.

## Phase 2 — Delete the homepage design and redesign it from scratch

You have permission to delete the current homepage design entirely and rebuild. Do NOT
cosmetic-patch; redesign with intent. Requirements (lock these):

- **Lead system (locked decision in `docs/ui-ux-redesign-plan.md` §9):** A1 portal feed —
  centered mega-headline blocks for the top 3–5 stories (category pill → 40–52px Mukta
  headline on desktop / 28–34px mobile → byline/meta → large image), then switch to dense
  category desks. Match the OnlineKhabar/Ratopati/NepalKhabar family grammar: centered
  display headlines, red/Civic Crimson category pill, author avatar + timestamp under the
  headline, full-width hero image.
- **Chrome budget:** thin brand nav (~48–52px) with categories + पात्रो as the loudest
  utility CTA + trending-topic pills (CMS tags, not static hub synonyms). Mobile:
  hamburger | centered logo | search, one optional live strip OR breaking ticker (pick
  one), then content. Kill TopicsStrip hub duplication. No more than 2 chrome bands above
  the first story on mobile.
- **After the fold:** dense `SectionBlock` desks only (desk / stack / mosaic variants —
  never sparse text-only columns, never empty grid cells). ONE Latest or Most-read sticky
  rail on xl (not both forever), at most one FeaturedBand (asymmetric, labelled), one
  ProvinceHub, one conversion module, close with photo-of-the-day + today-in-history (only
  when real corpus matches — honest otherwise).
- **Density:** portal rhythm (`py-6`–`py-10` sections), every list row has thumbnail OR
  deck (never headline-only blank rails). No side-stripe red bar list accents. No thick
  `border-ink` page-wide chops as default — use hairline `rule` + short brand-underline
  section headers (`packages/ui/src/SectionHeader.tsx`).
- **Typography:** Mukta for Devanagari display, Noto Sans Devanagari for body, Source
  Sans 3 for Latin UI (see `apps/web/app/fonts.ts`, `DESIGN.md`). No Latin uppercase +
  wide-letter-spacing costume on Nepali labels.
- **Ads on homepage:** respect the existing ad system — masthead leaderboard slot, one
  mid-page house/network slot, one closing billboard. Slots collapse cleanly when ads are
  off (`NEXT_PUBLIC_ADS_MODE=off`). Never render empty dashed "media kit" shells on the
  public homepage.
- **Polls:** real editorial questions only. Gate demo/placeholder polls from public UI.
- You may reuse solid existing primitives (`SectionBlock`, `StoryCard`, `MegaStoryBlock`,
  `PortalFeed`, `LeadPackage`, `LatestRail`) but you own the composition. If you keep a
  component, say so; if you replace it, delete the old one and list it in the DELETE LIST.
- Rebuild `apps/web/app/[locale]/page.tsx` as the single homepage. Keep `revalidate`,
  dedupe logic, and honest empty states. Ensure both `ne` and `en` render correctly.

## Phase 3 — Restore design discipline across the whole public site

One surface at a time, in this order: **homepage → category/topic/hub indexes → article →
patro/utilities → trust/footer/chrome**. Apply `impeccable` critique mentally to each.

- Category/topic pages: one list language (dense thumb rows or desk), optional grid/list
  toggle like Ratopati, never sparse equal-card grids on topics.
- Article page: stronger display headline scale (Devanagari line-height ≥1.2), body measure
  ~65–75ch, dense "also read" thumb rail, keep trust ledger / corrections / sponsored
  badge / sticky reader controls, keep print styles.
- Patro/utilities: today banner, month grid, utility tiles, and honest last-updated
  empty states — never blank widgets labelled as if the desk forgot. Do NOT reintroduce a
  duplicate live board.
- Global chrome: audit `Masthead`/`PublicShell`/`BottomNav`/cookie banner; cookie banner
  must not cover the mobile bottom nav; no duplicate search on mobile.
- Sweep the whole public site for: thick ink rules used as default, SaaS hero/metrics/
  glass patterns, gradient text, diagonal-stripe SVG blocks that read as broken images,
  gallery whitespace, headline-only rails, demo/test strings. Fix or list for deletion.

## Phase 4 — Ads system: make it real and admin-manageable

The repo already has an ad stack. Make it complete and production-real, matching how real
Nepali news portals manage ads:

- **Audit** `apps/web/lib/ads.ts`, `apps/web/lib/house-ads.ts`, `apps/web/lib/ads/*`
  (`attention.ts`, `yield-local.ts`, `house-ad-promote.ts`), `apps/web/components/AdSlot.tsx`,
  `apps/web/components/ads/*` (`AdTracker`, `HouseAdLink`, `NetworkAdUnit`,
  `NetworkAdScripts`, `ConsentGatedAd`), `apps/web/components/MobileAdDock.tsx`,
  `apps/web/app/admin/(desk)/ads/page.tsx`, `apps/web/app/api/ads/event/route.ts`,
  `apps/web/app/api/cron/house-ad-promote/route.ts`, `apps/web/app/ads.txt/route.ts`,
  `apps/web/app/sellers.json/route.ts`.
- **Complete the admin flow** so a newsroom person can fully manage ads from `/admin/ads`
  without code: create/edit/activate/deactivate house ads per placement, set title, body,
  CTA, link, image URL, enable A/B with challenger, promote A/B winners, see 30-day
  impression/click/CTR per placement, delivery coverage. Fix any missing pieces, broken
  forms, or missing roles (`ad_manager` etc. in `lib/admin-roles.ts`).
- **Placements:** ensure every defined placement in `AD_PLACEMENTS` is actually wired on a
  real page (masthead leaderboard, sidebar rectangle/tower, mid-billboard, article inline,
  mobile dock, native). No placement defined but never rendered.
- **Modes:** `off` collapses everything; `house` renders direct-sale house ads (labelled);
  `network` loads AdSense/GAM only after advertising consent (`NEXT_PUBLIC_ADS_MODE`).
  Network scripts must only load when mode=network + credentials + consent.
- **Labeling:** ads are always clearly labelled (विज्ञापन / Advertisement) and sponsored
  content uses `SponsoredBadge`. Never deceptive.
- **Tracking:** verify `AdTracker` → `/api/ads/event` → `lib/ad-events.ts` → ops tables
  actually record impressions/clicks/attention and feed `/admin/ads`. Fix gaps.
- **ads.txt / sellers.json:** keep honest, driven by env (`ADS_TXT_BODY`,
  `SELLERS_JSON_BODY`), never hardcoded fake sellers.

### The NEBians demo campaign (real ad, never labelled "demo")

Prepare a **real, publishable house ad** for **NEBians** (nebians.consica.com.np), a
Nepali learning community app. From the live site: it is "NEBians — Nepali Learning
Community"; study notes, textbooks, past papers, forum discussions, blog/news, interactive
courses, and a NEB Class 12 result checker; audiences are BLE (Class 8), SEE (Class 10),
NEB Class 11/12, and Bachelor-level (TU/IOM nursing) students; the Android app is live on
Google Play (`com.neb.ians`); brand feel is friendly/student-first, uses a "Neby" mascot.

Build the house ad creative to be seeded/created through the admin flow (and output the
exact JSON or seed data the human can insert). It must be copy that sounds like a real
editorial ad buy — no "demo", no "sample", no placeholder. Provide:

- A primary 728×90 leaderboard creative (title/headline, body line, CTA, link to
  https://nebians.consica.com.np)
- A 300×250 rectangle creative (for sidebar/article)
- A mobile 320×50 creative
- A native/sponsored-card creative (image + headline + deck + CTA + SponsoredBadge)
- Nepali-first copy (Devanagari) with an English variant, following the product tone of
  voice in PRODUCT.md (credible, direct, calm, factual — no clickbait, no em dashes).
- If the human has an image URL, describe where to place it; if not, give copy-only
  variants that render cleanly without an image (the existing house-ad renderer supports
  text-only).

Do NOT wire NEBians into ads.txt/sellers.json (it is a direct house campaign, not a network).

## Phase 5 — Backend + CMS completeness (do real work, not stubs)

Work through `apps/admin` (Payload) and the web ops backend. Identify every half-measure
and complete it:

- Payload collections/globals in `apps/admin/src`: articles, categories, tags, authors,
  media, revisions, users/roles, workflow fields. Verify access control is correct,
  publication uses `_status=published` + `workflowStage` + `publishAt` (not `noIndex`),
  and revalidation webhook is bounded and correct (publish/update/unpublish + old/new slug).
- Media upload + storage: legacy uploader vs canonical Payload Vercel Blob path. Fix WebP/
  AVIF sniffing, provider errors, and Next/Image remote allowlist. Production metadata
  must never fall back to process memory.
- Postgres: one connection per warm instance; bounded pool; survive pool exhaustion without
  taking down readers (`apps/web/lib` + `packages/db/src/env.ts`). Verify ops migrations
  (`apps/web/migrations`).
- Auth: Better Auth sessions, `requireNewsroomSession`, roles (`admin-roles.ts`), MFA/TOTP,
  boot accounts. Verify cookie-precheck bypass for anonymous users (no DB hit per anonymous
  request).
- API routes under `apps/web/app/api`: journalist articles, admin media, editorial
  workflow transitions, feedback, submissions, comments/moderation, polls, live widgets,
  ads events, cron jobs (scheduled-publish, digest-compose, breaking-auto-boost,
  house-ad-promote). Fix any that are hollow or error-prone. Add consistent error shapes.
- Live data adapters (`apps/web/lib`): weather/AQI/NEPSE/gold-forex/sports/election/exam/
  youtube — ensure honest empty states, bounded timeouts, caching, and no invented data.
- SEO: sitemap, news-sitemap, RSS/Atom/JSON feed, robots, llms.txt, image/video sitemaps,
  canonical/alternates, article schema, speakable, live blog schema if implemented.
- Performance: Core Web Vitals budget (LCP<2.5s 4G, CLS<0.1), no render-blocking surprises,
  no redundant cross-service reads on the homepage critical path.
- Complete the **DELETE LIST** for the backend too: orphaned legacy endpoints, dead
  adapters, superseded code (Cloudinary, Meilisearch, HomeLiveBoard remnants, etc.).

## Phase 6 — Semantic execution order & final deliverables

Execute everything in semantic order: **audit → critical homepage fixes → homepage redesign
→ chrome → category/article → patro/utilities → ads system → backend/CMS → SEO/trust →
declutter.** You may batch related files, but keep the order.

At the end, deliver in this exact structure:

1. **Summary** — what you changed, surface by surface, and why (map each change to a
   locked decision or audit finding).
2. **All changed/new files** — full file content per file, exact paths, in apply order.
3. **All files to delete** — the consolidated final **DELETE LIST** (exact paths + one-line
   reason each). The human will delete these manually — make the list precise and safe.
4. **Verification commands** the human must run, in order:
   `pnpm install`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`,
   `pnpm verify:static`, `pnpm --filter @nagarikwatch/web build`,
   `pnpm --filter @nagarikwatch/admin build`, `pnpm test:e2e`.
   Also `node scripts/verify-workspace-lock.mjs`. Note anything that will likely fail and why.
5. **What you could NOT verify** because you have no tools (build, e2e, live screenshots)
   — be honest. Recommend the human run `impeccable detect` on changed targets:
   `node .agents/skills/impeccable/scripts/detect.mjs --json <changed targets>`
   (or the `skills/impeccable/scripts/detect.mjs` variant).

Be extremely critical. Do not pad. Implement truly. Use the skills. Never ship half measures.
