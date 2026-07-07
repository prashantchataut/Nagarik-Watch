# Nagarik Watch production audit and implementation notes

Scope: uploaded codebase `nagarik-watch-v11-mobile-personalization.zip`, live site `https://nagarik-watch.vercel.app`, and a benchmark scan of Nepali news portals including Ratopati, Onlinekhabar, Setopati, Kantipur, Nagarik News, Annapurna Post, Nepal Press, PahiloPost, Bizmandu, NepalKhabar, Baahrakhari, Himalkhabar, Gorkhapatra, DeshSanchar and Ujyaalo.

## Executive judgement

The site is not yet worth a NPR 400k production handoff. It has good technical ambition, but the current product still feels like a capable prototype: seeded content, thin utility/account pages, unfinished ad monetisation, uneven Nepali copy, limited mobile language access, incomplete provider wiring and no real newsroom trust data. The biggest risk is not visual polish; it is credibility. A news portal fails fast when readers see placeholder language, generic civic claims, repeated sample stories, weak author/legal identity and ad boxes that do not behave like a real media business.

## 20 critical issues

1. **Seeded content reads generic.** Many headlines and decks sound plausible but not reported. They need actual bylines, location, source links, quotes and update trails.
2. **Homepage has weak editorial hierarchy.** The current page has many modules, but the lead story, live widgets, footer text and ad areas compete instead of building a newsroom rhythm.
3. **Footer appears too early in extracted DOM order.** The live text extraction shows footer/trust material before the main article list, which is poor for screen readers and search snippets.
4. **Ad system is only a placeholder.** Boxes exist, but there is no inventory model, placement taxonomy, media kit, impression/click tracking, sponsor separation or campaign lifecycle.
5. **AI-slop copy damages trust.** The flagged utility slogan, broad civic claims and “use your own judgement” disclaimers read generated rather than editorial.
6. **Utilities page lacked a service standard.** A news utility page must say which data is official, approximate, delayed or unavailable; otherwise weather/market tools create liability.
7. **Account/saved pages feel local-storage-only.** Reader accounts, bookmarks and history are partly browser-local. This is okay for prototype but not production account UX.
8. **Mobile language toggle was hidden on very small screens.** Bilingual sites need the language switcher visible without opening desktop-only controls.
9. **Hindi is not a toggle problem; it is a content model problem.** Adding Hindi means adding `hi` to locale types, routes, dictionaries, content availability flags, SEO alternates and editorial workflows.
10. **Narrator/audio was absent as a real reader control.** Speakable schema existed, but there was no user-visible listen/stop control on article pages.
11. **Live-data fallbacks can look real.** Provider fallbacks and mock data must be visually distinct and never mixed into an official market/weather presentation.
12. **Logo was serviceable but too generic.** Eye/mountain marks are common; the logo needed a cleaner watchfulness/reporting direction and production-safe SVG assets.
13. **Trust pages are copy-heavy but not evidence-heavy.** Team, ownership, corrections and ad policies need real legal registration, named editor, contact phone and corrections log.
14. **SEO alternates need a Hindi-ready plan.** Current bilingual routes are fine for Nepali/English, but Hindi later needs hreflang, sitemap and content gating.
15. **Category pages use weak empty states.** “Section is ready” style messages are launch-prototype language and should be replaced by honest no-content states.
16. **Province/district pages are taxonomy stubs.** They are useful architecture, but not production pages until mapped to real stories and indexed selectively.
17. **Homepage density is still below real Nepali portals.** Major portals use more latest rails, top story clusters, regional rails, trend tags, multimedia and ad placements.
18. **Search/account/history need measurable acceptance tests.** Functional means keyboard, empty state, persistence, permission denial, mobile and locale tests, not just components rendering.
19. **No clear editorial CMS acceptance path.** Publishing workflow exists in code, but the public site still needs a newsroom QA checklist for title, deck, source, correction, image credit and translation completeness.
20. **Build verification could not be completed in this sandbox.** The repository has no installed dependencies here, and TypeScript cannot resolve Next/workspace packages without install. A real handoff must run install, lint, typecheck, unit tests and production build in CI.

## Benchmark lessons from real Nepali portals

