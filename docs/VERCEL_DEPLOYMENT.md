# Vercel deployment — Nagarik Watch

Nagarik Watch is a pnpm monorepo with two independently deployed Next.js applications. The reader and Payload CMS share workspace packages, so installation must run from the repository root.

## Current incident: `ERR_PNPM_OUTDATED_LOCKFILE`

The supplied deployment log for commit `b13a8ce` proves that Vercel is still building a stale repository tree:

```text
Scope: all 9 workspace projects
<ROOT>/apps/cms/package.json
ERR_PNPM_OUTDATED_LOCKFILE
```

The canonical project has **eight** manifests and one CMS application at `apps/admin`. It uses an explicit workspace list:

```yaml
packages:
  - 'apps/web'
  - 'apps/admin'
  - 'packages/*'
```

That explicit list prevents a forgotten `apps/cms` directory from re-entering pnpm installation. The delivered tree also verifies the canonical layout before Vercel installs dependencies.

### Required Git cleanup

Replace the repository with the delivered tree and run:

```bash
git rm -r apps/cms 2>/dev/null || true
git add -A
git commit -m "retire legacy cms workspace and complete newsroom rebuild"
git push origin main
```

Then verify the Vercel deployment screen shows the **new commit SHA**. Do not redeploy `b13a8ce`; an old commit cannot contain a new lockfile or workspace definition.

The next install log must say:

```text
Canonical workspaces verified: apps/web, apps/admin, and packages/*.
Scope: all 8 workspace projects
```

If it still says nine projects or names `apps/cms`, one of these is true:

1. the new tree was not committed;
2. `apps/cms` remains tracked in Git;
3. Vercel is deploying an older SHA;
4. Vercel is connected to a different repository or branch;
5. the project root points at a stale subdirectory.

## Lockfile repair workflow

Run from the repository root on a connected machine:

```bash
corepack enable
corepack prepare pnpm@10.17.1 --activate
node scripts/verify-canonical-workspaces.mjs
node scripts/verify-workspace-lock.mjs
pnpm install --frozen-lockfile
```

When intentionally changing dependencies:

```bash
pnpm install --lockfile-only
node scripts/verify-workspace-lock.mjs
git add package.json pnpm-lock.yaml apps packages
git commit
```

Do not permanently replace `--frozen-lockfile` with `--no-frozen-lockfile`. That suppresses the repository defect rather than fixing it.

## Project 1 — reader web

Recommended Vercel settings:

- repository: the Nagarik Watch repository
- branch: `main`
- root directory: repository root
- framework: Next.js
- Node: 22.x
- install: use `vercel.json`
- build: use `vercel.json`
- output: `apps/web/.next`
- health: `/api/health`

The root `vercel.json` runs:

```text
node scripts/verify-canonical-workspaces.mjs && pnpm install --frozen-lockfile
pnpm verify:workspaces && pnpm --filter @nagarikwatch/web... build
```

## Project 2 — Payload CMS

Create a second Vercel project from the same repository (`nagarik-watch-admin` or equivalent).
As of the last ops check, this project may have **zero deployments** until an operator links the
repo, sets Node **22.x** (match root `package.json` engines; do not leave the project on Node 24),
and triggers the first production build.

- root directory: `apps/admin`
- framework: Next.js
- Node: **22.x**
- install/build/output: use `apps/admin/vercel.json`
- health: `/healthz`
- storage: Vercel Blob (or another configured Payload object-storage adapter) — never ephemeral
  local disk in production
- shared secrets with the reader app: `REVALIDATE_SECRET`, publication URLs, `DATABASE_URL` (or
  the CMS database URL if intentionally split)

Before promoting a production CMS release:

```bash
pnpm --filter @nagarikwatch/admin migrate
pnpm build:admin
```

Keep `PAYLOAD_DB_PUSH=false` in production.

## Required reader environment

- `CONTENT_SOURCE=payload`
- `PAYLOAD_PUBLIC_SERVER_URL=https://<cms-domain>`
- `PAYLOAD_API_TOKEN`
- `NEXT_PUBLIC_SITE_URL=https://<reader-domain>`
- `DATABASE_URL`
- `AUTH_SECRET`
- `BETTER_AUTH_SECRET`
- `REVALIDATE_SECRET`
- `CRON_SECRET`
- verified publication/legal identity values from `.env.example`
- email delivery configuration
- Web Push configuration when background alerts are enabled

## Required CMS environment

- `DATABASE_URL`
- `PAYLOAD_SECRET`
- `PAYLOAD_PUBLIC_SERVER_URL=https://<cms-domain>`
- `NEXT_PUBLIC_SITE_URL=https://<reader-domain>`
- `REVALIDATE_SECRET`
- `PAYLOAD_DB_PUSH=false`
- configured and tested Payload object-storage adapter

## Release verification

```bash
node scripts/verify-canonical-workspaces.mjs
node scripts/verify-workspace-lock.mjs
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm verify:static
pnpm build:web
pnpm build:admin
```

After deployment:

```text
GET https://<reader-domain>/api/health
GET https://<cms-domain>/healthz
```

Do not promote the release if the commit SHA is wrong, either health endpoint is degraded, migrations have not run, email cannot deliver, or Payload media still uses ephemeral local filesystem storage.
