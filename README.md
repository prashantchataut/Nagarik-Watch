# Nagarik Watch (नागरिक वाच)

A modern, Devanagari-first **web news portal for Nepal**. Nepali primary, with a dedicated
**author-reviewed English** section (never machine translation). Hybrid editorial model
(original + aggregated-with-attribution + wire). Ad-supported, free to read.

This repository contains the **full planning foundation** (spec, architecture, ADRs,
content model, editorial workflow, phased task lists) plus the monorepo scaffolding.
Reader app + CMS code lands in the phased builds.

## Status

🟢 **Planning complete · Phase 0 (foundation) in progress.**
See [docs/phase-0-tasks.md](docs/phase-0-tasks.md) for current work.

## Tech stack (summary)

- **Next.js** (App Router) + **TypeScript** (strict) + **Tailwind CSS**, reader portal
- **Payload CMS** (self-hosted, in-repo), editorial tool
- **PostgreSQL**, content + full-text search
- **Edge/CDN + object storage** behind a swappable adapter (default: Cloudflare; ADR-003)
- **Plausible + GA4** analytics · **AdSense → GAM** ads

## Repository layout

```
apps/
  web/      Next.js reader portal
  admin/    Payload CMS (editorial)
packages/
  db/       shared content types + Zod schemas
  ui/       design system (Civic Crimson tokens, primitives)
  infra/    swappable edge + storage adapters (ADR-003)
  ingest/   RSS/wire ingestion
  tsconfig/ shared TS configs
docs/       architecture, ADRs, content model, editorial workflow, phase task lists
PRODUCT.md  DESIGN.md  SPEC.md   impeccable + spec-driven context
```

## Planning documents (read these first)

1. [PRODUCT.md](PRODUCT.md), brand, users, tone, anti-references, principles
2. [DESIGN.md](DESIGN.md), **Civic Crimson** palette, Devanagari type, design laws
3. [SPEC.md](SPEC.md), master spec (objective, stack, testing, boundaries)
4. [docs/architecture.md](docs/architecture.md), system design + NFRs + hosting framework
5. [docs/adr/](docs/adr/), ADR-001 (name risk) … ADR-007 (bilingual model)
6. [docs/content-model.md](docs/content-model.md) + [docs/editorial-workflow.md](docs/editorial-workflow.md)
7. [docs/phase-0-tasks.md](docs/phase-0-tasks.md) → [phase-5-tasks.md](docs/phase-5-tasks.md)
8. [MANUAL.md](MANUAL.md), launch blockers, provider setup, env vars and mock/demo inventory

## Getting started (once apps are scaffolded)

```bash
pnpm install
cp .env.example .env.local      # fill in real values
pnpm dev                        # runs web + admin via turbo
```

Node ≥ 20.11 · pnpm ≥ 9.

## Working on this repo

- **Skills:** this project is built with the impeccable, spec-driven-development,
  architecture-designer, and planning-and-task-breakdown skills. Follow the workflow in
  the relevant `docs/` and ADR files.
- **Spec is living:** update SPEC.md + the relevant ADR _before_ implementing a decision
  change.
- **Boundaries:** see SPEC.md §Boundaries (always / ask first / never).
