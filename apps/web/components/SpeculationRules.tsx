/**
 * Chrome/Edge Speculation Rules for next-article navigation.
 * Only list URLs we already rendered as links — never blanket-prerender the site.
 */
export function SpeculationRules({
  prerenderUrls = [],
  prefetchUrls = [],
}: {
  prerenderUrls?: string[]
  prefetchUrls?: string[]
}) {
  const prerender = uniqueAbsolutePaths(prerenderUrls).slice(0, 2)
  const prefetch = uniqueAbsolutePaths([...prefetchUrls, ...prerenderUrls]).slice(0, 6)
  if (prerender.length === 0 && prefetch.length === 0) return null

  const rules: Record<string, unknown> = {}
  if (prerender.length > 0) {
    rules.prerender = [
      {
        source: 'list',
        urls: prerender,
        eagerness: 'moderate',
      },
    ]
  }
  if (prefetch.length > 0) {
    rules.prefetch = [
      {
        source: 'list',
        urls: prefetch,
        eagerness: 'conservative',
      },
    ]
  }

  return (
    <script type="speculationrules" dangerouslySetInnerHTML={{ __html: JSON.stringify(rules) }} />
  )
}

function uniqueAbsolutePaths(urls: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of urls) {
    if (!raw) continue
    let path = raw.trim()
    if (!path.startsWith('/')) continue
    if (path.startsWith('//')) continue
    path = path.split('#')[0]?.split('?')[0] ?? path
    if (seen.has(path)) continue
    seen.add(path)
    out.push(path)
  }
  return out
}
