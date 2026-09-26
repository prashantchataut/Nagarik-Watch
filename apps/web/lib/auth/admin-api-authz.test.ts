import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Authorization coverage for the admin API.
 *
 * The desk guard added in `lib/auth/desk-access.ts` keys off the
 * `x-nw-shell: admin` header, which `proxy.ts` sets for `/admin` and
 * `/admin/*` only. `/api/admin/**` is deliberately outside it, which means
 * every admin route handler carries its own decision and nothing checked that
 * they all do. Roadmap item 7.8 recorded exactly that gap.
 *
 * The same argument as `lib/auth/desk-access.test.ts` applies: "this handler
 * authenticates" is load-bearing, not conventional. So it is asserted
 * structurally, per exported handler, so a new mutating endpoint cannot ship
 * with an anonymous write path and nothing going red.
 */

const API_ROOT = path.resolve(__dirname, '../../app/api/admin')

function routeFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...routeFiles(full))
    else if (entry === 'route.ts') out.push(full)
  }
  return out
}

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/** Session helpers that throw or return null when there is no staff session. */
const SESSION_HELPERS = ['requireNewsroomSession(', 'getNewsroomSession(', 'requireAdminSession(']

/** Role gates. A session alone is authentication, not authorization. */
const ROLE_GATES = [
  'assertNewsroomRole(',
  'canEdit(',
  'canCreate(',
  'canPublish(',
  'canDelete(',
  'canModerateComments(',
  'canManageUsers(',
  'ROLES.has(',
  'roles.has(',
]

/** Split a route module into `[handlerName, body]` blocks. */
function handlers(source: string): Array<[string, string]> {
  const re = /export\s+async\s+function\s+([A-Z]+)\s*\(/g
  const marks: Array<{ name: string; at: number }> = []
  let match: RegExpExecArray | null
  while ((match = re.exec(source))) marks.push({ name: match[1], at: match.index })
  return marks.map((mark, index) => [
    mark.name,
    source.slice(mark.at, index + 1 < marks.length ? marks[index + 1].at : source.length),
  ])
}

describe('admin API authorization coverage', () => {
  const files = routeFiles(API_ROOT)

  it('finds the admin route handlers at all', () => {
    // Guards against the suite passing because the glob went stale.
    expect(files.length).toBeGreaterThanOrEqual(9)
  })

  const cases = files.flatMap((file) =>
    handlers(readFileSync(file, 'utf8')).map(
      ([name, body]) => [path.relative(API_ROOT, file), name, body] as const,
    ),
  )

  it('finds a handler in every admin route module', () => {
    expect(cases.length).toBeGreaterThanOrEqual(12)
  })

  it.each(cases.map(([file, name]) => [`${file} ${name}`, file, name] as const))(
    '%s authenticates the caller',
    (_label, file, name) => {
      const body = cases.find((c) => c[0] === file && c[1] === name)![2]
      const authenticated = SESSION_HELPERS.some((helper) => body.includes(helper))
      // `journalist-feedback` reads the session through a local alias; keep the
      // escape hatch explicit rather than loosening the rule for everyone.
      const exempt = body.includes('admin-api-authz-exempt')
      expect(authenticated || exempt, `${file} ${name} has no session check`).toBe(true)
    },
  )

  it.each(cases.map(([file, name]) => [`${file} ${name}`, file, name] as const))(
    '%s authorizes the caller by role',
    (_label, file, name) => {
      const body = cases.find((c) => c[0] === file && c[1] === name)![2]
      const gated = ROLE_GATES.some((gate) => body.includes(gate))
      const exempt = body.includes('admin-api-authz-exempt')
      expect(gated || exempt, `${file} ${name} authenticates but never authorizes`).toBe(true)
    },
  )

  it.each(
    cases
      .filter(([, name]) => MUTATING.has(name))
      .map(([file, name]) => [`${file} ${name}`, file, name] as const),
  )('%s rejects cross-site writes', (_label, file, name) => {
    const body = cases.find((c) => c[0] === file && c[1] === name)![2]
    expect(
      body.includes('isTrustedWriteRequest('),
      `${file} ${name} accepts a cross-site write`,
    ).toBe(true)
  })
})
