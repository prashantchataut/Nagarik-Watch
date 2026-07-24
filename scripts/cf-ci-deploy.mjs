#!/usr/bin/env node
/**
 * Workers Builds default deploy is `npx wrangler deploy`.
 * Force --no-autoconfig so monorepo workspace detection never runs.
 * Expects apps/web/out from the preceding build step.
 */
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'apps', 'web', 'out')
const configPath = path.join(root, 'wrangler.jsonc')

if (!existsSync(outDir)) {
  console.error('[deploy] Missing apps/web/out — build the static export first.')
  process.exit(1)
}
if (!existsSync(configPath)) {
  console.error('[deploy] Missing root wrangler.jsonc')
  process.exit(1)
}

console.log('[deploy] wrangler deploy --config wrangler.jsonc --no-autoconfig')

const wranglerBin = path.join(root, 'node_modules', 'wrangler', 'bin', 'wrangler.js')
const result = spawnSync(
  process.execPath,
  [wranglerBin, 'deploy', '--config', 'wrangler.jsonc', '--no-autoconfig'],
  {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
    shell: false,
  },
)

process.exit(result.status ?? 1)
