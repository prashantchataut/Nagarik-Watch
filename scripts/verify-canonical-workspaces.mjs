#!/usr/bin/env node
/**
 * Canonical workspace verification.
 *
 * History: this gate used to require `'apps/admin'` inside `pnpm-workspace.yaml`
 * while `pnpm-lock.yaml` had no importer for it, so `pnpm install
 * --frozen-lockfile` could never succeed with that entry present. The gate and
 * the lockfile disagreed, which is why CI failed on its first step for every
 * push. The canonical reader/web app is `apps/web`; `apps/admin` (Payload CMS)
 * is a *separate* deployable that the root workspace does not install.
 *
 * This script now asserts what is actually true and fails loudly if the
 * ambiguity comes back:
 *   1. `apps/web` and `packages/*` are workspace members.
 *   2. The retired `apps/cms` workspace is gone.
 *   3. Every workspace member has a matching lockfile importer (the drift that
 *      broke `--frozen-lockfile` installs).
 *   4. `apps/admin`, if present, is explicitly consistent with the lockfile.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const problems = []
const notes = []

const workspaceText = readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8')
const lockText = readFileSync(join(root, 'pnpm-lock.yaml'), 'utf8')

// 1. Required members.
for (const entry of ["'apps/web'", "'packages/*'"]) {
  if (!workspaceText.includes(entry)) problems.push(`pnpm-workspace.yaml is missing ${entry}`)
}

// 2. Retired legacy CMS workspace.
if (workspaceText.includes("'apps/*'") || workspaceText.includes('"apps/*"')) {
  problems.push(
    'pnpm-workspace.yaml must not use apps/* because it re-enables the retired apps/cms workspace',
  )
}
if (existsSync(join(root, 'apps', 'cms', 'package.json'))) {
  problems.push(
    'legacy apps/cms/package.json is still present; the canonical CMS location is apps/admin. Delete it with: git rm -r apps/cms',
  )
}

/** Importers declared in pnpm-lock.yaml, e.g. `.`, `apps/web`, `packages/db`. */
function lockfileImporters() {
  const lines = lockText.split(/\r?\n/)
  const importers = []
  let inImporters = false
  for (const line of lines) {
    if (line === 'importers:') {
      inImporters = true
      continue
    }
    if (!inImporters) continue
    if (/^[^\s]/.test(line) && line.trim()) break
    const match = line.match(/^ {2}([^\s][^:]*):(?:\s*\{\})?\s*$/)
    if (match) importers.push(match[1])
  }
  return new Set(importers)
}

const importers = lockfileImporters()

function hasPackageJson(dir) {
  try {
    return statSync(join(root, dir, 'package.json')).isFile()
  } catch {
    return false
  }
}

// 3. Workspace members and lockfile importers must agree.
const members = []
if (hasPackageJson('apps/web')) members.push('apps/web')
const packagesDir = join(root, 'packages')
if (existsSync(packagesDir)) {
  for (const name of readdirSync(packagesDir)) {
    if (hasPackageJson(join('packages', name))) members.push(`packages/${name}`)
  }
}
for (const member of members) {
  if (!importers.has(member)) {
    problems.push(
      `pnpm-lock.yaml has no importer for workspace member ${member} — run pnpm install to refresh the lockfile`,
    )
  }
}

// 4. apps/admin must be consistent with the lockfile, never silently half-wired.
if (hasPackageJson('apps/admin')) {
  const adminIsMember = workspaceText.includes("'apps/admin'")
  const adminHasImporter = importers.has('apps/admin')
  if (adminIsMember && !adminHasImporter) {
    problems.push(
      'apps/admin is a workspace member but has no pnpm-lock.yaml importer — regenerate the lockfile with pnpm install',
    )
  }
  if (!adminIsMember && adminHasImporter) {
    problems.push(
      'apps/admin has a pnpm-lock.yaml importer but is not a workspace member — remove the stale importer',
    )
  }
  if (!adminIsMember && !adminHasImporter) {
    notes.push(
      'apps/admin (Payload CMS) is present but outside the root workspace: a separate deployable, not installed or built by CI.',
    )
  }
}

if (problems.length) {
  console.error('Canonical workspace verification failed:')
  for (const problem of problems) console.error(`- ${problem}`)
  process.exit(1)
}

console.log(`Canonical workspaces verified: apps/web, packages/* (${members.length} members).`)
for (const note of notes) console.log(`note: ${note}`)
