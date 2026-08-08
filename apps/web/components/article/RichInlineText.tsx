import type { ReactNode } from 'react'
import { parseInlineMarks, type InlineMark } from '@/lib/content/inline-marks'

function isSafeHttpUrl(href: string): boolean {
  try {
    const url = new URL(href)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function renderMarks(marks: InlineMark[], keyPrefix: string): ReactNode[] {
  return marks.map((mark, index) => {
    const key = `${keyPrefix}-${index}`
    switch (mark.type) {
      case 'text':
        return <span key={key}>{mark.value}</span>
      case 'bold':
        return <strong key={key}>{renderMarks(mark.children, key)}</strong>
      case 'italic':
        return <em key={key}>{renderMarks(mark.children, key)}</em>
      case 'highlight':
        return (
          <mark key={key} className="article-inline-highlight">
            {renderMarks(mark.children, key)}
          </mark>
        )
      case 'link': {
        if (!isSafeHttpUrl(mark.href)) {
          return <span key={key}>{renderMarks(mark.children, key)}</span>
        }
        return (
          <a
            key={key}
            href={mark.href}
            className="article-inline-link"
            rel="noopener noreferrer"
            target="_blank"
          >
            {renderMarks(mark.children, key)}
          </a>
        )
      }
      default: {
        const _exhaustive: never = mark
        void _exhaustive
        return null
      }
    }
  })
}

/** Renders paragraph / heading / list text with safe inline marks (no HTML). */
export function RichInlineText({ text }: { text: string }) {
  return <>{renderMarks(parseInlineMarks(text), 'm')}</>
}
