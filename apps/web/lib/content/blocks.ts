import type { ArticleBlock } from '@nagarikwatch/db'

const IMAGE_RE = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/
const EMBED_RE = /^\[embed:([^\]]+)\]\(([^)\s]+)\)$/
const AD_RE = /^\[ad:([^\]]+)\]$/
const LEGACY_EMBED_RE = /^\[Embed:\s*(.+)\]$/i

function parseEmbedProvider(raw: string): 'youtube' | 'twitter' | 'facebook' | 'custom' {
  const value = raw.trim().toLowerCase()
  if (value === 'youtube' || value === 'twitter' || value === 'facebook' || value === 'custom') {
    return value
  }
  return 'custom'
}

function parseLine(line: string): ArticleBlock {
  const image = line.match(IMAGE_RE)
  if (image) {
    const alt = image[1]?.trim() ?? ''
    const url = image[2]?.trim() ?? ''
    const caption = image[3]?.trim()
    return {
      type: 'image',
      image: { url, alt },
      caption: caption || undefined,
    }
  }

  const embed = line.match(EMBED_RE)
  if (embed) {
    return {
      type: 'embed',
      provider: parseEmbedProvider(embed[1] ?? 'custom'),
      url: embed[2]?.trim() ?? '',
    }
  }

  const legacyEmbed = line.match(LEGACY_EMBED_RE)
  if (legacyEmbed) {
    return {
      type: 'embed',
      provider: 'custom',
      url: legacyEmbed[1]?.trim() ?? '',
    }
  }

  const ad = line.match(AD_RE)
  if (ad) {
    return { type: 'adSlot', placementKey: ad[1]?.trim() || 'inline' }
  }

  if (line.startsWith('### ')) return { type: 'heading3', text: line.slice(4).trim() }
  if (line.startsWith('## ')) return { type: 'heading2', text: line.slice(3).trim() }
  if (line.startsWith('> ')) return { type: 'pullQuote', quoteNe: line.slice(2).trim() }
  if (line.startsWith('- ')) {
    return { type: 'list', ordered: false, items: [line.slice(2).trim()].filter(Boolean) }
  }
  if (/^\d+\.\s+/.test(line)) {
    return {
      type: 'list',
      ordered: true,
      items: [line.replace(/^\d+\.\s+/, '').trim()].filter(Boolean),
    }
  }
  return { type: 'paragraph', text: line }
}

export function blocksFromShorthand(input: unknown, fallbackText = ''): ArticleBlock[] {
  if (Array.isArray(input)) return input as ArticleBlock[]
  const text = String(input ?? '').trim()
  if (!text) return fallbackText ? [{ type: 'paragraph', text: fallbackText }] : []

  const blocks: ArticleBlock[] = []
  const chunks = text
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)

  for (const chunk of chunks) {
    const lines = chunk
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    if (lines.length === 0) continue

    if (lines.every((line) => line.startsWith('- ') || /^\d+\.\s+/.test(line))) {
      const ordered = lines.every((line) => /^\d+\.\s+/.test(line))
      blocks.push({
        type: 'list',
        ordered,
        items: lines
          .map((line) => (ordered ? line.replace(/^\d+\.\s+/, '').trim() : line.slice(2).trim()))
          .filter(Boolean),
      })
      continue
    }

    for (const line of lines) {
      blocks.push(parseLine(line))
    }
  }

  return blocks.length > 0
    ? blocks
    : fallbackText
      ? [{ type: 'paragraph', text: fallbackText }]
      : []
}

/** Round-trip safe shorthand used by admin + journalist editors. */
export function shorthandFromBlocks(blocks: ArticleBlock[] | undefined): string {
  if (!Array.isArray(blocks)) return ''
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'paragraph':
          return block.text
        case 'heading2':
          return `## ${block.text}`
        case 'heading3':
          return `### ${block.text}`
        case 'pullQuote':
          return `> ${block.quoteNe}`
        case 'list':
          return block.items
            .map((item, index) => (block.ordered ? `${index + 1}. ${item}` : `- ${item}`))
            .join('\n')
        case 'image': {
          const alt = block.image.alt ?? ''
          const caption = block.caption?.trim()
          return caption
            ? `![${alt}](${block.image.url} "${caption}")`
            : `![${alt}](${block.image.url})`
        }
        case 'embed':
          return `[embed:${block.provider}](${block.url})`
        case 'adSlot':
          return `[ad:${block.placementKey}]`
        default: {
          const _exhaustive: never = block
          return _exhaustive
        }
      }
    })
    .filter(Boolean)
    .join('\n\n')
}
