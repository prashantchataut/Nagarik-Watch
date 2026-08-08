# Phase 2, Editorial CMS & workflow

> Goal: make the CMS a real newsroom tool, full content model, roles, draft→review→
> publish workflow, revisions, scheduling, a media library that enforces alt text, search,
> and the wire/aggregation ingestion pipeline. By the end, a journalist can run their whole
> day inside `apps/admin`.
>
> Governed by planning-and-task-breakdown: vertical slices, S/M tasks (≤5 files),
> acceptance + verification, checkpoints. Reference: content-model.md, editorial-workflow.md.

## Overview

Phase 1 shipped a publishable Article/Category; Phase 2 deepens the CMS to the full
content model and the workflow rules, plus ingestion. The reader site gains **search** and
**author/topic** polish, and consumes the new content types as they arrive.

## Architecture decisions active this phase

- ADR-002 (Payload), ADR-005 (Postgres FTS for search), editorial-workflow.md (roles +
  attribution rules), content-model.md (full model)., -

## Task list

### Task 2.1: Roles + RBAC in Payload

**Description:** implement the five roles (`author`, `copyeditor`, `editor`, `publisher`,
`admin`) with access policies matching editorial-workflow.md §1. Enforce the breaking-flag
permission and the "author cannot self-publish" rule.

- **Acceptance:**
  - [ ] Each role sees/edits/publishes exactly what the matrix allows.
  - [ ] `isBreaking=true` rejected for non-`editor`/`publisher` (or non-section).
  - [ ] `author` cannot move an Article to `published`.
- **Verify:** integration tests asserting each role's allowed/forbidden transitions.
- **Dependencies:** Phase 1.
- **Files:** `apps/admin/src/access/{roles,policies}.ts`, collection access functions.
- **Size:** M.

### Task 2.2: Draft → review → publish workflow stage

**Description:** add a `workflowStage` field + the state machine from editorial-workflow.md
§2 (draft/review/scheduled/published/unpublished), with the review queue UI and
"request changes" back-transition.

- **Acceptance:**
  - [ ] Review queue lists `review` items oldest-first, filterable by section.
  - [ ] Only the permitted roles advance/reject each transition.
  - [ ] Unpublish reverts to `draft`; public URL 410s or redirects to category.
- **Verify:** walk a story draft→review→publish→unpublish as different roles.
- **Dependencies:** 2.1.
- **Files:** `apps/admin/src/collections/Articles.ts` (workflow fields), `apps/admin/src/components/ReviewQueue.tsx`, hooks.
- **Size:** M.

### Task 2.3: Revisions + scheduling

**Description:** enable Payload revisions (keep last 25, ADR-002 open item), diff/rollback
UI, and scheduled publishing via `publishAt`.

- **Acceptance:**
  - [ ] Saving a published article creates a revision; rollback works.
  - [ ] Future `publishAt` hides the story until then; scheduler publishes it automatically.
  - [ ] Editorial calendar view shows upcoming scheduled items.
- **Verify:** schedule a story 2 minutes ahead; it appears publicly at T+0.
- **Dependencies:** 2.2.
- **Files:** `apps/admin/src/collections/Articles.ts` (versions config), calendar component.
- **Size:** M.

### Task 2.4: Media library with alt-text enforcement

**Description:** stand up the `Media` collection (content-model.md §5) with **required alt
text**, credit/caption/license/sourceUrl fields, width/height capture for reserved sizes.

- **Acceptance:**
  - [ ] Upload rejects an image with empty alt (client + server validation).
  - [ ] Object-storage adapter works (default R2; swappable per ADR-003); served via `next/image` transforms.
  - [ ] License=external requires sourceUrl.
- **Verify:** try to save an image without alt → blocked; image renders on web with transform.
- **Dependencies:** Phase 0 R2.
- **Files:** `apps/admin/src/collections/Media.ts`, `apps/web/lib/media.ts`.
- **Size:** M.

### Task 2.5: Taxonomy, Tags/Topics + Author (columnist) pages

**Description:** add `Tag`, `Author` collections (content-model.md §3–4), wire Author to
the existing author page, enrich Topic pages, and add columnist support (role + column
category).

- **Acceptance:**
  - [ ] Authors have bio/photo/social; author pages list their work.
  - [ ] Tags drive topic pages across categories.
  - [ ] Columnists surface under their column category.
- **Verify:** seed authors + tags; visit pages; assert content + SEO.
- **Dependencies:** Phase 1 author/topic pages.
- **Files:** `apps/admin/src/collections/{Tags.ts,Authors.ts}`, web query layer additions.
- **Size:** M.

### Task 2.6: Source attribution enforcement + on-site rendering

**Description:** hard-enforce the attribution rules (content-model.md §1, editorial-
workflow.md §3) and render the linked attribution line for `aggregated`/`wire` articles.

- **Acceptance:**
  - [ ] Cannot save/publish `sourceType ≠ original` without `sourceName`+`sourceUrl`+`sourcePublishedAt`.
  - [ ] On-site attribution line links to the origin; cannot be removed by editing copy.
- **Verify:** create aggregated + wire articles; assert blocks + rendered lines.
- **Dependencies:** 2.4.
- **Files:** `apps/admin/src/collections/Articles.ts` (validate hook), `apps/web/components/attribution-line.tsx`.
- **Size:** S.

### Task 2.7: Search (Postgres FTS) end to end

