# Pending changes that need `workflow` scope

`workflow-fixes.patch` holds two changes to `.github/workflows/` that could not
be pushed from the agent environment. The GitHub OAuth token available there has
no `workflow` scope, and GitHub answers a write under `.github/workflows/` with
`404 Not Found` rather than a permission error. Everything else in the pull
request that carried this file is applied normally.

Apply it from a checkout that can push workflows:

```bash
git apply docs/pending/workflow-fixes.patch
git add .github/workflows
git commit -m "ci: verify lockfile overrides before install; fix the ops-cron base host"
```

Then delete this directory — it exists only to carry the patch across the scope
boundary.

## What the two changes do

**`ci.yml` — verify lockfile overrides before `Install`.**
`pnpm.overrides` drifted from `pnpm-lock.yaml`, which makes
`pnpm install --frozen-lockfile` abort with
`ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`. That is the command every CI job runs and
the one `vercel.json` uses as its `installCommand`, so CI failed on its Install
step for 25 consecutive pushes and Vercel stopped shipping. The new step runs
`scripts/verify-lockfile-overrides.mjs` *before* Install so the mismatch is
reported by name instead of as a cryptic install abort. The script is already on
`main` via this PR and is also wired into `pnpm verify:static`, so the gate still
functions without this patch — this step only improves the error message and
fails faster.

**`ops-crons.yml` — stop calling a hostname that does not exist.**
The workflow defaulted to `https://www.nagarikwatch.com`. That name has no DNS
record; only the apex `nagarikwatch.com` is served. Every scheduled run — one
every five minutes — failed on name resolution, so the failure said nothing
about the crons themselves. The patch defaults to the apex and preflights the
host, so a misconfigured `CRON_BASE_URL` reports itself clearly.

Until the patch is applied the cron workflow keeps failing. Setting the
`CRON_BASE_URL` repository secret to the deployed origin fixes it without any
code change, and is worth doing regardless of the patch.
