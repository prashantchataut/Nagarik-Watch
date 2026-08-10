import { describe, expect, it } from 'vitest'
import { hasInlineMarks, parseInlineMarks, prefixLines, wrapTextSelection } from './inline-marks'

describe('inline marks', () => {
  it('parses bold italic highlight and links', () => {
    const marks = parseInlineMarks(
      'यो **मोटो** र *तिर्खा* र ==महत्त्वपूर्ण== र [लिंक](https://example.com) हो।',
    )
    expect(marks.some((m) => m.type === 'bold')).toBe(true)
    expect(marks.some((m) => m.type === 'italic')).toBe(true)
    expect(marks.some((m) => m.type === 'highlight')).toBe(true)
    expect(marks.some((m) => m.type === 'link')).toBe(true)
    expect(hasInlineMarks('plain')).toBe(false)
    expect(hasInlineMarks('**x**')).toBe(true)
  })

  it('wraps selection without losing surrounding text', () => {
    const result = wrapTextSelection('hello world', 6, 11, '**', '**')
    expect(result.next).toBe('hello **world**')
    expect(result.selectionStart).toBe(8)
    expect(result.selectionEnd).toBe(13)
  })

  it('prefixes structural markers on the current line', () => {
    const result = prefixLines('a\nb\nc', 2, 3, '## ')
    expect(result.next).toBe('a\n## b\nc')
  })
})
