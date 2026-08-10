#!/usr/bin/env node
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { buildStaffAdminHtml } from './staff-admin-gateway.mjs'
import { buildPublicDeskHtml } from './static-desk-gateway.mjs'

const appDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const middlewarePath = path.join(appDir, 'middleware.ts')
const middlewareBak = path.join(appDir, 'middleware.ts.pages-bak')
const outDir = path.join(appDir, 'out')
const stashed = []

function stashPath(fromRelative, toRelative) {
  const from = path.join(appDir, fromRelative)
  const to = path.join(appDir, toRelative)
  if (!existsSync(from)) return
  mkdirSync(path.dirname(to), { recursive: true })
  // Prefer rename; on Windows, AV/indexers often lock trees so fall back to copy+remove.
  try {
    if (existsSync(to)) rmSync(to, { recursive: true, force: true })
    renameSync(from, to)
  } catch {
    cpSync(from, to, { recursive: true, force: true })
    rmSync(from, { recursive: true, force: true })
  }
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
    try {
      if (existsSync(from)) rmSync(from, { recursive: true, force: true })
      renameSync(to, from)
    } catch {
      cpSync(to, from, { recursive: true, force: true })
      rmSync(to, { recursive: true, force: true })
    }
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
    [
      '/ne/*  /:splat  308',
      '/auth/login  /auth/login/  308',
      '/auth/signup  /auth/signup/  308',
      '/auth/profile  /auth/profile/  308',
      '/journalist/login  /journalist/login/  308',
      '/journalist  /journalist/login/  308',
      '/admin  /admin/  308',
      '',
    ].join('\n'),
    'utf8',
  )
}

function writeJournalistGateway(siteUrl) {
  const desks = [
    {
      dir: path.join(outDir, 'journalist', 'login'),
      titleNe: 'पत्रकार डेस्क',
      leadNe:
        'पत्रकार लगइन यस स्थिर पब्लिक होस्टमा चल्दैन। समाचारकक्ष पहुँच पूर्ण एप होस्टमा मात्र उपलब्ध छ। आम पाठकका लागि गृहपृष्ठ र सुरक्षित समाचार खुला छ।',
      titleEn: 'Journalist desk',
      leadEn:
        'Journalist sign-in is not available on this static public host. Newsroom access needs the full app host. Readers can still use the homepage and saved stories.',
      primaryLabelNe: 'गृहपृष्ठमा फर्कनुहोस्',
    },
  ]

  for (const desk of desks) {
    mkdirSync(desk.dir, { recursive: true })
    writeFileSync(
      path.join(desk.dir, 'index.html'),
      buildPublicDeskHtml({
        siteUrl,
        titleNe: desk.titleNe,
        leadNe: desk.leadNe,
        titleEn: desk.titleEn,
        leadEn: desk.leadEn,
        primaryHref: `${String(siteUrl).replace(/\/$/, '')}/`,
        primaryLabelNe: desk.primaryLabelNe,
      }),
      'utf8',
    )
  }

  mkdirSync(path.join(outDir, 'en', 'journalist', 'login'), { recursive: true })
  const src = path.join(outDir, 'journalist', 'login', 'index.html')
  const dest = path.join(outDir, 'en', 'journalist', 'login', 'index.html')
  if (existsSync(src)) cpSync(src, dest, { force: true })
}

try {
  console.warn(
    '[build-pages-static] PREVIEW ONLY — strips app/api + app/admin. Not the launch origin (ADR-004). Use Vercel Node + Cloudflare DNS for production. See docs/launch-runbook.md.',
  )
  process.env.CONTENT_SOURCE = process.env.CONTENT_SOURCE || 'json'
  process.env.NEXT_PUBLIC_LAUNCH_STATUS = process.env.NEXT_PUBLIC_LAUNCH_STATUS || 'preview'
  process.env.NEXT_PUBLIC_STATIC_EXPORT = '1'
  process.env.CF_PAGES_STATIC = process.env.CF_PAGES_STATIC || '1'
  if (!process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
    process.env.NEXT_PUBLIC_SITE_URL =
      process.env.CF_PAGES_URL?.trim() || 'https://nagarik-watch.pages.dev'
  }

  run('node', ['scripts/patch-page-dynamic.mjs'])
  if (existsSync(middlewarePath)) renameSync(middlewarePath, middlewareBak)
  for (const segment of ['api', 'admin']) stashAppSegment(segment)
  for (const segment of ['journalist']) stashLocaleSegment(segment)
  run('pnpm', ['exec', 'next', 'build'])
  flattenNepaliRoot()

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.CF_PAGES_URL?.trim() ||
    'https://nagarikwatch.com'
  const cmsAdminUrl =
    process.env.NEXT_PUBLIC_CMS_ADMIN_URL?.trim() || process.env.PAYLOAD_ADMIN_URL?.trim() || ''
  const adminAppUrl =
    process.env.NEXT_PUBLIC_ADMIN_APP_URL?.trim() || process.env.ADMIN_APP_URL?.trim() || ''
  mkdirSync(path.join(outDir, 'admin'), { recursive: true })
  writeFileSync(
    path.join(outDir, 'admin', 'index.html'),
    buildStaffAdminHtml({ siteUrl, cmsAdminUrl, adminAppUrl }),
    'utf8',
  )
  writeJournalistGateway(siteUrl)
  console.log(`Wrote static staff gateway → ${adminAppUrl}/admin/login`)
  console.log('Wrote static journalist gateway')

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
