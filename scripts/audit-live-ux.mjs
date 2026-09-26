/**
 * Live UX audit — measures the rendered site in a real browser.
 *
 * Static gates in `pnpm verify:static` read tokens and source. This one reads
 * the *rendered* page: what the browser actually laid out, at the viewports
 * readers actually use. It exists because every claim in DESIGN.md about
 * spacing, contrast and tap targets was previously unverifiable from source.
 *
 * Usage:
 *   node scripts/audit-live-ux.mjs --base http://localhost:3000 [--json out.json] [--strict]
 *
 * Playwright is optional: when the browser is unavailable the script reports
 * `skipped` and exits 0, so it can sit in a pipeline that has no browser.
 */
import { writeFileSync } from 'node:fs'

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? fallback : args[i + 1]
}
const BASE = flag('base', process.env.AUDIT_BASE_URL || 'http://localhost:3000')
const JSON_OUT = flag('json', '')
const STRICT = args.includes('--strict')
const ONLY = flag('routes', '')

const DEFAULT_ROUTES = [
  ['/home', '/'],
  ['/home-en', '/en'],
  ['/desk', '/politics'],
  ['/article', '/politics/demo-politics-1'],
  ['/latest', '/latest'],
  ['/market', '/market'],
  ['/patro', '/patro'],
  ['/search', '/search'],
  ['/login', '/login'],
]

const ROUTES = ONLY ? ONLY.split(',').map((r) => [r.trim() || r, r.trim()]) : DEFAULT_ROUTES

const VIEWPORTS = [
  ['mobile-320', 320, 720],
  ['mobile-390', 390, 844],
  ['tablet-768', 768, 1024],
  ['desktop-1440', 1440, 900],
]

/* ------------------------------------------------------------------ *
 * In-page probe. Serialised into the browser, so it must be self
 * contained: no imports, no closures over Node scope.
 * ------------------------------------------------------------------ */
