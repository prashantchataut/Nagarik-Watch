import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Desk role rules are enforced inside `requireNewsroomSession()`, because that
 * is the one thing every desk page runs on every request -- the layout that
 * used to hold the check is not re-rendered on client-side navigation.
 *
 * That makes "this page calls `requireNewsroomSession()`" load-bearing rather
 * than conventional. A new desk that reads its data some other way would render
 * for any authenticated staff account, with no rule consulted and nothing
 * failing. So assert it structurally: the next desk cannot be added without
 * either wiring the guard or deleting this test on purpose.
 */

const DESK_ROOT = path.resolve(__dirname, '../../app/admin/(desk)')

function pageFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) {
      out.push(...pageFiles(full))
    } else if (entry === 'page.tsx') {
      out.push(full)
    }
  }
  return out
}

describe('admin desk authorization coverage', () => {
  const pages = pageFiles(DESK_ROOT)

  it('finds the desk pages at all', () => {
    // Guards against the suite silently passing because the glob went stale
    // after a route-group rename.
    expect(pages.length).toBeGreaterThan(30)
  })

  it.each(pages.map((p) => [path.relative(DESK_ROOT, p), p] as const))(
    '%s reaches the desk guard through requireNewsroomSession()',
    (_label, file) => {
      expect(readFileSync(file, 'utf8')).toContain('requireNewsroomSession()')
    },
  )
})
