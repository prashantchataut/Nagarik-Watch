---
name: logo-design
description: Design and generate app/site logos in PNG and SVG format with proper brand guidelines, scalability, color theory, favicon variants, and dark/light mode variants. Use when the user mentions logo, brand mark, app icon, site icon, favicon, brand identity, or wants a visual symbol for their product.
trigger: /logo
---

# Logo Design

Design and generate professional logos for apps and websites with proper brand guidelines, export formats, and variant systems.

## When to Activate

- User mentions "logo", "brand mark", "app icon", "site icon", "favicon", "brand identity", "visual identity"
- User wants a visual symbol/mark for their product, company, or project
- User asks to redesign or improve an existing logo
- User needs logo variants (dark mode, favicon, social media sizes)

## Process

### Step 1 — Understand the brand

Ask these questions ONE AT A TIME (not all at once):

1. **What is the product/service name?** (Exact text for the logo mark)
2. **What does it do in one sentence?** (Shapes the personality)
3. **Who is the target audience?** (Developers? Consumers? Enterprise? Kids?)
4. **What feeling should the logo evoke?** (Trust? Speed? Fun? Luxury? Minimalism?)
5. **Any existing brand colors or preferences?** (Hex codes, color families, or "no preference")
6. **Any existing logos or brands you admire?** (For style direction, not copying)
7. **Where will this logo be used?** (App icon only? Website header? Merch? All of the above?)

### Step 2 — Determine logo type

Based on Step 1 answers, choose the appropriate logo type:

| Type | Best for | Examples |
|------|----------|----------|
| **Wordmark** | Brand names that are distinctive on their own | Google, Netflix, Coca-Cola |
| **Lettermark** | Long names shortened to initials | IBM, HBO, NASA |
| **Brandmark (icon)** | Global brands, apps with icon needs | Apple, Twitter, Slack |
| **Combination mark** | Most common — icon + text | Adidas, Dropbox, Spotify |
| **Emblem** | Traditional, authority, badges | Starbucks, Harley-Davidson |

For apps and SaaS products, **combination mark** is almost always the right choice — you need both an icon (for app stores, favicons) and a wordmark (for headers, emails).

### Step 3 — Design principles

Every logo must follow these rules:

1. **Scalability** — Must work at 16px (favicon) and 1024px (app store). Test by imagining the logo at both sizes before generating.
2. **Simplicity** — Maximum 2-3 visual elements. If you need more, simplify.
3. **Monochrome test** — Must be recognizable in pure black on white and pure white on black.
4. **No text in icons** — The brandmark/icon portion should have NO text. Text goes in the wordmark portion only.
5. **Distinct silhouette** — The icon should be recognizable by its outline alone.
6. **Color restraint** — Maximum 2 colors in the icon, maximum 3 in the full logo.
7. **No trends** — Avoid gradients, 3D effects, complex illustrations, or anything that dates quickly.

### Step 4 — Color system

Generate a complete color system:

```
Primary:    #XXXXXX  (Main brand color — used in icon, buttons, links)
Secondary:  #XXXXXX  (Accent — used sparingly for highlights, CTAs)
Background: #XXXXXX  (Light mode background)
Surface:    #XXXXXX  (Light mode card/surface)
Text:       #XXXXXX  (Light mode primary text)
Muted:      #XXXXXX  (Light mode secondary text)

Dark variants:
Background: #XXXXXX  (Dark mode background)
Surface:    #XXXXXX  (Dark mode card/surface)
Text:       #XXXXXX  (Dark mode primary text)
Muted:      #XXXXXX  (Dark mode secondary text)
```

Rules for color selection:
- Primary color should pass WCAG AA contrast (4.5:1) against both light and dark backgrounds
- If the primary color fails contrast on dark, create a lighter variant for dark mode
- Never use more than 1 saturated color — the rest should be neutral or desaturated

### Step 5 — Generate the logo

Use an image generation tool (Flux, DALL-E, Recraft, or similar) to create the logo. Generate multiple options:

**Prompt template for brandmark/icon:**
```
Minimalist [logo type] logo for [product name], [feeling] feeling, [color] primary color, clean vector style, white background, scalable, professional, no text, no gradients, flat design, [geometric/organic/abstract] shape
```

**Prompt template for wordmark:**
```
[product name] wordmark logo, [feeling] feeling, modern sans-serif typography, [color] primary color, clean, professional, scalable, white background
```

