# Nagarik Watch reconstruction progress — 2026-07-14

## Completed

### Deployment and architecture
- Canonical eight-workspace monorepo.
- Legacy `apps/cms` retired and blocked from workspace discovery.
- Frozen-lockfile and canonical-tree verifiers run before Vercel installation.
- Separate reader and Payload deployment contracts and health endpoints.
- Explicit migrations and production schema push disabled by default.

### Public product and UI
- Distinct civic brand and Devanagari-first typography.
- Editorial homepage hierarchy and article reading experience.
- Rule-based cards, navigation and provenance signals.
- Reader Corner converted into the personal news desk.
- Membership, author/topic, pagination and recovery surfaces stripped of generic SaaS/pill styling.
- Honest Source Desk and empty states.

### Reader product
- Authentication, password recovery/change and account security.
- Bookmarks, anonymous merge, reading history, reading progress and clear controls.
- Moderated comments, replies and owner deletion.
- Interests, followed journalists, timezone and alert preferences.
- Explainable personalized recommendations.

### Journalist product
- Separate login and role-gated workspace.
- Owned/assigned draft create, reopen and revise flows.
- Evidence, source, classification, distribution, teaser, social and alert recommendation fields.
- Preview and tab-scoped recovery.

### Newsroom and algorithms
- Payload canonical content and protected internal fields.
- Publisher-only public workflow and relationship-aware publish webhook.
- Transparent hybrid ranker with history metadata, freshness and diversity guardrails.
- In-app alerts and provider-backed Web Push delivery path.
- Seen/read/delivered state separation, quotas, cooldowns, retries and reader-timezone quiet hours.

## Connected-environment work remaining

1. Push a new Git SHA and verify Vercel builds eight workspaces.
2. Run dependency install, formatting, lint, semantic typecheck, tests and both production builds.
3. Run migrations against staging PostgreSQL.
4. Add and test durable Payload object storage.
5. Configure/test email and Web Push providers.
6. Populate real sourced journalism and production media.
7. Complete legal identity and launch configuration.
8. Execute cross-device visual, accessibility, performance and end-to-end acceptance testing.
