#!/usr/bin/env node
/**
 * Production deploy for the public site.
 *
 * Apex (nagarikwatch.com) is served from Cloudflare Pages project `nagarik-watch`.
 * Workers (`wrangler deploy`) only updates *.workers.dev and is not enough for the
 * custom domain. This script deploys Pages first, then Workers for the workers.dev
 * mirror.
 *
 * Expects apps/web/out from `pnpm run build:cf-pages`.
 */
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'apps', 'web', 'out')
const configPath = path.join(root, 'wrangler.jsonc')
const wranglerBin = path.join(root, 'node_modules', 'wrangler', 'bin', 'wrangler.js')

if (!existsSync(outDir)) {
  console.error('[deploy] Missing apps/web/out — build the static export first.')
  process.exit(1)
}
if (!existsSync(configPath)) {
  console.error('[deploy] Missing root wrangler.jsonc')
  process.exit(1)
}

function run(label, args) {
  console.log(`[deploy] ${label}`)
  const result = spawnSync(process.execPath, [wranglerBin, ...args], {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
    shell: false,
  })
  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1)
  }
}

const project = process.env.CF_PAGES_PROJECT_NAME || 'nagarik-watch'
const branch =
  process.env.CF_PAGES_BRANCH ||
  process.env.WORKERS_CI_BRANCH ||
  process.env.GITHUB_REF_NAME ||
  'main'

run(`wrangler pages deploy apps/web/out --project-name=${project}`, [
  'pages',
  'deploy',
  outDir,
  `--project-name=${project}`,
  `--branch=${branch}`,
  '--commit-dirty=true',
])

run('wrangler deploy --config wrangler.jsonc --no-autoconfig', [
  'deploy',
  '--config',
  'wrangler.jsonc',
  '--no-autoconfig',
])

console.log(
  '[deploy] Done. If apex still looks stale, purge cache for nagarikwatch.com in the Cloudflare zone dashboard.',
)
