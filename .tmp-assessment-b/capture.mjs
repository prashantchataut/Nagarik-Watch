import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({
  headless: true,
  channel: 'chrome',
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('https://nagarikwatch.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2500);

const shots = [];
async function shot(name) {
  const file = path.join(outDir, name);
  await page.screenshot({ path: file, fullPage: false });
  shots.push(file);
}

await shot('assessment-b-desktop-top.png');
await page.evaluate(() => window.scrollTo(0, 700));
await page.waitForTimeout(500);
await shot('assessment-b-desktop-mid1.png');
await page.evaluate(() => window.scrollTo(0, 1400));
await page.waitForTimeout(500);
await shot('assessment-b-desktop-mid2.png');
await page.evaluate(() => window.scrollTo(0, 2200));
await page.waitForTimeout(500);
await shot('assessment-b-desktop-mid3.png');
await page.evaluate(() => window.scrollTo(0, 3000));
await page.waitForTimeout(500);
await shot('assessment-b-desktop-lower.png');

const metrics = await page.evaluate(() => {
  const isVisible = (el) => {
    const r = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0';
  };

  const emptyRegions = [];
  const grids = [...document.querySelectorAll('[class*="grid"]')].filter(isVisible).slice(0, 60);
  for (const g of grids) {
    const style = getComputedStyle(g);
    const cols = style.gridTemplateColumns;
    if (!cols || cols === 'none') continue;
    const children = [...g.children].filter(isVisible);
    const rect = g.getBoundingClientRect();
    const trackCount = cols.trim().split(/\s+/).length;
    if (trackCount >= 3 && children.length > 0 && children.length < trackCount) {
      emptyRegions.push({
        className: String(g.className || '').slice(0, 200),
        trackCount,
        childCount: children.length,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        top: Math.round(rect.top + window.scrollY),
        cols,
      });
    }
  }

  // Also measure flex/grid columns that look empty (large empty sibling space)
  const columnGaps = [];
  for (const g of grids.slice(0, 30)) {
    const style = getComputedStyle(g);
    if (style.display !== 'grid') continue;
    const rect = g.getBoundingClientRect();
    const children = [...g.children].filter(isVisible);
    if (children.length < 2) continue;
    const childRects = children.map((c) => c.getBoundingClientRect());
    const occupied = childRects.reduce((sum, r) => sum + r.width * r.height, 0);
    const area = rect.width * rect.height;
    const fill = area > 0 ? occupied / area : 1;
    if (fill < 0.55 && rect.height > 160 && rect.width > 600) {
      columnGaps.push({
        className: String(g.className || '').slice(0, 200),
        fillPct: +(fill * 100).toFixed(1),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        childCount: children.length,
        top: Math.round(rect.top + window.scrollY),
        childWidths: childRects.map((r) => Math.round(r.width)),
        childHeights: childRects.map((r) => Math.round(r.height)),
      });
    }
  }

  const stretchedImages = [...document.querySelectorAll('img')]
    .filter(isVisible)
    .slice(0, 100)
    .map((img) => {
      const r = img.getBoundingClientRect();
      const natW = img.naturalWidth || 0;
      const natH = img.naturalHeight || 0;
      const dispW = r.width;
      const dispH = r.height;
      const natAR = natW && natH ? natW / natH : null;
      const dispAR = dispW && dispH ? dispW / dispH : null;
      const stretch = natAR && dispAR ? Math.abs(natAR - dispAR) / natAR : null;
      return {
        src: (img.currentSrc || img.src || '').slice(0, 140),
        className: String(img.className || '').slice(0, 140),
        parentClass: String(img.parentElement?.className || '').slice(0, 140),
        natW,
        natH,
        dispW: Math.round(dispW),
        dispH: Math.round(dispH),
        natAR: natAR ? +natAR.toFixed(3) : null,
        dispAR: dispAR ? +dispAR.toFixed(3) : null,
        stretchPct: stretch != null ? +(stretch * 100).toFixed(1) : null,
        objectFit: getComputedStyle(img).objectFit,
        top: Math.round(r.top + window.scrollY),
      };
    })
    .filter((i) => i.stretchPct != null && i.stretchPct > 12 && i.dispW > 40)
    .slice(0, 25);

  const largeWhitespace = [...document.querySelectorAll('section, article, div')]
    .filter(isVisible)
    .slice(0, 250)
    .map((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 220 || r.height < 140) return null;
      const textLen = (el.innerText || '').trim().length;
      const childCount = el.children.length;
      const density = textLen / (r.width * r.height);
      if (density < 0.00012 && r.height > 200 && childCount <= 3) {
        return {
          className: String(el.className || '').slice(0, 200),
          tag: el.tagName,
          width: Math.round(r.width),
          height: Math.round(r.height),
          textLen,
          childCount,
          top: Math.round(r.top + window.scrollY),
        };
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, 20);

  const classHits = {};
  for (const sel of [
    'StoryCard',
    'SectionHeader',
    'LatestRail',
    'HomeLive',
    'PollOf',
    'UtilityStrip',
    'hero',
    'mosaic',
    'desk',
    'stack',
    'rail',
    'sidebar',
    'grid-cols',
    'aspect-',
  ]) {
    classHits[sel] = document.querySelectorAll(`[class*="${sel}"], [data-component*="${sel}"]`).length;
  }

  const tokens = new Set();
  const main = document.querySelector('main') || document.body;
  main.querySelectorAll('[class]').forEach((el, idx) => {
    if (idx > 500) return;
    String(el.className)
      .split(/\s+/)
      .forEach((t) => {
        if (/story|section|rail|hero|mosaic|desk|stack|card|latest|live|poll|thumb|aspect|grid|col-|sidebar|kicker/i.test(t)) {
          tokens.add(t);
        }
      });
  });

  // Sample headline/card geometry for misalignment
  const articles = [...document.querySelectorAll('article, a[href*="/"], [class*="story"], [class*="Story"]')]
    .filter(isVisible)
    .slice(0, 40)
    .map((el) => {
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        className: String(el.className || '').slice(0, 160),
        width: Math.round(r.width),
        height: Math.round(r.height),
        left: Math.round(r.left),
        top: Math.round(r.top + window.scrollY),
      };
    });

  return {
    viewport: {
      vw: window.innerWidth,
      vh: window.innerHeight,
      scrollHeight: document.documentElement.scrollHeight,
    },
    emptyRegions,
    columnGaps,
    stretchedImages,
    largeWhitespace,
    classHits,
    classTokens: [...tokens].slice(0, 100),
    articles: articles.slice(0, 25),
    title: document.title,
  };
});

fs.writeFileSync(path.join(outDir, 'layout-metrics.json'), JSON.stringify(metrics, null, 2));
console.log(
  JSON.stringify(
    {
      shots: shots.map((s) => path.basename(s)),
      emptyRegions: metrics.emptyRegions.length,
      columnGaps: metrics.columnGaps.length,
      stretchedImages: metrics.stretchedImages.length,
      largeWhitespace: metrics.largeWhitespace.length,
      classHits: metrics.classHits,
      scrollHeight: metrics.viewport.scrollHeight,
    },
    null,
    2,
  ),
);

await browser.close();
