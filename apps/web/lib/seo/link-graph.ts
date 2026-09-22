/**
 * Authority flow across the site's own internal links.
 *
 * The catalog claimed "internal link-graph authority flow" and admitted in the
 * same breath that no graph audit existed. The obstacle was always where to get
 * the edges: nobody hand-curates internal links here. But the site already
 * builds an internal link graph on every article page — `relatedByContent`
 * picks the five stories each article links out to, and those anchors are real
 * crawlable links. That graph is the one search engines walk, so that is the
 * graph this audits.
 *
 * PageRank over it answers two questions an editor can act on. Which stories
 * are orphans — published, indexable, and linked to by nothing, so a crawler
 * reaches them only from the sitemap? And is authority pooling in a handful of
 * stories while the rest of the archive starves?
 *
 * It is an audit, not a controller. Nothing here rewrites the related-stories
 * list; silently reordering what a reader is offered to spread PageRank around
 * would be optimising for the crawler at the reader's expense.
 */
import type { StoryCardData } from '@nagarikwatch/db'
import { relatedByContent } from '@/lib/ranking'

/** Matches the article page, which renders `relatedByContent(article, pool, 5)`. */
export const LINKS_PER_STORY = 5
const DAMPING = 0.85
/** PageRank on a few hundred nodes converges well inside this. */
const ITERATIONS = 40

export type LinkGraph = {
  /** slug → slugs it links out to. */
  outbound: Map<string, string[]>
  /** slug → slugs linking to it. */
  inbound: Map<string, string[]>
}

/**
 * Build the graph the article pages actually render. O(n²) in the window, which
 * is why callers pass a window rather than the archive.
 */
export function buildRelatedGraph(
  stories: readonly StoryCardData[],
  linksPerStory = LINKS_PER_STORY,
): LinkGraph {
  const pool = [...stories]
  const outbound = new Map<string, string[]>()
  const inbound = new Map<string, string[]>()
  for (const story of stories) {
    inbound.set(story.slug, [])
  }
  for (const story of stories) {
    const targets = relatedByContent(story, pool, linksPerStory).map((related) => related.slug)
    outbound.set(story.slug, targets)
    for (const target of targets) {
      inbound.get(target)?.push(story.slug)
    }
  }
  return { outbound, inbound }
}

/**
 * PageRank. Rank leaked by dangling nodes — a story whose related list came
 * back empty — is redistributed rather than lost, so the scores stay a
 * probability distribution and the numbers on the page keep summing to 1.
 */
export function pageRank(graph: LinkGraph, damping = DAMPING, iterations = ITERATIONS) {
  const nodes = [...graph.outbound.keys()]
  const n = nodes.length
  if (n === 0) return new Map<string, number>()
  let rank = new Map(nodes.map((slug) => [slug, 1 / n]))

  for (let round = 0; round < iterations; round += 1) {
    const next = new Map(nodes.map((slug) => [slug, 0]))
    let dangling = 0
    for (const slug of nodes) {
      const targets = graph.outbound.get(slug) ?? []
      const share = rank.get(slug) ?? 0
      if (targets.length === 0) {
        dangling += share
        continue
      }
      const perTarget = share / targets.length
      for (const target of targets) {
        if (next.has(target)) next.set(target, (next.get(target) ?? 0) + perTarget)
      }
    }
    const base = (1 - damping) / n + (damping * dangling) / n
    for (const slug of nodes) {
      next.set(slug, base + damping * (next.get(slug) ?? 0))
    }
    rank = next
  }
  return rank
}

/**
 * Gini coefficient of the rank distribution. 0 means every story carries the
 * same authority, 1 means one story carries all of it. A news archive is never
 * flat — recency alone tilts it — so this is read as a trend, not a target.
 */
export function authorityGini(rank: ReadonlyMap<string, number>): number {
  const values = [...rank.values()].sort((a, b) => a - b)
  const n = values.length
  if (n === 0) return 0
  const total = values.reduce((sum, value) => sum + value, 0)
  if (total === 0) return 0
  const weighted = values.reduce((sum, value, index) => sum + (index + 1) * value, 0)
  return (2 * weighted) / (n * total) - (n + 1) / n
}

export type LinkGraphEntry = {
  slug: string
  title: string
  category: string
  inbound: number
  authority: number
}

export type LinkGraphAudit = {
  nodes: number
  edges: number
  /** Indexable stories nothing links to — reachable only from the sitemap. */
  orphans: LinkGraphEntry[]
  /** Highest-authority stories, which is where link equity is pooling. */
  hubs: LinkGraphEntry[]
  meanInbound: number
  gini: number
}

export function auditLinkGraph(stories: readonly StoryCardData[], sampleLimit = 8): LinkGraphAudit {
  // A no-index story being an orphan is not a finding; it is the intent.
  const indexable = stories.filter((story) => story.noIndex !== true)
  const graph = buildRelatedGraph(indexable)
  const rank = pageRank(graph)
  const entries: LinkGraphEntry[] = indexable.map((story) => ({
    slug: story.slug,
    title: story.titleNe,
    category: story.category.slug,
    inbound: graph.inbound.get(story.slug)?.length ?? 0,
    authority: rank.get(story.slug) ?? 0,
  }))
  const edges = [...graph.outbound.values()].reduce((sum, targets) => sum + targets.length, 0)
  return {
    nodes: entries.length,
    edges,
    orphans: entries
      .filter((entry) => entry.inbound === 0)
      .sort((a, b) => a.slug.localeCompare(b.slug))
      .slice(0, sampleLimit),
    hubs: [...entries].sort((a, b) => b.authority - a.authority).slice(0, sampleLimit),
    meanInbound: entries.length ? edges / entries.length : 0,
    gini: authorityGini(rank),
  }
}
