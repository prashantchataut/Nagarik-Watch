#!/usr/bin/env node
/**
 * Push secrets from .dev.vars to Cloudflare Worker (nagarik-watch-app).
 * Skips blank values and comments.
 */
import { createReadStream, existsSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const devVars = path.join(appDir, '.dev.vars')
const secretKeys = new Set([
  'AUTH_SECRET',
  'BETTER_AUTH_SECRET',
  'REVALIDATE_SECRET',
  'DATABASE_URL',
  'CRON_SECRET',
  'NEWSROOM_SUPERADMIN_PASSWORD',
  'NEWSROOM_ADMIN_PASSWORD',
])

async function parseDevVars() {
  if (!existsSync(devVars)) {
    console.error('Missing .dev.vars — run: node scripts/configure-admin-env.mjs')
    process.exit(1)
  }
  const entries = new Map()
  const rl = createInterface({ input: createReadStream(devVars), crlfDelay: Infinity })
  for await (const line of rl) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (value) entries.set(key, value)
  }
  return entries
}

const entries = await parseDevVars()

for (const key of secretKeys) {
  const value = entries.get(key)
  if (!value) {
    console.log(`skip ${key} (empty)`)
    continue
  }
  console.log(`setting secret ${key}...`)
  const result = spawnSync(
    'pnpm',
    ['exec', 'wrangler', 'secret', 'put', key, '--config', 'wrangler.admin.jsonc'],
    {
      cwd: appDir,
      input: value,
      stdio: ['pipe', 'inherit', 'inherit'],
      shell: process.platform === 'win32',
    },
  )
  if (result.status !== 0) process.exit(result.status ?? 1)
}

console.log('Secrets uploaded for nagarik-watch-app.')
