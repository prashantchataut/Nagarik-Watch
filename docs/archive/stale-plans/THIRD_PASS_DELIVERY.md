# Nagarik Watch third-pass delivery

## Deploy the new tree

The failing Vercel build is still using commit `b13a8ce`, which contains the retired `apps/cms` workspace. From a clean checkout, replace the repository contents with this delivery and run:

```bash
git rm -r apps/cms 2>/dev/null || true
git add -A
git commit -m "complete Nagarik Watch reader and newsroom reconstruction"
git push origin main
```

Confirm that Vercel displays the new SHA. The install log must contain:

```text
Canonical workspaces verified: apps/web, apps/admin, and packages/*.
Scope: all 8 workspace projects
```

It must not mention `apps/cms`.

## Connected verification

```bash
corepack enable
corepack prepare pnpm@10.17.1 --activate
node scripts/verify-canonical-workspaces.mjs
node scripts/verify-workspace-lock.mjs
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm verify:static
pnpm build:web
pnpm --filter @nagarikwatch/admin migrate
pnpm build:admin
pnpm test:e2e
```

Do not replace the frozen install with `--no-frozen-lockfile` in production CI.

## Vercel structure

Use two projects from the same repository:

1. Reader: repository root, root `vercel.json`, health `/api/health`.
2. Payload: `apps/admin`, its own `vercel.json`, health `/healthz`.

## Production integrations still required

- PostgreSQL and migrations;
- durable Payload object storage;
- verified email sender/provider;
- Web Push VAPID/provider/cron configuration;
- publication legal identity and newsroom contacts;
- real sourced stories and media;
- staging smoke tests for login, password reset, invitations, publishing, revalidation, bookmarks, history, comments, alerts and media uploads.
