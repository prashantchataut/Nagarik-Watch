#!/usr/bin/env node
/**
 * Reset local editorial test fixtures: articles JSON store, uploads dir marker, and
 * instruct Postgres truncate when DATABASE_URL is configured.
 */
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const articlesFile = resolve(root, 'apps/web/data/articles.json')
const uploadsDir = resolve(root, 'apps/web/.data/uploads/newsroom')
const e2ePgliteDir = resolve(root, 'apps/web/.data/e2e-newsroom-pglite')

function resetArticlesJson() {
  const store = { articles: [], version: 1 }
  mkdirSync(dirname(articlesFile), { recursive: true })
  writeFileSync(articlesFile, `${JSON.stringify(store, null, 2)}\n`, 'utf-8')
  console.info('[db:reset:test] Cleared apps/web/data/articles.json')
}

function resetUploads() {
  if (existsSync(uploadsDir)) {
    rmSync(uploadsDir, { recursive: true, force: true })
  }
  mkdirSync(uploadsDir, { recursive: true })
  console.info('[db:reset:test] Cleared local media uploads')
}

function resetE2eAuth() {
  if (existsSync(e2ePgliteDir)) {
    rmSync(e2ePgliteDir, { recursive: true, force: true })
  }
  console.info('[db:reset:test] Cleared E2E PGlite auth data')
}

function resetPostgres() {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    console.info('[db:reset:test] DATABASE_URL unset — skipped Postgres truncate.')
    return
  }
  const script = resolve(root, 'apps/web/scripts/reset-test-data.ts')
  const result = spawnSync('pnpm', ['exec', 'tsx', script], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

resetArticlesJson()
resetUploads()
resetE2eAuth()
resetPostgres()
console.info(
  '[db:reset:test] Done. Restart web dev server and sign in with NEWSROOM_* boot accounts.',
)
