import type { ArticleBlock } from '@nagarikwatch/db'
import { describe, expect, it } from 'vitest'
import {
  collectThumbnailCandidates,
  cropRetention,
  pickShareImage,
  scoreThumbnail,
  type ThumbnailCandidate,
} from './thumbnail-salience'

function candidate(overrides: Partial<ThumbnailCandidate> = {}): ThumbnailCandidate {
  return {
    url: 'https://cdn.nagarikwatch.np/photos/budget.jpg',
    alt: 'अर्थमन्त्रीले संसदमा विनियोजन विधेयक पेश गर्दै',
    width: 1600,
    height: 900,
    caption: 'संसद भवन, काठमाडौं',
    credit: 'नागरिक वाच',
    origin: 'hero',
    position: 0,
    ...overrides,
  }
}

function imageBlock(url: string, extra: Partial<ThumbnailCandidate> = {}): ArticleBlock {
  return {
    type: 'image',
    image: {
      url,
      alt: extra.alt ?? 'प्रहरीले प्रदर्शनकारीलाई नियन्त्रणमा लिँदै',
      width: extra.width ?? 1600,
      height: extra.height ?? 900,
      credit: extra.credit,
    },
    caption: extra.caption,
  } as ArticleBlock
}

describe('cropRetention', () => {
  it('keeps almost everything on a 1.91:1 photo and loses half of a portrait', () => {
    expect(cropRetention(1200, 630)).toBeCloseTo(1, 5)
    expect(cropRetention(1600, 900)).toBeGreaterThan(0.78)
    expect(cropRetention(1080, 1350)).toBeLessThan(0.45)
  })

  it('does not punish an image whose dimensions were never recorded', () => {
    expect(cropRetention(undefined, undefined)).toBe(0.6)
  })
})

describe('scoreThumbnail', () => {
  it('rejects what a social crawler cannot render', () => {
    expect(scoreThumbnail(candidate({ url: 'data:image/png;base64,iVBOR' })).reasons).toEqual([
      'unusable-url',
    ])
    expect(scoreThumbnail(candidate({ url: '/graphics/chart.svg' })).reasons).toEqual(['vector'])
    expect(scoreThumbnail(candidate({ url: '/brand/logo-wide.png' })).reasons).toEqual([
      'non-editorial',
    ])
    expect(scoreThumbnail(candidate({ width: 400, height: 220 })).reasons).toEqual(['too-small'])
  })

  it('scores a wide captioned news photo above a tall undescribed one', () => {
    const wide = scoreThumbnail(candidate())
    const tall = scoreThumbnail(
      candidate({ width: 1080, height: 1350, alt: 'photo', caption: undefined, credit: undefined }),
    )
    expect(wide.score).toBeGreaterThan(tall.score)
    expect(tall.reasons).toContain('deep-crop')
    expect(tall.reasons).toContain('no-alt')
  })

  it('treats filler alt text as no alt text', () => {
    expect(scoreThumbnail(candidate({ alt: 'तस्बिर' })).reasons).toContain('no-alt')
    expect(scoreThumbnail(candidate({ alt: 'photo 2' })).reasons).toContain('no-alt')
    expect(scoreThumbnail(candidate()).reasons).toContain('described')
  })

  it('still accepts an image with no recorded dimensions', () => {
    const scored = scoreThumbnail(candidate({ width: undefined, height: undefined }))
    expect(scored.usable).toBe(true)
    expect(scored.reasons).toContain('unknown-size')
  })
})

describe('collectThumbnailCandidates', () => {
  it('reads the hero and then the body photos in reading order', () => {
    const candidates = collectThumbnailCandidates({
      heroImage: { url: '/media/hero.jpg', alt: 'संसद बैठक' },
      heroCredit: 'रासस',
      bodyNe: [
        { type: 'paragraph', text: 'बजेट पेश भयो।' } as ArticleBlock,
        imageBlock('/media/crowd.jpg'),
        imageBlock('/media/minister.jpg'),
      ],
    })
    expect(candidates.map((item) => item.url)).toEqual([
      '/media/hero.jpg',
      '/media/crowd.jpg',
      '/media/minister.jpg',
    ])
    expect(candidates[0]!.origin).toBe('hero')
    expect(candidates[0]!.credit).toBe('रासस')
    expect(candidates[2]!.position).toBe(2)
  })

  it('does not let a hero repeated in the body compete with itself', () => {
    const candidates = collectThumbnailCandidates({
      heroImage: { url: '/media/hero.jpg', alt: 'संसद बैठक' },
      bodyNe: [imageBlock('/media/hero.jpg')],
    })
    expect(candidates).toHaveLength(1)
  })
})

describe('pickShareImage', () => {
  it('reaches into the body when the story has no hero at all', () => {
    const picked = pickShareImage(
      collectThumbnailCandidates({
        bodyNe: [imageBlock('/media/flood.jpg', { caption: 'सप्तकोशीको बहाव' })],
      }),
    )
    expect(picked?.candidate.url).toBe('/media/flood.jpg')
  })

  it('prefers a usable body photo over a hero the crawler would drop', () => {
    const picked = pickShareImage(
      collectThumbnailCandidates({
        heroImage: { url: '/media/hero.svg', alt: 'तथ्याङ्क चार्ट' },
        bodyNe: [imageBlock('/media/rescue.jpg', { caption: 'उद्धार टोली' })],
      }),
    )
    expect(picked?.candidate.url).toBe('/media/rescue.jpg')
  })

  it('keeps the hero when it is the better photograph', () => {
    const picked = pickShareImage(
      collectThumbnailCandidates({
        heroImage: {
          url: '/media/hero.jpg',
          alt: 'भूकम्पपछि जाजरकोटको बस्ती',
          width: 2000,
          height: 1125,
          credit: 'नागरिक वाच',
        },
        bodyNe: [imageBlock('/media/map.jpg', { alt: 'नक्सा', width: 900, height: 1200 })],
      }),
    )
    expect(picked?.candidate.origin).toBe('hero')
  })

  it('returns null when nothing in the story can be shared', () => {
    expect(pickShareImage([])).toBeNull()
    expect(pickShareImage([candidate({ url: '/brand/logo.png' })])).toBeNull()
  })
})
