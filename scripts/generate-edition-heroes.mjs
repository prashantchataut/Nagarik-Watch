/**
 * Creates editorial SVG hero images for every edition slug.
 * Run: node scripts/generate-edition-heroes.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

const outDir = path.resolve('apps/web/public/media/edition-2026-07')
mkdirSync(outDir, { recursive: true })

const slugs = readFileSync('scripts/_edition-slugs.txt', 'utf8')
  .split(/\r?\n/)
  .map((s) => s.trim())
  .filter(Boolean)

const palettes = [
  ['#8B1E1E', '#1A0A0A', '#F4EDE4'],
  ['#6B1520', '#0F1720', '#E8DCC8'],
  ['#9C2A1F', '#142018', '#F7F1E8'],
  ['#7A1F2B', '#1C1410', '#EFE6DA'],
  ['#A33A2C', '#101820', '#F2E8DC'],
]

function hash(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function labelFromSlug(slug) {
  return slug.replace(/-/g, ' ').slice(0, 42)
}

for (const slug of slugs) {
  const h = hash(slug)
  const [brand, ink, paper] = palettes[h % palettes.length]
  const label = labelFromSlug(slug)
  const y1 = 80 + (h % 40)
  const y2 = 220 + (h % 60)
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${ink}"/>
      <stop offset="55%" stop-color="${brand}"/>
      <stop offset="100%" stop-color="${ink}"/>
    </linearGradient>
    <linearGradient id="mist" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="${paper}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${paper}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#g)"/>
  <circle cx="${200 + (h % 200)}" cy="${y1}" r="${120 + (h % 80)}" fill="${paper}" fill-opacity="0.08"/>
  <circle cx="${1100 + (h % 300)}" cy="${y2}" r="${180 + (h % 90)}" fill="${paper}" fill-opacity="0.1"/>
  <rect x="0" y="620" width="1600" height="280" fill="url(#mist)"/>
  <rect x="72" y="72" width="14" height="120" fill="${paper}"/>
  <text x="110" y="120" fill="${paper}" font-family="Georgia, serif" font-size="42" font-weight="700">नागरिक वाच</text>
  <text x="110" y="168" fill="${paper}" fill-opacity="0.75" font-family="system-ui, sans-serif" font-size="22" letter-spacing="4">NAGARIK WATCH</text>
  <text x="72" y="760" fill="${paper}" font-family="Georgia, serif" font-size="48" font-weight="700">${label}</text>
  <text x="72" y="820" fill="${paper}" fill-opacity="0.7" font-family="system-ui, sans-serif" font-size="24">Original edition · २०८३</text>
</svg>`
  writeFileSync(path.join(outDir, `${slug}.svg`), svg, 'utf8')
}

console.log('wrote', slugs.length, 'svg heroes to', outDir)
