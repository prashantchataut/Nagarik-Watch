#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const devVarsPath = path.join(appDir, '.dev.vars')
const vercelPath = path.join(appDir, '.env.vercel.production')

function parseEnv(file) {
  const out = new Map()
  if (!existsSync(file)) return out
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    let val = trimmed.slice(eq + 1)
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    out.set(trimmed.slice(0, eq), val)
  }
  return out
}

const vercel = parseEnv(vercelPath)
if (!vercel.size) {
  console.error('Missing .env.vercel.production — run vercel env pull first')
  process.exit(1)
}

let text = existsSync(devVarsPath) ? readFileSync(devVarsPath, 'utf8') : ''
const has = (key) => new RegExp(`^${key}=`, 'm').test(text)
const added = []
for (const key of ['DATABASE_URL', 'CRON_SECRET', 'BETTER_AUTH_URL', 'NEXT_PUBLIC_SITE_URL']) {
  const val = vercel.get(key)
  if (!val || has(key)) continue
  if (!text.endsWith('\n') && text.length) text += '\n'
  text += `${key}=${val}\n`
  added.push(key)
}
writeFileSync(devVarsPath, text)
console.log(`merged=${added.join(',') || 'none'}`)
console.log(`has_database_url=${has('DATABASE_URL')}`)
