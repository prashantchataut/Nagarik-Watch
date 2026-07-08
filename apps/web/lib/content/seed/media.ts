import type { MediaRef } from '@nagarikwatch/db'

/**
 * Local SVG placeholder image generator. v3 copyright policy: NO external
 * images (Unsplash/Pexels/etc. require license verification and many IDs
 * expired). All article hero images are generated as category-themed SVG
 * data URLs — no network request, no copyright risk, no broken images.
 *
 * Editors can upload real images via the admin media library (Phase 2);
 * until then, every article gets a deterministic, branded placeholder.
 */

const CATEGORY_COLORS: Record<string, { from: string; to: string }> = {
  politics: { from: '#9E1F22', to: '#C02A2A' },
  society: { from: '#8B4513', to: '#C02A2A' },
  business: { from: '#1F3A5F', to: '#2E5A8F' },
  sports: { from: '#1B5E20', to: '#2E7D32' },
  world: { from: '#37474F', to: '#546E7A' },
  technology: { from: '#4A148C', to: '#6A1B9A' },
  entertainment: { from: '#BF360C', to: '#E64A19' },
  health: { from: '#00695C', to: '#00897B' },
  education: { from: '#0D47A1', to: '#1565C0' },
  opinion: { from: '#3E2723', to: '#5D4037' },
  default: { from: '#9E1F22', to: '#C02A2A' },
}

function hashSeed(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export function placeholder(
  seed: string,
  category: string,
  label: string,
  alt: string,
  opts: { w?: number; h?: number; credit?: string; caption?: string } = {},
): MediaRef {
  const { w = 1600, h = 900, credit, caption } = opts
  const colors = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.default!
  const hash = hashSeed(seed)
  const pattern = hash % 5
  const svg = renderSvg(w, h, colors, label, pattern)
  return {
    url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    alt,
    width: w,
    height: h,
    credit: credit ?? 'Nagarik Watch',
    caption,
  }
}

function renderSvg(
  w: number,
  h: number,
  colors: { from: string; to: string },
  label: string,
  pattern: number,
): string {
  const safeLabel = label
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
  const patterns = [
    `<pattern id="p" patternUnits="userSpaceOnUse" width="40" height="40" patternTransform="rotate(45)"><rect width="20" height="40" fill="#ffffff" opacity="0.04"/></pattern>`,
    `<pattern id="p" patternUnits="userSpaceOnUse" width="30" height="30"><circle cx="15" cy="15" r="2" fill="#ffffff" opacity="0.06"/></pattern>`,
    `<pattern id="p" patternUnits="userSpaceOnUse" width="60" height="60"><circle cx="30" cy="30" r="20" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.05"/><circle cx="30" cy="30" r="10" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.04"/></pattern>`,
    `<pattern id="p" patternUnits="userSpaceOnUse" width="20" height="20"><path d="M0 0L20 20M20 0L0 20" stroke="#ffffff" stroke-width="0.5" opacity="0.05"/></pattern>`,
    `<pattern id="p" patternUnits="userSpaceOnUse" width="48" height="42"><path d="M24 2L46 40L2 40Z" fill="none" stroke="#ffffff" stroke-width="0.8" opacity="0.05"/></pattern>`,
  ]
  const eyeMark = `<g transform="translate(${w - 70} ${h - 60})" opacity="0.18"><path d="M0 20 Q25 8 50 20 Q25 32 0 20 Z" fill="#ffffff"/><circle cx="25" cy="20" r="6" fill="${colors.from}"/><circle cx="25" cy="19" r="2.5" fill="#ffffff"/></g>`
  const fontSize = Math.max(20, Math.floor(w / 18))
  const subFontSize = Math.max(12, Math.floor(w / 40))
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${colors.from}"/><stop offset="100%" stop-color="${colors.to}"/></linearGradient>${patterns[pattern]}</defs><rect width="${w}" height="${h}" fill="url(#bg)"/><rect width="${w}" height="${h}" fill="url(#p)"/>${eyeMark}<text x="40" y="${h - 50}" font-family="'Mukta','Noto Sans Devanagari',sans-serif" font-size="${fontSize}" font-weight="700" fill="#ffffff" opacity="0.92">${safeLabel}</text><text x="40" y="${h - 20}" font-family="'Inter',sans-serif" font-size="${subFontSize}" font-weight="500" fill="#ffffff" opacity="0.6" letter-spacing="2">NAGARIK WATCH</text></svg>`
}

/** Compatibility wrapper matching the old unsplash() signature. */
export function unsplash(
  photoId: string,
  alt: string,
  opts: {
    w?: number
    h?: number
    credit?: string
    caption?: string
    category?: string
    label?: string
  } = {},
): MediaRef {
  const { w = 1600, h, credit, caption, category = 'default', label } = opts
  return placeholder(photoId, category, label ?? alt.slice(0, 30), alt, { w, h, credit, caption })
}