Generate at minimum:
1. **3 icon concepts** — different visual approaches
2. **1 wordmark** — using the chosen icon's color system
3. **1 combination mark** — icon + wordmark together

### Step 6 — Export deliverables

For each approved logo, generate these files:

| File | Size | Format | Purpose |
|------|------|--------|---------|
| `logo.svg` | Scalable | SVG | Primary source file, any size |
| `logo.png` | 1024x1024 | PNG | App store, presentations |
| `logo-dark.png` | 1024x1024 | PNG | Dark mode variant |
| `logo-light.png` | 1024x1024 | PNG | Light mode variant |
| `favicon.ico` | 32x32 | ICO | Browser tab icon |
| `favicon-16.png` | 16x16 | PNG | Favicon small |
| `favicon-32.png` | 32x32 | PNG | Favicon standard |
| `apple-touch-icon.png` | 180x180 | PNG | iOS home screen |
| `android-chrome-192.png` | 192x192 | PNG | Android home screen |
| `android-chrome-512.png` | 512x512 | PNG | Android splash |
| `og-image.png` | 1200x630 | PNG | Social media sharing |

For SVG generation, use code to create a clean, optimized SVG:
- Remove unnecessary attributes
- Use viewBox for scalability
- Include both colored and monochrome paths
- Add proper `<title>` and `<desc>` for accessibility

### Step 7 — Brand guidelines document

Create a `BRAND.md` file in the project root:

```markdown
# Brand Guidelines — [Product Name]

## Logo

### Primary Logo
![Primary logo](./logo.svg)

### Dark Mode Variant
![Dark mode logo](./logo-dark.png)

### Light Mode Variant
![Light mode logo](./logo-light.png)

## Color System

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| Primary | #XXXXXX | #XXXXXX | Buttons, links, icon fills |
| Secondary | #XXXXXX | #XXXXXX | Accents, highlights |
| Background | #XXXXXX | #XXXXXX | Page background |
| Surface | #XXXXXX | #XXXXXX | Cards, modals |
| Text | #XXXXXX | #XXXXXX | Primary text |
| Muted | #XXXXXX | #XXXXXX | Secondary text, captions |

## Typography

- **Headings:** [Font family], [weight], [size scale]
- **Body:** [Font family], [weight], [size scale]
- **Monospace:** [Font family] (for code)

## Logo Usage Rules

1. **Minimum size:** Logo icon minimum 24px, wordmark minimum 120px wide
2. **Clear space:** Maintain at least 1x the icon height as clear space on all sides
3. **Don't stretch** — Maintain aspect ratio at all times
4. **Don't rotate** — The logo always faces right/up
5. **Don't add effects** — No shadows, glows, gradients, or 3D effects
6. **Don't recolor** — Use only the approved color variants above
7. **On dark backgrounds:** Use the dark mode variant or white monochrome version
8. **On light backgrounds:** Use the primary or dark-on-light variant

## Favicon

Use `favicon.ico` for browser tabs and `apple-touch-icon.png` for iOS. See the generated files in `/public/icons/`.

## Social Media

- **OG Image:** `og-image.png` (1200x630)
- **Profile picture:** Use the icon-only version at 400x400 minimum
```

### Step 8 — Implementation checklist

After generating all assets, verify:

- [ ] SVG opens correctly in browser and renders at all sizes
- [ ] PNG files are crisp at their target sizes (not blurry)
- [ ] Favicon displays correctly in browser tab
- [ ] Dark mode variant has sufficient contrast on dark backgrounds
- [ ] Light mode variant has sufficient contrast on light backgrounds
- [ ] Monochrome version works in pure black and pure white
- [ ] Logo is recognizable at 16x16 (favicon size)
- [ ] `BRAND.md` is complete and committed
- [ ] All files are in the project's `/public/` or `/assets/` directory
- [ ] HTML `<link>` tags for favicons are added to the document `<head>`

## Common Mistakes to Avoid

- **Too many colors** — Stick to 1-2 in the icon, 3 max in the full logo
- **Detail at small sizes** — If it doesn't work at 16px, simplify
- **Text in the icon** — Icons should be recognizable without any text
- **Following trends** — Gradients, 3D, and complex illustrations date quickly
- **Similar to competitors** — Check that the logo doesn't look like existing brands in the same space
- **Inconsistent spacing** — Use a grid system for alignment
- **Missing variants** — Always provide dark, light, and monochrome versions