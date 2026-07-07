import type { ArticleBlock } from '@nagarikwatch/db'

export function blocksFromShorthand(input: unknown, fallbackText = ''): ArticleBlock[] {
  if (Array.isArray(input)) return input as ArticleBlock[]
  const text = String(input ?? '').trim()
  if (!text) return fallbackText ? [{ type: 'paragraph', text: fallbackText }] : []

  const blocks: ArticleBlock[] = []
  const chunks = text.split(/\n{2,}/).map((chunk) => chunk.trim()).filter(Boolean)

  for (const chunk of chunks) {
    const lines = chunk.split('\n').map((line) => line.trim()).filter(Boolean)
    if (lines.length === 0) continue

    if (lines.every((line) => line.startsWith('- '))) {
      blocks.push({ type: 'list', ordered: false, items: lines.map((line) => line.slice(2).trim()).filter(Boolean) })
      continue
    }

    for (const line of lines) {
      if (line.startsWith('### ')) blocks.push({ type: 'heading3', text: line.slice(4).trim() })
      else if (line.startsWith('## ')) blocks.push({ type: 'heading2', text: line.slice(3).trim() })
      else if (line.startsWith('> ')) blocks.push({ type: 'pullQuote', quoteNe: line.slice(2).trim() })
      else if (line.startsWith('- ')) blocks.push({ type: 'list', ordered: false, items: [line.slice(2).trim()].filter(Boolean) })
      else blocks.push({ type: 'paragraph', text: line })
    }
  }

  return blocks.length > 0 ? blocks : fallbackText ? [{ type: 'paragraph', text: fallbackText }] : []
}
