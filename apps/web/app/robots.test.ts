import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * `isStaticPublicExport` is a module-scope constant baked at build time, so
 * each case needs a fresh module graph rather than a mutated env var.
 */
async function loadRobots(staticExport: boolean) {
  vi.resetModules()
  vi.doMock('@/lib/runtime/public-api', () => ({
    isStaticPublicExport: staticExport,
    hasLivePublicApi: () => !staticExport,
  }))
  const mod = await import('./robots')
  return mod.default()
}

afterEach(() => {
  vi.doUnmock('@/lib/runtime/public-api')
  vi.resetModules()
})

describe('robots.txt', () => {
  it('invites crawlers on the Node origin and names all three sitemaps', async () => {
    const robots = await loadRobots(false)
    const rules = Array.isArray(robots.rules) ? robots.rules : [robots.rules]
    expect(rules[0]!.allow).toBe('/')
    expect(rules[0]!.disallow).toContain('/admin/')
    expect(robots.sitemap).toHaveLength(3)
  })

  it('disallows everything in a static export, which is preview-only (ADR-004)', async () => {
    const robots = await loadRobots(true)
    const rules = Array.isArray(robots.rules) ? robots.rules : [robots.rules]
    expect(rules[0]!.disallow).toBe('/')
    expect(rules[0]!.allow).toBeUndefined()
    // A mirror that cannot serve the product must not advertise a sitemap for it.
    expect(robots.sitemap).toBeUndefined()
  })
})
