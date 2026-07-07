# ADR-015: Durable engagement and subscriber storage

Date: 2026-07-06
Status: Accepted for v14

## Decision

Reader engagement state uses Postgres when `DATABASE_URL` is configured:

- `nw_comments`
- `nw_poll_votes`
- `nw_bookmarks`
- `nw_reading_history`
- `nw_newsletter_subscribers`

When `DATABASE_URL` is absent, the app uses process-local memory for development and preview only. Live launch is blocked without Postgres.

## Why

Comments, bookmarks, reading history, poll votes and newsletter confirmations cannot be process-local in a production news site. Server restarts, serverless cold starts and multi-instance deployments would otherwise lose user data.

## Consequences

- Public write APIs keep the same route contract.
- Tables are created lazily by the server module to keep setup simple for the current scaffold.
- A future migration system should replace lazy DDL before high-traffic launch.
- Launch readiness flags `DATABASE_URL` as a live blocker.

## Follow-up work

- Move lazy DDL to formal migrations.
- Add moderation/audit tables for all comment state changes.
- Add newsletter unsubscribe and export flows.
- Add retention policy and privacy tooling for reader data deletion.
