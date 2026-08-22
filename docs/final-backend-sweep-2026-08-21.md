# Nagarik Watch final backend sweep — 2026-08-21

## Scope

This sweep focuses on the reader publication path, editorial consistency, reader-engagement persistence, trending detection, comments/reactions, author/tag invalidation, and ePaper session safety. It is intentionally conservative: it changes existing contracts where the repository already has a source of truth and avoids inventing new provider or newsroom workflows.

## Publication and frontend visibility

The public-reader predicate is now shared by the Payload access layer, Payload hook visibility checks, admin health diagnostics, and the web reader query layer. A public article must satisfy all three conditions:

1. Payload `_status` is `published`.
2. `workflowStage` is `scheduled`, `published`, or `updated`.
3. `publishAt` exists and is at or before the request time.

`noIndex` remains an SEO/distribution directive and does not hide a story from readers.

The reader now uses the exact request timestamp for the `publishAt` cutoff. The previous time-bucket optimization could make the first ISR render after a publish webhook query with a cutoff older than the article's new `publishAt`; that stale render could then survive until the route's normal ISR interval. The exact cutoff removes that race. Last-known-good Payload cache keys normalize the cutoff timestamp separately so CMS outage fallback remains reusable.

Admin `/healthz` now reports `publicationTimingDrift` in addition to `publicationDrift`. A published, public-workflow article with no `publishAt` therefore has an explicit operational signal instead of silently being made visible.

Revalidation now covers the current and prior article/category location, home/latest/trending/search surfaces, RSS/Atom/JSON feeds, news/image/video/normal sitemaps, and current plus previous author/tag routes. Reassigning an author or tag no longer leaves the old profile/topic page stale.

## Content authority

The existing live-source guard remains fail-closed: when Payload is canonical, web-side editorial writes do not claim success against the local shadow store. The final sweep did not add another content store or a second publication authority.

## Trending detection

The trending detector now separates the current short window from the preceding baseline window. Previously, the same current-window engagement could contribute to both the numerator and baseline, muting or distorting burst detection. The detector also:

- respects custom short-window sizes in burst-rate math;
- ignores future-dated telemetry;
- clamps negative/non-finite engagement inputs;
- applies safe option bounds;
- keeps the detector pure and testable.

Reader emoji reactions were removed from trending inputs because they are low-confidence, client-controlled signals. Reading/deep-scroll data, approved comments, bookmarks, and first-party ranking events remain inputs. Ranking events are still client-originated and should receive stronger session/user deduplication before they are treated as manipulation-resistant.

## Engagement database architecture

Production request paths no longer attempt opportunistic engagement-schema DDL. Production relies on versioned operational migrations; local/development fallback can still self-bootstrap where permitted.

Migration `0015_engagement_hot_path_indexes.sql` adds indexes matching the public-comment and rolling-trending predicates for approved comments, bookmarks, reading events, and ranking events. Because the migration runner wraps each migration in a transaction, these indexes intentionally do not use `CREATE INDEX CONCURRENTLY`; apply the migration in a normal deployment window and watch lock/wait metrics on unusually large tables.

## Comments, review/moderation, and reactions

Comments remain pre-moderated. Normal accepted submissions enter `pending`, and public reads return approved comments only.

The comment API now:

- resolves the canonical currently-public article before reading or writing;
- enforces `commentsEnabled` on the server;
- derives the public byline from the authenticated session instead of trusting a browser-supplied author name;
- validates reply parents and approved-comment votes;
- returns controlled `503` responses for storage failures;
- returns upvote counts expected by the client;
- uses a session-sensitive ETag with `private, no-cache, must-revalidate` and `Vary: Cookie`.

The article comment component polls every 15 seconds while the tab is visible, uses conditional requests, avoids overlapping fetches, and preserves the submitting reader's local pending-moderation item until it appears in the approved feed. This is near-real-time, not a claim of true server push. The current Vercel/Node architecture has no durable pub/sub layer configured for WebSocket/SSE fanout, so adding fake in-process push would be less reliable than bounded polling.

Reaction writes and reads now resolve a canonical currently-public article. Arbitrary/unpublished client article identifiers can no longer create or expose reaction state. Reactions are not an input to trending.

## Author/journalist and tag flow

Payload already models article authors as relationships and keeps editor/fact-check/copy-edit roles separately. Reader card mapping now retains article tags, and publication revalidation invalidates both old and new author/tag routes when relationships change.

