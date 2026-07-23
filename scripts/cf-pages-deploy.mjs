#!/usr/bin/env node
/**
 * Cloudflare CI deploy for the static Pages export.
 * Dashboard must NOT use bare `npx wrangler deploy` from the monorepo root —
 * that targets Workers and fails workspace detection.
 *
 * Preferred Pages setup: leave Deploy command empty and set output dir to
 * apps/web/out. Use this script only when the host requires an explicit deploy.
 */
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'apps', 'web', 'out')

if (!existsSync(outDir)) {
  console.error('[deploy] Missing apps/web/out — run `pnpm build` (or build:cf-pages) first.')
  process.exit(1)
}

const project = process.env.CF_PAGES_PROJECT_NAME || 'nagarik-watch'
const branch =
  process.env.CF_PAGES_BRANCH ||
  process.env.WORKERS_CI_BRANCH ||
  process.env.GITHUB_REF_NAME ||
  'main'

console.log(`[deploy] wrangler pages deploy ${outDir} --project-name=${project} --branch=${branch}`)

const result = spawnSync(
  'pnpm',
  [
    'exec',
    'wrangler',
    'pages',
    'deploy',
    outDir,
    `--project-name=${project}`,
    `--branch=${branch}`,
  ],
  {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  },
)

process.exit(result.status ?? 1)
