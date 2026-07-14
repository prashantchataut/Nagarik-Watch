# Nagarik Watch — Reconstruction Progress

**Status:** deployment lockfile incident repaired; product is suitable for connected CI and staging integration, but not yet a public production launch.

## Completed

### Deployment and repository integrity
- Removed the legacy `apps/cms`/`apps/admin` split and retained `apps/admin` as the canonical CMS package.
- Repaired and verified the pnpm lockfile across all eight workspace manifests.
- Added a lockfile-drift check before CI installation.
- Added reader and CMS build jobs, migration instructions and health endpoints.
- Documented the exact Vercel two-project topology.

### Public product
- Rebuilt brand mark, masthead, navigation, homepage hierarchy, article flow and shared story surfaces.
- Moved journalism above ads and removed fake popularity signals.
- Added an attributed Source Desk instead of fabricated demo reporting.
- Added explicit source, update, verification and correction cues.

### Editorial system
- Made Payload the only production editorial source of truth.
- Unified workflow states and protected public visibility.
- Added reporter assignment, publishing-role checks, unique slugs and a checked-in migration.
- Hid internal notes, assignments, AI drafts, review timestamps and staff relationships from public responses.
- Restricted public author contact fields.

### Reader and account functionality
- Added real password reset emails, 30-minute reset tokens and session revocation.
- Added authenticated password change with other-session revocation.
- Added expiring, hashed and email-bound newsroom invitations.
- Added invitation acceptance, role activation and super-admin escalation protections.
- Verified article identity before bookmarks, comments and reading events are stored.
- Added anonymous-to-account bookmark merging.

### Operations
- Unified newsletter storage and double opt-in behavior.
- Added actual Resend/generic email delivery and honest delivery failures.
- Added same-origin guards to newsroom mutations.
- Added rate limits to ad telemetry.
- Protected provider-health diagnostics behind newsroom authentication.
- Aligned the operations launch dashboard with the strict release gate.

## Current gates

| Gate | State |
|---|---|
| Workspace manifest/lockfile consistency | Pass, 8/8 |
| Public-surface audit | Pass |
| Ad-placement audit | Pass, 20 registered / 17 rendered |
| Architecture audit | Pass |
| Recovery verification | Pass |
| Project skill audit | Pass, 0 failures / 0 warnings |
| TypeScript syntax parse | Pass, 342 files |
| Strict launch negative test | Pass: unconfigured launch blocked |
| Frozen dependency install | Blocked by registry DNS in this environment |
| Semantic typecheck/tests/Next builds | Must run in connected CI |
| Durable Payload media storage | Hard blocker; adapter not yet wired |
| Real newsroom content inventory | Required before public launch |
| Verified legal/publication identity | Required before public launch |

## Next gates

1. Push this tree as a new commit and deploy that SHA, not `b6ae37e`.
2. Run frozen install, format, lint, typecheck, tests and both Next builds in connected CI.
3. Apply Payload migrations to staging Postgres.
4. Add and verify a supported Payload S3/Vercel Blob storage adapter; regenerate the lockfile intentionally.
5. Configure verified email senders and test reset, invitation and newsletter delivery.
6. Publish real, sourced stories through draft → review → publish → update → correction/retraction.
7. Run mobile visual regression, keyboard/accessibility and low-bandwidth checks.
8. Enable live launch only when `NEXT_PUBLIC_LAUNCH_STATUS=live pnpm launch:gate` passes.
