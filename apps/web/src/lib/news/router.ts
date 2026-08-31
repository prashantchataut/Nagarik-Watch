export type Route =
  | { name: 'home' }
  | { name: 'english' }
  | { name: 'desk'; desk: string }
  | { name: 'article'; desk: string; slug: string }
  | { name: 'disaster' }
  | { name: 'fact-check' }
  | { name: 'feed' }
  | { name: 'profile' }
  | { name: 'subscribe' }
  | { name: 'province'; slug?: string }
  | { name: 'patro' }
  | { name: 'nepse' }
  | { name: 'rashifal' }
  | { name: 'scores' }
  | { name: 'tools' }
  | { name: 'preeti' }
  | { name: 'date-converter' }
  | { name: 'saved' }
  | { name: 'search'; query?: string }
  | { name: 'journalist' }
  | { name: 'page'; slug: string }

/**
 * REAL-ROUTE navigation (repo deployment).
 * href() returns true paths so crawlers see real <a href> URLs everywhere.
 * In-page anchors (#account, #footer-newsletter, #desks-anchor) stay anchors.
 */
export function href(path: string): string {
  if (path.includes('#')) {
    // '/#footer-newsletter' and '#account' → in-page anchor
    const i = path.indexOf('#')
    return path.slice(i)
  }
  return path.startsWith('/') ? path : `/${path}`
}

/**
 * Programmatic navigation. Components call go('/subscribe') etc.
 * A custom event lets the site shell turn this into a Next router.push
 * (works from any client component without prop-drilling useRouter).
 */
export function go(path: string): void {
  const target = href(path)
  if (target.startsWith('#')) {
    window.location.hash = target.slice(1)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    return
  }
  window.dispatchEvent(new CustomEvent('nagarikwatch:navigate', { detail: target }))
}

/** Derive the active Route from the real pathname (chrome active states). */
export function routeFromPathname(pathname: string): Route {
  const parts = pathname.replace(/^\/+/, '').replace(/\/+$/, '').split('/').filter(Boolean)
  if (parts.length === 0) return { name: 'home' }

  const first = parts[0]!
  if (first === 'en') return { name: 'english' }
  if (first === 'disaster') return { name: 'disaster' }
  if (first === 'fact-check') return { name: 'fact-check' }
  if (first === 'feed') return { name: 'feed' }
  if (first === 'profile') return { name: 'profile' }
  if (first === 'subscribe') return { name: 'subscribe' }
  if (first === 'province') return { name: 'province', slug: parts[1] }
  if (first === 'page' && parts[1]) return { name: 'page', slug: parts[1] }
  if (first === 'patro') return { name: 'patro' }
  if (first === 'nepse' || first === 'bajar') return { name: 'nepse' }
  if (first === 'rashifal') return { name: 'rashifal' }
  if (first === 'scores') return { name: 'scores' }
  if (first === 'saved') return { name: 'saved' }
  if (first === 'journalist') return { name: 'journalist' }
  if (first === 'search') return { name: 'search' }
  if (first === 'tools') {
    if (parts[1] === 'preeti') return { name: 'preeti' }
    if (parts[1] === 'date') return { name: 'date-converter' }
    return { name: 'tools' }
  }

  if (parts.length === 1) return { name: 'desk', desk: first }
  if (parts.length === 2) return { name: 'article', desk: first, slug: parts[1]! }
  return { name: 'home' }
}


