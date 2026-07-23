#!/usr/bin/env node
/**
 * Cloudflare Pages build entry.
 * Sets a build-time site origin when the dashboard var is missing, then runs the
 * static Pages export (not the full turbo monorepo build / Payload admin).
 */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

function withHttps(value) {
  const trimmed = String(value || '').trim().replace(/\/$/, '')
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

const siteUrl =
  withHttps(process.env.NEXT_PUBLIC_SITE_URL) ||
  withHttps(process.env.SITE_URL) ||
  withHttps(process.env.CF_PAGES_URL) ||
  'https://nagarik-watch.pages.dev'

const env = {
  ...process.env,
  NODE_ENV: 'production',
  CF_PAGES: process.env.CF_PAGES || '1',
  CF_PAGES_STATIC: '1',
  NEXT_PUBLIC_SITE_URL: siteUrl,
  BETTER_AUTH_URL: withHttps(process.env.BETTER_AUTH_URL) || siteUrl,
}

const result = spawnSync(
  'pnpm',
  ['--filter', '@nagarikwatch/web', 'build:pages'],
  { cwd: root, env, stdio: 'inherit', shell: process.platform === 'win32' },
)

process.exit(result.status ?? 1)