**Description:** add a `tsvector` index on Article title + deck + body (per locale), a
Payload-backed search query, and `/[locale]/search?q=` page with result cards + empty
state + recent searches.

- **Acceptance:**
  - [ ] Search returns relevant results in both locales (Devanagari + Latin).
  - [ ] Empty/no-result states are helpful and on-brand.
  - [ ] Search p95 < 200ms on the seed set.
- **Verify:** search several Nepali + English terms; assert relevance + performance.
- **Dependencies:** 2.5; FTS tokenizer check (ADR-005 open item).
- **Files:** migration (FTS index), `apps/web/lib/search.ts`, `apps/web/app/[locale]/search/page.tsx`.
- **Size:** M.

### Task 2.8: Menu manager (globals)

**Description:** implement the `Menu` globals (primary/footer/mobile/utility) editable in
the CMS (content-model.md §6, §10) consumed by the chrome components.

- **Acceptance:**
  - [ ] Editors reorder nav without code changes; one level of nested children supported.
  - [ ] Chrome reflects menu changes after publish revalidate.
- **Verify:** edit primary menu in CMS; nav updates on the site.
- **Dependencies:** Phase 1 chrome.
- **Files:** `apps/admin/src/globals/Menus.ts`, `apps/web/lib/menus.ts`, chrome wiring.
- **Size:** M.

### Task 2.9: Wire/RSS ingestion pipeline

**Description:** build `packages/ingest`: configurable RSS/wire sources, fetch + normalize

- dedupe (by sourceUrl + title hash), sanitize HTML, re-host images to R2 with alt text,
  and create **draft** `wire` Articles in the review queue.

* **Acceptance:**
  - [ ] Cron pulls feeds on schedule; new items appear as drafts for editor review.
  - [ ] No raw HTML is injected (sanitized); images re-hosted.
  - [ ] Duplicate items across feeds are deduped, not double-created.
* **Verify:** point at a real RSS feed; ingest; see drafts appear; reject the bad ones.
* **Dependencies:** 2.4, 2.6.
* **Files:** `packages/ingest/src/{index.ts,sources.ts,sanitize.ts,dedupe.ts}`, cron config.
* **Size:** M (split if needed: ingest-core / sanitize-dedupe).

### Task 2.10: Publish webhook + revalidate hardening

**Description:** make the publish→revalidate webhook robust: HMAC-signed, idempotent,
tag-based cache purge, with a periodic sitemap-driven revalidation sweep as a backstop.

- **Acceptance:**
  - [ ] Unsigned/forged webhooks rejected.
  - [ ] Repeated publishes don't cause duplicate work (idempotent).
  - [ ] Sweep catches any article whose publish webhook was lost.
- **Verify:** drop a webhook (simulate loss); sweep revalidates the article.
- **Dependencies:** Phase 1 deploy.
- **Files:** `apps/web/app/api/revalidate/route.ts`, `apps/admin/src/hooks/afterChange.ts`, sweep job.
- **Size:** M.

### Task 2.11: Breaking ticker global + push stub

**Description:** implement the `BreakingTicker` global; render the ticker from it; enqueue
a (no-op in Phase 2) push event respecting the rate cap. Real push ships in Phase 3.

- **Acceptance:**
  - [ ] `publisher` sets a breaking item; ticker site-wide reflects it within seconds.
  - [ ] Rate cap enforced; over-cap noted to the editor.
  - [ ] Un-flagging removes it from the ticker.
- **Verify:** set/clear breaking as publisher; observe ticker + cap behavior.
- **Dependencies:** 2.1, 2.10.
- **Files:** `apps/admin/src/globals/BreakingTicker.ts`, `apps/web/components/breaking-ticker.tsx`, push-queue stub.
- **Size:** M.

### Task 2.12: Corrections & updates UX

**Description:** surface `corrections[]` as a visible dated notice and the "यो लेख अपडेट
भएको छ" update notice when `updatedAt ≠ publishedAt` (editorial-workflow.md §5).

- **Acceptance:**
  - [ ] Correction notice renders above the body with date + summary.
  - [ ] Update notice renders when the article was edited after publishing.
- **Verify:** add a correction + an update; assert both notices.
- **Dependencies:** Phase 1 article page.
- **Files:** `apps/web/components/{correction-notice.tsx,update-notice.tsx}`.
- **Size:** S., -

## Checkpoint: Phase 2 → Phase 3 gate

- [ ] A journalist can take a tip → published (or scheduled) entirely in the CMS, under
      the correct role rules, in < 10 minutes (SPEC.md success criterion).
- [ ] Aggregated/wire attribution is enforced and rendered; sponsored type not yet (Phase 4).
- [ ] Search works in both locales; FTS performance within budget.
- [ ] Ingestion creates clean, deduped drafts; no raw HTML injection.
- [ ] Publish → revalidate robust (signed, idempotent, swept).
- [ ] Editorial review: walk the full workflow as each role.

## Risks this phase surfaces

| Risk | Mitigation |
|, -|, -|
| Devanagari FTS relevance poor (ADR-005) | Spike tokenizer early in 2.7; fall back to a custom dictionary or move that field to Meilisearch sooner |
| Revisions inflate the DB | Keep last 25; archive older; monitor size |
| Ingestion pulls a poisoned feed | Strict Zod + sanitize; quarantine bad items; never auto-publish |
