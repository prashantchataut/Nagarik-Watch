#!/usr/bin/env node
/**
 * Root build entry for CI hosts.
 * Cloudflare Pages sets CF_PAGES=1 — use the static export path instead of
 * turbo building the whole monorepo (admin + SSR web), which needs SITE_URL
 * and does not produce apps/web/out.
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

function isCloudflarePages() {
  const flag = String(process.env.CF_PAGES || '').toLowerCase()
  return flag === '1' || flag === 'true' || process.env.CF_PAGES_STATIC === '1'
}

const usePages = isCloudflarePages()
const command = usePages ? 'node' : 'pnpm'
const args = usePages
  ? [path.join(root, 'scripts', 'cf-pages-build.mjs')]
  : ['exec', 'turbo', 'run', 'build']

console.log(
  usePages
    ? '[build] Cloudflare Pages detected — running static export (build:cf-pages)'
    : '[build] Running turbo run build',
)

const result = spawnSync(command, args, {
  cwd: root,
  env: process.env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

process.exit(result.status ?? 1)
