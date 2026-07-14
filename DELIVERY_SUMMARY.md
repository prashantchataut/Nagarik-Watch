# Nagarik Watch — Delivery Summary

This archive contains the deployment repair and second functionality/security pass completed on 13 July 2026.

## First deployment action

1. Replace or merge this tree into the GitHub repository.
2. Commit both manifests and `pnpm-lock.yaml` together.
3. Push a new commit. Do not redeploy the old failing SHA `b6ae37e`.
4. Let CI run the frozen install and both application builds.
5. Deploy reader and Payload CMS as separate Vercel projects as described in `docs/VERCEL_DEPLOYMENT.md`.

## Repository-native preflight

```bash
node scripts/verify-workspace-lock.mjs
node scripts/audit-public-surface.mjs
node scripts/audit-ad-placements.mjs
node scripts/audit-architecture.mjs
node scripts/verify-recovery.mjs
```

## Connected-machine verification

```bash
corepack enable
corepack prepare pnpm@10.17.1 --activate
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build:web
pnpm build:admin
```

Read `VERIFICATION_LOG_CURRENT.md` before treating the project as production-ready. Payload media storage remains a deliberate hard launch blocker until a durable object-storage adapter is actually wired.
