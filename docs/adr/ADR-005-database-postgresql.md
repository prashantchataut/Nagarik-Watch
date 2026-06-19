# ADR-005: Database, PostgreSQL

- **Status:** Accepted
- **Date:** 2026-06-18
- **Decision owner:** Architect
- **Supersedes:** none

## Context

The portal's data is **strongly relational**:

- Articles belong to one Category, have many Tags, many Authors, one source attribution,
  many Revisions, many Media references.
- Menus have ordered items; Authors have roles; Ads have placement + targeting rules.
- Search must work across title + deck + body in both Nepali and English.
- Editorial workflow needs transactions (status transitions, publish + index update +
  webhook fire as an atomic-ish unit).

We also want to avoid running a **second datastore** at launch (no separate search engine,
no separate cache store beyond the CDN) to keep the solo-dev ops surface small.

## Alternatives considered

| Option        | Pros                                          | Cons                                                       |
|, , , , -|, , , , , , , , , , , , -|, , , , , , , , , , , , , , , |
| **PostgreSQL**| ACID, relational, mature FTS, JSONB for flexible fields, Payload-native via Drizzle | Vertical scale has limits (fine at our scale)              |
| **MySQL / MariaDB** | Mature, common in shared hosting        | Weaker full-text story; Payload's first-class story is Postgres |
| **MongoDB**   | Flexible schema, good for content            | We lose relational integrity + transactions; Payload's Postgres adapter is stronger |
| **SQLite (Turso/libSQL)** | Zero-ops, embedded                 | Concurrency + write scaling limits for a newsroom editing all day; backups less convenient |
| **Postgres + separate search (Meilisearch/Typesense) from day 1** | Best search | Second system to operate before traffic justifies it |

## Decision

Use **PostgreSQL 16+** as the single primary datastore, accessed through Payload CMS's
**Drizzle adapter**. Schema and migrations live in `apps/admin/migrations/` and are
version-controlled.

## Rationale

- **Relational fit:** articles/taxonomy/authors/revisions are textbook relational data.
  Postgres gives us integrity, joins, transactions, and constraints for free.
- **One store for content + search:** Postgres **full-text search** (with a
  `tsvector` index on title + deck + body) is more than enough at launch and through
  moderate scale, so we defer Meilisearch/Typesense until traffic/query-volume justifies
  it (see Open items).
- **Payload-native:** Payload's Postgres+Drizzle adapter is first-class; migrations are
  code, reviewable in PRs.
- **JSONB for flexibility:** semi-structured bits (rich-text body blocks, ad targeting
  rules, custom per-category metadata) fit in JSONB columns without losing the relational
  backbone.
- **Bilingual search:** Postgres FTS handles both Devanagari and Latin; we maintain
  separate indexes per locale for relevance.
- **Managed options:** wherever the origin lands (ADR-004), managed Postgres (Neon,
  Supabase, or the VPS for Option B) gives us backups, PITR, and HA when budget allows.

## Consequences

- **Positive:** one datastore; transactions; strong integrity; built-in search; schema as
  code; Payload alignment.
- **Negative:** Postgres FTS relevance and typo-tolerance trail dedicated search engines;
  acceptable now, may need to migrate later (see Open items).
- **Negative:** vertical scaling, mitigated by read-heavy workload being CDN-cached, and
  by managed-Postgres vertical scale headroom.

## Trade-offs

Operational simplicity (one datastore, schema-as-code, built-in search) is prioritised
over the best-in-class search relevance of a dedicated engine and the horizontal scale of
a document DB. Both can be added later without rearchitecting the editorial model.

## Open items

- **FTS → Meilisearch migration threshold:** define the trigger (e.g. search p95 latency
  > 200ms, or article count > 50k, or editor demand for typo-tolerance / faceting). The
  migration is additive (write-through from Payload hooks), not a rewrite.
- **Revisions retention policy:** keep last N revisions per article to bound DB growth
  (Open item in ADR-002).
- **Backups + PITR:** confirm the managed provider's backup cadence; document a quarterly
  restore test (architecture.md §6).
- **Devanagari tokenization in FTS:** verify Postgres's default tokenizer handles Nepali
  matras/conjuncts adequately; if not, configure a custom dictionary or move that field
  to a dedicated search engine earlier.
