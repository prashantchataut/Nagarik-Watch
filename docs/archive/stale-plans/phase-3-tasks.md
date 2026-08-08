# Phase 3, Signature news features (full parity)

> Goal: reach Ratopati/Setopati feature parity. Add ePaper, photo galleries, video
> stories, live blog, web push for breaking, newsletter, and a strong PWA (installable +
> offline reading). These are the features that distinguish a _newspaper website_ from a
> _blog_.
>
> Governed by planning-and-task-breakdown: vertical slices, S/M tasks (≤5 files),
> acceptance + verification, checkpoints. Each feature is a vertical slice: content type
> → CMS UI → web route → SEO/perf/a11y.

## Overview

Each signature feature is independent and can be prioritized/reordered by editorial need.
Recommended order: PWA + push first (they amplify everything), then galleries/video,
then ePaper, then live blog (the most complex), then newsletter.

## Architecture decisions active this phase

- ADR-002/003/005. Realtime transport for live blog is an open architecture item
  (architecture.md §9), decided in Task 3.8., -

## Task list

### Task 3.1: PWA, manifest, service worker, installability

**Description:** add a web manifest, app icons, a service worker (via `next-pwa` or
`serwist`) caching the shell + recent articles for offline reading, and install
affordances.

- **Acceptance:**
  - [ ] Lighthouse PWA installable; "Add to home screen" works on Android.
  - [ ] A visited article is readable offline; the shell loads offline.
  - [ ] Service worker updates safely (no stale-brick versioning).
- **Verify:** Lighthouse PWA audit; airplane-mode read of a recently visited article.
- **Dependencies:** Phase 1.
- **Files:** `apps/web/public/manifest.webmanifest`, `apps/web/app/sw.ts`, icons.
- **Size:** M.

### Task 3.2: Web push (breaking news), Phase 2 stub made real

**Description:** wire OneSignal or self-hosted FCM; readers opt in via a clear prompt;
publishing a breaking item (Phase 2 stub) now sends a push, subject to the rate cap.

- **Acceptance:**
  - [ ] Reader opts in; a test breaking publish delivers a push.
  - [ ] Rate cap (≤3/hour, ≤10/day) enforced; over-cap suppresses + notes to editor.
  - [ ] Unsubscribe honored everywhere.
- **Verify:** opt in on two devices; publish breaking; receive push; unsubscribe.
- **Dependencies:** 2.11.
- **Files:** `apps/web/app/api/push/*`, `packages/ingest/src/push.ts` or `apps/admin/src/services/push.ts`, prompt component.
- **Size:** M.

### Task 3.3: Photo Gallery content type + viewer

**Description:** add `Gallery` (content-model.md §9) with a keyboard-accessible viewer
(lightbox), arrows/escape, focus trap, caption per image.

- **Acceptance:**
  - [ ] Galleries embeddable in article body and viewable standalone.
  - [ ] Viewer is fully keyboard-operable; screen-reader announces image + caption.
  - [ ] No layout shift; images lazy-loaded.
- **Verify:** a11y suite on the viewer; keyboard walkthrough.
- **Dependencies:** Phase 2 media library.
- **Files:** `apps/admin/src/collections/Galleries.ts`, body block, `apps/web/components/gallery-viewer.tsx`.
- **Size:** M.

### Task 3.4: Video content type + embed

**Description:** add `Video` (content-model.md §9) supporting self-hosted (R2) and
YouTube/Facebook providers, with poster images and lazy-loaded playback (no autoplay).

- **Acceptance:**
  - [ ] Videos embed in articles and have standalone pages.
  - [ ] No autoplay; poster shown until play; CLS-safe reserved box.
  - [ ] External provider embeds load only on click (privacy + perf).
- **Verify:** Lighthouse CLS unaffected; click-to-play works for external embeds.
- **Dependencies:** 3.3.
- **Files:** `apps/admin/src/collections/Videos.ts`, body block, `apps/web/components/video-embed.tsx`.
- **Size:** M.

### Task 3.5: ePaper edition viewer

**Description:** add `EpaperEdition` (content-model.md §9) with a date-keyed archive,
page navigation, and a reader-friendly PDF/page viewer.

- **Acceptance:**
  - [ ] Latest edition on `/epaper`; archive browsable by date.
  - [ ] Pages render crisply on mobile; download/share supported.
  - [ ] SEO: an ePaper landing page that's indexable; individual page images not.
