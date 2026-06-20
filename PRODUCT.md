# Nagarik Watch, PRODUCT.md

> Source-of-truth product context for the impeccable design skill. Loaded before every
> design task alongside `DESIGN.md`. Keep this file honest; edit it when reality changes.

## Product Purpose

**Nagarik Watch** (नागरिक वाच) is a modern, web-only news portal for Nepal. It delivers
fast, credible, Devanagari-first journalism across politics, society, business, sports,
entertainment, world news, and a signature opinion/columns section. It exists to give
Nepali readers (at home and in the diaspora) a faster, cleaner, more trustworthy reading
experience than the incumbents, while keeping the news free to read.

The editorial model is **hybrid**: original reporting, curated/aggregated items with clear
attribution, and syndicated/wire content, all under a single editorial voice.

Revenue is **ad-supported** (programmatic + direct ad sales + sponsored/native content).
No reader paywall on day one.

**Register:** brand (the portal itself, homepage, section pages, article pages, long-form
content) with a product register only inside the editorial CMS/admin (see `DESIGN.md`).

## Users

### Primary: the Nepali news reader

- Reads on a **mid-range Android phone over mobile data**, mostly Nepali ISPs (Ncell, NTC),
  often on flaky 3G/4G. Performance and data cost are existential, not nice-to-have.
- Reads in **Devanagari (Nepali)** first; a meaningful minority want an English section.
- Scans the homepage fast, jumps into category pages, reads 1–3 articles per session.
- Comes in from **social shares (Facebook above all) and Google**, so article pages must
  win the first load, and headlines must be legible and shareable.
- Cares about trust: clear bylines, dates, source attribution, visible correction notices.

### Secondary: the diaspora reader

- On decent broadband in the Gulf, Malaysia, the US, UK, Australia. Wants to stay
  connected to home. Latency from origin matters less (CDN handles it) but reliability and
  freshness matter more.

### Tertiary: the journalist / editor (CMS users, product register)

- Authors, copy editors, section editors, a publisher/Chief Sub. They live in the CMS all
  day. They need speed, no friction on common actions, draft→review→publish flow,
  revisions, scheduling, and a media library that enforces alt text and image credits.

## Brand

### Positioning

A civic-minded, independent news portal that treats the **citizen (नागरिक)** as the
subject and the audience of news. The "Watch" in the name signals scrutiny: holding power
to account, watching out for the reader. The tone is **credible, direct, calm, and
respectful**, never sensationalist, never partisan-stenography, never clickbait.

### Personality (three words)

**Vigilant. Clear. Nepali.**

### Tone of voice

- **Devanagari-first** in all reader-facing copy. The English section reads as clean,
  plain Indian-subcontinent English, not American marketing English.
- Headlines are **factual and specific**, who, what, where, not teasing or withholding.
- Decks/subheads add context, never repeat the headline.
- Breaking-news labels are used **sparingly** and truthfully. "ब्रेकिङ" is reserved for
  events that are actually unfolding; we do not cry wolf.
- Corrections are visible, dated, and unembarrassed.
- Bylines and source attribution are always shown. Aggregated items credit the origin
  outlet with a link.

### What we sound like (do)

> "अर्थमन्त्रीले आगामी बजेटमा पूर्वाधारमा रकम बढाउने जनाए"

Factual subject–verb–object. Named actors. No filler, no hype.

### What we do not sound like (don't)

> "यस्तो भयो भने तपाईंलाई पनि असर गर्छ! जान्नुहोस्..."

Withholding, clickbait, emotional manipulation.

## Anti-references (what we are NOT, visually and editorially)

These are real outlets we have studied and explicitly do **not** want to copy the
weaknesses of:

- **Setopati, Ratopati** (inspiration sites): we admire the editorial breadth and the
  signature opinion/blog identity, and we aim to **match their depth**. We do **not** want
  their visual clutter, ad-density that hurts readability, or generic WordPress-y density.
  Our bar is a faster, cleaner, more typographically considered version of the same idea.
- **Ad-heavy tabloid density**: no auto-playing video, no full-screen interstitials, no
  popups that block reading, no ad between every paragraph.
- **Sensationalist vernacular news aesthetic**: no red-and-yellow alarmist color blocks,
  no all-caps shouting, no夸张 "BREAKING" everywhere.
- **Generic SaaS/landing-page aesthetic**: this is a news brand, not a startup homepage.
  No hero-metric counters, no gradient text, no glassmorphism, no identical feature-card
  grids. (These are impeccable absolute bans anyway.)
- **Partisan house-organ**: we are not a mouthpiece of any party. Visual neutrality of
  the chrome lets the journalism carry the voice.

## Strategic principles (ranked)

1. **Reader trust above all.** Bylines, dates, sources, corrections, clear labeling of
   sponsored content. Every shortcut that erodes trust is rejected, even if it lifts
   short-term engagement.
2. **Devanagari is first-class, not an afterthought.** Fonts, line-height, matra
   rendering, search, URL slugs, and SEO are all designed for Nepali first.
3. **Performance is a feature.** Mobile-first, aggressive performance budget
   (LCP < 2.5s on 4G, CLS < 0.1), lean pages. A news site that loads slowly loses the
   reader to a competitor before the first paint.
4. **Free to read, sustainable to run.** The ad stack must fund the newsroom without
   poisoning the reading experience. Ads are labeled, lazy-loaded, and viewable, never
   deceptive.
5. **Ownable and independent.** The product, code, CMS, content, and data are ours
   (self-hosted CMS, our repo, our DB). No vendor lock-in that could hold the newsroom
   hostage.
6. **Hybrid editorial is honest.** Original reporting is the brand's claim to authority;
   aggregated and wire content fill breadth and are always attributed. We never present
   others' work as our own.
7. **Designed to last.** Long-term, not launch-day. Clean architecture, ADRs, versioned
   spec, so a future team can inherit it.

## Success signals (what "good" looks like, detailed, testable targets live in SPEC.md)

- A reader on a mid-range Android over 4G can open any article and begin reading within
  ~2.5s, with no jarring layout shift.
- A journalist can take a tip from idea to published story (with hero image, byline,
  tags, SEO fields) in under 10 minutes inside the CMS.
- The homepage reads as unmistakably Nepali, unmistakably a news brand, and unmistakably
  not a clone of any incumbent.
- Sponsored content is, in a blind test, distinguishable from editorial by any reader.
- The site is registered with Nepal's Department of Information & Broadcasting and shows
  its registration number in the footer (legal norm for Nepali online news).

## Open product questions (to resolve over time)

- Do we add a Nepali-language **newsletter** digest in Phase 3, or wait for traction?
- Do we build a **mobile app** eventually, or is a strong PWA enough?
- At what traffic/revenue threshold do we reconsider a soft **membership** layer?
- Photojournalism vertical: standalone, or folded into a Photo Gallery content type?

## Non-goals (explicit, for this build)

- No native mobile apps in v1 (PWA is the day-one mobile story).
- No reader paywall or hard meter in v1.
- No user-generated content / open comments-without-moderation in v1 (comments, if any,
  ship pre-moderated or not at all, see `docs/editorial-workflow.md`).
- No print production tooling. The "ePaper" feature is a digital edition viewer, not a
  print-pagination system.
