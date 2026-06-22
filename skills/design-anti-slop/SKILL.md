---
name: design-anti-slop
description: "Detect and eliminate generic AI design patterns. Identifies cookie-cutter layouts, overused gradients, stock aesthetics, and buzzword-heavy copy. Use when reviewing designs for authenticity and avoiding the 'AI startup' look."
applies_to:
  - "**/*.figma"
  - "**/*.sketch"
tags:
  - design
  - ui
  - ux
  - visual-design
  - authenticity
  - design reviews
related_skills:
  - text/anti-slop
version: 2.0.0
---

# Design Anti-Slop

Detect and eliminate generic AI design patterns. Identifies cookie-cutter layouts, overused gradients, stock aesthetics, and buzzword-heavy copy. Use when reviewing designs for authenticity and avoiding the "AI startup" look.

## When to Use

Use `design-anti-slop` when:

- Reviewing AI-generated designs before implementation
- Conducting design audits for generic patterns
- Catching "template syndrome" in landing pages
- Ensuring brand authenticity in visual design
- Teaching design quality standards to teams
- Detecting the "AI startup aesthetic"

Do NOT use when:

- Following specific brand guidelines that happen to use common patterns
- Working with established design systems (different context)
- Intentionally using templates for rapid prototyping

## Quick Example

### Before (AI Design Slop)

- Purple/pink/cyan mesh gradient hero
- "Empower Your Business" headline
- Three feature cards with generic icons
- Floating 3D geometric shapes
- Stats section with big numbers
- Generic testimonials
- "Get Started Today" CTA

### After (Authentic Design)

- Brand-specific color palette
- Specific value proposition headline
- Content-driven layout based on user needs
- Visual elements that serve purpose
- Real customer data/quotes with context
- Clear, action-oriented CTA

What changed:

- Removed generic gradient background
- Replaced buzzword headline with specific value
- Designed layout for actual content, not template
- Eliminated decorative 3D elements
- Used authentic customer proof
- Specified the action, not generic "get started"

## The AI Slop Test

If someone could look at this interface and say "AI made that" without doubt, it's failed. This is the core principle. Every design decision must survive the question: **could a template have made this same choice?** If yes, make a different choice.

### Category-Reflex Check

Run at two altitudes; the second catches what the first misses.

1. **First-order:** If someone could guess the theme + palette from the category alone ("observability -> dark blue", "healthcare -> white + teal", "finance -> navy + gold", "crypto -> neon on black"), it's the first training-data reflex. Rework until the answer isn't obvious from the domain.

2. **Second-order:** If someone could guess the aesthetic family from category-plus-anti-references ("AI workflow tool that's not SaaS-cream -> editorial-typographic", "fintech that's not navy-and-gold -> terminal-native dark mode"), it's the trap one tier deeper. The first reflex was avoided; the second wasn't. Rework until both answers are not obvious.

## When to Use What

| If you see... | Red flag because... | Better approach |
|---|---|---|
| Purple/pink/cyan gradient | "AI startup" cliche | Brand colors, solid backgrounds |
| "Empower your business" | Generic buzzword headline | Specific value: "Cut API response time 80%" |
| Floating 3D shapes | Decorative without purpose | Purpose-driven visuals or remove |
| Everything in cards | Template thinking | Vary layouts based on content type |
| Inter for everything | Default font choice | Fonts matching brand personality |
| Center-aligned everything | Lazy symmetry | Intentional alignment, left for readability |
| Generic icon + text cards | Cookie-cutter pattern | Content-first layout variations |
| "Get Started" CTA | Vague action | Specific: "Start Free Trial" "Download Report" |

## Core Workflow

### 3-Step Slop Detection

**1. Visual audit** - Scan for generic patterns

Check for:
- Generic gradients (purple/pink/cyan mesh)
- Floating 3D geometric shapes
- Glassmorphism overuse
- Stock photo aesthetics
- Same font for everything (usually Inter)
- The hero-metric template (big number, small label, gradient accent)

**2. Layout audit** - Check structure

Red flags:
- Cookie-cutter landing page template
- Everything in cards
- Center-aligned everything
- Identical spacing everywhere
- Template-driven, not content-driven

**3. Copy audit** - Review microcopy

Buzzword alerts:
- "Empower your business"
- "Take control of your future"
- "Unlock your potential"
- "Seamless experience"
- Generic CTAs ("Get Started", "Learn More")

## Quick Reference Checklist

Design slop indicators:

- Purple/pink/cyan gradient background
- Floating 3D shapes (cubes, spheres, toruses)
- Glassmorphism on every element
- Stock photo aesthetics (diverse workplace, people pointing at screens)
- Inter for all text
- Everything in cards
- Everything center-aligned
- "Empower your business" type headlines
- Generic three-column feature layout
- Stats section with big numbers but no context
- Fake-looking testimonials
- Generic pricing cards
- "Get Started Today" CTA

## Absolute Bans

Match-and-refuse. If you're about to use any of these, rewrite with different structure.

- **Side-stripe borders.** `border-left` or `border-right` greater than 1px as a colored accent on cards, list items, callouts, or alerts. Never intentional. Rewrite with full borders, background tints, leading numbers/icons, or nothing.
- **Gradient text.** `background-clip: text` combined with a gradient background. Decorative, never meaningful. Use a single solid color. Emphasis via weight or size.
- **Glassmorphism as default.** Blurs and glass cards used decoratively. Rare and purposeful, or nothing.
- **The hero-metric template.** Big number, small label, supporting stats, gradient accent. SaaS cliche.
- **Identical card grids.** Same-sized cards with icon + heading + text, repeated endlessly.
- **Modal as first thought.** Modals are usually laziness. Exhaust inline / progressive alternatives first.

