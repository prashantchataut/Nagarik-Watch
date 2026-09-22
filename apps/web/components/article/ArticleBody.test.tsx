// @vitest-environment happy-dom
// Without this, happy-dom really fetches the embed URL when the iframe mounts —
// a unit test has no business calling YouTube.
/* @vitest-environment-options { "settings": { "disableIframePageLoading": true } } */
import { afterEach, describe, expect, it } from 'vitest'
import type { ArticleBlock } from '@nagarikwatch/db'
import { ArticleBody } from '@/components/article/ArticleBody'
import { cleanupRendered, renderClient } from '@/test/render'

afterEach(cleanupRendered)

const embed: ArticleBlock = {
  type: 'embed',
  provider: 'youtube',
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  caption: 'संसद बैठकको प्रत्यक्ष प्रसारण',
}

describe('ArticleBody embeds under Save-Data', () => {
  it('ships the iframe by default', () => {
    const { container } = renderClient(<ArticleBody blocks={[embed]} locale="ne" />)
    const frame = container.querySelector('iframe')
    expect(frame).not.toBeNull()
    // Privacy-preserving host, not the tracking one.
    expect(frame?.getAttribute('src')).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ')
  })

  it('replaces it with a link to the source when the reader asked for less data', () => {
    const { container } = renderClient(<ArticleBody blocks={[embed]} locale="ne" saveData />)
    expect(container.querySelector('iframe')).toBeNull()
    expect(container.querySelector('a')?.getAttribute('href')).toBe(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    )
    // The caption still identifies what was withheld, so the placeholder is not
    // a mystery box.
    expect(container.textContent).toContain('संसद बैठकको प्रत्यक्ष प्रसारण')
  })
})