- **Verify:** open latest edition on mobile; navigate pages; download.
- **Dependencies:** Phase 2 media library.
- **Files:** `apps/admin/src/collections/Epaper.ts`, `apps/web/app/[locale]/epaper/**`, viewer component.
- **Size:** M.

### Task 3.6: Live blog content type + feed

**Description:** add `LiveBlog` (content-model.md §9) with status live/paused/ended,
timestamped entries (newest first), highlight pinning, and a realtime feed.

- **Acceptance:**
  - [ ] Editors add entries in the CMS; they appear on the site in near-real-time.
  - [ ] Pinned/highlighted entries surface at the top.
  - [ ] Status transitions (live→ended) reflected; ended blogs freeze and show a summary.
- **Verify:** add entries during a test event; confirm appearance + ordering.
- **Dependencies:** 3.4.
- **Files:** `apps/admin/src/collections/LiveBlogs.ts`, body block, `apps/web/components/live-blog-feed.tsx`.
- **Size:** M.

### Task 3.7: Realtime transport for live blog (architecture decision)

**Description:** decide and implement the live-blog update transport: SSE vs WebSocket vs
short polling. Document the decision as ADR-007.

- **Acceptance:**
  - [ ] ADR-007 written with trade-offs.
  - [ ] Chosen transport delivers updates with p95 < 5s under normal load.
  - [ ] Degrades gracefully (polling fallback) if the realtime channel fails.
- **Verify:** load the live blog on multiple clients; post an entry; measure latency.
- **Dependencies:** 3.6.
- **Files:** `apps/web/app/api/live/**`, ADR-007.
- **Size:** M.

### Task 3.8: Newsletter signup + send

**Description:** newsletter signup component (inline, no modal) capturing consent;
integration with Listmonk (self-host) or Buttondown; a daily/weekly Nepali digest.

- **Acceptance:**
  - [ ] Signups captured with double opt-in and clear consent.
  - [ ] Editors can compose a digest; send on schedule.
  - [ ] Unsubscribe works and is immediate.
- **Verify:** sign up; receive confirmation + a digest; unsubscribe.
- **Dependencies:** 3.1 (PWA/engagement baseline).
- **Files:** `apps/web/components/newsletter-signup.tsx`, `apps/web/app/api/newsletter/*`, provider integration.
- **Size:** M.

### Task 3.9: Most-read / trending widgets

**Description:** a most-read widget (from Plausible/GA4 stats, cached) and a trending rail,
clearly labeled, no clickbait ordering tricks.

- **Acceptance:**
  - [ ] Most-read reflects real reader behavior; refreshed on a sensible cadence.
  - [ ] Renders as a tasteful rail, not a clickbait Taboola-style widget.
- **Verify:** drive some reads; confirm widget updates on next refresh.
- **Dependencies:** Phase 1 analytics.
- **Files:** `apps/web/components/most-read.tsx`, stats-fetching lib with cache.
- **Size:** S.

### Task 3.10: Dark mode toggle + reduced-motion polish

**Description:** ship the dark-mode tokens (DESIGN.md §12) behind a user toggle with
system-preference default, and audit all motion under `prefers-reduced-motion`.

- **Acceptance:**
  - [ ] Toggle persists; system preference respected; no flash of wrong theme.
  - [ ] Reduced-motion disables all non-essential motion site-wide.
- **Verify:** toggle in various `prefers-color-scheme`/`prefers-reduced-motion` states.
- **Dependencies:** Phase 0 tokens.
- **Files:** `packages/ui/src/theme.ts`, `apps/web/components/theme-toggle.tsx`, globals.
- **Size:** S., -

## Checkpoint: Phase 3 → Phase 4 gate

- [ ] PWA installable + offline reading works.
- [ ] Breaking news pushes deliver within the rate cap.
- [ ] Galleries, video, ePaper, live blog all functional and accessible.
- [ ] Newsletter operational with double opt-in.
- [ ] Realtime transport decision recorded in ADR-007.
- [ ] Editorial review of each signature feature in both locales.

## Risks this phase surfaces

| Risk | Mitigation |
|, -|, -|
| Live blog realtime is operationally heavy for solo dev | Prefer SSE or polling over WebSocket; revisit only if needed |
| Video self-hosting bandwidth cost | Default to YouTube/Facebook embeds; self-host only marquee video |
| Push opt-ins low | Make the prompt contextual (after reading a breaking story), not on first load |
| ePaper PDFs heavy on mobile | Serve per-page images, not the full PDF; lazy-load pages |
