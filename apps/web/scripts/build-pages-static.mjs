#!/usr/bin/env node
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { buildStaffAdminHtml } from './staff-admin-gateway.mjs'

const appDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const middlewarePath = path.join(appDir, 'middleware.ts')
const middlewareBak = path.join(appDir, 'middleware.ts.pages-bak')
const outDir = path.join(appDir, 'out')
const stashRoot = path.join(appDir, '.pages-build-bak')
const stashed = []

function stashPath(fromRelative, toRelative) {
  const from = path.join(appDir, fromRelative)
  const to = path.join(appDir, toRelative)
  if (!existsSync(from)) return
  mkdirSync(path.dirname(to), { recursive: true })
  renameSync(from, to)
  stashed.push({ from, to })
}

function stashAppSegment(name) {
  stashPath(path.join('app', name), path.join('.pages-build-bak', name))
}

function stashLocaleSegment(name) {
  stashPath(path.join('app', '[locale]', name), path.join('.pages-build-bak', '[locale]', name))
}

function restoreStashed() {
  for (const { from, to } of stashed.reverse()) {
    if (!existsSync(to)) continue
    mkdirSync(path.dirname(from), { recursive: true })
    renameSync(to, from)
  }
}

function run(cmd, args, env = {}) {
  const result = spawnSync(cmd, args, {
    cwd: appDir,
    stdio: 'inherit',
    env: { ...process.env, CF_PAGES_STATIC: '1', ...env },
    shell: process.platform === 'win32',
  })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function copyIntoRoot(fromDir, toDir) {
  for (const name of readdirSync(fromDir)) {
    const from = path.join(fromDir, name)
    const to = path.join(toDir, name)
    if (statSync(from).isDirectory()) {
      mkdirSync(to, { recursive: true })
      copyIntoRoot(from, to)
    } else {
      mkdirSync(path.dirname(to), { recursive: true })
      cpSync(from, to, { force: true })
    }
  }
}

function flattenNepaliRoot() {
  const neDir = path.join(outDir, 'ne')
  if (!existsSync(neDir)) return
  copyIntoRoot(neDir, outDir)
  writeFileSync(
    path.join(outDir, '_redirects'),
    '/ne/*  /:splat  308\n',
    'utf8',
  )
}

try {
  process.env.CONTENT_SOURCE = process.env.CONTENT_SOURCE || 'json'
  process.env.NEXT_PUBLIC_LAUNCH_STATUS = process.env.NEXT_PUBLIC_LAUNCH_STATUS || 'preview'
  if (!process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
    process.env.NEXT_PUBLIC_SITE_URL =
      process.env.CF_PAGES_URL?.trim() || 'https://nagarik-watch.pages.dev'
  }

  run('node', ['scripts/patch-page-dynamic.mjs'])
  if (existsSync(middlewarePath)) renameSync(middlewarePath, middlewareBak)
  for (const segment of ['api', 'admin']) stashAppSegment(segment)
  for (const segment of ['auth', 'journalist']) stashLocaleSegment(segment)
  run('pnpm', ['exec', 'next', 'build'])
  flattenNepaliRoot()

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.CF_PAGES_URL?.trim() ||
    'https://nagarikwatch.com'
  const cmsAdminUrl =
    process.env.NEXT_PUBLIC_CMS_ADMIN_URL?.trim() ||
    process.env.PAYLOAD_ADMIN_URL?.trim() ||
    ''
  const adminAppUrl =
    process.env.NEXT_PUBLIC_ADMIN_APP_URL?.trim() ||
    process.env.ADMIN_APP_URL?.trim() ||
    ''
  mkdirSync(path.join(outDir, 'admin'), { recursive: true })
  writeFileSync(
    path.join(outDir, 'admin', 'index.html'),
    buildStaffAdminHtml({ siteUrl, cmsAdminUrl, adminAppUrl }),
    'utf8',
  )
  console.log(`Wrote static staff gateway → ${adminAppUrl}/admin/login`)

  if (process.argv.includes('--deploy')) {
    run('pnpm', [
      'exec',
      'wrangler',
      'pages',
      'deploy',
      './out',
      '--project-name=nagarik-watch',
      '--branch=main',
    ])
  } else {
    console.log(`Static export: ${outDir}`)
  }
} finally {
  if (existsSync(middlewareBak)) renameSync(middlewareBak, middlewarePath)
  restoreStashed()
}
