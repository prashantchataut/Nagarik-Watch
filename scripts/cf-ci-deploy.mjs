#!/usr/bin/env node
/**
 * Production deploy for the public site — Cloudflare Workers (OpenNext).
 *
 * Why this is not a static Pages upload: a static export has no server, so
 * `build-pages-static.mjs` has to stash `app/api` + `app/admin` to make the
 * build succeed. That is what left the live apex answering 404 for every
 * `/api/*` route while `/` looked healthy. The origin has to run the Worker so
 * the routes exist.
 *
 * `CF_WORKERS=1` selects the static-assets incremental cache and cache
 * interception in open-next.config.ts. That keeps prerendered pages off the
 * Worker entirely, which is what makes this viable on Workers Free: the Free
 * plan bills 10 ms CPU per request, and static assets cost none.
 *
 * Cloudflare keeps the previous version live if this build fails, so a broken
 * push does not take the site down.
 *
 * Optional static Pages preview still exists behind `pnpm deploy:cf-pages`.
 */
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const appDir = path.join(root, 'apps', 'web')
const configName = 'wrangler.jsonc'
const configPath = path.join(appDir, configName)
const wranglerBin = path.join(root, 'node_modules', 'wrangler', 'bin', 'wrangler.js')

if (!existsSync(configPath)) {
  console.error(`[deploy] Missing ${configPath}`)
  process.exit(1)
}

function run(label, command, args, cwd) {
  console.log(`[deploy] ${label}`)
  const result = spawnSync(command, args, {
    cwd,
    env: { ...process.env, CF_WORKERS: '1' },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1)
}

run('opennextjs-cloudflare build', 'pnpm', ['exec', 'opennextjs-cloudflare', 'build'], appDir)

const workerEntry = path.join(appDir, '.open-next', 'worker.js')
if (!existsSync(workerEntry)) {
  console.error(
    [
      `[deploy] The OpenNext build did not produce ${workerEntry}.`,
      '  The Worker deploy cannot continue without it.',
      '',
      'Check the build log above. A common cause is a failed `next build`',
      'inside the OpenNext step, or a stale CF_PAGES_STATIC=1 in the build',
      'environment, which forces output: "export" and removes every API route.',
    ].join('\n'),
  )
  process.exit(1)
}

run(
  'wrangler deploy',
  process.execPath,
  [wranglerBin, 'deploy', '--minify', '--config', configName, '--no-autoconfig'],
  appDir,
)

console.log(
  '[deploy] Worker deployed. Purge the Cloudflare cache for the apex if it still looks stale.',
)
