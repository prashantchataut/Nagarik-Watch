/**
 * Lightweight inline marks inside plain ArticleBlock text strings.
 * Stored as shorthand (not HTML): **bold**, *italic*, ==highlight==, [label](url).
 * Render with {@link parseInlineMarks} → React nodes (never dangerouslySetInnerHTML).
 */

export type InlineMark =
  | { type: 'text'; value: string }
  | { type: 'bold'; children: InlineMark[] }
  | { type: 'italic'; children: InlineMark[] }
  | { type: 'highlight'; children: InlineMark[] }
  | { type: 'link'; href: string; children: InlineMark[] }

const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/
const HIGHLIGHT_RE = /==([^=]+)==/
const BOLD_RE = /\*\*([^*]+)\*\*/
const ITALIC_RE = /(?<!\*)\*([^*\n]+)\*(?!\*)/

function parseSegment(input: string, depth: number): InlineMark[] {
  if (!input) return []
  if (depth > 8) return [{ type: 'text', value: input }]

  const candidates: Array<{ index: number; length: number; mark: InlineMark }> = []

  const link = LINK_RE.exec(input)
  if (link && link.index !== undefined) {
    candidates.push({
      index: link.index,
      length: link[0].length,
      mark: {
        type: 'link',
        href: link[2] ?? '',
        children: parseSegment(link[1] ?? '', depth + 1),
      },
    })
  }

  const highlight = HIGHLIGHT_RE.exec(input)
  if (highlight && highlight.index !== undefined) {
    candidates.push({
      index: highlight.index,
      length: highlight[0].length,
      mark: {
        type: 'highlight',
        children: parseSegment(highlight[1] ?? '', depth + 1),
      },
    })
  }

  const bold = BOLD_RE.exec(input)
  if (bold && bold.index !== undefined) {
    candidates.push({
      index: bold.index,
      length: bold[0].length,
      mark: {
        type: 'bold',
        children: parseSegment(bold[1] ?? '', depth + 1),
      },
    })
  }

  const italic = ITALIC_RE.exec(input)
  if (italic && italic.index !== undefined) {
    candidates.push({
      index: italic.index,
      length: italic[0].length,
      mark: {
        type: 'italic',
        children: parseSegment(italic[1] ?? '', depth + 1),
      },
    })
  }

  if (candidates.length === 0) return [{ type: 'text', value: input }]

  candidates.sort((a, b) => a.index - b.index || b.length - a.length)
  const first = candidates[0]!
  const before = input.slice(0, first.index)
  const after = input.slice(first.index + first.length)
  return [
    ...(before ? parseSegment(before, depth + 1) : []),
    first.mark,
    ...parseSegment(after, depth + 1),
  ]
}

/** Parse inline mark shorthand into a tree safe for React rendering. */
export function parseInlineMarks(input: string): InlineMark[] {
  return parseSegment(String(input ?? ''), 0)
}

/** True when text contains any supported inline mark delimiters. */
export function hasInlineMarks(input: string): boolean {
  const text = String(input ?? '')
  return (
    LINK_RE.test(text) ||
    HIGHLIGHT_RE.test(text) ||
    BOLD_RE.test(text) ||
    ITALIC_RE.test(text)
  )
}

export function wrapTextSelection(
  value: string,
  start: number,
  end: number,
  prefix: string,
  suffix: string,
  emptyPlaceholder = '',
): { next: string; selectionStart: number; selectionEnd: number } {
  const safeStart = Math.max(0, Math.min(start, value.length))
  const safeEnd = Math.max(safeStart, Math.min(end, value.length))
  const selected = value.slice(safeStart, safeEnd)
  const inner = selected || emptyPlaceholder
  const next = `${value.slice(0, safeStart)}${prefix}${inner}${suffix}${value.slice(safeEnd)}`
  if (selected) {
    return {
      next,
      selectionStart: safeStart + prefix.length,
      selectionEnd: safeStart + prefix.length + inner.length,
    }
  }
  return {
    next,
    selectionStart: safeStart + prefix.length,
    selectionEnd: safeStart + prefix.length + inner.length,
  }
}

/** Prefix the current line (or selection lines) with a structural marker. */
export function prefixLines(
  value: string,
  start: number,
  end: number,
  marker: string,
): { next: string; selectionStart: number; selectionEnd: number } {
  const lineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1
  const lineEndSearch = value.indexOf('\n', end)
  const lineEnd = lineEndSearch === -1 ? value.length : lineEndSearch
  const block = value.slice(lineStart, lineEnd)
  const lines = block.split('\n').map((line) => {
    const trimmed = line.replace(/^\s+/, '')
    if (trimmed.startsWith(marker)) return line
    if (marker === '## ' && trimmed.startsWith('### ')) {
      return `${line.slice(0, line.length - trimmed.length)}## ${trimmed.slice(4)}`
    }
    if (marker === '### ' && trimmed.startsWith('## ')) {
      return `${line.slice(0, line.length - trimmed.length)}### ${trimmed.slice(3)}`
    }
    return `${line.slice(0, line.length - trimmed.length)}${marker}${trimmed}`
  })
  const replaced = lines.join('\n')
  const next = `${value.slice(0, lineStart)}${replaced}${value.slice(lineEnd)}`
  return {
    next,
    selectionStart: lineStart,
    selectionEnd: lineStart + replaced.length,
  }
}

export function insertAtCursor(
  value: string,
  start: number,
  end: number,
  insertion: string,
): { next: string; selectionStart: number; selectionEnd: number } {
  const safeStart = Math.max(0, Math.min(start, value.length))
  const safeEnd = Math.max(safeStart, Math.min(end, value.length))
  const needsLeadingBreak = safeStart > 0 && value[safeStart - 1] !== '\n'
  const needsTrailingBreak = safeEnd < value.length && value[safeEnd] !== '\n'
  const chunk = `${needsLeadingBreak ? '\n\n' : ''}${insertion}${needsTrailingBreak ? '\n\n' : ''}`
  const next = `${value.slice(0, safeStart)}${chunk}${value.slice(safeEnd)}`
  const caret = safeStart + chunk.length
  return { next, selectionStart: caret, selectionEnd: caret }
}
