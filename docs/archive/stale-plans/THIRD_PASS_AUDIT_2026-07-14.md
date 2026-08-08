# Nagarik Watch third-pass audit — 2026-07-14

## Executive verdict

The project is no longer a collection of visually polished shells. The reader product, journalist workspace, Payload newsroom, engagement store, transparent recommendation engine and alert planner now have explicit ownership and persistence contracts.

The codebase is still not honestly launch-complete. The remaining blockers are infrastructure and connected-environment verification: the new Git tree must actually be pushed, dependencies must install in a networked environment, migrations and both Next builds must pass, production email and Web Push providers must be tested, and Payload uploads need a durable object-storage adapter.

## 1. Deployment incident

The Vercel log for commit `b13a8ce` is not building the delivered canonical tree. It reports nine workspaces and reads `apps/cms/package.json`. The reconstructed project has eight manifests, one canonical CMS at `apps/admin`, and an explicit `pnpm-workspace.yaml` list.

Implemented safeguards:

- explicit workspaces: `apps/web`, `apps/admin`, `packages/*`;
- retired `apps/cms` and ignored accidental recreation;
- pre-install canonical-workspace verifier;
- dependency-free lockfile/manifests verifier;
- frozen lockfile retained in CI and Vercel;
- separate reader and Payload deployment contracts;
- checked-in migration workflow and production schema push disabled by default.

The repository repair cannot affect an old SHA. A new clean commit is mandatory.

## 2. Public UI and information architecture

### Reconstructed

- Distinct civic masthead and Devanagari-first hierarchy.
- Journalism above advertising on the homepage.
- Editorial lead, secondary and latest-news hierarchy.
- Rule-based story cards rather than generic rounded tiles.
- Article headline, provenance and opening paragraphs before advertising.
- Calm reading measure, progress, reading-time and source signals.
- Real reader desk at `/reader-corner` rather than a duplicate tag page.
- Membership page changed from SaaS pricing cards to an honest funding ledger.
- Author and topic metadata changed from pill collections to editorial links and rules.
- Pagination and 404 recovery changed to publication-style navigation.
- Honest empty states instead of fake content or synthetic audience numbers.

### Remaining visual QA

The shared system is substantially stronger, but final visual acceptance still requires real-device checks at 360 px, 768 px, desktop, 200% zoom, reduced motion, dark mode and long Nepali headlines. Screenshot-based regression testing should be added after dependencies install.

## 3. Reader functionality

Implemented:

- local/device mode and signed-in synchronization;
- canonical bookmarks and anonymous-to-account merge;
- reading history with dwell time, scroll depth, completion and article classification metadata;
- clear-history and reset-interest controls;
- saved-story removal and account sync;
- real reading-time calculation from article content;
- moderated comments, approved replies and owner deletion;
- account profile and password change separated from the personal news desk;
- password reset with expiring tokens, delivery provider and session revocation;
- reader-controlled category, topic, province and journalist follows;
- stored timezone, quiet hours and notification-channel preferences;
- reader-facing explanation of recommendation behavior and exclusions.

Client-submitted story identity is not trusted for bookmarks, reading events or comments. The server resolves the canonical public article before persisting activity.

## 4. Recommendation engine

The active version is `nw-hybrid-v2`. It is a deterministic, explainable hybrid ranker—not an embedding or collaborative-filtering system.

Signals:

- explicit category, topic, province and journalist follows;
- reading-history category, tag and author metadata;
- current-session similarity;
- bookmark affinity;
- freshness;
- a small breaking/editorial urgency component.

Guardrails:

- invalid and materially future-dated stories excluded;
- sponsored and do-not-recommend stories excluded by default;
- recently read fatigue window;
- category, author and source concentration limits;
- algorithm-version and dominant-strategy labels;
- no fabricated views, shares or popularity data.

A regression was fixed where stored reading metadata was dropped by the browser personalization adapter before reaching the ranker. Older history can now influence recommendations even after the original article leaves the current homepage catalog.