const PROBE = () => {
  const out = { route: location.pathname, viewport: window.innerWidth }

  /* ---- overflow ---- */
  const docOverflow = document.documentElement.scrollWidth - window.innerWidth
  out.overflowX = Math.max(0, docOverflow)
  out.overflowOffenders = []
  if (docOverflow > 1) {
    const all = document.body.querySelectorAll('*')
    for (const el of all) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      if (r.right > window.innerWidth + 1 || r.left < -1) {
        const style = getComputedStyle(el)
        if (style.position === 'fixed') continue
        out.overflowOffenders.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className && String(el.className).slice(0, 90)) || '',
          right: Math.round(r.right),
          left: Math.round(r.left),
          width: Math.round(r.width),
          text: (el.textContent || '').trim().slice(0, 40),
        })
      }
      if (out.overflowOffenders.length >= 12) break
    }
  }

  /* ---- colour helpers ----
   * The palette is authored in oklch/lab, and the browser hands those back
   * verbatim from getComputedStyle. A regex over `rgb()` silently returns
   * nothing for them, which is exactly how a contrast gate reports a false
   * 1.02:1 on a brand button. Resolve every colour through a canvas instead:
   * it is the only parser that understands every CSS colour syntax we ship.
   */
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx2d = canvas.getContext('2d', { willReadFrequently: true })
  const colorCache = new Map()
  const parseColor = (value) => {
    if (!value || value === 'transparent') return null
    if (colorCache.has(value)) return colorCache.get(value)
    let result = null
    try {
      ctx2d.clearRect(0, 0, 1, 1)
      ctx2d.fillStyle = '#000'
      ctx2d.fillStyle = value
      ctx2d.fillRect(0, 0, 1, 1)
      const [r, g, b, a] = ctx2d.getImageData(0, 0, 1, 1).data
      if (a === 0) result = { r: 0, g: 0, b: 0, a: 0 }
      else result = { r, g, b, a: a / 255 }
    } catch {
      result = null
    }
    colorCache.set(value, result)
    return result
  }
  const lum = ({ r, g, b }) => {
    const f = (c) => {
      const s = c / 255
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }
  const ratio = (a, b) => {
    const l1 = lum(a)
    const l2 = lum(b)
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
  }
  const blend = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  })
  const effectiveBg = (el) => {
    let node = el
    let acc = null
    let uncertain = false
    while (node && node !== document.documentElement.parentNode) {
      const style = getComputedStyle(node)
      if (style.backgroundImage && style.backgroundImage !== 'none') uncertain = true
      const c = parseColor(style.backgroundColor)
      if (c && c.a > 0) acc = acc ? blend(acc, c) : c
      if (acc && acc.a === 1) return { color: acc, uncertain }
      node = node.parentElement
    }
    return { color: acc && acc.a === 1 ? acc : { r: 255, g: 255, b: 255, a: 1 }, uncertain }
  }

  /* ---- text contrast + font sizes ---- */
  const contrastIssues = []
  const fontSizes = {}
  let skippedContrast = 0
  const seenText = new Set()
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let textNode
  while ((textNode = walker.nextNode())) {
    const text = (textNode.nodeValue || '').trim()
    if (text.length < 2) continue
    const el = textNode.parentElement
    if (!el || seenText.has(el)) continue
    seenText.add(el)
    const style = getComputedStyle(el)
    if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0)
      continue
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) continue
    const size = parseFloat(style.fontSize)
    const weight = Number(style.fontWeight) || 400
    fontSizes[Math.round(size)] = (fontSizes[Math.round(size)] || 0) + 1
    const fg = parseColor(style.color)
    if (!fg || fg.a === 0) continue
    const bgInfo = effectiveBg(el)
    if (bgInfo.uncertain) {
      skippedContrast += 1
      continue
    }
    const bg = bgInfo.color
    const fgSolid = fg.a < 1 ? blend(fg, bg) : fg
    const r = ratio(fgSolid, bg)
    const isLarge = size >= 24 || (size >= 18.66 && weight >= 700)
    const min = isLarge ? 3 : 4.5
    if (r < min) {
      contrastIssues.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className && String(el.className).slice(0, 70)) || '',
        size: Math.round(size),
        weight,
        ratio: Math.round(r * 100) / 100,
        min,
        text: text.slice(0, 46),
      })
    }
    if (size < 12) {
      contrastIssues.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className && String(el.className).slice(0, 70)) || '',
        size: Math.round(size),
        weight,
        ratio: Math.round(r * 100) / 100,
        min: 12,
        kind: 'tiny-text',
        text: text.slice(0, 46),
      })
    }
  }
  // Collapse duplicates: same class + same ratio reported once.
  const dedup = new Map()
  for (const i of contrastIssues) {
    const key = `${i.kind || 'contrast'}|${i.cls}|${i.ratio}|${i.size}`
    if (!dedup.has(key)) dedup.set(key, { ...i, count: 1 })
    else dedup.get(key).count += 1
  }
  out.contrast = [...dedup.values()].sort((a, b) => a.ratio - b.ratio).slice(0, 25)
  out.contrastCount = contrastIssues.filter((i) => i.kind !== 'tiny-text').length
  out.contrastUnmeasured = skippedContrast
  out.tinyTextCount = contrastIssues.filter((i) => i.kind === 'tiny-text').length
  out.fontSizes = fontSizes

  /* ---- Devanagari letter-spacing (DESIGN.md §3) ----
   * The design contract forbids letter-spacing outright, and gives a specific
   * reason for Devanagari: conjuncts and matras need zero inter-glyph spacing
   * or the script stops rendering correctly. Source-level gates cannot tell
   * which language a kicker will be rendered in; the browser can. So this is
   * measured, not asserted.
   */
  const devanagariTracking = []
  const seenTracking = new Set()
  for (const el of document.querySelectorAll('body *')) {
    if (el.children.length > 0) continue
    const text = (el.textContent || '').trim()
    if (!/[\u0900-\u097F]/.test(text)) continue
    const style = getComputedStyle(el)
    if (style.visibility === 'hidden' || style.display === 'none') continue
    const ls = style.letterSpacing
    const px = ls.endsWith('px') ? parseFloat(ls) : ls === 'normal' ? 0 : NaN
    if (!(px > 0.4)) continue
    const key = `${el.tagName}|${String(el.className).slice(0, 60)}|${px}`
    if (seenTracking.has(key)) continue
    seenTracking.add(key)
    devanagariTracking.push({
      tag: el.tagName.toLowerCase(),
      cls: (el.className && String(el.className).slice(0, 70)) || '',
      letterSpacing: px,
      text: text.slice(0, 30),
    })
  }
  out.devanagariTracking = devanagariTracking.slice(0, 15)
  out.devanagariTrackingCount = devanagariTracking.length

  /* ---- tap targets (WCAG 2.2 SC 2.5.8: 24x24 minimum) ----
   * Two exemptions are built in, because without them the number is noise:
   * links that sit inline in a sentence (the spec's inline exception), and
   * elements the page has deliberately hidden from sighted users (sr-only /
   * clipped). Both were inflating the count to three figures on every page.
   */
  const isVisuallyHidden = (el) => {
    let node = el
    while (node && node !== document.body) {
      const s = getComputedStyle(node)
      if (s.display === 'none' || s.visibility === 'hidden') return true
      if (s.clipPath && s.clipPath !== 'none') return true
      if (s.clip && s.clip !== 'auto' && s.clip !== 'rect(auto, auto, auto, auto)') return true
      const r = node.getBoundingClientRect()
      if (r.width <= 1 || r.height <= 1) return true
      node = node.parentElement
    }
    return false
  }
  const targets = []
  for (const el of document.querySelectorAll(
    'a[href], button, [role="button"], input:not([type="hidden"]), select, textarea, summary',
  )) {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    const style = getComputedStyle(el)
    if (style.visibility === 'hidden' || style.display === 'none') continue
    // SC 2.5.8 "Inline" exception: a link that sits inside a sentence is not
    // held to the 24px minimum, because the sentence sets its rhythm.
    if (style.display === 'inline' && el.closest('p, li, figcaption, .article-body, .prose'))
      continue
    if (isVisuallyHidden(el)) continue
    targets.push({
      el,
      r,
      tag: el.tagName.toLowerCase(),
      cls: (el.className && String(el.className).slice(0, 70)) || '',
      name: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 34),
    })
  }

  /* SC 2.5.8 "Spacing" exception: an undersized target is conformant when a
   * 24px-diameter circle centred on it does not intersect another target.
   * Applying it is what separates a real finding from a headline link in a
   * list whose rows are 70px apart. */
  const circleHitsRect = (cx, cy, rect) => {
    const nx = Math.max(rect.left, Math.min(cx, rect.right))
    const ny = Math.max(rect.top, Math.min(cy, rect.bottom))
    const dx = cx - nx
    const dy = cy - ny
    return dx * dx + dy * dy < 144 // r = 12
  }
  const small = []
  const advisory = []
  const exemptBySpacing = []
  for (const t of targets) {
    const undersized = t.r.width < 24 || t.r.height < 24
    if (!undersized) {
      if (t.r.height < 44 && window.innerWidth < 768) {
        advisory.push({
          tag: t.tag,
          cls: t.cls,
          w: Math.round(t.r.width),
          h: Math.round(t.r.height),
          name: t.name,
        })
      }
      continue
    }
    const cx = t.r.left + t.r.width / 2
    const cy = t.r.top + t.r.height / 2
    let crowded = false
    for (const other of targets) {
      if (other.el === t.el) continue
      if (other.el.contains(t.el) || t.el.contains(other.el)) continue
      if (circleHitsRect(cx, cy, other.r)) {
        crowded = true
        break
      }
    }
    const entry = {
      tag: t.tag,
      cls: t.cls,
      w: Math.round(t.r.width),
      h: Math.round(t.r.height),
      name: t.name,
    }
    if (crowded) small.push(entry)
    else exemptBySpacing.push(entry)
  }
  out.tapTargets = small.slice(0, 20)
  out.tapTargetCount = small.length
  out.tapTargetSpacingExempt = exemptBySpacing.length
  out.tapTargetAdvisory = advisory.length

  /* ---- structure ---- */
  const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => ({
    level: Number(h.tagName[1]),
    text: (h.textContent || '').trim().slice(0, 50),
  }))
  out.h1Count = headings.filter((h) => h.level === 1).length
  out.headingJumps = []
  for (let i = 1; i < headings.length; i += 1) {
    if (headings[i].level - headings[i - 1].level > 1) {
      out.headingJumps.push(`${headings[i - 1].level}→${headings[i].level} ${headings[i].text}`)
    }
  }
  out.headings = headings.slice(0, 40)

  const imgs = [...document.querySelectorAll('img')]
  out.imgCount = imgs.length
  out.imgMissingAlt = imgs.filter((i) => !i.hasAttribute('alt')).length
  out.imgEmptyAlt = imgs.filter((i) => i.getAttribute('alt') === '').length
  out.imgNoDimensions = imgs.filter(
    (i) => !i.getAttribute('width') && !i.getAttribute('height'),
  ).length
  out.landmarks = {
    main: document.querySelectorAll('main').length,
    nav: document.querySelectorAll('nav').length,
    header: document.querySelectorAll('header').length,
    footer: document.querySelectorAll('footer').length,
  }
  const interactive = [...document.querySelectorAll('a[href], button')]
  out.unnamedInteractive = interactive
    .filter((el) => {
      if (isVisuallyHidden(el)) return false
      // `aria-hidden` + `tabIndex={-1}` is the sanctioned way to keep a
      // duplicate card image link out of the accessibility tree.
      if (el.getAttribute('aria-hidden') === 'true' || el.tabIndex === -1) return false
      const name = (el.getAttribute('aria-label') || el.textContent || '').trim()
      const labelled = el.getAttribute('aria-labelledby')
      const imgAlt = el.querySelector('img[alt]:not([alt=""])')
      const svgTitle = el.querySelector('svg title')
      return !name && !labelled && !imgAlt && !svgTitle && !el.getAttribute('title')
    })
    .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)}`)
    .slice(0, 12)
  const ids = {}
  for (const el of document.querySelectorAll('[id]')) ids[el.id] = (ids[el.id] || 0) + 1
  out.duplicateIds = Object.entries(ids)
    .filter(([, n]) => n > 1)
    .map(([id]) => id)
    .slice(0, 12)
  out.domNodes = document.getElementsByTagName('*').length
  out.htmlBytes = document.documentElement.outerHTML.length

  /* ---- resources ---- */
  const res = performance.getEntriesByType('resource')
  out.resourceCount = res.length
  out.transferKB = Math.round(res.reduce((a, r) => a + (r.transferSize || 0), 0) / 1024)
  out.blockingCss = res.filter((r) => r.initiatorType === 'link' && /css/.test(r.name)).length
  out.scripts = res.filter((r) => r.initiatorType === 'script').length

  return out
}

/* ------------------------------------------------------------------ */

async function main() {
  let chromium
  try {
    ;({ chromium } = await import('@playwright/test'))
  } catch {
    console.log('audit-live-ux: playwright not installed — skipped')
    return
  }

  const browser = await chromium.launch().catch((error) => {
    console.log(`audit-live-ux: browser unavailable (${String(error).slice(0, 80)}) — skipped`)
    return null
  })
  if (!browser) return

  const report = []
  for (const [name, path] of ROUTES) {
    for (const [vpName, width, height] of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport: { width, height }, locale: 'ne-NP' })
      const page = await ctx.newPage()
      let result
      // Compatibility routes answer with a redirect, which destroys the
      // execution context mid-probe. Retry once against the final URL.
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const response = await page.goto(BASE + path, {
            waitUntil: 'domcontentloaded',
            timeout: 60000,
          })
          await page.waitForTimeout(1500)
          result = await page.evaluate(PROBE)
          result.status = response ? response.status() : 0
          break
        } catch (error) {
          result = { route: path, viewport: width, status: 0, error: String(error).slice(0, 160) }
          await page.waitForTimeout(600)
        }
      }
      result.name = name
      result.viewportName = vpName
      report.push(result)
      await ctx.close()
    }
  }
  await browser.close()

  /* ---- human summary ---- */
  const lines = []
  lines.push(`live UX audit — ${BASE}`)
  lines.push('')
  const head =
    'route'.padEnd(16) +
    'vp'.padEnd(14) +
    'ovf'.padStart(5) +
    'contr'.padStart(7) +
    'tap'.padStart(6) +
    'nodes'.padStart(8) +
    'kb'.padStart(7)
  lines.push(head)
  lines.push('-'.repeat(head.length))
  for (const r of report) {
    if (r.error) {
      lines.push(`${r.name.padEnd(16)}${r.viewportName.padEnd(14)}ERROR ${r.error.slice(0, 60)}`)
      continue
    }
    lines.push(
      r.name.padEnd(16) +
        r.viewportName.padEnd(14) +
        String(r.overflowX).padStart(5) +
        String(r.contrastCount).padStart(7) +
        String(r.tapTargetCount).padStart(6) +
        String(r.domNodes).padStart(8) +
        String(r.transferKB).padStart(7),
    )
  }

  const totals = report.reduce(
    (acc, r) => {
      acc.overflow += r.overflowX > 1 ? 1 : 0
      acc.contrast += r.contrastCount || 0
      acc.tap += r.tapTargetCount || 0
      acc.spacingExempt += r.tapTargetSpacingExempt || 0
      acc.alt += r.imgMissingAlt || 0
      acc.unnamed += (r.unnamedInteractive || []).length
      acc.dupeIds += (r.duplicateIds || []).length
      acc.tracking += r.devanagariTrackingCount || 0
      return acc
    },
    {
      overflow: 0,
      contrast: 0,
      tap: 0,
      spacingExempt: 0,
      alt: 0,
      unnamed: 0,
      dupeIds: 0,
      tracking: 0,
    },
  )
  lines.push('')
  lines.push(
    `totals: overflow=${totals.overflow} lowContrast=${totals.contrast} smallTapTargets=${totals.tap} ` +
      `imgMissingAlt=${totals.alt} unnamedControls=${totals.unnamed} duplicateIds=${totals.dupeIds}` +
      `\n         (undersized targets exempted by the 2.5.8 spacing rule: ${totals.spacingExempt})` +
      `\n         devanagariLetterSpacing=${totals.tracking}`,
  )

  const worst = report
    .filter(
      (r) =>
        !r.error &&
        (r.overflowX > 1 ||
          (r.contrastCount || 0) > 0 ||
          (r.tapTargetCount || 0) > 0 ||
          (r.devanagariTrackingCount || 0) > 0),
    )
    .slice(0, 8)
  for (const r of worst) {
    lines.push('')
    lines.push(`### ${r.name} @ ${r.viewportName} (${r.status})`)
    for (const o of (r.overflowOffenders || []).slice(0, 4)) {
      lines.push(
        `  overflow: <${o.tag} class="${o.cls}"> right=${o.right} w=${o.width} "${o.text}"`,
      )
    }
    for (const c of (r.contrast || []).slice(0, 5)) {
      lines.push(
        `  contrast ${c.ratio}:1 (min ${c.min}) ${c.size}px w${c.weight} <${c.tag} class="${c.cls}"> x${c.count} "${c.text}"`,
      )
    }
    for (const t of (r.tapTargets || []).slice(0, 6)) {
      lines.push(`  tap <${t.tag} class="${t.cls}"> ${t.w}x${t.h} "${t.name}"`)
    }
    for (const t of (r.devanagariTracking || []).slice(0, 5)) {
      lines.push(`  letter-spacing ${t.letterSpacing}px on <${t.tag} class="${t.cls}"> "${t.text}"`)
    }
  }
  console.log(lines.join('\n'))

  if (JSON_OUT) {
    writeFileSync(JSON_OUT, JSON.stringify({ base: BASE, report }, null, 2))
    console.log(`\nwrote ${JSON_OUT}`)
  }

  if (
    STRICT &&
    (totals.overflow || totals.contrast || totals.tap || totals.alt || totals.tracking)
  ) {
    process.exitCode = 1
  }
}

await main()
