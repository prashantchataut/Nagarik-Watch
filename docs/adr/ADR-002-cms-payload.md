# ADR-002: Headless CMS, Payload CMS (self-hosted)

- **Status:** Accepted
- **Date:** 2026-06-18
- **Decision owner:** Architect
- **Supersedes:** none

## Context

The portal needs a content management system that supports:

- A rich **content model** (articles, taxonomy, media, authors, ePaper, galleries, video,
  live blog, menus, ad slots), see `docs/content-model.md`.
- **Role-based editorial workflow** (author → copy editor → publisher), revisions, draft
  scheduling, breaking-news toggle, see `docs/editorial-workflow.md`.
- **Media library** with enforced alt text + image credits.
- **Type-safe integration** with the Next.js reader app for SSR/ISR.
- **No per-seat editor pricing**, because a newsroom's editor count grows and we will not
  be held hostage to a vendor's seat license.
- **Self-hostable** so we control data, cost, and residency, and avoid vendor lock-in.
- **Low ops burden** for a solo developer.

## Alternatives considered

| Option        | Pros                                            | Cons                                                    |
|, , , , -|, , , , , , , , , , , , -|, , , , , , , , , , , , , , -|
| **Sanity**    | Best-in-class editor UX, GROQ, real-time, CDN   | Managed-only; per-editor pricing; content lives in their cloud; vendor lock-in |
| **Strapi**    | Self-hosted, mature, plugin ecosystem           | Less TypeScript-native; admin UX heavier; v4→v5 churn   |
| **Contentful / Storyblok** | Managed, reliable                   | Per-seat/entry pricing gets expensive for a newsroom; data not ours |
| **WordPress (headless)** | Huge ecosystem, familiar to editors  | PHP stack breaks monorepo TS story; REST/GraphQL plugin sprawl; security surface; weak type story for Next.js |
| **Directus**  | DB-first, self-hosted, TypeScript               | Good option; less purpose-built for editorial rich-text + blocks than Payload |
| **Custom CMS**| Total control                                   | Enormous build cost; reinvents access control, media, revisions, unjustified for solo dev |

## Decision

Use **Payload CMS** (self-hosted, in-repo at `apps/admin`), on **PostgreSQL** via Payload's
Drizzle adapter.

## Rationale

- **TypeScript-native;** the schema is code in the repo, and types flow into `packages/db`
  and `apps/web` automatically, one contract across the whole monorepo.
- **Self-hosted in our own infrastructure** → no vendor lock-in, no per-editor licensing,
  data residency under our control (matters if ADR-004 chooses a Nepal VPS).
- **Co-locates with the web app** → reads use Payload's **Local API** (in-process, no HTTP
  hop) for the fastest SSR.
- **Native editorial features** we'd otherwise build: drafts/revisions, role-based access
  control, scheduling, hooks, rich-text + blocks, media library with field validation
  (we enforce alt text at the field level).
- **MIT-licensed,** actively maintained, strong Next.js App Router story.
- **Drizzle migrations are versioned** in the repo → reproducible schema, safe reviews.

## Consequences

- **Positive:** One TS codebase; type-safe end-to-end; no editor-seat cost; full data
  ownership; fast SSR via Local API; rich editorial features out of the box.
- **Negative:** We operate the CMS (backups, updates) ourselves, bounded by choosing
  managed Postgres (ADR-005) and a managed origin (ADR-004 leans that way). Payload's
  editor UX is good but not as polished as Sanity's; acceptable for a newsroom that values
  ownership over polish.

## Trade-offs

Data ownership, cost predictability, and a unified TypeScript codebase are prioritised
over the absolute-best editor UX and zero-ops managed CMS offerings. The ops cost is
absorbed by managed infra choices in ADR-004/005.

## Open items

- Evaluate Payload's **Live Preview** for editors during Phase 2.
- Decide on **versions/revisions retention** policy (keep last N; bound DB growth).
- Confirm **2FA availability** for the publisher role (security baseline in
  `docs/architecture.md` §6).
