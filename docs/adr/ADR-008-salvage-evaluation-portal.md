# ADR-008: Salvage from the AI-generated evaluation portal

- **Status:** Superseded in part by ADR-014 and ADR-015
- **Date:** 2026-07-02
- **Last reviewed:** 2026-07-12

## Context

A standalone generated portal collided with the canonical pnpm/Turborepo workspace. Useful pieces were reviewed and selectively moved into `apps/web`; duplicate framework, auth, and content layers were rejected.

## Adopted

1. Additional JSON-LD builders in `apps/web/lib/json-ld.ts`.
2. A common public-write rate-limit interface in `apps/web/lib/rate-limit.ts`.

## Current state

The original per-process limiter described by this ADR is no longer the production implementation. Public write limits use atomic Postgres counters in production and an in-memory implementation only for local development. Better Auth also uses database-backed rate-limit storage in production.

Reader accounts are implemented through Better Auth rather than a second JWT/session stack. Payload remains the canonical production editorial content system; operational reader state is stored in Postgres.

## Consequences

- There is one reader frontend and one authentication system.
- No generated Prisma/SQLite content layer is retained.
- ADR-014 defines the Payload REST deployment boundary.
- ADR-015 defines durable engagement and operational storage.
