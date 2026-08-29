# ADR-014: Canonical CMS and admin boundary

- **Date:** 2026-07-06
- **Status:** Accepted (amended 2026-08-28 — Payload default, no runtime news fixtures)

## Decision

Payload CMS (`apps/admin`) is the canonical source of truth for editorial content in every normal deployment mode. The public app consumes content through Payload's server-side REST API using `PAYLOAD_PUBLIC_SERVER_URL` and a least-privilege service token where required.

`CONTENT_SOURCE` defaults to `payload`. `CONTENT_SOURCE=json` is an explicit local/emergency compatibility mode only; it is never selected implicitly when Payload is missing. A Payload-declared deployment that lacks its CMS URL fails closed instead of silently serving a different article store.

The custom admin in `apps/web/app/admin` is the operations surface for auth/users, launch readiness, comments, submissions, contact, live data, live blogs, newsletters, polls, ads, audit records, settings and diagnostics. It is not a second production article CMS. When Payload is canonical, article/category/tag/author/media links route to Payload and shadow-store mutations are rejected.

The journalist desk remains in `apps/web`. In Payload mode it creates and updates drafts through the CMS bridge; the Better Auth journalist identity must match an active Payload author.

Source-code article fixtures are not shipped. Payload's development seed may create structural categories and shared desk identities, but it never creates or publishes articles. Volatile tags/topics are created in the CMS.

## Required production topology

- `CONTENT_SOURCE=payload` or omitted (Payload is the default)
- `PAYLOAD_PUBLIC_SERVER_URL=<cms origin>`
- `PAYLOAD_API_TOKEN=<least-privilege bridge token>` where journalist/admin bridge actions are enabled
- `DATABASE_URL=<postgres url>` for auth and operational data
- `PAYLOAD_DB_PUSH=false`
- `REVALIDATE_SECRET=<signed reader-cache webhook secret>`

`CONTENT_SOURCE=json` is reserved for an intentional local/emergency recovery procedure and must never be used as an automatic fallback.

## Why

Earlier revisions had multiple incompatible assumptions: Payload existed as a separate deployment, the web app retained its own article CRUD/store, and several build/dev paths could silently choose the shadow store. That topology allowed an editor to see a successful write that the reader site never consumed. Hardcoded edition fixtures made the split even harder to detect because an apparently populated site could be running without the CMS at all.

A real newsroom needs one editorial authority, an explicit network boundary, and failure states that remain visible.

## Consequences

- Payload owns article bodies, taxonomy, authors, media, revisions, workflow and publish state.
- The public app does not invent or auto-seed journalism when Payload is unavailable.
- CMS media URLs are resolved against the Payload/storage origin.
- The JSON/Postgres article store is compatibility debt, not a peer CMS. Its remaining routes/files may be deleted after the cutover checklist proves no deployment depends on `CONTENT_SOURCE=json`.
- Better Auth and `nw_*` operational data remain web concerns.
- Shared `@nagarikwatch/db` types remain the rendering contract, with explicit mapping at the REST boundary.

## Cutover completion criteria

1. Production and preview both report `contentMode=payload`.
2. Editorial publishing, scheduling, unpublishing and media upload work in Payload.
3. Journalist draft creation works through the Payload bridge if enabled.
4. Reader revalidation fires after publish/update/delete.
5. No deployment, workflow or operator runbook depends on `CONTENT_SOURCE=json`.
6. Only then remove the shadow article CRUD/API/store files listed in the phase-2 deletion manifest.

## Follow-up

- Add contract tests against a disposable Payload/Postgres environment.
- Keep signed on-demand revalidation covered by integration tests.
- Replace lazy operational DDL with reviewed migrations.
- Evaluate a private web-to-CMS service URL for lower latency.
