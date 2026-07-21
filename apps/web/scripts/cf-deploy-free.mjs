#!/usr/bin/env node
/**
 * Cloudflare Workers Free deploy: slim bundle (CF_WORKERS=1) + wrangler --minify.
 * Build on WSL/Linux — see ../../scripts/cf-build-wsl.sh on Windows.
 */
import { spawnSync } from 'node:child_process'

process.env.CF_WORKERS = '1'

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

run('pnpm', ['exec', 'opennextjs-cloudflare', 'build'])
run('pnpm', ['exec', 'wrangler', 'deploy', '--minify'])
