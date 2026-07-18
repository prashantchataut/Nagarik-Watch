import { describe, expect, it } from 'vitest'
import { publicShareImageUrl } from './share-image'

describe('publicShareImageUrl', () => {
  it('falls back for data URLs and empty values', () => {
    expect(publicShareImageUrl('data:image/svg+xml;base64,abc', 'https://nagarikwatch.com')).toBe(
      'https://nagarikwatch.com/opengraph-image.png',
    )
    expect(publicShareImageUrl(undefined, 'https://nagarikwatch.com')).toBe(
      'https://nagarikwatch.com/opengraph-image.png',
    )
  })

  it('keeps absolute https URLs and absolutizes site paths', () => {
    expect(publicShareImageUrl('https://cdn.example/a.jpg', 'https://nagarikwatch.com')).toBe(
      'https://cdn.example/a.jpg',
    )
    expect(publicShareImageUrl('/media/a.jpg', 'https://nagarikwatch.com')).toBe(
      'https://nagarikwatch.com/media/a.jpg',
    )
  })
})
