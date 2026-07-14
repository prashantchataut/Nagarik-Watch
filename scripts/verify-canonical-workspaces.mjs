#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const legacyManifest = join(root, 'apps', 'cms', 'package.json')
const workspaceText = readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8')
const requiredEntries = ["'apps/web'", "'apps/admin'", "'packages/*'"]
const problems = []

for (const entry of requiredEntries) {
  if (!workspaceText.includes(entry)) problems.push(`pnpm-workspace.yaml is missing ${entry}`)
}
if (workspaceText.includes("'apps/*'") || workspaceText.includes('"apps/*"')) {
  problems.push("pnpm-workspace.yaml must not use apps/* because it re-enables the retired apps/cms workspace")
}
if (existsSync(legacyManifest)) {
  problems.push(
    'legacy apps/cms/package.json is still present; canonical CMS is apps/admin. Delete it with: git rm -r apps/cms',
  )
}

if (problems.length) {
  console.error('Canonical workspace verification failed:')
  for (const problem of problems) console.error(`- ${problem}`)
  process.exit(1)
}

console.log('Canonical workspaces verified: apps/web, apps/admin, and packages/*.')
