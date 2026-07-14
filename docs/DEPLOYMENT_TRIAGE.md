# Deployment triage — Nagarik Watch

Use the first failing boundary in the log. Do not edit application code until the failure has reached application compilation.

## Current Vercel failure

**Commit:** `b13a8ce`  
**Stage:** dependency installation  
**Error:** `ERR_PNPM_OUTDATED_LOCKFILE`  
**Evidence:** Vercel reports nine workspaces and `<ROOT>/apps/cms/package.json`.

The delivered repository has eight manifests and explicitly includes only `apps/web`, `apps/admin` and `packages/*`. Therefore the current Vercel run is not using the delivered tree.

### Resolution

```bash
git rm -r apps/cms 2>/dev/null || true
git add -A
git commit -m "retire legacy cms workspace and fix frozen install"
git push origin main
```

Deploy the resulting new SHA. Clear the Vercel build cache once after the replacement. Cache clearing is not the root fix; it only removes stale artifacts after the correct commit is selected.

Expected install evidence:

```text
Canonical workspaces verified: apps/web, apps/admin, and packages/*.
Scope: all 8 workspace projects
```

## Supported toolchain

- Node.js `22.x`
- pnpm `10.17.1`
- `pnpm install --frozen-lockfile`

The Vercel warning that project settings specify Node 24 while `package.json` specifies Node 22 is informational. The repository intentionally selects Node 22.

## Failure classes

### 1. Canonical workspace failure

The pre-install verifier reports a missing canonical workspace or wildcard `apps/*` configuration. Restore the delivered `pnpm-workspace.yaml` and remove the legacy CMS directory.

### 2. Frozen-lockfile mismatch

A tracked manifest differs from its lockfile importer. Use pnpm 10.17.1, regenerate the lockfile intentionally, review the importer diff, and commit the manifest and lockfile together.

### 3. Registry/network failure

Corepack or pnpm cannot resolve/fetch the npm registry. This happens before source code is evaluated. Check DNS, provider egress, registry settings and package-manager caching.

### 4. TypeScript or Next build failure

Capture the first source-level error. Fix it under the pinned toolchain, then rerun both reader and CMS builds; a reader-only green build is insufficient.

### 5. Payload migration failure

Run checked-in migrations against staging first. Keep `PAYLOAD_DB_PUSH=false`. Do not enable schema push to bypass a failed migration.

### 6. Runtime provider failure

Use `/api/health`, `/healthz`, and authenticated provider-health diagnostics. Distinguish database, CMS, email, push and object-storage readiness.

## Evidence required before declaring deployment fixed

- exact commit SHA shown by Vercel
- branch and repository name
- Vercel project root
- install and build commands
- printed Node and pnpm versions
- first complete error stack
- successful frozen install
- successful reader build
- successful CMS build
- successful staging migration
- healthy reader and CMS endpoints

See `VERCEL_DEPLOYMENT.md` for full topology and `NOTIFICATIONS.md` for alert-provider setup.
