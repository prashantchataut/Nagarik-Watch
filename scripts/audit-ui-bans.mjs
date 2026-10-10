#!/usr/bin/env node
/**
 * Repository-native UI ban gate for public reader surfaces.
 * Em-dash ban applies to reader-facing string/JSX text, not code comments.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { homeRoutePath } from './lib/home-route.mjs'

const ROOT = process.cwd()
const SCAN_ROOTS = [
  join(ROOT, 'apps/web/app/[locale]'),
  join(ROOT, 'apps/web/components'),
  join(ROOT, 'packages/ui/src'),
]

const SKIP_DIRS = new Set(['node_modules', '.next', 'admin', 'journalist'])
const EXT = /\.(tsx?|jsx?|css)$/

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

function walk(dir, out = []) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (EXT.test(name)) out.push(full)
  }
  return out
}

const files = SCAN_ROOTS.flatMap((root) => walk(root))
const findings = []

for (const file of files) {
  const rel = relative(ROOT, file).replace(/\\/g, '/')
  if (rel.includes('/admin/') || rel.includes('/journalist/')) continue
  const raw = readFileSync(file, 'utf8')
  const text = stripComments(raw)

  // Honest Source Sans token (historical --font-inter alias is banned).
  if (/--font-inter\b/.test(text)) {
    findings.push({ ban: 'font-inter-alias', file: rel })
  }

  // Accent stripe ban on public components (staff desks excluded above).
  if (/\bborder-l-4\b/.test(text) && !rel.includes('admin/')) {
    findings.push({ ban: 'border-l-4-accent', file: rel })
  }

  // Em dash in quoted strings or JSX text nodes.
  const emDashInCopy =
    /['"`][^'"`\n]*[—][^'"`\n]*['"`]/.test(text) || />[^<>{}\n]*[—][^<>{}\n]*</.test(text)
  if (emDashInCopy) {
    findings.push({ ban: 'em-dash', file: rel })
  }
}

// Homepage hierarchy invariants. The active opening package is the portal
// opening (DESIGN.md §5, locked decision #1 amended 2026-10-10): one lead
// display story beside a dense ताजा rail, with exactly one priority H1 inside
// MegaStoryBlock.
//
// The rail is checked structurally rather than counted at runtime because the
// count a reader actually sees depends on how much the edition has published.
// What a gate can hold is that the opening still *has* a rail, that HomePage
// still feeds it, and that the lead headline has not crept back up to the
// screen-filling size the amendment removed.
const homePagePath = join(ROOT, 'apps/web/components/home/HomePage.tsx')
const localeHomeRoutePath = join(ROOT, homeRoutePath(ROOT))
const portalFeedPath = join(ROOT, 'apps/web/components/home/PortalFeed.tsx')
const megaStoryPath = join(ROOT, 'apps/web/components/home/MegaStoryBlock.tsx')

try {
  const homePage = stripComments(readFileSync(homePagePath, 'utf8'))
  const localeRoute = stripComments(readFileSync(localeHomeRoutePath, 'utf8'))
  if (
    !/PortalFeed/.test(homePage) ||
    /LeadPackage/.test(homePage) ||
    !/HomePage/.test(localeRoute) ||
    // The opening must be fed a rail, or the density rule has no input.
    !/rail=\{/.test(homePage)
  ) {
    findings.push({ ban: 'homepage-opening-hierarchy', file: relative(ROOT, homePagePath) })
  }
} catch {
  findings.push({ ban: 'homepage-opening-missing', file: relative(ROOT, homePagePath) })
}

try {
  const portalFeed = stripComments(readFileSync(portalFeedPath, 'utf8'))
  if (
    !/slice\(0,\s*5\)/.test(portalFeed) ||
    !/MegaStoryBlock/.test(portalFeed) ||
    // The rail itself: a dense list beside the lead, not another display block.
    !/DenseStoryItem/.test(portalFeed) ||
    !/\brail\b/.test(portalFeed)
  ) {
    findings.push({ ban: 'homepage-portal-feed-contract', file: relative(ROOT, portalFeedPath) })
  }
} catch {
  findings.push({ ban: 'homepage-portal-feed-missing', file: relative(ROOT, portalFeedPath) })
}

try {
  const megaStory = stripComments(readFileSync(megaStoryPath, 'utf8'))
  const h1Count = megaStory.match(/<h1\b/g)?.length ?? 0
  if (h1Count !== 1 || !/priority/.test(megaStory)) {
    findings.push({ ban: 'homepage-h1-count', file: relative(ROOT, megaStoryPath) })
  }
  // The lead headline used to clamp at 4.5rem and centre itself, which is what
  // made the first screen a one-story screen. Hold the ceiling.
  const leadClamp = megaStory.match(/max-w-\[20ch\]\s+text-\[clamp\([^)]*,\s*([\d.]+)rem\)\]/)
  if (!leadClamp || Number(leadClamp[1]) > 3) {
    findings.push({ ban: 'homepage-lead-headline-scale', file: relative(ROOT, megaStoryPath) })
  }
  if (/mx-auto max-w-\[\d+rem\] pb-\d/.test(megaStory) || /text-center/.test(megaStory)) {
    findings.push({ ban: 'homepage-lead-centred', file: relative(ROOT, megaStoryPath) })
  }
} catch {
  findings.push({ ban: 'homepage-mega-story-missing', file: relative(ROOT, megaStoryPath) })
}

if (findings.length) {
  console.error('UI ban audit failed:')
  for (const row of findings) {
    console.error(`  [${row.ban}] ${row.file}`)
  }
  process.exit(1)
}

console.log(`UI ban audit passed (${files.length} files scanned).`)
