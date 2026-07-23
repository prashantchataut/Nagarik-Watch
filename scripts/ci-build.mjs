#!/usr/bin/env node
/**
 * Root build entry for CI hosts.
 * Cloudflare Pages (and some Workers Builds images) should produce the static
 * export under apps/web/out — not turbo building the whole monorepo.
 *
 * Detection is intentionally broad: CF_PAGES is not always injected early (or
 * at all) on every Cloudflare build product that still uses /opt/buildhome.
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

function truthy(value) {
  const flag = String(value || '').toLowerCase()
  return flag === '1' || flag === 'true' || flag === 'yes'
}

function isCloudflarePagesLike() {
  if (truthy(process.env.CF_PAGES_STATIC)) return true
  if (truthy(process.env.CF_PAGES)) return true
  // Present on Pages even when CF_PAGES itself is missing from the shell.
  if (process.env.CF_PAGES_URL || process.env.CF_PAGES_BRANCH || process.env.CF_PAGES_COMMIT_SHA) {
    return true
  }
  // Workers Builds / shared Cloudflare CI image (not Vercel).
  if (truthy(process.env.WORKERS_CI) || truthy(process.env.CLOUDFLARE_CI)) return true
  if (!process.env.VERCEL) {
    const cwd = process.cwd().replace(/\\/g, '/')
    if (cwd.includes('/opt/buildhome') || cwd.includes('/opt/buildhome/repo')) return true
  }
  return false
}

const usePages = isCloudflarePagesLike()
const command = usePages ? 'node' : 'pnpm'
const args = usePages
  ? [path.join(root, 'scripts', 'cf-pages-build.mjs')]
  : ['exec', 'turbo', 'run', 'build']

console.log(
  usePages
    ? '[build] Cloudflare CI detected — running static export (build:cf-pages)'
    : '[build] Running turbo run build',
)

const result = spawnSync(command, args, {
  cwd: root,
  env: process.env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

process.exit(result.status ?? 1)
