# Current verification log — 2026-07-14

## Repository-level checks

| Check | Result |
|---|---|
| Canonical workspaces | Passed: `apps/web`, `apps/admin`, `packages/*` |
| Package manifests vs lockfile | Passed: 8/8 |
| Public-surface audit | Passed |
| Ad-placement audit | Passed: 20 registered, 17 rendered |
| Architecture audit | Passed |
| Repository recovery audit | Passed |
| Nagarik Watch project-skill audit | Passed: 0 failures, 0 warnings |
| TS/TSX syntax parse | Passed: 370 files, 0 errors |
| Recommendation/notification compiled smoke test | Passed |

## Deployment incident verification

The supplied Vercel log for `b13a8ce` still reports nine workspaces and `apps/cms/package.json`. This proves the deployed Git tree does not contain the canonical workspace repair. The delivered repository has no `apps/cms` manifest and prevents a stale legacy directory from joining the pnpm workspace.

## Checks not runnable in this environment

The npm registry could not be resolved, so dependencies could not be installed. The following require a connected CI or development machine:

```text
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

## Production-only acceptance tests

- Payload media upload/retrieval/delete through durable object storage;
- email confirmation, password recovery and newsroom invitation delivery;
- Web Push subscription, delivery, cooldown, quiet hours, retries and unsubscribe;
- CMS publish/revalidation/notification event flow;
- migration execution on a staging database snapshot;
- 360 px, tablet and desktop visual QA;
- keyboard, screen-reader, 200% zoom and reduced-motion checks;
- Core Web Vitals under real images, analytics and traffic.
