# Visual Design Slop Patterns

Complete catalog of visual design patterns that signal generic AI generation, with detection rules and alternatives.

## Color

### High-Confidence Sloppy Patterns

| Pattern | Why it's slop | Better approach |
|---|---|---|
| Purple (#7F5AF0) + Cyan (#2CB67D) + Pink (#FF6AC1) | The "AI startup" gradient; every AI-generated design uses this palette | Brand-specific colors; pick a color strategy (restrained, committed, full palette, drenched) and commit |
| Pure black (#000) and pure white (#FFF) | Digital-only colors that never appear in nature; harsh on eyes | Tinted neutrals: tint every neutral toward the brand hue (chroma 0.005-0.01 is enough) |
| Purple accent on dark background | Default "tech product" palette | Build palette from brand identity, not category assumptions |
| Pastel everything | Safe, generic, no commitment | Use color intentionally; restrained doesn't mean pastel |
| Gradient mesh hero backgrounds | Visual noise that adds nothing | Solid or subtly textured backgrounds; let content breathe |
| Rainbow/iridescent accents | "Look how creative!" without substance | One or two accent colors used with purpose |

### Color Strategy Framework

Before picking colors, choose a commitment level:

1. **Restrained**: Tinted neutrals + one accent <=10% of surface. Product default.
2. **Committed**: One saturated color carries 30-60% of surface. Brand default for identity-driven pages.
3. **Full palette**: 3-4 named roles, each deliberate. Brand campaigns; product data viz.
4. **Drenched**: The surface IS the color. Brand heroes, campaign pages.

The "one accent <=10%" rule is Restrained only. Committed/Full palette/Drenched exceed it on purpose. Don't collapse every design to Restrained by reflex.

### Detection Rule

If someone could guess the palette from the category alone ("healthcare -> white + teal", "finance -> navy + gold"), it's the first training-data reflex. Rework until the answer isn't obvious from the domain.

## Typography

### High-Confidence Sloppy Patterns

| Pattern | Why it's slop | Better approach |
|---|---|---|
| Inter for everything | The default "modern" font; signals zero typographic thought | Choose fonts matching brand personality; vary weight and size for hierarchy |
| Montserrat + Open Sans | The generic "professional" pairing | Look beyond the top 10 Google Fonts; consider typefaces with character |
| 5+ font families | Trying too hard to look "designed" | 1-2 families maximum; hierarchy through weight and size, not family count |
| System font stack for production UI | Acceptable for prototypes, lazy for shipped products | A single well-chosen web font (200-400KB) transforms perceived quality |
| Center-aligned body text | Hard to read at length; signals template | Left-align body text; center only short headings or single-line elements |
| Body text below 16px | Unreadable on mobile; accessibility failure | 16px minimum for body; 14px only for secondary metadata |
| Line height below 1.5 | Cramped, hard to scan | 1.5-1.8 for body text; tighter for headings |

### Typography Hierarchy Rules

- Cap body line length at 65-75ch
- Hierarchy through scale + weight contrast (>=1.25 ratio between steps)
- Avoid flat scales where every step is the same multiplier
- Never use more than 2 font families

## Depth & Effects

### High-Confidence Sloppy Patterns

| Pattern | Why it's slop | Better approach |
|---|---|---|
| Glassmorphism on everything | Frosted glass was novel in 2020; now it's the default AI aesthetic | Use glass effects rarely and purposefully; prefer solid backgrounds |
| Excessive box shadows | Layered shadows on every card signal template | Use 1-2 shadow levels maximum; most elements need none |
| Floating 3D shapes (cubes, spheres, toruses) | Purely decorative; add visual noise without information | Remove entirely; or use purpose-driven illustration/photography |
| Gradient text (`background-clip: text`) | Decorative, never meaningful | Single solid color; emphasis through weight or size |
| Hover effects on everything | Micro-interactions that distract rather than inform | Hover only on interactive elements; keep transitions subtle |
| Parallax scrolling | Technical flex that hurts performance and accessibility | Use motion to reveal content, not to show off |

## Imagery & Iconography

### High-Confidence Sloppy Patterns

| Pattern | Why it's slop | Better approach |
|---|---|---|
| Stock workplace diversity photos | Generic "people collaborating" imagery | Real product screenshots; authentic team photos; custom illustration |
| Phosphor/React Icons heroicons everywhere | Default icon sets signal no design thought | Custom icons, or remove icons when they don't add information |
| Flat/line icons in primary color | Every AI design uses the same icon style | Match icon style to brand personality; vary weight and style |
| Abstract geometric illustrations | "Decorative" without meaning | Purpose-driven visuals or remove entirely |
| Isometric illustrations | Trendy but generic | Use if authentic to brand; otherwise, simpler is better |

## Motion & Animation

### High-Confidence Sloppy Patterns

| Pattern | Why it's slop | Better approach |
|---|---|---|
| Entrance animations on every element | Distracting; slows perceived performance | Animate only state changes and key content reveals |
| Bounce/elastic easing | Draws attention to the animation, not the content | Ease out with exponential curves (ease-out-quart/quint/expo) |
| Animated gradients | Visual noise | Static color; animate only on meaningful state changes |
| Scroll-triggered animations everywhere | Performance-killing, accessibility-hostile | Animate only key moments; respect `prefers-reduced-motion` |
| Loading spinners with branding | Users want speed, not branded waiting | Optimize for speed; skeleton screens for perceived performance |

## Theme

### Dark vs. Light

Dark vs. light is never a default. Not dark "because tools look cool dark." Not light "to be safe."

Before choosing, write one sentence of physical scene: who uses this, where, under what ambient light, in what mood. If the sentence doesn't force the answer, it's not concrete enough. Add detail until it does.

"Observability dashboard" does not force an answer. "SRE glancing at incident severity on a 27-inch monitor at 2am in a dim room" does. Run the sentence, not the category.

## Anti-References by Category

Common "first reflex" aesthetic choices by domain that should be questioned:

| Category | First reflex (avoid) | Second reflex (also avoid) | Authentic direction |
|---|---|---|---|
| SaaS / productivity | White + blue + Inter | Dark mode + neon accents | Editorial typographic; content-first |
| Fintech | Navy + gold + serif | Terminal-native dark mode | Data-dense, information-rich |
| Healthcare | White + teal + rounded | Soft pastels + illustration | Clinical clarity; accessible contrast |
| Developer tools | Dark + monospace + green | Terminal aesthetic | Functional density; purpose-driven color |
| AI / ML products | Purple gradient + 3D shapes | Minimal white + code snippets | Specific to what the AI actually does |
| Education | Bright primary colors + illustration | Corporate blue + photos | Warmth without condescension |