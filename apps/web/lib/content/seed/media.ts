import type { MediaRef } from '@nagarikwatch/db'

/**
 * Editorial SVG stand-in when CMS has no photograph yet.
 * Must read as intentional brand media, not a broken/loading stripe.
 */

const CATEGORY_COLORS: Record<string, { ink: string; wash: string; accent: string }> = {
  politics: { ink: '#1A1012', wash: '#3A1C22', accent: '#C02A2A' },
  society: { ink: '#141210', wash: '#2E2620', accent: '#C02A2A' },
  business: { ink: '#10141A', wash: '#1E2A38', accent: '#C02A2A' },
  sports: { ink: '#0E1410', wash: '#1A2E1E', accent: '#C02A2A' },
  world: { ink: '#101418', wash: '#243038', accent: '#C02A2A' },
  technology: { ink: '#121018', wash: '#261E36', accent: '#C02A2A' },
  entertainment: { ink: '#161210', wash: '#3A2418', accent: '#C02A2A' },
  health: { ink: '#0E1414', wash: '#1A2E2C', accent: '#C02A2A' },
  education: { ink: '#0E1218', wash: '#1A2840', accent: '#C02A2A' },
  opinion: { ink: '#141210', wash: '#2A2420', accent: '#C02A2A' },
  interview: { ink: '#141014', wash: '#322028', accent: '#C02A2A' },
  migration: { ink: '#101418', wash: '#1E2C34', accent: '#C02A2A' },
  default: { ink: '#121014', wash: '#2A181C', accent: '#C02A2A' },
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
  const svg = renderSvg(w, h, colors, label, hash % 3)
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
  colors: { ink: string; wash: string; accent: string },
  label: string,
  motif: number,
): string {
  const safeLabel = label
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  const motifs = [
    `<circle cx="${w * 0.78}" cy="${h * 0.32}" r="${Math.min(w, h) * 0.22}" fill="${colors.accent}" opacity="0.12"/>
     <circle cx="${w * 0.86}" cy="${h * 0.55}" r="${Math.min(w, h) * 0.12}" fill="#ffffff" opacity="0.05"/>`,
    `<rect x="${w * 0.55}" y="${h * 0.18}" width="${w * 0.38}" height="${h * 0.55}" fill="${colors.accent}" opacity="0.1"/>
     <rect x="${w * 0.62}" y="${h * 0.28}" width="${w * 0.22}" height="${h * 0.08}" fill="#ffffff" opacity="0.08"/>`,
    `<path d="M${w * 0.58} ${h * 0.72} L${w * 0.92} ${h * 0.22} L${w * 0.92} ${h * 0.72} Z" fill="${colors.accent}" opacity="0.11"/>`,
  ]

  const fontSize = Math.max(22, Math.floor(w / 18))
  const subFontSize = Math.max(13, Math.floor(w / 42))

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.ink}"/>
      <stop offset="100%" stop-color="${colors.wash}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  ${motifs[motif]}
  <rect x="0" y="0" width="8" height="${h}" fill="${colors.accent}"/>
  <rect x="0" y="${h - 6}" width="${w}" height="6" fill="${colors.accent}" opacity="0.85"/>
  <text x="36" y="${h - 56}" font-family="Mukta,Noto Sans Devanagari,sans-serif" font-size="${fontSize}" font-weight="800" fill="#F7F2F1">${safeLabel}</text>
  <text x="36" y="${h - 28}" font-family="Source Sans 3,system-ui,sans-serif" font-size="${subFontSize}" font-weight="700" fill="#F7F2F1" opacity="0.55">NAGARIK WATCH</text>
</svg>`
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
