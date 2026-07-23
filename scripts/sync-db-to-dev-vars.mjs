#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(repoRoot, '.env')
const destPath = path.join(repoRoot, 'apps', 'web', '.dev.vars')

const env = readFileSync(envPath, 'utf8')
const match = env.match(/^DATABASE_URL=(.+)$/m)
if (!match) {
  console.error('DATABASE_URL not found in .env')
  process.exit(1)
}
const db = match[1].trim().replace(/^["']|["']$/g, '')
let text = readFileSync(destPath, 'utf8')
if (/^DATABASE_URL=/m.test(text)) {
  text = text.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${db}`)
} else {
  text = `${text.trimEnd()}\nDATABASE_URL=${db}\n`
}
writeFileSync(destPath, text)
console.log('DATABASE_URL synced into apps/web/.dev.vars')
