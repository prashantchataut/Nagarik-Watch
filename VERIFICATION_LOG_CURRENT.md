# Nagarik Watch — Current Verification Log

**Date:** 2026-07-13  
**Scope:** deployment repair and second functionality/security pass

## Verified in this environment

```text
node scripts/verify-workspace-lock.mjs
Workspace lockfile verified for 8 package manifests.

node scripts/audit-public-surface.mjs
Public surface audit passed.

node scripts/audit-ad-placements.mjs
Ad placement audit passed (20 placements, 17 intentionally rendered).

node scripts/audit-architecture.mjs
Architecture audit passed.

node scripts/verify-recovery.mjs
Repository recovery verification passed.

python nagarik-watch-newsroom/scripts/audit_newsroom.py
0 failures, 0 warnings.

TypeScript parser scan
342 TypeScript/TSX files parsed; 0 syntax errors.

node scripts/launch-gate.mjs
Non-live mode correctly skipped strict release checks.

NEXT_PUBLIC_LAUNCH_STATUS=live node scripts/launch-gate.mjs
Exited 1 and blocked an unconfigured launch, as required.
```

## Deployment incident status

The supplied Vercel build failed during dependency installation, before TypeScript or Next.js compilation. Commit `b6ae37e` contained an `apps/cms/package.json` importer that was out of sync with `pnpm-lock.yaml`. The repaired tree has one canonical CMS package at `apps/admin`, no legacy `apps/cms`, and a dependency-free verifier that confirms all eight workspace manifests match their lockfile importers.

Deploying `b6ae37e` again will reproduce the same failure. The fix only applies after this repaired tree is committed and Vercel builds the new SHA.

## Functionality added and statically verified

- Payload as the canonical editorial CMS.
- Signed CMS-to-reader revalidation.
- Editorial workflow and RBAC alignment.
- Public-field privacy for articles and author contacts.
- Real provider-backed password reset and authenticated password change.
- Expiring, hashed, email-bound newsroom invitations.
- Role-escalation restrictions and protected staff changes.
- Canonical article validation for bookmarks, comments and reading telemetry.
- Real newsletter confirmation and honest provider failures.
- Same-origin guards on state-changing newsroom APIs.
- Rate-limited advertising telemetry.
- Authenticated provider-health inspection.
- Health endpoints for reader and CMS.
- Honest launch gate for legal identity, secrets, database, CMS, email and storage.

## Not executable here

The environment cannot resolve `registry.npmjs.org`. Corepack therefore cannot download the pinned `pnpm@10.17.1` binary and exits with `getaddrinfo EAI_AGAIN`. Consequently these dependency-aware checks were not claimed as passed:

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build:web
pnpm build:admin
pnpm test:e2e
```

A parser scan is not a substitute for a real typecheck or production build.

## Remaining hard launch blocker

Payload media uploads still use local filesystem storage. That storage is ephemeral on Vercel. Storage credentials alone do not fix this; a supported Payload object-storage adapter must be added, the lockfile regenerated on a connected machine, and upload/read/delete behavior verified before a live launch. The release gate now fails explicitly for this condition.
