import { describe, expect, it } from 'vitest'
import { assessAltText, auditAltText } from './alt-text'

const codes = (alt: string, caption?: string) =>
  assessAltText(alt, caption).issues.map((issue) => issue.code)

describe('assessAltText', () => {
  it('passes a description that does its job', () => {
    const result = assessAltText('काठमाडौंको माइतीघरमा शिक्षकहरूको प्रदर्शन')
    expect(result.issues).toEqual([])
    expect(result.score).toBe(1)
  })

  it('treats empty alt as a failure, not a low score', () => {
    for (const value of ['', '   ', null, undefined]) {
      const result = assessAltText(value)
      expect(result.score).toBe(0)
      expect(result.issues).toEqual([{ code: 'missing', severity: 'error' }])
    }
  })

  it('catches filenames pasted into the field', () => {
    expect(codes('IMG_4821.JPG')).toContain('filename')
    expect(codes('DSC00012')).toContain('filename')
    expect(codes('screenshot-2026-03-04-at-11.02.png')).toContain('filename')
  })

  it('flags prefixes a screen reader already announces', () => {
    expect(codes('Photo of protesters outside the ministry')).toContain('redundant-prefix')
    expect(codes('तस्बिर: माइतीघरमा प्रदर्शनकारीहरू')).toContain('redundant-prefix')
    // "Photograph" as a subject, not a prefix, is fine.
    expect(codes('Photographers gather outside the ministry gate')).not.toContain(
      'redundant-prefix',
    )
  })

  it('flags alt text copied from the caption', () => {
    const caption = 'शिक्षकहरू माइतीघर मण्डलामा भेला भएका छन्'
    expect(codes(caption, caption)).toContain('duplicates-caption')
    expect(codes(caption, 'बुधबार बिहान खिचिएको तस्बिर')).not.toContain('duplicates-caption')
  })

  it('bounds length in both directions', () => {
    expect(codes('छोटो')).toContain('too-short')
    expect(codes('क'.repeat(200))).toContain('too-long')
    expect(codes('क'.repeat(60))).toEqual([])
  })

  it('scores a stack of problems lower than a single one', () => {
    const one = assessAltText('Photo of the ministry building on a cloudy afternoon')
    const many = assessAltText('IMG_2.png')
    expect(many.score).toBeLessThan(one.score)
    expect(one.score).toBeLessThan(1)
  })
})

describe('auditAltText', () => {
  const items = [
    { id: 'a', alt: 'काठमाडौंको माइतीघरमा शिक्षकहरूको प्रदर्शन' },
    { id: 'b', alt: '' },
    { id: 'c', alt: 'IMG_0001.jpg' },
    { id: 'd', alt: 'Photo of the new bridge over the Bagmati river' },
  ]

  it('separates outright failures from weak-but-present descriptions', () => {
    const audit = auditAltText(items)
    expect(audit.total).toBe(4)
    expect(audit.failing).toBe(2)
    expect(audit.weak).toBe(1)
    expect(audit.meanScore).toBeLessThan(1)
  })

  it('lists the worst first and leaves clean items out entirely', () => {
    const audit = auditAltText(items)
    expect(audit.worst.map((entry) => entry.id)).toEqual(['b', 'c', 'd'])
  })

  it('reports a clean library as clean', () => {
    const audit = auditAltText([items[0]!])
    expect(audit).toMatchObject({ total: 1, failing: 0, weak: 0, meanScore: 1 })
    expect(audit.worst).toEqual([])
  })

  it('does not divide by zero on an empty library', () => {
    expect(auditAltText([])).toMatchObject({ total: 0, failing: 0, weak: 0, meanScore: 1 })
  })
})
