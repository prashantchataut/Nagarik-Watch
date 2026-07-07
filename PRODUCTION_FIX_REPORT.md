# Nagarik Watch v12 production fix report

## Scope

This pass starts from the v11/v10 production-audit package and focuses on making the previously identified issues code-real instead of just documented. The work applies the repository skill guidance in `AGENT.md` and the local skill folders most relevant to this task: anti-slop, design-anti-slop, impeccable, frontend-design, accessibility-audit, secure-code-guardian, error-handling, incremental-implementation, verification-before-completion, launch and shipping-and-launch.

No matching ChatGPT-hosted Skill was available for this exact codebase-repair task, so the applicable project-local skill checklists were used instead.

## Issues solved or materially hardened

1. Fake published article data was removed from `apps/web/data/articles.json`; the default public store now starts empty instead of shipping seeded articles as live news.
2. Seed scripts now create draft content by default and only publish when explicitly run with `--publish`.
3. Public launch readiness is enforced with a visible blocker banner unless legal publisher, editor, registration, CMS and provider settings are configured.
4. Legal/trust footer and policy surfaces no longer imply missing registration or publisher data exists.
5. The ad system now has a real placement taxonomy, reserved dimensions, house/network/off modes and impression event endpoint.
6. Homepage, hub pages, article body, right rail and mobile sticky inventory now use keyed ad placements.
7. Utility and market pages no longer display fallback weather/AQI/NEPSE/gold/forex values as official live data.
8. Live-widget fallback labels are always visible when fallback data is used.
9. The article editor now submits the field names the API actually expects: `categorySlug`, `tagSlugs`, `isFeatured`, `seoTitleNe`, `heroCaptionNe` and related fields.
10. Draft edit pages now find articles by id or slug and can edit unpublished stories.
11. New article redirects use the saved article id to avoid slug ambiguity.
12. Editor body shorthand is converted into typed `ArticleBlock[]` server-side.
13. Publishing defaults now flip `noIndex=false` and `includeInNewsSitemap=true`; non-published content stays noindex/out of the news sitemap.
14. Workflow stages are validated server-side on create/update.
15. Article page language switching no longer dead-ends on English routes with no reviewed English translation; it shows a labeled Nepali fallback and noindexes that fallback English view.
16. Missing article subcomponents were restored: corrections notice and tag row now export from `ArticleBody.tsx`.
17. Article comments now respect the article's `commentsEnabled` setting.
18. Reader comment moderation is now functional in `/admin/comments` with list, status filter and approve/reject/flag actions.
19. Account/saved copy now clearly states what is browser-local versus account-backed.
20. Cookie consent was localized and made more explicit about essential, analytics and personalization choices.
21. The wordmark no longer claims the old verification tagline; it now uses a less misleading public-interest label.
22. Original AI-slop phrases and previous mock/seed public-surface leak phrases were scanned and removed from the audited reader surface.

## Still not truly solvable without real operational inputs

These are not code-only tasks and must be completed before a real public launch:

- Real legal publisher name, DoIB/registration number, editor-in-chief, newsroom phone, address and corrections contact.
- Real Payload/Postgres production CMS configuration, or an explicit decision to operate the JSON store outside serverless read-only deployment.
- Real ad vendor/direct sales process, campaign trafficking and billing rules.
- Real market/weather/AQI/forex provider credentials and source agreements.
- Real newsroom content, bylines, image rights, source attribution and editorial QA.
- Hindi support as a full locale (`hi` routes, dictionaries, fields, hreflang, sitemap and editorial workflow), not a cosmetic toggle.

## Verification performed

Passed:

```bash
node scripts/audit-public-surface.mjs
node JSON parse check for package/app package/articles data
AI-slop/seed/public-surface grep scan
```

Blocked by sandbox dependency/network state:

```bash
corepack pnpm --version
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`corepack` could not download `pnpm@9.12.0` from `registry.npmjs.org` because DNS resolution failed with `EAI_AGAIN`. A raw global `tsc` run is not meaningful here because the repo has no installed dependencies/workspace package resolution in the sandbox; it cannot resolve Next, React, workspace tsconfig, Node types or `@nagarikwatch/*` packages.

## Required local verification after unzip

Run from the repo root in a normal networked Node 22+ environment:

```bash
corepack enable
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm audit:public
```
