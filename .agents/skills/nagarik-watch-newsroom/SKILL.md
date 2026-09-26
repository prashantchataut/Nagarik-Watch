---
name: nagarik-watch-newsroom
description: revamp and audit the nagarik watch nepali-first news portal across public ui, editorial ux, payload cms, deployment, content provenance, recommendations, accessibility, seo, and launch readiness. use for any task that changes nagarik watch pages, components, branding, newsroom workflows, seed content, ranking logic, admin controls, or production configuration.
---

# Nagarik Watch Newsroom

Work from evidence, not route counts or documentation claims.

## Required workflow

1. Inspect the relevant implementation, data source, route, and production boundary before editing.
2. Run `python3 scripts/audit_newsroom.py <project-root>` before and after material changes.
3. Read `references/product-standard.md` for public UI and editorial hierarchy.
4. Read `references/nepali-voice.md` before writing Nepali interface or editorial copy.
5. Read `references/content-integrity.md` before adding news, seed data, sources, bylines, quotes, or recommendations.
6. Prefer system-level fixes over page-specific decoration. Improve tokens, shared shells, cards, states, and data contracts first.
7. Keep reader, journalist, operations-admin, and Payload-CMS responsibilities explicit. Never create a second production editorial source of truth.
8. Treat deployment failures as reproducible engineering defects: capture command, environment assumption, failing boundary, root cause, fix, and verification status.
9. Finish with an honest change log: verified, statically checked, blocked, and still incomplete.

## Non-negotiable quality bars

- Devanagari-first typography must remain readable at 360 px width and 200% zoom.
- Every public page must have a clear purpose, current content or an honest empty state, and a primary next action.
- Do not publish fabricated reporting, invented quotes, invented bylines, or unattributed summaries.
- Recommendation results must be explainable, diversity-limited, freshness-aware, and exclude sensitive, sponsored, retracted, or do-not-recommend items.
- Admin actions must be role-gated server-side, auditable, and explicit about persistence and failure.
- No fake live data, empty ad boxes, pretend paywalls, pretend analytics, or provider setup language on public pages.
- Do not copy competitor layouts. Extract information architecture and interaction lessons, then build a distinct civic identity.

## Delivery sequence

Apply changes in this order unless evidence requires otherwise:

1. deployment and data integrity blockers
2. information architecture and route consolidation
3. brand, typography, spacing, and responsive shell
4. homepage, category, article, search, archive, and utility foundations
5. account, membership, submissions, and trust surfaces
6. operations admin and Payload editorial workflow
7. recommendations, trending, analytics, and experiments
8. accessibility, performance, SEO, tests, and launch gates
