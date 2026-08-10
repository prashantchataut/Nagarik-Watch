import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const adsFile = join(root, 'apps/web/lib/ads.ts')
const adsText = readFileSync(adsFile, 'utf8')
const keys = [...adsText.matchAll(/'([a-z0-9-]+)'\s*:\s*\{/g)].map((m) => m[1])
const requiredRegistered = [
  'home-top',
  'home-billboard',
  'home-hero-rail',
  'home-mid',
  'article-top-billboard',
  'article-inline-1',
  'article-sidebar-top',
  'article-sidebar-sticky',
  'article-native-related',
  'category-top',
  'category-inline',
  'latest-top',
  'latest-inline',
  'trending-top',
  'trending-inline',
  'hub-inline',
  'sidebar-rectangle',
  'sidebar-tower',
  'mobile-sticky',
]

const requiredRendered = [
  'home-billboard',
  'home-mid',
  'article-top-billboard',
  'article-sidebar-top',
  'article-sidebar-sticky',
  'article-native-related',
  'category-top',
  'category-inline',
  'latest-top',
  'latest-inline',
  'trending-top',
  'trending-inline',
  'hub-inline',
  'mobile-sticky',
]
const MAX_STATIC_SLOTS_PER_FILE = 4
const MAX_ADS_PER_CONTENT_UNIT = 1.5
const MIN_PARAGRAPHS_BEFORE_INLINE_AD = 4

const missing = requiredRegistered.filter((key) => !keys.includes(key))
const duplicates = keys.filter((key, idx) => keys.indexOf(key) !== idx)
const failures = []
if (missing.length) failures.push(`Missing required placements: ${missing.join(', ')}`)
if (duplicates.length) failures.push(`Duplicate placements: ${duplicates.join(', ')}`)

function files(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    const st = statSync(p)
    if (st.isDirectory()) files(p, out)
    else if (/\.(tsx|ts)$/.test(p)) out.push(p)
  }
  return out
}

const sourceFiles = files(join(root, 'apps/web'))
const used = new Set()
for (const file of sourceFiles) {
  const text = readFileSync(file, 'utf8')
  const slotCount = (text.match(/<AdSlot\b/g) ?? []).length
  if (slotCount > MAX_STATIC_SLOTS_PER_FILE) {
    failures.push(
      `${file}: ${slotCount} static ad slots exceeds the maximum of ${MAX_STATIC_SLOTS_PER_FILE}`,
    )
  }
  if (slotCount > 0 && !file.endsWith(join('components', 'AdSlot.tsx'))) {
    const contentUnits = Math.max(
      1,
      (
        text.match(
          /<(?:article|StoryCard|ArticleBody|CategoryDesk|RankedStoryList|PublicHubPage|p)\b/g,
        ) ?? []
      ).length,
    )
    const density = slotCount / contentUnits
    if (density > MAX_ADS_PER_CONTENT_UNIT) {
      failures.push(
        `${file}: ad density ${density.toFixed(2)} exceeds ${MAX_ADS_PER_CONTENT_UNIT} slots per content unit`,
      )
    }
  }
  for (const key of keys) {
    if (
      new RegExp(`placementKey=[{]?['"]${key}['"]`).test(text) ||
      new RegExp(`placementKey:\\s*['"]${key}['"]`).test(text)
    ) {
      used.add(key)
    }
  }
}

const articleBodyFile = join(root, 'apps/web/components/article/ArticleBody.tsx')
const articleBodyText = readFileSync(articleBodyFile, 'utf8')
const paragraphThreshold = Number(
  articleBodyText.match(/const AD_AFTER_PARAGRAPH\s*=\s*(\d+)/)?.[1] ?? 0,
)
if (paragraphThreshold < MIN_PARAGRAPHS_BEFORE_INLINE_AD) {
  failures.push(
    `Article inline ads require at least ${MIN_PARAGRAPHS_BEFORE_INLINE_AD} paragraphs; found ${paragraphThreshold}`,
  )
}

for (const key of requiredRendered) {
  if (!used.has(key)) {
    failures.push(`Required placement is registered but not rendered: ${key}`)
  }
}

if (failures.length) {
  console.error('Ad placement audit failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  `Ad placement audit passed (${keys.length} placements, ${used.size} rendered; max ${MAX_STATIC_SLOTS_PER_FILE} slots/file).`,
)
