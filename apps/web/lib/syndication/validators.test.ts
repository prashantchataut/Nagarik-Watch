import { describe, expect, it } from 'vitest'
import { validateAmpHtml, validateAppleNewsFormat, validateInstantArticle } from './validators'

describe('validateAmpHtml', () => {
  it('passes a fully structured page', () => {
    expect(
      validateAmpHtml({ hasCanonical: true, hasHeroImage: true, hasAmpBoilerplate: true }),
    ).toEqual({
      ok: true,
      issues: [],
    })
  })

  it('reports every missing field', () => {
    const { ok, issues } = validateAmpHtml({
      hasCanonical: false,
      hasHeroImage: false,
      hasAmpBoilerplate: false,
    })
    expect(ok).toBe(false)
    expect(issues).toHaveLength(3)
  })
})

describe('validateInstantArticle', () => {
  it('passes a complete article', () => {
    expect(
      validateInstantArticle({ title: 'Flood update', bodyBlockCount: 4, hasCanonical: true }).ok,
    ).toBe(true)
  })

  it('flags an empty title and missing body', () => {
    const { ok, issues } = validateInstantArticle({
      title: '   ',
      bodyBlockCount: 0,
      hasCanonical: true,
    })
    expect(ok).toBe(false)
    expect(issues).toContain('Missing headline.')
    expect(issues).toContain('Article has no body blocks to export.')
  })
})

describe('validateAppleNewsFormat', () => {
  it('passes a complete document', () => {
    expect(
      validateAppleNewsFormat({ hasIdentifier: true, hasTitle: true, hasComponents: true }).ok,
    ).toBe(true)
  })

  it('flags every missing field', () => {
    const { ok, issues } = validateAppleNewsFormat({
      hasIdentifier: false,
      hasTitle: false,
      hasComponents: false,
    })
    expect(ok).toBe(false)
    expect(issues).toHaveLength(3)
  })
})
