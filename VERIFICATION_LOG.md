# Verification log

## Passed

### Recovery integrity

```text
Recovery verification passed
- 672/672 uploaded ZIP entries preserved
- auth singleton retry and seed isolation present
- Better Auth catch-all route restored
- duplicate site URL removed
- known time-dependent hydration paths stabilized
```

Command:

```bash
node scripts/verify-recovery.mjs
```

### TypeScript/TSX syntax

All available non-declaration TypeScript files were parsed and transpiled independently with the TypeScript compiler API:

```text
TypeScript syntax check passed for 249 TS/TSX files
```

This is a syntax check, not a workspace typecheck.

### Repository static audits

```text
Public surface audit passed.
Architecture audit passed.
Architecture warning: engagement storage still contains a dev/preview memory fallback.
Launch gate skipped strict checks because NEXT_PUBLIC_LAUNCH_STATUS is not live.
```

## Failed or blocked

### Ad placement audit

Failed because the uploaded archive omits the public route files that render homepage, article, category, latest, and trending placements. Fourteen required placements are registered but not found in the recovered source.

### Full workspace typecheck

`tsc -p apps/web/tsconfig.json --noEmit` could not run meaningfully because dependencies are not installed, the workspace `@nagarikwatch/tsconfig` package is not resolved through `node_modules`, generated Next types are absent, and the uploaded archive omits route source. The raw diagnostic log is included as `VERIFICATION_TSC_WEB.log`.

### `pnpm` install/build/test

Blocked. `pnpm` was not installed, and Corepack could not fetch it because registry network access failed (`EAI_AGAIN registry.npmjs.org`).

### Database/auth browser smoke test

Blocked. Docker is not available in this environment, so local Postgres could not be started. The login endpoint and admin session redirect therefore could not be exercised end-to-end.

## Verification commands for the intact repository

```bash
corepack enable
corepack prepare pnpm@9.12.0 --activate
pnpm install --frozen-lockfile
docker compose up -d
pnpm --filter @nagarikwatch/web... build
pnpm --filter @nagarikwatch/web dev
```

In another terminal:

```bash
curl -i http://localhost:3000/api/auth/sign-in/email \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3000' \
  --data '{"email":"admin@nagarikwatch.com","password":"<your-local-admin-password>"}'
```