No schema-breaking author-role redesign was added in this sweep because doing so safely requires a generated/reviewed Payload migration and product decisions about public credit roles. The current model remains authoritative rather than being silently replaced.

## ePaper / news edition

The ePaper index and dated edition pages now use the repository's shared `pageDynamic` build-mode contract. On the live Node origin they are dynamic because entitlement is session-dependent; in the API-less static Cloudflare Pages preview they remain exportable. This prevents a signed-in entitlement result from being treated as a globally static page.

The sweep deliberately did not invent an edition database or fake print inventory. The existing edition source remains honest. If immutable daily editorial editions are required, that should be a separate schema/workflow project with migration and newsroom sign-off.

## UI/UX collision notes

The following changed files can overlap a parallel UI branch:

- `apps/web/components/article/CommentSection.tsx`
- `apps/web/components/article/ReactionBar.tsx`
- `apps/web/app/[locale]/[category]/[slug]/page.tsx` (one behavioral prop change)
- `apps/web/app/[locale]/epaper/page.tsx`
- `apps/web/app/[locale]/epaper/[date]/page.tsx`
- `apps/admin/src/collections/Articles.ts` (workflow helper copy)

When merging, preserve the behavioral changes even if the JSX/CSS is replaced by the UI branch: canonical API parameters, explicit `commentsEnabled === true`, visibility-aware comment refresh, and session-aware ePaper dynamic mode.

## Verification completed in this environment

- `git diff --check` with CRLF-aware whitespace rules.
- TypeScript syntax transpilation of every changed `.ts`/`.tsx` file using TypeScript 5.8.3.
- Direct execution assertions for publication and trending algorithms.
- Nagarik Watch newsroom audit: 0 failures; 1 warning about direct quotes in seed news requiring source verification.
- Canonical workspace verification.
- Workspace lockfile verification.
- Architecture audit.
- Route matrix generation/audit.
- Public-surface audit.
- UI-ban audit.
- Internal trust/policy link audit.
- Performance-budget self-test.
- ZIP validator syntax check.

Full dependency-aware lint/typecheck/Vitest/build/E2E execution was not possible in this environment because pnpm dependencies are not installed and the environment cannot resolve the npm registry. This is a verification gap, not a pass.

## Required deployment verification

Run, in order, from a networked development/CI environment with real launch configuration:

```bash
pnpm install
pnpm --filter @nagarikwatch/web migrate:ops
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm verify:static
pnpm --filter @nagarikwatch/web build
pnpm --filter @nagarikwatch/admin build
pnpm test:e2e
pnpm test:e2e:newsroom
pnpm validate:newsroom
node scripts/launch-gate.mjs
node scripts/verify-workspace-lock.mjs
```

Then verify with real Payload/Postgres/Blob deployments:

- publish a new immediate story and confirm direct URL, latest, category, home placement, feeds, and sitemaps update;
- schedule a future story and confirm it is absent before `publishAt`, present after scheduler/revalidation, and notified only at the intended transition;
- rename slug/category/author/tag and confirm old and new affected routes invalidate correctly;
- confirm `/healthz` reports both publication drift counters at zero;
- submit, approve, reply to, vote on, and remove comments according to moderation rules;
- confirm ePaper entitlement differs correctly between signed-in entitled and non-entitled sessions;
- inspect query plans/lock timing for migration `0015` on production-sized engagement tables.

## Recommended next tasks

1. Add a Payload/Postgres integration test that proves relationship filters such as `authors.author.slug` and `tags.tag.slug` work against the deployed Payload version; if not, resolve slug-to-ID before relationship filtering.
2. Add session/user uniqueness and anomaly caps to ranking-event inputs before treating trending as manipulation-resistant.
3. Add an admin-facing “Why is this not public?” panel backed by the shared publication diagnostics and `/healthz` counters; keep its UI separate from the current parallel redesign until merge.
4. Add durable event/pub-sub infrastructure only if true sub-second comment updates are a product requirement; until then keep bounded visibility-aware polling.
5. Decide whether Nagarik Watch needs immutable daily editions. If yes, design a versioned edition/revision model instead of freezing the live homepage implicitly.
6. Add a data-retention policy for engagement telemetry, comment moderation/audit data, and stale reactions/bookmarks, with indexes and scheduled cleanup validated against production volume.
7. Run the complete launch gate with `NEXT_PUBLIC_LAUNCH_STATUS=live` only after production secrets, Payload URL, Postgres, Blob, Cloudflare, and revalidation secret are real.