## Common Workflows

### Workflow 1: Audit Landing Page Design

**Check hero section**

Red flags:
- Gradient mesh background (purple/pink/cyan)
- "Empower/Transform/Revolutionize Your Business"
- Generic stock photo or 3D shapes
- Center-aligned everything

Better:
- Brand-specific colors
- Specific value prop: "Process 10k transactions/sec"
- Real product screenshot or authentic imagery
- Strategic alignment

**Check features section**

Red flags:
- Exactly three cards
- Generic icons (rocket, shield, chart)
- "Feature 1" "Feature 2" "Feature 3" layout
- All cards identical size regardless of content

Better:
- Content-driven layout (2, 4, 5 items if that's what you need)
- Specific icons or remove them
- Vary presentation based on feature importance
- Size cards based on content

**Check social proof**

Red flags:
- Generic testimonials with stock photos
- "10k+ users" "99% satisfaction" without context
- Logo wall of companies you can't verify

Better:
- Real customer quotes with full names, roles, companies
- Specific metrics: "Reduced support tickets 40% in Q3 2024"
- Verifiable customer relationships

**Check CTA**

Red flags:
- "Get Started"
- "Learn More"
- "Try for Free"
- Gradient button with excessive shadow

Better:
- Specific action: "Start 14-Day Trial" "Download Whitepaper"
- "See Live Demo" "Request Pricing"
- Simple, clear button styling

### Workflow 2: Review SaaS Dashboard Design

**Check color usage**

Red flags:
- Purple accent color (generic SaaS palette)
- Pastel everything
- Pure black (#000) and pure white (#FFF)

Better:
- Brand-specific palette
- Functional color system (success, warning, error)
- Accessible contrast ratios (WCAG AA minimum)

**Check layout patterns**

Red flags:
- Every section in a card
- Cards within cards
- Everything spaced identically
- Floating elements with excessive shadows

Better:
- Vary visual treatment based on content type
- Group related data visually
- Use spacing to create hierarchy
- Subtle shadows where needed for depth

**Check data visualization**

Red flags:
- Default chart library colors
- Gradients on every chart
- 3D charts (rarely useful)
- Decorative animations

Better:
- Purpose-driven color choices
- Simple, readable charts
- 2D charts (easier to read)
- Animation only for state changes

### Workflow 3: Review Mobile App Design

**Check navigation**

Red flags:
- Generic bottom tab bar with 5 items
- Icons without labels
- Hamburger menu for everything

Better:
- Navigation based on user flow
- Most important actions surfaced
- Labels for clarity
- Consider alternatives to hamburger

**Check components**

Red flags:
- Fully rounded buttons (pill shape)
- Gradient buttons everywhere
- Ghost buttons as primary CTAs
- Every input has an icon inside

Better:
- Appropriate border radius (4-8px usually)
- Style hierarchy (primary solid, secondary outline)
- Icons in inputs only when helpful

**Check typography**

Red flags:
- Same font family for everything
- Body text < 16px
- Insufficient line height (< 1.5)
- Center-aligned paragraphs

Better:
- Clear hierarchy with font sizes/weights
- Readable body text (16px+)
- Comfortable line height (1.5-1.8)
- Left-aligned body text

## High-Confidence Slop Patterns

These are almost always AI-generated or template-derived:

### Visual

- **Purple (#7F5AF0) + Cyan (#2CB67D) + Pink (#FF6AC1) palette** - The "AI startup" gradient
- **Floating 3D geometric shapes** - Cubes, spheres, toruses with no purpose
- **Glassmorphism on everything** - Blurred backgrounds, frosted glass effects overused
- **Stock workplace diversity photos** - Generic "people collaborating" imagery

### Layout

- **Exact three-column feature cards** - The universal AI template
- **Everything in cards** - Cards within cards within cards
- **Hero -> 3 features -> stats -> testimonials -> pricing -> CTA** - The AI landing page formula
- **Center-aligned everything** - Lazy symmetry without purpose

### Typography

- **Inter for everything** - The default modern font choice
- **Montserrat + Open Sans** - The generic pairing
- **Excessive font variation** - 5+ fonts trying to look "designed"

### Copy

- **"Empower your business"** - Generic value prop
- **"Seamless experience"** - Meaningless modifier
- **"Get Started" CTA** - Vague action
- **"Trusted by industry leaders"** - Unverifiable claim

## Context Matters

Not all patterns are always slop:

- **Brand guidelines** - If brand actually uses purple, it's authentic
- **Industry standards** - Some patterns are conventions (e.g., ecommerce layouts)
- **Accessibility** - Some "generic" patterns exist for good UX reasons
- **Established systems** - Material Design, iOS HIG have reasons for patterns

The issue is thoughtless copying without considering if it serves your specific users and content.

## Reference Files

- **[references/visual.md](references/visual.md)** - Complete visual design pattern catalog
- **[references/layout.md](references/layout.md)** - Layout antipatterns and alternatives
- **[references/ux-writing.md](references/ux-writing.md)** - Microcopy and button text patterns

## Related Skills

- **anti-slop** - For cleaning up text and code slop patterns
- **impeccable** - For full design craft and iteration