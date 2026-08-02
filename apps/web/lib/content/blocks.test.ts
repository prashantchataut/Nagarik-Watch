import { describe, expect, it } from 'vitest'
import { blocksFromShorthand, shorthandFromBlocks } from './blocks'
import type { ArticleBlock } from '@nagarikwatch/db'

describe('article body shorthand round-trip', () => {
  it('preserves images, embeds, and ads', () => {
    const blocks: ArticleBlock[] = [
      { type: 'paragraph', text: 'परिचय' },
      {
        type: 'image',
        image: { url: 'https://cdn.example/a.jpg', alt: 'मन्दिर' },
        caption: 'काठमाडौं',
      },
      { type: 'embed', provider: 'youtube', url: 'https://youtube.com/watch?v=abc' },
      { type: 'adSlot', placementKey: 'article-mid' },
      { type: 'heading2', text: 'शीर्षक' },
    ]
    const text = shorthandFromBlocks(blocks)
    const back = blocksFromShorthand(text)
    expect(back).toEqual(blocks)
  })

  it('parses markdown image lines from the desk editor', () => {
    const back = blocksFromShorthand('![alt text](https://cdn.example/x.png)\n\nअनुच्छेद')
    expect(back[0]).toEqual({
      type: 'image',
      image: { url: 'https://cdn.example/x.png', alt: 'alt text' },
      caption: undefined,
    })
    expect(back[1]).toEqual({ type: 'paragraph', text: 'अनुच्छेद' })
  })
})
