# Repo declutter — current, verified state

> **Previous version of this file was dangerous.** It instructed readers to run
> `git rm -r apps/web/app apps/web/components apps/web/lib …`, which deletes the
> entire reader application. Do not follow any instruction that removes those
> paths: they are the product. That list was written for an older consolidation
> attempt that was never applied, and it was left in the repo root where a human
> or an agent could have executed it.

## What is actually canonical

| Path                | Status                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `apps/web`          | **The reader app.** Next.js 16 App Router, real routes, SSG + ISR. Owns the public site. |
| `apps/admin`        | Payload CMS. **Separate deployable, outside the root pnpm workspace.** Not built by CI.  |
| `packages/db`       | Shared types, BS↔AD date maths, workflow rules. Used by `apps/web`.                      |
| `packages/ui`       | Design tokens and shared reader components.                                              |
| `packages/infra`    | Deployment/infra helpers.                                                                |
| `packages/ingest`   | Wire/ingest helpers.                                                                     |
| `packages/tsconfig` | Shared TypeScript config.                                                                |
| `design-system/`    | Token source of truth referenced by `packages/ui`.                                       |
| `scripts/`          | Repo-native gates: workspace/lock verification, static audits, perf budget, launch gate. |
| `docs/`             | Product, architecture, runbooks, audits.                                                 |

`pnpm-workspace.yaml` lists `apps/web` and `packages/*` only. That is deliberate:
`apps/admin` has no `pnpm-lock.yaml` importer, so adding it to the workspace would
make `pnpm install --frozen-lockfile` fail for everyone. `scripts/verify-canonical-workspaces.mjs`
and `scripts/verify-workspace-lock.mjs` now assert exactly this and fail loudly if
the two files drift apart again.

## Cleaned up in this pass

Removed from git (recoverable via `git log --follow`):

- `.tmp-assessment-b/`, `.tmp-chrome/` — ~5.5 MB of agent screenshot scratch at the repo root.
- `apps/web/tsconfig.zip` — a 1.9 MB stray archive.
- `apps/web/bun.lock` — a second package manager's lockfile competing with `pnpm-lock.yaml`.
- `apps/web/scripts/*.png`, `img_*.json`, `img_err.txt` — one-off capture dumps.

`.gitignore` and `.prettierignore` now ignore `.audit/`, `.tmp-*/`, `*.zip` and stray
`bun.lock` files so scratch cannot be committed again.

## Safe local cleanups (not committed)

```bash
rm -rf apps/web/.next .turbo coverage playwright-report test-results
```

## Verification

The repo has one command for the whole gate:

```bash
pnpm verify      # workspaces → lock → format → lint → typecheck → tests → audits → build → budget → db tests
```

It must pass from a clean checkout with no `.env` file. If it does not, that is a
bug in the repo, not in your environment.
