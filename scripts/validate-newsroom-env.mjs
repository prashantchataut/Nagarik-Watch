#!/usr/bin/env node
/**
 * Validate newsroom environment before starting the full stack.
 * Usage: node scripts/validate-newsroom-env.mjs
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function loadEnvFile(name) {
  const path = resolve(root, name)
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

loadEnvFile('.env')
loadEnvFile('.env.local')

const errors = []
const warnings = []

function env(name) {
  return process.env[name]?.trim() ?? ''
}

const contentSource = env('CONTENT_SOURCE') || env('PAYLOAD_CONTENT_SOURCE') || 'json'
const payloadUrl = env('PAYLOAD_PUBLIC_SERVER_URL') || env('PAYLOAD_ADMIN_URL')

if (!env('DATABASE_URL')) {
  warnings.push(
    'DATABASE_URL is unset — auth falls back to PGlite and Payload CMS cannot start. Use Docker Postgres or Neon.',
  )
}

if (contentSource === 'payload') {
  if (!payloadUrl) {
    errors.push('CONTENT_SOURCE=payload requires PAYLOAD_PUBLIC_SERVER_URL (or PAYLOAD_ADMIN_URL).')
  }
  if (!env('PAYLOAD_SECRET') || env('PAYLOAD_SECRET').length < 32) {
    errors.push('PAYLOAD_SECRET must be at least 32 characters when Payload is canonical.')
  }
  if (!env('REVALIDATE_SECRET') || env('REVALIDATE_SECRET').length < 32) {
    warnings.push('REVALIDATE_SECRET should be set so publish hooks can revalidate the reader.')
  }
  if (!env('PAYLOAD_API_TOKEN')) {
    warnings.push(
      'PAYLOAD_API_TOKEN is unset — journalist desk cannot create Payload drafts until a service API key is configured.',
    )
  }
} else {
  warnings.push(
    `CONTENT_SOURCE=${contentSource} — reader uses the JSON/ops store. Set CONTENT_SOURCE=payload for the production editorial path.`,
  )
}

if (env('ENABLE_WEB_ADMIN_SCAFFOLD') === 'false') {
  warnings.push('ENABLE_WEB_ADMIN_SCAFFOLD=false — web ops desk routes are disabled.')
}

if (!env('AUTH_SECRET') && !env('BETTER_AUTH_SECRET')) {
  errors.push('AUTH_SECRET or BETTER_AUTH_SECRET is required.')
}

if (!env('NEWSROOM_SUPERADMIN_EMAIL') && !env('NEWSROOM_ADMIN_EMAIL')) {
  warnings.push('No NEWSROOM_* boot credentials — first admin login may be unavailable.')
}

if (errors.length) {
  console.error('[validate-newsroom-env] Blocking issues:')
  for (const message of errors) console.error(`  ✗ ${message}`)
  process.exit(1)
}

if (warnings.length) {
  console.warn('[validate-newsroom-env] Warnings:')
  for (const message of warnings) console.warn(`  ! ${message}`)
}

console.log(`[validate-newsroom-env] OK (CONTENT_SOURCE=${contentSource})`)
