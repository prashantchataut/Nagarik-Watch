#!/usr/bin/env node
/**
 * Deploy full apps/web (admin + API + reader) via WSL OpenNext build, then wrangler.
 * Falls back to instructions if Workers Free size limit blocks deploy.
 */
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = path.join(appDir, '../..')
const wslScript = path.join(repoRoot, 'scripts', 'cf-deploy-app-wsl.sh')

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    cwd: opts.cwd ?? appDir,
    stdio: 'inherit',
    env: { ...process.env, CF_WORKERS: '1', ...opts.env },
    shell: opts.shell ?? false,
  })
  return result.status ?? 1
}

if (process.platform === 'win32' && existsSync(wslScript)) {
  const wslPath =
    '/mnt/c/Users/MMT/Documents/side quests/Nagarik Watch/scripts/cf-deploy-app-wsl.sh'
  process.exit(run('wsl', ['-d', 'Ubuntu', '--', 'bash', wslPath]))
}

process.env.CF_WORKERS = '1'
const build = run('pnpm', ['exec', 'opennextjs-cloudflare', 'build'], { shell: true })
if (build !== 0) process.exit(build)
process.exit(
  run('pnpm', ['exec', 'wrangler', 'deploy', '--minify', '--config', 'wrangler.admin.jsonc'], {
    shell: true,
  }),
)
