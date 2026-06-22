# Layout Antipatterns & Alternatives

Complete catalog of layout patterns that signal generic AI generation, with structural alternatives.

## Page-Level Antipatterns

### The AI Landing Page Formula

**The pattern:** Hero -> 3 features -> stats -> testimonials -> pricing -> CTA

This is the single most common AI-generated layout. Every section appears in the same order, with the same visual treatment, on every AI-generated landing page.

**Why it's slop:** The layout serves the template, not the content. Features get three cards because the template has three slots, not because there are three equally important features. Stats appear because the template has a stats section, not because the numbers are compelling.

**Better approach:** Start with the content. What does this specific user need to see? In what order? What builds trust? What drives action? Then design a layout that serves those answers.

### The Infinite Scroll of Sections

**The pattern:** Hero, features, how-it-works, benefits, testimonials, pricing, FAQ, CTA, footer. Every section full-width, alternating white/gray backgrounds.

**Why it's slop:** Template-driven. No content hierarchy. Every section gets equal weight.

**Better approach:** Some content deserves 80% of the page. Some deserves a line. Let importance drive space allocation.

## Section-Level Antipatterns

### Everything in Cards

**The pattern:** Every piece of content lives in a rounded rectangle with a subtle shadow. Features in cards. Pricing in cards. Testimonials in cards. Team members in cards. Cards within cards within cards.

**Why it's slop:** Cards are the lazy answer. They signal "I couldn't figure out how to group this content, so I put a box around it."

**Better approach:**
- Most content doesn't need a container
- Use cards only when they provide genuine grouping or interaction affordance
- Never nest cards inside cards
- Vary visual treatment: backgrounds, borders, spacing, typography

### The Three-Column Feature Grid

**The pattern:** Exactly three equal-sized cards, each with an icon, heading, and paragraph. Always three. Always equal.

**Why it's slop:** The number three comes from the template, not the content. Some products have 2 key features. Some have 7. Some have 1 that matters more than all others combined.

**Better approach:**
- Show the actual number of features you have
- Size cards based on content importance
- Vary layout based on content type (not everything is a card)
- If one feature matters most, give it more space

### The Stats Section

**The pattern:** Big numbers in a row. "10K+ Users" "99% Uptime" "50M+ API Calls" with gradient or accent-colored numbers.

**Why it's slop:** The hero-metric template. Numbers without context are meaningless. "10K+ Users" tells me nothing about whether those users are happy, active, or relevant to me.

**Better approach:**
- Specific metrics with context: "Reduced support tickets 40% in Q3 2024"
- Real numbers over vanity metrics
- Show, don't tell: product screenshots over abstract statistics
- If you must show stats, explain why they matter to the reader

### The Testimonial Carousel

**The pattern:** Stock photos of smiling people with generic quotes like "This product changed our workflow."

**Why it's slop:** Fake, unverifiable, and tells me nothing about the product's value.

**Better approach:**
- Real customer quotes with full names, roles, and companies
- Specific outcomes: "Cut our deployment time from 4 hours to 20 minutes"
- Case study links for depth
- If you don't have testimonials yet, don't fabricate them

### The Pricing Table

**The pattern:** Three columns: Free/Pro/Enterprise. Middle one highlighted. Feature checklists. "Most Popular" badge.

**Why it's slop:** Every SaaS has the same pricing layout. The "Most Popular" badge is always on the middle tier. The feature checklists are hard to scan.

**Better approach:**
- Lead with the value, not the price
- Show what each tier is FOR, not just what it costs
- Highlight differences, not just checklists
- Consider if a pricing table is even the right format

## Component-Level Antipatterns

### Center-Aligned Everything

**The pattern:** Every heading, paragraph, and CTA centered. Even body text.

**Why it's slop:** Center alignment is the default in most design tools. It requires zero thought about layout. It's also harder to read at length.

**Better approach:**
- Left-align body text (always)
- Center only short headings or single-line elements
- Use alignment intentionally: left for content, center for emphasis, right for metadata

### Identical Spacing Everywhere

**The pattern:** Every section has the same padding. Every element has the same margin. Everything is evenly distributed.

**Why it's slop:** Same spacing = no hierarchy. The eye doesn't know what's important.

**Better approach:**
- Vary spacing for rhythm
- Tighter spacing groups related items
- Looser spacing separates sections
- Use spacing to create visual hierarchy

### The Side-Stripe Border

**The pattern:** `border-left: 3px solid var(--accent)` on every card, list item, callout, and alert.

**Why it's slop:** It's the most common AI-generated accent pattern. Every card, quote, and notification has the same left-stripe treatment.

**Better approach:**
- Full borders
- Background tints
- Leading numbers or icons
- Or nothing (most elements don't need a visual accent)

### The Icon + Heading + Text Card

**The pattern:** Small icon, bold heading, short paragraph. Repeated 3-6 times in a grid.

**Why it's slop:** The universal content container. Used for features, benefits, team members, services, pricing tiers, and everything else.

**Better approach:**
- Vary presentation based on content type
- Features might work as a list, a table, or a narrative
- Team members might work as a sidebar or inline
- Not everything needs an icon, a heading, AND a paragraph

## Responsive Antipatterns

### The Stack

**The pattern:** Desktop is multi-column; mobile is everything stacked vertically in the same order.

**Why it's slop:** Mobile isn't just a narrower desktop. The content hierarchy should change.

**Better approach:**
- Reorder content for mobile context
- Hide or defer secondary content
- Change interaction patterns for touch
- Consider if all sections are even necessary on mobile

### The Squeeze

**The pattern:** Same layout, just narrower. Text shrinks. Margins shrink. Everything crams in.

**Why it's slop:** Content doesn't reflow; it just gets smaller.

**Better approach:**
- Redesign layouts for different breakpoints
- Change navigation patterns
- Adjust typography scale
- Prioritize mobile-critical content