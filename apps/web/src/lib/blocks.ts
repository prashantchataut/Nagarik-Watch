import type { Block } from '@/lib/news/data'

/**
 * Shared editorial body-block utilities — used by BOTH the API (validation +
 * storage) and the journalist editor (markdown-lite parsing + preview).
 * No server-only imports so it can ship to the client bundle.
 */

/* ---------- JSON (storage) ---------- */

export function blocksToJson(blocks: Block[]): string {
  return JSON.stringify(blocks)
}

export function blocksFromJson(raw: string | null | undefined, fallback: Block[] = []): Block[] {
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return fallback
    const clean: Block[] = []
    for (const b of parsed) {
      if (!b || typeof b !== 'object') continue
      const k = (b as { k?: unknown }).k
      const text = (b as { text?: unknown }).text
      if (k === 'p' && typeof text === 'string' && text.trim()) clean.push({ k: 'p', text })
      else if (k === 'h2' && typeof text === 'string' && text.trim()) clean.push({ k: 'h2', text })
      else if (k === 'h3' && typeof text === 'string' && text.trim()) clean.push({ k: 'h3', text })
      else if (k === 'quote' && typeof text === 'string' && text.trim()) clean.push({ k: 'quote', text })
      else if (k === 'list' && Array.isArray((b as { items?: unknown }).items)) {
        const items = ((b as { items: unknown[] }).items ?? []).filter(
          (it): it is string => typeof it === 'string' && it.trim().length > 0,
        )
        if (items.length) clean.push({ k: 'list', items })
      }
    }
    return clean
  } catch {
    return fallback
  }
}

/* ---------- markdown-lite parser (editor input → blocks) ---------- */

/**
 * Editor syntax (one idea per line, blank lines optional):
 *   ## शीर्षक        → h2
 *   ### उपशीर्षक     → h3
 *   > उद्धरण        → quote
 *   - बुँदा          → list item (consecutive - lines merge into one list)
 *   सामान्य पङ्क्ति   → p
 */
export function parseBodyBlocks(input: string): Block[] {
  const blocks: Block[] = []
  let list: string[] | null = null

  const flushList = () => {
    if (list && list.length) blocks.push({ k: 'list', items: list })
    list = null
  }

  for (const rawLine of input.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) {
      flushList()
      continue
    }
    if (line.startsWith('### ')) {
      flushList()
      blocks.push({ k: 'h3', text: line.slice(4).trim() })
    } else if (line.startsWith('## ')) {
      flushList()
      blocks.push({ k: 'h2', text: line.slice(3).trim() })
    } else if (line.startsWith('> ')) {
      flushList()
      blocks.push({ k: 'quote', text: line.slice(2).trim() })
    } else if (line.startsWith('- ')) {
      const item = line.slice(2).trim()
      if (item) list = [...(list ?? []), item]
    } else {
      flushList()
      blocks.push({ k: 'p', text: line })
    }
  }
  flushList()
  return blocks
}

/** Serialize blocks back to the editor's markdown-lite syntax. */
export function blocksToMarkdown(blocks: Block[]): string {
  return blocks
    .map((b) => {
      if (b.k === 'h2') return `## ${b.text}`
      if (b.k === 'h3') return `### ${b.text}`
      if (b.k === 'quote') return `> ${b.text}`
      if (b.k === 'list') return b.items.map((i) => `- ${i}`).join('\n')
      return b.text
    })
    .join('\n\n')
}

/** Rough Devanagari-aware reading time (~220 words/min). */
export function readingMinutesOf(blocks: Block[]): number {
  const words = blocks.reduce((n, b) => {
    if (b.k === 'list') return n + b.items.join(' ').split(/\s+/).length
    return n + b.text.split(/\s+/).length
  }, 0)
  return Math.max(1, Math.round(words / 220))
}

export function wordCount(blocks: Block[]): number {
  return blocks.reduce((n, b) => {
    if (b.k === 'list') return n + b.items.join(' ').split(/\s+/).filter(Boolean).length
    return n + b.text.split(/\s+/).filter(Boolean).length
  }, 0)
}

/* ---------- slug helper (Devanagari-safe) ---------- */

export function slugify(input: string, fallbackPrefix = 'story'): string {
  const ascii = input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
  if (ascii.length >= 3) return ascii.slice(0, 60)
  // Devanagari headline with no ASCII → readable stable fallback
  const rand = Math.random().toString(36).slice(2, 7)
  return `${fallbackPrefix}-${rand}`
}

export function shortId(): string {
  return Math.random().toString(36).slice(2, 8)
}
