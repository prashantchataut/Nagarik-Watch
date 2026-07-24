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
  politics: { from: '#141014', to: '#3A181C' },
  society: { from: '#121214', to: '#2A2420' },
  business: { from: '#0E1218', to: '#1A2838' },
  sports: { from: '#0E1410', to: '#1A2E1E' },
  world: { from: '#121416', to: '#242C32' },
  technology: { from: '#121018', to: '#261E36' },
  entertainment: { from: '#161210', to: '#3A2418' },
  health: { from: '#0E1414', to: '#1A2E2C' },
  education: { from: '#0E1218', to: '#1A2840' },
  opinion: { from: '#141210', to: '#2A2420' },
  default: { from: '#101010', to: '#2A1618' },
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
  const eyeMark = `<rect x="${w - 120}" y="${h - 48}" width="80" height="3" fill="#ffffff" opacity="0.35"/>`
  const fontSize = Math.max(18, Math.floor(w / 22))
  const subFontSize = Math.max(11, Math.floor(w / 48))
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${colors.from}"/><stop offset="100%" stop-color="${colors.to}"/></linearGradient><linearGradient id="vignette" x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0%" stop-color="#000000" stop-opacity="0.15"/><stop offset="55%" stop-color="#000000" stop-opacity="0.05"/><stop offset="100%" stop-color="#000000" stop-opacity="0.45"/></linearGradient>${patterns[pattern]}</defs><rect width="${w}" height="${h}" fill="url(#bg)"/><rect width="${w}" height="${h}" fill="url(#p)"/><rect width="${w}" height="${h}" fill="url(#vignette)"/>${eyeMark}<text x="36" y="${h - 44}" font-family="'Mukta','Noto Sans Devanagari',sans-serif" font-size="${fontSize}" font-weight="700" fill="#ffffff" opacity="0.95">${safeLabel}</text><text x="36" y="${h - 18}" font-family="Georgia,serif" font-size="${subFontSize}" font-weight="600" fill="#ffffff" opacity="0.55" letter-spacing="2.5">NAGARIK WATCH</text></svg>`
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
