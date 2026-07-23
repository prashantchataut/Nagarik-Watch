#!/usr/bin/env node
/**
 * Sync non-secret vars from .dev.vars into wrangler.admin.jsonc `vars`.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const devVarsPath = path.join(appDir, '.dev.vars')
const configPath = path.join(appDir, 'wrangler.admin.jsonc')

const entries = new Map()
for (const line of readFileSync(devVarsPath, 'utf8').split(/\r?\n/)) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq < 0) continue
  entries.set(trimmed.slice(0, eq).trim(), trimmed.slice(eq + 1).trim())
}

const siteUrl =
  entries.get('NEXT_PUBLIC_SITE_URL') ||
  entries.get('BETTER_AUTH_URL') ||
  'https://nagarik-watch.pages.dev'

const vars = {
  CONTENT_SOURCE: entries.get('CONTENT_SOURCE') || 'json',
  NEXT_PUBLIC_LAUNCH_STATUS: entries.get('NEXT_PUBLIC_LAUNCH_STATUS') || 'preview',
  ENABLE_WEB_ADMIN_SCAFFOLD: entries.get('ENABLE_WEB_ADMIN_SCAFFOLD') || 'true',
  NEXT_PUBLIC_SITE_URL: siteUrl,
  BETTER_AUTH_URL: entries.get('BETTER_AUTH_URL') || siteUrl,
  NEWSROOM_SUPERADMIN_EMAIL: entries.get('NEWSROOM_SUPERADMIN_EMAIL') || '',
  NEWSROOM_SUPERADMIN_NAME: entries.get('NEWSROOM_SUPERADMIN_NAME') || '',
  NEWSROOM_ADMIN_EMAIL: entries.get('NEWSROOM_ADMIN_EMAIL') || '',
  NEWSROOM_ADMIN_NAME: entries.get('NEWSROOM_ADMIN_NAME') || '',
}

const config = {
  $schema: 'node_modules/wrangler/config-schema.json',
  name: 'nagarik-watch',
  main: '.open-next/worker.js',
  compatibility_date: '2026-07-20',
  compatibility_flags: ['nodejs_compat', 'global_fetch_strictly_public'],
  assets: {
    directory: '.open-next/assets',
    binding: 'ASSETS',
  },
  workers_dev: true,
  preview_urls: true,
  vars,
}

writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`)
console.log('Updated wrangler.admin.jsonc vars (no secret values written).')
console.log('NEXT_PUBLIC_SITE_URL=', siteUrl)
