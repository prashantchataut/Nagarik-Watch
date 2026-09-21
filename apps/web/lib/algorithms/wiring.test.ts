import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { ALGORITHM_CATALOG } from './catalog'
import { ALGORITHM_PRODUCT_WIRING, isProductWired, productWiringStats } from './product-surfaces'
// Node-only analysis helper; kept as .mjs so nothing can import it into a bundle.
import { buildReaderImportGraph, implementationModules, resolveModule } from './wiring-graph.mjs'

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

type Graph = {
  originsByModule: Map<string, string[]>
  newsroomOriginsByModule: Map<string, string[]>
  source: Map<string, string>
}

/**
 * Recompute, from source, which catalog algorithms a product surface can
 * reach, and which surface. `product-surfaces.ts` is a hand-shipped copy of
 * this result because the admin page renders in a runtime with no filesystem;
 * this test is what stops the copy from drifting into a comfortable fiction.
 *
 * Reader wins over newsroom when both reach an algorithm, matching the
 * generator — otherwise the two would disagree about `/search`.
 */
function computeWiring(graph: Graph): Map<string, 'reader' | 'newsroom'> {
  const catalogSource = readFileSync(path.join(APP_ROOT, 'lib/algorithms/catalog.ts'), 'utf8')
  const wired = new Map<string, 'reader' | 'newsroom'>()
  for (const block of catalogSource.split(/\n {2}\{\n/).slice(1)) {
    const id = /id:\s*'([^']+)'/.exec(block)?.[1]
    if (!id) continue
    const implementation = /implementation:\s*\n?\s*'([\s\S]*?)',\n/.exec(block)?.[1] ?? ''
    const modules = (implementationModules(implementation) as string[])
      .map((modulePath) => resolveModule(graph.source, modulePath) as string | null)
      .filter((file): file is string => Boolean(file))
    if (modules.some((file) => (graph.originsByModule.get(file)?.length ?? 0) > 0)) {
      wired.set(id, 'reader')
    } else if (modules.some((file) => (graph.newsroomOriginsByModule.get(file)?.length ?? 0) > 0)) {
      wired.set(id, 'newsroom')
    }
  }
  return wired
}

const graph = buildReaderImportGraph(APP_ROOT) as Graph
const computedWiring = computeWiring(graph)
const computed = new Set(computedWiring.keys())

describe('algorithm product wiring', () => {
  it('declares exactly the algorithms a reader-facing file can reach', () => {
    const declared = new Set(ALGORITHM_PRODUCT_WIRING.map((row) => row.id))
    const missing = [...computed].filter((id) => !declared.has(id)).sort()
    const stale = [...declared].filter((id) => !computed.has(id)).sort()
    // `pnpm algorithms:wiring` regenerates the table when this fails.
    expect({ missing, stale }).toEqual({ missing: [], stale: [] })
  })

  it('agrees with the graph about which surface reaches each algorithm', () => {
    const mismatched = ALGORITHM_PRODUCT_WIRING.filter(
      (row) => computedWiring.get(row.id) !== row.surface,
    ).map((row) => `${row.id}: declared ${row.surface}, computed ${computedWiring.get(row.id)}`)
    expect(mismatched).toEqual([])
  })

  it('points every declared row at a module that exists and is reachable', () => {
    for (const row of ALGORITHM_PRODUCT_WIRING) {
      expect(graph.source.has(row.module), `${row.id}: ${row.module} is missing`).toBe(true)
      const origins =
        row.surface === 'reader'
          ? (graph.originsByModule.get(row.module) ?? [])
          : (graph.newsroomOriginsByModule.get(row.module) ?? [])
      expect(origins, `${row.id}: ${row.module} is not reachable from ${row.surface}`).toContain(
        row.entrypoint,
      )
    }
  })

  it('never counts the algorithms panel itself as a product surface', () => {
    for (const row of ALGORITHM_PRODUCT_WIRING) {
      expect(row.entrypoint, `${row.id} is wired only to the panel`).not.toContain('/algorithms/')
    }
  })

  it('only declares ids that exist in the catalog', () => {
    const catalogIds = new Set(ALGORITHM_CATALOG.map((entry) => entry.id))
    for (const row of ALGORITHM_PRODUCT_WIRING) {
      expect(catalogIds.has(row.id), `${row.id} is not a catalog id`).toBe(true)
    }
  })

  it('reports panel-only coverage rather than implying the whole catalog ships', () => {
    const stats = productWiringStats(ALGORITHM_CATALOG.length)
    expect(stats.wired + stats.newsroom + stats.panelOnly).toBe(ALGORITHM_CATALOG.length)
    // The honest headline number. If this ever reads 232 the gate above is
    // broken, not the site.
    expect(stats.panelOnly).toBeGreaterThan(0)
    expect(stats.coverage).toBeLessThan(1)
  })

  it('agrees with the runtime about the surfaces we know are wired', () => {
    // Spot-checks with a human reason, so a regenerated table still gets read.
    expect(isProductWired('bm25-search')).toBe(true) // /search
    expect(isProductWired('weighted-scoring-ranker')).toBe(true) // hub ranking
    expect(isProductWired('dynamic-paywall')).toBe(true) // article page
    expect(isProductWired('reading-streaks')).toBe(true) // reader activity panel
  })
})
