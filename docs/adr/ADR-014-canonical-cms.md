# ADR-014: Canonical CMS and admin boundary

Date: 2026-07-06
Status: Accepted for v14

## Decision

Payload CMS (`apps/admin`) is the canonical source of truth for newsroom content in production.

The custom admin inside `apps/web/app/admin` remains only for operational surfaces that are not full article authoring: launch readiness, ad placements, comments, live widgets, SEO checks, wire review, account roles, and diagnostics.

Production must set:

- `PAYLOAD_CONTENT_SOURCE=payload`
- `DATABASE_URL=<postgres url>`
- `ENABLE_WEB_ADMIN_SCAFFOLD=true` only when the operations dashboard is intended to be reachable.

## Why

V13 had two competing content-authoring paths: Payload and the custom web admin JSON store. That creates drift in workflow stages, fields, permissions, and SEO behavior. A real newsroom needs one editorial source of truth.

## Consequences

- Payload owns article bodies, categories, media, authors, workflow and publishing.
- The JSON store remains a preview/dev fallback and is launch-gated out of live mode.
- `/admin/articles` in the web app should be treated as legacy/dev unless the team explicitly keeps it as an operations shortcut.
- Launch gate and launch banner block live deployments unless Payload is active.

## Follow-up work

- Add direct links from the web operations admin to the Payload admin.
- Remove or hide duplicate article-authoring screens after migration acceptance.
- Ensure Payload collections map one-to-one to `@nagarikwatch/db` shared types.
