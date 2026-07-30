import { describe, expect, it } from 'vitest'
import { isPubliclyVisibleStage, publicArticlePath } from '@/lib/content/article-visibility'

describe('public article visibility helpers', () => {
  it('marks only published/updated as public', () => {
    expect(isPubliclyVisibleStage('published')).toBe(true)
    expect(isPubliclyVisibleStage('updated')).toBe(true)
    expect(isPubliclyVisibleStage('draft')).toBe(false)
    expect(isPubliclyVisibleStage('scheduled')).toBe(false)
  })

  it('builds locale article paths', () => {
    expect(publicArticlePath('politics', 'test-slug')).toBe('/ne/politics/test-slug')
    expect(publicArticlePath('politics', 'test-slug', 'en')).toBe('/en/politics/test-slug')
  })
})
