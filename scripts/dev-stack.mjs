#!/usr/bin/env node
/**
 * Start local Postgres (Docker) and print next steps for the newsroom stack.
 * Usage: node scripts/dev-stack.mjs
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const composeFile = resolve(root, 'docker-compose.yml')

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

if (!existsSync(composeFile)) {
  console.error('docker-compose.yml not found.')
  process.exit(1)
}

console.info('[dev:stack] Starting Postgres…')
run('docker', ['compose', 'up', '-d', 'postgres'])

console.info(`
[dev:stack] Postgres is starting. Next steps:

  1. Copy .env.example → .env.local and set local-only credentials:
     DATABASE_URL=postgresql://nagarik:nagarik_dev@localhost:5432/nagarik_watch
     NEWSROOM_* passwords (see .env.example local defaults)

  2. Apply ops/auth migrations:
     pnpm migrate:ops
     pnpm --filter @nagarikwatch/web migrate:auth

  3. Run the web app (and optional Payload admin on :3001):
     pnpm --filter @nagarikwatch/web dev

  4. Reset deterministic test data:
     pnpm db:reset:test

Media uploads without BLOB_READ_WRITE_TOKEN persist under apps/web/.data/uploads/
`)
