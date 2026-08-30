'use client'

import { useEffect, useState } from 'react'

export type Route =
  | { name: 'home' }
  | { name: 'english' }
  | { name: 'desk'; desk: string }
  | { name: 'article'; desk: string; slug: string }
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

const TOOL_ROUTES: Record<string, Route> = {
  patro: { name: 'patro' },
  nepse: { name: 'nepse' },
  rashifal: { name: 'rashifal' },
  scores: { name: 'scores' },
  tools: { name: 'tools' },
  preeti: { name: 'preeti' },
  date: { name: 'date-converter' },
  saved: { name: 'saved' },
  search: { name: 'search' },
  journalist: { name: 'journalist' },
}

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '').replace(/\/+$/, '')
  if (!clean) return { name: 'home' }
  const parts = clean.split('/').filter(Boolean)

  if (parts[0] === 'en') return { name: 'english' }
  if (parts[0] === 'province') return { name: 'province', slug: parts[1] }
  if (parts[0] === 'page' && parts[1]) return { name: 'page', slug: parts[1] }
  if (parts[0] === 'search') return { name: 'search', query: parts.slice(1).join('/') }
  if (parts[0] === 'tools') {
    if (parts[1] === 'preeti') return { name: 'preeti' }
    if (parts[1] === 'date') return { name: 'date-converter' }
    return { name: 'tools' }
  }

  if (parts.length === 1 && TOOL_ROUTES[parts[0]!]) return TOOL_ROUTES[parts[0]]!
  if (parts.length === 1) return { name: 'desk', desk: parts[0]! }
  if (parts.length === 2) return { name: 'article', desk: parts[0]!, slug: parts[1]! }

  return { name: 'home' }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() =>
    typeof window === 'undefined' ? { name: 'home' } : parseHash(window.location.hash),
  )
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash))
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export function go(path: string) {
  const target = path.startsWith('#') ? path : `#${path.startsWith('/') ? path : `/${path}`}`
  if (window.location.hash === target) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  window.location.hash = target
}

export function href(path: string): string {
  return path.startsWith('#') ? path : `#${path.startsWith('/') ? path : `/${path}`}`
}
