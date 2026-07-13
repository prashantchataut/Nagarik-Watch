# ADR-014: Canonical CMS and admin boundary

- **Date:** 2026-07-06
- **Status:** Accepted and implemented (updated 2026-07-12)

## Decision

Payload CMS (`apps/admin`) is the sole source of truth for production editorial content.
It is deployed as a separate application. `apps/web` consumes public content through
Payload's server-side REST API using `PAYLOAD_PUBLIC_SERVER_URL`.

The custom admin in `apps/web/app/admin` is an operations surface for auth/users, launch
readiness, comments, submissions, contact, live data, live blogs, newsletters, polls, ads,
audit records, settings, and diagnostics. When Payload is canonical, article, category,
tag, author, and media routes redirect to Payload and web shadow-store mutations are
rejected.

The dedicated journalist desk remains in `apps/web`. It creates Payload drafts through a
least-privilege service-account API key. The Better Auth journalist email must match an
active Payload Authors document.

Production requires:

- `CONTENT_SOURCE=payload`
- `PAYLOAD_PUBLIC_SERVER_URL=<cms origin>`
- `DATABASE_URL=<postgres url>`
- `PAYLOAD_DB_PUSH=false`
- `PAYLOAD_API_TOKEN=<least-privilege bridge key>` when the journalist desk is enabled

## Why

Earlier revisions had three incompatible assumptions:

1. Payload was a separate deployment.
2. The web app attempted to import `@payload-config` and use the Local API despite not
   depending on Payload or sharing its build context.
3. The web admin could write a JSON/operational article store that the public Payload
   reader never consumed.

That topology could produce successful-looking writes that never appeared publicly, and
the Local API import could not resolve in the web deployment. A real newsroom needs one
content authority and an explicit network boundary.

## Consequences

- Payload owns article bodies, taxonomy, authors, media, revisions, workflow, and publish
  state.
- The public web app depends on Payload REST availability; failures surface as errors rather
  than falling back to invented or stale production content.
- CMS media URLs are resolved against the Payload origin, while object-storage hosts are
  explicitly admitted by the web image configuration.
- The local JSON store remains a development-only seam and is rejected in production.
- Better Auth and operational `nw_*` data remain web concerns, backed by Postgres in
  production.
- Shared `@nagarikwatch/db` types remain the rendering contract, but mapping at the REST
  boundary is explicit and testable.

## Follow-up

- Add contract tests against a disposable Payload/Postgres environment.
- Add signed on-demand revalidation hooks after Payload publish/update.
- Replace lazy operational DDL with reviewed migrations.
- Evaluate a private service URL for web-to-CMS reads to reduce public-hop latency.
