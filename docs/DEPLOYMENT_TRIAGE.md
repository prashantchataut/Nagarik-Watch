# Deployment Triage — Nagarik Watch

This guide separates repository defects from provider/network failures. Paste the exact deployment log beside this checklist before changing code.

## Supported toolchain

- Node.js: `22.x`
- pnpm: `10.17.1`
- install: `pnpm install --frozen-lockfile`

Do not use npm or Yarn to install this workspace. Do not delete or regenerate `pnpm-lock.yaml` as a first response to a failed build.

## Deployment topology

Deploy the monorepo as two services:

1. **Reader web**
   - workspace package: `@nagarikwatch/web`
   - application directory: `apps/web`
   - build from monorepo root: `pnpm --filter @nagarikwatch/web build`
   - start command: `pnpm --filter @nagarikwatch/web start`

2. **Payload admin/CMS**
   - workspace package: `@nagarikwatch/admin`
   - application directory: `apps/admin`
   - build from monorepo root: `pnpm --filter @nagarikwatch/admin build`
   - run checked-in migrations before start
   - start command: `pnpm --filter @nagarikwatch/admin start`

Both services need the full workspace during installation because they depend on internal packages.

## Minimum live environment contract

The launch gate requires verified values for:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_PUBLICATION_LEGAL_NAME`
- `NEXT_PUBLIC_EDITOR_IN_CHIEF`
- `NEXT_PUBLIC_DOIB_NUMBER`
- `NEXT_PUBLIC_NEWSROOM_PHONE`
- `NEXT_PUBLIC_NEWSROOM_ADDRESS`
- `NEXT_PUBLIC_NEWSROOM_EMAIL`
- `DATABASE_URL`
- `PAYLOAD_PUBLIC_SERVER_URL`
- `PAYLOAD_API_TOKEN`
- `AUTH_SECRET` (at least 32 non-placeholder characters)
- `PAYLOAD_SECRET` (at least 32 non-placeholder characters)
- `REVALIDATE_SECRET` (at least 32 non-placeholder characters)
- `SUBMISSION_IP_SALT` (at least 32 non-placeholder characters)
- `CONTENT_SOURCE=payload`
- `PAYLOAD_DB_PUSH=false`
- one durable media backend: `STORAGE_BUCKET`, `BLOB_READ_WRITE_TOKEN`, or `S3_BUCKET`

Never expose database, Payload API or server secrets through `NEXT_PUBLIC_*` variables.

## Required commands before release

```bash
corepack enable
corepack prepare pnpm@10.17.1 --activate
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm verify:static
pnpm --filter @nagarikwatch/web build
pnpm --filter @nagarikwatch/admin build
NEXT_PUBLIC_LAUNCH_STATUS=live pnpm launch:gate
```

## Error classification

### Package-manager fetch failure

Symptoms include a Corepack error while requesting the pnpm tarball from the npm registry. This occurs before application dependencies or source code are evaluated. Check provider network/DNS, package-manager caching and registry access before editing application code.

### Frozen-lockfile mismatch

The log explicitly reports that `package.json` and `pnpm-lock.yaml` disagree. Reproduce locally with the same Node/pnpm versions, make intentional dependency changes, run install to update the lockfile, review the diff and commit both files.

### Build-time database connection

A Next build should not require a reachable production database merely to evaluate modules. Locate stack frames that create pools or execute queries during module import/static generation. Do not “fix” this by inserting fake production credentials or swallowing every database error.

### Missing environment value

The log names an environment variable or the launch gate reports it. Set the value in the correct service scope. Reader-public values and server-only CMS values must not be mixed.

### Payload migration/schema failure

Run checked-in migrations against a backup or disposable staging database first. Keep `PAYLOAD_DB_PUSH=false` in production. Never enable schema push merely to bypass a migration error.

### Next.js type/compile failure

Capture the first source-level error, not only the final non-zero exit. Fix it under the pinned toolchain, then run the full CI sequence because later failures may have been hidden.

## Evidence to preserve from the provider

- service/root directory
- install command
- build command
- Node and pnpm versions printed in the log
- commit SHA
- environment name (preview/staging/production)
- first complete error stack
- whether the failure occurs during install, build, migration or runtime start

Do not declare a deployment fixed until the same commit passes in CI and the provider reaches a healthy runtime check.
