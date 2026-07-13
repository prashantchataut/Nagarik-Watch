# Nagarik Watch (नागरिक वाच)

**नेपाली-प्रथम नागरिक पत्रकारिता प्लेटफर्म · A Devanagari-first civic news platform**

Nagarik Watch is a bilingual Nepali news portal with Nepali at `/` and editor-reviewed
English at `/en/`. The repository is a pnpm/Turborepo monorepo containing the public
Next.js application, a separate Payload CMS newsroom, and shared content, infrastructure,
ingestion, UI, and TypeScript packages.

## Current status / हालको अवस्था

The repository is no longer a planning-only scaffold. It contains working reader,
journalist, operations-admin, auth, content, live-data, submission, newsletter, poll,
bookmark, recommendation, SEO, and trust-page surfaces.

It is **not ready to be labelled live until the launch gate passes**. Real publication
credentials, production secrets, Postgres, object storage, approved data providers, and a
full dependency-backed verification run are still operator responsibilities. See
[`FINAL_AUDIT.md`](FINAL_AUDIT.md), [`CONTINUATION_PROMPT.md`](CONTINUATION_PROMPT.md),
and [`MANUAL.md`](MANUAL.md).

## Architecture / संरचना

```text
apps/
  web/      Reader site + reader auth + journalist desk + role-gated operations admin
  admin/    Payload CMS 3 editorial source of truth
packages/
  db/       Shared content contracts, schemas, ranking/recommendation utilities
  ui/       Civic Crimson design system
  infra/    Storage and CDN adapters
  ingest/   Feed normalization and ingestion helpers
  tsconfig/ Shared TypeScript configuration
docs/       Architecture, ADRs, workflows, deployment and provider guidance
```

### Production boundary

- **Payload (`apps/admin`) owns editorial content**: articles, categories, tags, authors,
  media, revisions, and publishing workflow.
- **The reader app consumes Payload through its REST API**. The two apps may be deployed
  independently; the web app does not import Payload configuration or open a second CMS
  connection.
- **The web operations admin does not maintain a shadow production content store**.
  Content routes redirect to Payload when `CONTENT_SOURCE=payload`.
- **Postgres is mandatory at runtime in production** for Better Auth and operational state.
  Development may use persistent local PGlite/auth files and explicit local data files.

The decision is recorded in [`docs/adr/ADR-014-canonical-cms.md`](docs/adr/ADR-014-canonical-cms.md).

## Local development / स्थानीय विकास

Requirements: Node.js 22 and pnpm 10.17.1.

```bash
corepack enable
pnpm install
cp .env.example .env.local
# Fill local-only values; never commit the file.
pnpm dev
```

Default ports:

- Reader and web operations: `http://localhost:3000`
- Payload newsroom: `http://localhost:3001/admin`

For a lightweight web-only development session, omit `DATABASE_URL`; Better Auth uses the
persistent PGlite directory configured by `PGLITE_DATA_DIR`. Payload itself still requires
Postgres.

## Required verification / अनिवार्य जाँच

Before deployment, run from a networked environment with dependencies installed:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm verify:static
pnpm --filter @nagarikwatch/web build
pnpm --filter @nagarikwatch/admin build
pnpm test:e2e
```

For live configuration validation:

```bash
NEXT_PUBLIC_LAUNCH_STATUS=live pnpm launch:gate
```

Never bypass a failing launch gate. The current repair environment could run the
repository-native static audits but could not install pnpm dependencies; exact evidence is
recorded in [`VERIFICATION_LOG_CURRENT.md`](VERIFICATION_LOG_CURRENT.md).

## Source documents

- [`PRODUCT.md`](PRODUCT.md) — audience, editorial promise, anti-references
- [`DESIGN.md`](DESIGN.md) — Civic Crimson visual system and editorial hierarchy
- [`SPEC.md`](SPEC.md) — product and engineering boundaries
- [`docs/architecture.md`](docs/architecture.md) — runtime architecture
- [`docs/content-model.md`](docs/content-model.md) — shared content contract
- [`docs/editorial-workflow.md`](docs/editorial-workflow.md) — newsroom workflow
- [`MANUAL.md`](MANUAL.md) — owner setup, credentials, providers, launch checklist
