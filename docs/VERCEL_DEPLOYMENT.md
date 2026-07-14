# Vercel deployment — Nagarik Watch

Nagarik Watch is a monorepo with two independently deployed Next.js applications. Keep the repository root available during installation because both apps consume workspace packages.

## Incident fixed: `ERR_PNPM_OUTDATED_LOCKFILE`

The failed deployment at commit `b6ae37e` stopped during dependency installation. Vercel reported that `apps/cms/package.json` declared 18 specifiers that were absent from that commit's `pnpm-lock.yaml` importer.

This delivery uses one canonical CMS directory: `apps/admin`. The duplicate/former `apps/cms` path is not part of the workspace. The checked-in lockfile is verified against every root, app and package manifest by:

```bash
node scripts/verify-workspace-lock.mjs
```

A deployment of `b6ae37e` will remain broken. Commit and push this repaired tree, then deploy the new commit SHA.

## Correct lockfile repair workflow

Run from the repository root on a connected machine:

```bash
corepack enable
corepack prepare pnpm@10.17.1 --activate
pnpm install --lockfile-only
node scripts/verify-workspace-lock.mjs
pnpm install --frozen-lockfile
```

Review and commit both the changed `package.json` file(s) and `pnpm-lock.yaml`. Do not set Vercel to `--no-frozen-lockfile`; that hides repository drift and makes installs non-reproducible.

## Project 1 — reader web

Use the repository root as the project root.

- Framework: Next.js
- Node: 22.x
- Install: `pnpm install --frozen-lockfile`
- Build: `pnpm build:web`
- Output: `apps/web/.next`
- Health: `/api/health`

The root `vercel.json` already contains the reader build settings.

Required production values include:

- `CONTENT_SOURCE=payload`
- `PAYLOAD_PUBLIC_SERVER_URL=https://<cms-domain>`
- `NEXT_PUBLIC_SITE_URL=https://<reader-domain>`
- `DATABASE_URL`
- `AUTH_SECRET`
- `BETTER_AUTH_SECRET`
- `REVALIDATE_SECRET` (same value as CMS)
- verified publication identity values from `.env.example`

## Project 2 — Payload CMS

Create a second Vercel project from the same repository. Keep the monorepo root available to the build and set:

- Framework: Next.js
- Node: 22.x
- Install: `pnpm install --frozen-lockfile`
- Build: `pnpm build:admin`
- Output: `apps/admin/.next`
- Health: `/healthz`

Required production values include:

- `DATABASE_URL`
- `PAYLOAD_SECRET`
- `PAYLOAD_PUBLIC_SERVER_URL=https://<cms-domain>`
- `NEXT_PUBLIC_SITE_URL=https://<reader-domain>`
- `REVALIDATE_SECRET` (same value as reader)
- `PAYLOAD_DB_PUSH=false`
- a supported Payload object-storage adapter plus its verified credentials

Apply checked-in migrations against staging before production:

```bash
pnpm --filter @nagarikwatch/admin migrate
```

The July 13 migration adds `viewer`/`reviewer` CMS roles and enforces globally unique article slugs. Do not enable `PAYLOAD_DB_PUSH` to bypass a migration failure.

## Publish-to-reader contract

When a published or updated article changes, Payload signs an HMAC request to the reader's `/api/revalidate` endpoint. Both projects must share the same 32+ character `REVALIDATE_SECRET`. The webhook revalidates the homepage, latest list, category, article, RSS and sitemap paths.

## Verification sequence

```bash
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

Do not promote the release if either endpoint is degraded. The current repository intentionally keeps the live launch gate blocked until Payload media is moved off local Vercel filesystem storage.