- Ratopati surfaces language editions, province menus, hot topics and “latest/popular/24-hour updates”. Nagarik Watch needs the same density and reader routing, but with cleaner spacing.
- Annapurna Post has submit article, Unicode, e-paper, multimedia and editorial sections. Nagarik Watch should add real submission and e-paper only when backed by workflows, not mock labels.
- Baahrakhari, Nagarik News and Gorkhapatra show how ad environments are normal in Nepali news: top banners, side rails and sponsored image placements. Nagarik Watch should reserve sizes and labels now, then plug a real ad manager.
- Onlinekhabar, Setopati, Kantipur and Nepal Press set a higher bar for article freshness, section segmentation and public trust. Nagarik Watch needs real daily editorial volume before launch.

## Implemented changes in this package

- Replaced the logo mark with a cleaner production SVG and regenerated `/icon.svg`, `/icon.png`, `/apple-icon.png` and `/opengraph-image.png`.
- Added a more realistic labelled advertisement environment via `AdSlot` and `AdStack`, including placement keys and reserved dimensions.
- Inserted ad placements into the homepage hero rail, homepage side rail and public hub pages.
- Rewrote the utility page headline and service-standard copy to remove “AI-slop” phrasing.
- Rewrote footer/about/meta/manifest/RSS copy to remove overbroad civic-trust claims and vague disclaimers.
- Made the mobile language toggle visible under the smallest breakpoint.
- Added a reader-visible narrator/listen button using the browser Speech Synthesis API.
- Added `data-narrator-body` to article bodies so the narrator reads article content, not the whole page chrome.
- Replaced weak empty-state language in category, province, district and empty-home states.
- Cleaned notification and recommendation copy to sound more like a product and less like generated marketing.

## Enhanced prompt for your AI agent

You are working on `Nagarik Watch`, a Nepali-first real news portal intended for production, not a demo. Treat this as a paid production audit and implementation pass. Be extremely critical. Inspect the full codebase, live deployment and visible UI. Benchmark against at least 15 real Nepali news portals: Ratopati, Onlinekhabar, Setopati, eKantipur, Nagarik News, Annapurna Post, Nepal Press, PahiloPost, Bizmandu, NepalKhabar, Baahrakhari, Himalkhabar, Gorkhapatra, DeshSanchar and Ujyaalo.

Work in this order:

1. Produce a severity-ranked list of at least 20 issues across UI, UX, editorial credibility, routing, SEO, ads, accounts, cookies/consent, performance, accessibility, i18n, dark/light mode, language toggle, narrator/audio, data providers, admin workflow and launch readiness.
2. Scan every reader-facing string and remove AI-generated filler, vague civic claims and placeholder launch copy. Replace it with direct Nepali/English newsroom language.
3. Make every visible feature either functional, clearly labelled as unavailable, or removed. Do not show fake data as real data.
4. Improve the advertisement environment like a real news portal: top leaderboard, mid-article rectangle, right rail, mobile banner, clear “Advertisement” labels, placement keys and no layout shift.
5. Improve utility, saved/account and public hub pages so they feel like real news product pages, not empty templates.
6. Fix dark/light mode and Nepali/English toggle across desktop and mobile. Do not add Hindi until locale routing, dictionaries, content fields, SEO alternates and editorial workflow support `hi`.
7. Add or repair narrator/listen controls on article pages using a progressive enhancement approach.
8. Regenerate the logo direction with an image model for visual exploration, then convert the final mark into clean production SVG/PNG assets. Never ship generated-image text.
9. Run lint, typecheck, tests and production build. If dependencies or environment block verification, state exactly what could not be run.
10. Deliver a changelog, the files changed and the remaining launch blockers.

Definition of done: the site must feel credible to Nepali readers, usable on mobile, clear about ads and sponsored content, honest about live data, accessible by keyboard/screen reader, SEO-safe, and free of obvious AI-slop copy.

## Remaining launch blockers

- Wire real CMS/editorial data and remove sample-like stories before public launch.
- Configure real ad network or direct campaign manager with impression/click tracking.
- Add legal publication data: owner, registration number, editor-in-chief, phone, address and corrections log.
- Run dependency install, lint, typecheck, tests and production build in a proper Node environment.
- Decide whether Hindi is truly in scope; if yes, add it as a full locale, not a superficial toggle.
