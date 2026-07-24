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

const wranglerArgs = ['deploy', '--config', 'wrangler.jsonc', '--no-autoconfig']

const result = spawnSync(
  process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
  ['exec', 'wrangler', ...wranglerArgs],
  {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
    // Avoid shell:true on Windows — paths with spaces (e.g. "side quests") get split.
    shell: false,
  },
)

process.exit(result.status ?? 1)
