# ADR-015: Durable engagement and operational storage

- **Status:** Accepted
- **Date:** 2026-07-06
- **Last reviewed:** 2026-07-12

## Decision

Postgres is mandatory for live runtime state, including reader engagement, contact messages, submissions, newsroom live overrides, polls, newsletters, advertisements, audit records, journalist workflow metadata, and distributed rate-limit counters.

Representative tables include:

- `nw_comments`, `nw_poll_votes`, `nw_bookmarks`, `nw_reading`
- `nw_newsletter_subscribers`, newsletter drafts and delivery queue state
- `nw_contact_messages`, `nw_submissions`, `nw_polls`
- newsroom live-data override and live-blog records
- `nw_rate_limits`

When `DATABASE_URL` is absent, local development uses `.data/` files or process memory according to the module. Production code fails loudly instead of silently falling back to ephemeral state. The launch gate blocks live status without Postgres.

## Why

Server restarts, serverless cold starts, and multi-instance deployments make local filesystem and process memory unsuitable for production newsroom and reader data.

## Consequences

- Public API contracts remain stable while persistence is durable.
- Operational state does not compete with Payload’s role as canonical editorial content storage.
- Lazy table setup remains a bootstrap convenience, not the desired long-term migration strategy.

## Follow-up work

- Replace lazy DDL with reviewed, versioned migrations before high-traffic launch.
- Add retention, export, and deletion tooling for privacy requests.
- Add newsletter unsubscribe and delivery-provider reconciliation.
- Add database integration tests for concurrent voting, rate limits, and moderation transitions.
