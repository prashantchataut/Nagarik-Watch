#!/usr/bin/env node
/**
 * Payload admin route-shape audit.
 *
 * `@payloadcms/next` types its REST handlers against
 * `params: Promise<{ slug?: string[] }>`, which only matches a **catch-all**
 * route segment. The repo shipped `api/[payload]/route.ts` instead, and
 * `pnpm build:admin` failed its route-type check — but only after a full
 * web+admin build, and CI never got that far because install failed first.
 *
 * This audit fails in milliseconds so the shape can never silently drift again
 * (for example after a Payload upgrade regenerates the folder).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const API_DIR = 'apps/admin/src/app/(payload)/api'
const REST_DIR = join(API_DIR, '[...slug]')
const REST_FILE = join(REST_DIR, 'route.ts')
const STALE_DIR = join(API_DIR, '[payload]')

const errors = []

if (!existsSync(REST_FILE)) {
  errors.push(
    `Missing ${REST_FILE}. The Payload REST route must live in a catch-all segment (api/[...slug]/route.ts).`,
  )
}

if (existsSync(STALE_DIR)) {
  errors.push(
    `Found ${STALE_DIR}. A single-segment [payload] folder does not satisfy @payloadcms/next route typing; delete it.`,
  )
}

if (existsSync(REST_FILE)) {
  const source = readFileSync(REST_FILE, 'utf8')
  for (const exportName of ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS']) {
    if (!source.includes(`export const ${exportName}`)) {
      errors.push(`${REST_FILE} no longer exports ${exportName}; regenerate it with Payload.`)
    }
  }
}

// The admin app must keep serving the CMS under the staff host only: the
// generated route set is part of the contract, so a stray extra API route is
// worth surfacing for review rather than discovering at runtime.
const unexpected = existsSync(API_DIR)
  ? readdirSync(API_DIR).filter(
      (entry) => !['[...slug]', 'graphql', 'graphql-playground'].includes(entry),
    )
  : []
if (unexpected.length > 0) {
  errors.push(`Unexpected directories under ${API_DIR}: ${unexpected.join(', ')}`)
}

if (errors.length > 0) {
  console.error('Payload admin route audit failed:\n')
  for (const error of errors) console.error(`  - ${error}`)
  process.exit(1)
}

console.log('Payload admin route audit passed (catch-all REST route, GraphQL endpoints intact).')
