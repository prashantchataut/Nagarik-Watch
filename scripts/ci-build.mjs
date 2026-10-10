#!/usr/bin/env node
/**
 * Root build entry for CI hosts.
 *
 * This used to branch on Cloudflare and emit the static export under
 * `apps/web/out`, which is what the origin published and why every `/api/*`
 * route answered 404 in production: a static export stashes `app/api` and
 * `app/admin` to make the build pass. The origin now deploys the OpenNext
 * Worker (`scripts/cf-ci-deploy.mjs`), which builds the server output itself,
 * so the plain build is correct on every platform.
 *
 * The static Pages preview is still available, but only when asked for
 * explicitly via `pnpm build:cf-pages` / `pnpm deploy:cf-pages`.
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

const result = spawnSync('pnpm', ['exec', 'turbo', 'run', 'build'], {
  cwd: root,
  env: process.env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

process.exit(result.status ?? 1)
