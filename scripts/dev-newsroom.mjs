#!/usr/bin/env node
/**
 * Full newsroom dev stack: validate env → Postgres (optional) → migrations → web + Payload CMS.
 *
 * Usage:
 *   pnpm dev:newsroom
 *
 * Requires .env with DATABASE_URL, PAYLOAD_SECRET, REVALIDATE_SECRET, and boot NEWSROOM_* creds.
 * Set CONTENT_SOURCE=payload so reader, journalist desk, and CMS share one authority.
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function hasDocker() {
  const probe = spawnSync('docker', ['info'], {
    cwd: root,
    stdio: 'ignore',
    shell: process.platform === 'win32',
  })
  return probe.status === 0
}

console.info('[dev:newsroom] Validating environment…')
run('node', ['scripts/validate-newsroom-env.mjs'], {
  env: {
    ...process.env,
    CONTENT_SOURCE: process.env.CONTENT_SOURCE?.trim() || 'payload',
    ENABLE_WEB_ADMIN_SCAFFOLD: process.env.ENABLE_WEB_ADMIN_SCAFFOLD?.trim() || 'true',
  },
})

if (!process.env.DATABASE_URL?.trim()) {
  if (hasDocker()) {
    console.info('[dev:newsroom] Starting local Postgres via Docker…')
    run('docker', ['compose', 'up', '-d', 'postgres'])
  } else {
    console.warn(
      '[dev:newsroom] Docker unavailable and DATABASE_URL unset — set DATABASE_URL in .env (Neon/Supabase works).',
    )
    process.exit(1)
  }
} else if (hasDocker() && existsSync(resolve(root, 'docker-compose.yml'))) {
  console.info('[dev:newsroom] Ensuring Docker Postgres is up…')
  spawnSync('docker', ['compose', 'up', '-d', 'postgres'], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
}

if (process.env.DATABASE_URL?.trim()) {
  console.info('[dev:newsroom] Applying ops + auth migrations…')
  run('pnpm', ['migrate:ops'])
  run('pnpm', ['--filter', '@nagarikwatch/web', 'migrate:auth'])
}

const stackEnv = {
  ...process.env,
  CONTENT_SOURCE: 'payload',
  ENABLE_WEB_ADMIN_SCAFFOLD: 'true',
  PAYLOAD_PUBLIC_SERVER_URL:
    process.env.PAYLOAD_PUBLIC_SERVER_URL?.trim() || 'http://localhost:3001',
  PAYLOAD_ADMIN_URL: process.env.PAYLOAD_ADMIN_URL?.trim() || 'http://localhost:3001/admin',
  NEXT_PUBLIC_CMS_ADMIN_URL:
    process.env.NEXT_PUBLIC_CMS_ADMIN_URL?.trim() || 'http://localhost:3001/admin',
  NEXT_PUBLIC_PAYLOAD_URL: process.env.NEXT_PUBLIC_PAYLOAD_URL?.trim() || 'http://localhost:3001',
}

console.info(`
[dev:newsroom] Starting apps:
  • Reader + ops desk  → http://localhost:3000
  • Payload CMS        → http://localhost:3001/admin
  • Web ops login      → http://localhost:3000/admin/login
  • Journalist desk    → http://localhost:3000/ne/journalist/login

CONTENT_SOURCE=payload (single editorial authority)
`)

const child = spawn(
  'pnpm',
  ['exec', 'turbo', 'run', 'dev', '--filter=@nagarikwatch/web', '--filter=@nagarikwatch/admin'],
  {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: stackEnv,
  },
)

child.on('exit', (code) => process.exit(code ?? 0))
