# Nagarik Watch Revamp — Progress and Next Gates

**Status:** first extensive reconstruction pass completed; production release not yet verified.

## Completed in this pass

- Created and validated a reusable `nagarik-watch-newsroom` skill.
- Rebuilt logo, masthead and primary/secondary navigation language.
- Reworked homepage hierarchy so journalism precedes advertising.
- Added a latest-story rail and clearer editorial grouping.
- Reduced rounded-card/pill visual noise in core shared components.
- Improved article headline scale, metadata, trust signals and ad placement.
- Rebuilt generic hub behavior and removed fake trending metrics.
- Added an attributed RSS Source Desk that links to original publishers.
- Removed thirty fabricated demo-news records across three unsafe seed modules.
- Repaired recommendation eligibility, author follows, fatigue and diversity.
- Added recommendation tests and algorithm-version logging.
- Unified workflow stages between shared types, JSON store and Payload.
- Prevented retracted/intermediate workflow states from public queries.
- Corrected misleading admin dashboard and algorithm descriptions.
- Consolidated CI into the workflow GitHub actually runs.
- Added project-specific content-integrity and Nepali-voice standards.

## Current quality gates

| Gate | State |
|---|---|
| Public-surface audit | Pass |
| Ad-placement audit | Pass |
| Architecture audit | Pass |
| Recovery verification | Pass |
| Newsroom skill audit | Pass with 6 warnings |
| Modified TS/TSX syntax parse | Pass |
| Frozen dependency install | Blocked by registry access in this environment |
| Full typecheck/tests/build | Not yet run |
| Live launch gate | Intentionally not enabled |
| Real deployment error reproduction | Waiting for owner-provided logs |

## Remaining warnings

- `disaster-alerts` is still a thin alias.
- `login`, `register` and `profile` are thin wrappers around shared account surfaces.
- `tag/[slug]` is a thin wrapper.
- The local JSON article store is intentionally empty.

A thin wrapper is not automatically a defect. It becomes a defect when navigation or marketing makes the page appear more capable than its shared implementation.

## Progressive roadmap

### Gate 1 — reproducible engineering baseline

- Run the new GitHub CI in a connected environment.
- Resolve all format, lint, type, test and build failures without bypass flags.
- Reproduce the supplied deployment log exactly.
- Decide and document separate deployment roots for reader and Payload admin.
- Pin/reconcile Next.js versions and regenerate the lockfile intentionally.

### Gate 2 — real newsroom pilot

- Configure Postgres, Payload, object storage and secrets.
- Enter verified publisher identity.
- Publish a small set of real, sourced stories through the CMS.
- Test correction, update, retraction and scheduled publishing.
- Review every Nepali UI string with a native newsroom editor.

### Gate 3 — reader functionality

- Verify search indexing and filters against real content.
- Test login, follows, bookmarks, reading history and newsletter persistence.
- Add event contracts for impressions, clicks, completion, follows and hides.
- Keep popularity pages in fallback/disclosure mode until telemetry is trustworthy.

### Gate 4 — public-service and growth surfaces

- Connect official, attributable sources for disaster alerts, results and markets.
- Add stale-data, error and last-updated states.
- Activate ads only after editorial hierarchy and performance budgets pass.
- Launch membership only with real entitlements, support and policy terms.

### Gate 5 — algorithm iteration

- Establish offline datasets and online success metrics.
- Measure source/author/category concentration and filter-bubble risk.
- Add explainable ranking diagnostics for editors.
- Consider collaborative or semantic retrieval only after data quality is proven.

## Non-negotiable newsroom rules

- Never publish generated reporting as fact.
- Never invent quotes, bylines, sources, popularity or “live” status.
- Never copy RSS article bodies; retain attribution and original links.
- Never let ads outrank the lead story.
- Never call a ranking “personalized,” “trending” or “most read” without real evidence.
- Never use unnatural translated Nepali merely to fill space.
