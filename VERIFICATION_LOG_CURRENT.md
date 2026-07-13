# Nagarik Watch — Current Verification Log

**Date:** 2026-07-12  
**Scope:** Recovered and repaired source tree in this delivery

## नेपाली सारांश

Repository-native static checks सबै पास भएका छन्। तर यो execution environment मा `pnpm` र installed `node_modules` उपलब्ध छैनन्, र npm/GitHub network resolution बन्द छ। त्यसैले dependency-aware `typecheck`, ESLint, Vitest, Next build र Playwright E2E चलाउन सकिएन। ती नचलाएको अवस्थामा “पूर्ण रूपमा verified” भनेर दाबी गरिएको छैन।

## Passed checks

```text
$ node syntax scan
Parsed 326 TypeScript files; syntax diagnostics: 0

$ node scripts/audit-public-surface.mjs
Public surface audit passed.

$ node scripts/audit-architecture.mjs
Architecture audit passed.

$ node scripts/audit-ad-placements.mjs
Ad placement audit passed (20 placements, 20 rendered).

$ node scripts/verify-recovery.mjs
Repository recovery verification passed
- missing workspace source and lockfile restored
- secret-bearing local files and nested archive excluded
- persistent auth, explicit migrations, and boot provisioning verified
- production content persistence and reader-shell wiring verified

$ node scripts/launch-gate.mjs
Launch gate skipped strict checks because NEXT_PUBLIC_LAUNCH_STATUS is not live.

$ empty catch scan
No empty catch blocks found.
```

## Expected negative test: strict live launch

The launch gate was executed with an otherwise empty environment and `NEXT_PUBLIC_LAUNCH_STATUS=live`. It exited with status `1`, as required, and blocked launch for missing canonical URL, verified publication credentials, Postgres, Payload service URL/token, strong secrets, durable storage, and production content mode.

This proves the app does not silently treat placeholder configuration as launch-ready.

## Not executable in this environment

The following commands were **not** successfully run because the runtime has no pnpm installation or dependency tree, and external package registries are unreachable:

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @nagarikwatch/admin build
pnpm --filter @nagarikwatch/web build
pnpm test:e2e
```

A parser-only TypeScript scan is not a substitute for dependency-aware typechecking. Browser behavior, database migrations, authentication sessions, Payload REST calls, image optimization, and responsive rendering therefore remain runtime-verification items.

## Required verification on a connected development machine

```bash
corepack enable
corepack prepare pnpm@10.17.1 --activate
pnpm install --frozen-lockfile

# Start Postgres first, then:
pnpm --filter @nagarikwatch/admin migrate
pnpm --filter @nagarikwatch/admin seed

pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm verify:static
pnpm --filter @nagarikwatch/admin build
pnpm --filter @nagarikwatch/web build
pnpm test:e2e
```

Run the strict launch gate only after filling production configuration:

```bash
NEXT_PUBLIC_LAUNCH_STATUS=live pnpm launch:gate
```

## Raw repository-native verification output

```text
$ node syntax scan
Parsed 326 TypeScript files; syntax diagnostics: 0
$ node scripts/audit-public-surface.mjs
Public surface audit passed.
$ node scripts/audit-architecture.mjs
Architecture audit passed.
$ node scripts/audit-ad-placements.mjs
Ad placement audit passed (20 placements, 20 rendered).
$ node scripts/verify-recovery.mjs
Repository recovery verification passed
- missing workspace source and lockfile restored
- secret-bearing local files and nested archive excluded
- persistent auth, explicit migrations, and boot provisioning verified
- production content persistence and reader-shell wiring verified
$ node scripts/launch-gate.mjs
Launch gate skipped strict checks because NEXT_PUBLIC_LAUNCH_STATUS is not live.
$ empty catch scan
No empty catch blocks found.
```

## Raw strict launch negative-test output

```text
Launch gate warnings:
- No analytics provider is configured
Launch gate failed:
- Canonical site URL is missing or unverified
- Legal publisher name is missing or unverified
- Editor-in-chief is missing or unverified
- Publication registration number is missing or unverified
- Newsroom phone is missing or unverified
- Newsroom address is missing or unverified
- Newsroom email is missing or unverified
- DATABASE_URL is required for durable production state
- Payload CMS server URL is missing or unverified
- Journalist-to-Payload service-account API key is missing or unverified
- AUTH_SECRET must be a non-placeholder secret of at least 32 characters
- PAYLOAD_SECRET must be a non-placeholder secret of at least 32 characters
- REVALIDATE_SECRET must be a non-placeholder secret of at least 32 characters
- SUBMISSION_IP_SALT must be a non-placeholder secret of at least 32 characters
- CONTENT_SOURCE=payload is mandatory for a live deployment
- PAYLOAD_DB_PUSH must be false in production; apply checked-in migrations instead
- Advertising sales email is missing
- Durable media/object storage is not configured
exit=1
```
