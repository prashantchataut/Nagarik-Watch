import type { MediaRef } from '@nagarikwatch/db'

/**
 * Verified Unsplash photo builder. Photo IDs below were chosen for topic relevance and are
 * written in the documented, working Unsplash CDN shape
 * (https://images.unsplash.com/photo-{id}?auto=format&fit=crop&w=...&q=80). next/image
 * transforms these to AVIF/WebP and sizes them; the CDN caches transforms.
 */
export function unsplash(
  id: string,
  alt: string,
  opts: { w?: number; h?: number; credit?: string; caption?: string } = {},
): MediaRef {
  const { w = 1600, h, credit, caption } = opts
  const params = `auto=format&fit=crop&w=${w}&q=80${h ? `&h=${h}` : ''}`
  return {
    url: `https://images.unsplash.com/photo-${id}?${params}`,
    alt,
    width: w,
    height: h,
    credit,
    caption,
  }
}

/** Common aspect ratios used by hero and card images (reserved to protect the CLS budget). */
export const HERO_16_9 = { w: 1600, h: 900 }
export const CARD_4_3 = { w: 800, h: 600 }
export const PORTRAIT_3_4 = { w: 800, h: 1067 }