## 5. Notifications

### In-app alerts

- canonical published/updated Payload stories create events;
- breaking, followed-topic and followed-journalist eligibility;
- separate `seen`, `read` and `dismissed` receipts;
- inbox viewing does not consume Web Push quotas;
- browser foreground alerts surface once while unread inbox state remains intact;
- quiet hours never hide the inbox.

### Background Web Push

- persisted browser subscriptions;
- service worker with safe same-origin destinations;
- personalized/API/newsroom routes excluded from cache;
- provider-backed delivery contract;
- cron authorization;
- daily quota, cooldown, retry cap and timezone-aware quiet hours;
- expired subscription disablement;
- notification click focus/open behavior.

A reporter can recommend an audience and urgency but cannot send directly. The audience tags must be story tags, and only an editor-approved canonical publication can create the event.

Production Web Push still requires real VAPID/provider credentials and an end-to-end delivery test.

## 6. Journalist workspace

Implemented as a separate product surface:

- dedicated journalist login;
- role-gated dashboard, assignments and feedback;
- owned/assigned draft access enforced server-side;
- create, reopen and revise draft workflows;
- tab-scoped unsaved recovery for new work;
- story, evidence, distribution and preview workspaces;
- Nepali headline/deck/body and human-reviewed English headline;
- source/evidence note, reporting location and media reference;
- editor pitch, homepage teaser and social copy as canonical Payload fields;
- category and tag classification;
- alert mode and audience recommendation;
- server-side contributor role contract shared by UI and APIs.

Reporters do not publish directly unless their canonical newsroom role grants publishing authority.

## 7. Payload newsroom and security

Implemented:

- first-account super-admin bootstrap;
- inactive-user login rejection;
- profile and role escalation restrictions;
- assigned-draft access;
- publisher-only schedule/publish transitions;
- unique article slugs and explicit migrations;
- protected internal fields and public response shaping;
- signed CMS-to-reader revalidation and publication webhook;
- relationship-ID resolution for author/topic alert matching;
- canonical featured-state homepage selection;
- audit logs for invitations and staff changes;
- expiring, hashed, email-bound newsroom invitations.

## 8. Content integrity

- Removed unsupported realistic seed reporting.
- No invented quotations, bylines, views or shares.
- External RSS appears only as an attributed headline-and-link Source Desk.
- Original Nagarik Watch reporting remains separate from aggregation.
- The empty canonical article store stays visibly empty until real newsroom content is published.

## 9. Verification completed in this environment

- canonical workspace verifier: passed;
- lockfile/manifests verifier: 8/8 passed;
- public-surface audit: passed;
- ad-placement audit: 20 registered, 17 intentionally rendered;
- architecture audit: passed;
- repository recovery audit: passed;
- Nagarik Watch project-skill audit: 0 failures, 0 warnings;
- TypeScript/TSX syntax parsing: 370 files, 0 parse errors;
- compiled recommendation/notification smoke tests: passed.

## 10. Not verified here

The execution environment cannot resolve the npm registry, so these dependency-aware checks remain pending on a connected machine:

- `pnpm install --frozen-lockfile`;
- Prettier and ESLint;
- semantic TypeScript project checks;
- Vitest/unit and database tests;
- reader production build;
- Payload production build;
- Playwright end-to-end tests;
- real migrations against staging PostgreSQL.

## 11. Hard launch blockers

1. Push the clean tree as a new Git commit; do not redeploy `b13a8ce`.
2. Run the full connected CI sequence.
3. Wire and test a supported Payload Vercel Blob, S3 or equivalent adapter.
4. Configure and test PostgreSQL, email, Web Push and cron secrets.
5. Run migrations before the CMS production build is promoted.
6. Publish real, sourced newsroom inventory.
7. Complete legal/publisher identity and contact configuration.
8. Run accessibility, mobile, cross-browser and performance acceptance tests.
