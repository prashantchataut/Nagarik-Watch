# What to build next

Written 2026-09-21, after the site-readiness pass. Revised 2026-09-22 — the items that
have since been done say so instead of being deleted, because "why is this no longer a
problem" is the question a reader of a roadmap actually has. Ordered by what blocks the
most downstream work, not by effort. Each item says why it matters here specifically, so
you can drop the ones you disagree with without unpicking the rest.

This file is the **platform** axis — content authority, observability, workflow, debt.
The reader-facing axis is a separate list: [`roadmap-reader-first.md`](./roadmap-reader-first.md),
written 2026-09-22, covering the font payload, romanised search, offline UX and the
design-system work the new contrast and token gates make possible.

## 0. Component tests exist now — extend them

**Was:** no test rendered a React component. That is fixed for the four where a bug is
silent rather than loud: `PaywallNotice`, `CookieConsent`, `SearchView` and
`ArticleBody`.

The harness is deliberately small: `// @vitest-environment happy-dom` at the top of the
file plus `@/test/render`, which is ~30 lines over `react-dom/server` and a DOM parse.
There is no `@testing-library/react` and no jsdom, and adding either is a decision, not
a detail — the current setup renders the server output a reader receives, which for an
app that is mostly server components is the thing worth asserting.

Still uncovered, in rough order of how much state they hold:

- `UtilityTools` (14 `useState`) and `NepaliCalendar` — the BS/AD conversion is the
  kind of arithmetic that is wrong silently and for one month only.
- `ReaderArticleControls` and `NotificationCenter` — both write to `localStorage`, so a
  regression persists across reloads for the reader who hit it.
- `CommentSection` — the only reader-facing component that posts.

## 1. Content authority: finish the Payload cutover

`CONTENT_SOURCE` still defaults to the JSON/Postgres desk, and `wrangler.jsonc` pins
`CONTENT_SOURCE: "json"`. ADR-014 says Payload is canonical; the code carries both
paths, which means every content feature is written twice and tested once.

The cutover is the single largest simplification available. Until it happens:

- `payload-cutover.ts`, `payload-admin-client.ts` and the dual-write branches in the
  admin routes all stay live.
- Editors have two places to upload media and no rule about which wins.

Do it behind `NEXT_PUBLIC_LAUNCH_STATUS=preview` on a staging domain first, then delete
the JSON desk rather than leaving it as a fallback. A fallback nobody tests is not a
fallback.

## 2. Observability before traffic, not after

`SENTRY_DSN` is read by the launch gate but nothing is wired. Right now a 500 in a
route handler reaches `console.error` on a serverless instance and disappears.

Minimum viable: Sentry (or equivalent) on the web app, with the release tagged to the
commit SHA, plus an alert on the `/api/cron/*` handlers. Those crons are the only thing
keeping forex, NEPSE and the earthquake feed fresh — if one starts failing you will
find out from a reader noticing a stale number, which is the worst possible detection
channel for a news site.

## 3. R2 — no longer silent, still one command from working

`saveR2MediaFile` expects a Workers `MEDIA_BUCKET` binding and `apps/web/wrangler.jsonc`
still declares no live `r2_buckets` entry. What changed is that it no longer _reads like
a working feature_: `wrangler.jsonc` carries the three enable steps in a comment above
the commented-out block, and `app/api/admin/media/upload/route.ts` returns 503 naming
the missing binding instead of falling through to local disk.

So this is a deployment step, not a code gap: create the bucket, uncomment the block,
redeploy. Leaving it off is a valid choice — Vercel Blob is the configured path — but
then `BLOB_READ_WRITE_TOKEN` has to be set, and today it is not.

## 4. Split `globals.css` — done

**Was:** 8,010 lines in one file, which is why the same patterns (focus rings, card
chrome) were redefined at several depths with slightly different values.

It is now 37 lines of imports over 14 partials in `apps/web/app/styles/`, numbered
`01-base.css` … `14-sports.css`. **The numbering is the cascade**: the partials are
imported in the order the rules were in, so moving one moves the rule it overrides. Add
a new surface as a new file at the end rather than appending to an existing one.

The move was mechanical and is provably a no-op in two ways worth repeating if you ever
re-cut the seams:

- the concatenated partials reproduce the original byte for byte (the split script
  aborts otherwise), and
- a production build from the split file emits compiled CSS with **identical sha256** to
  a build from the monolith — `2035f32af895357a` and `94a4fc51dd2080a1` for the two
  chunks.

That is the bar for this kind of change: zero rendered difference, demonstrated rather
than eyeballed.

## 5. Accessibility: finish what this pass started

Fixed here: reduced motion, two missing focus indicators, the media dialog's focus trap,
an admin skip link. Still open:

- **No axe run in CI.** `pnpm test:a11y` exists and is not in `.github/workflows/ci.yml`.
  Wiring it would have caught the dialog and the focus indicators automatically. This is
  a two-line change to the workflow file and has to be made by a human or a token with
  the `workflow` scope; agent pushes to `.github/workflows/**` are rejected.
- ~~**Colour contrast is unverified.**~~ Measured, fixed and gated.
  `scripts/audit-contrast.mjs` resolves every token in `packages/ui/src/tokens.css` to
  sRGB (the palette is authored in oklch, so this does the conversion rather than
  trusting a comment) and checks 64 rendered pairs across both themes at WCAG 2.2 AA. It
  runs in `verify:static` and exits non-zero, which is the difference between an audit
  and a guarantee.

  Six pairs were below AA. Two mattered a great deal: the **dark-theme primary button**
  was `--paper` on `--brand-strong` at **2.37:1**, and `--rule-strong` — which draws
  input borders — was 2.21:1 in light and 2.10:1 in dark, so a low-vision reader
  hunting for a field edge could not see one.

  The button was a _role_ problem, not a value problem: `--brand` cannot be darkened
  because it is also the link colour on black, so the text on it has to flip. Hence two
  new tokens, `--on-brand` and `--on-accent`, and a rule that is now worth enforcing in
  review: **a component must never put `--paper` or `--ink` on a brand or gold fill.**
  Repointing 22 CSS rules and 34 JSX class strings at `--on-brand` fixed every filled
  control at once.

  The four theme blocks (`:root`, the `prefers-color-scheme` copy, and the two
  `[data-theme]` selectors) are now diffed for drift by the same script. `light-dark()`
  would collapse the duplication and was deliberately rejected: a browser that does not
  know the function drops the declaration entirely and the site renders unstyled, which
  is not a trade worth making for an audience on older Android WebViews.

- **Tailwind fails silently, so that now fails the build too.** A utility naming a token
  that does not exist emits no CSS at all and the element just inherits. Three were live
  in the tree — `text-body-sm` (×3) and `text-display-sm`, both undefined type steps,
  and `border-rule-strong` (×2), where the token existed in `tokens.css` but was never
  exposed in the preset, so the hover affordance on the province tabs simply did not
  appear. `scripts/audit-design-tokens.mjs` now checks all 757 files against the 29
  colour and 11 type tokens the system actually defines.
- ~~**Touch targets.**~~ Ticker links and tag chips are fixed — the ticker links carry
  `min-h-6` (the 24px floor of SC 2.5.8) with the strip's own `mx-4` supplying the
  spacing exception, and the tag links became `min-h-8` chips, because they sit in a nav
  rather than a sentence and so the inline exemption never applied to them. The calendar
  day cells were already at `min-height: 4.25rem`; that sub-item was stale when written.
- **No screen-reader or keyboard pass has been done.** Automated checks catch the
  mechanical third of WCAG. The honest claim today is "the token layer is AA-verified",
  not "the site is accessible". One real defect of this kind was found and fixed by
  hand — the breaking ticker duplicates its list so the marquee has no gap when it
  wraps, and that duplicate was being announced and tabbed through a second time — which
  is exactly the class of bug no colour audit will ever surface.

## 6. Rate limiting is shared now — the gap that remains is a different one

**Was:** "counters in process memory, so the effective limit is your limit times the
number of warm instances." That is no longer true. `lib/rate-limit.ts` runs a token
bucket in `nw_rate_limits` in Postgres, refilled continuously rather than as a fixed
window (which would let 2× through at a boundary), and in production it **fails closed**
— if the store is unreachable the limiter throws rather than falling back to the
per-instance map.

What a shared limiter still cannot do is see an attack that is _spread_ rather than
fast. That is what `lib/security/credential-stuffing.ts` and `nw_auth_attempts` were
added for: one attempt each against forty accounts stays under every per-key limit by
design. It is wired into `app/api/auth/[...all]/route.ts` and reported on the launch
desk. The same shape of blind spot still exists for comments and submissions — one post
each from a thousand addresses — and the ledger is the pattern to copy when it matters.

## 7. Editorial workflow gaps worth closing

- ~~**No scheduled publishing.**~~ Done, and it was already done when this was written.
  `lib/editorial/scheduled-publish.ts` promotes `workflowStage=scheduled` rows whose
  `publishedAt` has passed, `app/api/cron/scheduled-publish/route.ts` runs it every five
  minutes off `CRON_SECRET`, and it is idempotent. The 6am embargo works.
- **Revision history exists only on the Payload path.** `apps/admin` declares
  `versions.drafts` on the Articles collection, so Payload keeps the audit trail. The
  JSON desk stores current state and nothing else, and it is still the default. This is
  a second reason to finish §1: for a fact-check desk, the absence of an audit trail on
  the article body is a credibility risk, and right now which path you are on decides
  whether you have one.
- **Corrections are half-built.** `Correction` is a real type in `packages/db`, the
  article page renders `CorrectionNotice`, and an editor still has no way to issue one —
  nothing writes `corrections[]`, and the RSS feed does not carry it.

That last one matters more than its size suggests. A Devanagari-first independent
outlet's main asset is trust, and a visible corrections policy that the software
actually implements is the cheapest trust you will ever buy.

## 8. Performance, once there is content

The perf budget passes at 66 chunks under 500 KiB, but it is measuring an empty site.
Re-measure with 500 published articles before drawing conclusions.

The three specific items that were listed here are done, and the way each was wrong is
worth keeping:

- **The sitemap was not slow, it was lying.** `sitemap.ts` read `perPage: 1000` and
  emitted whatever came back, so story 1,001 onwards simply stopped being advertised —
  no error, no failing build. Articles now live in `/archive-sitemap.xml`, an index over
  20,000-URL shards sorted newest-first, and `/sitemap.xml` carries structure only.
- **Search is already server-side.** `app/api/search/route.ts` calls
  `searchStoriesRanked` in `lib/search-server.ts`, rate-limited, with the index built on
  the server. Nothing ships the corpus to the browser.
- **Both ranking passes are cached at the source.** `lib/content/trending-stories.ts`
  (not `lib/`, which is where this bullet looked for it) recomputes per request, but the
  query under it does not: `getTrendingSamples` caches at `TRENDING_SAMPLE_TTL_MS =
30_000` and collapses concurrent callers onto one query. `lib/ranking-signals.ts`
  caches the engagement index at `ENGAGEMENT_TTL_MS = 30_000`. The ranking arithmetic
  runs per request and costs microseconds; the database round-trip is what was worth
  caching, and it is.

What is still unmeasured at volume: the admin SEO page rebuilds the related-story graph
for its PageRank pass, which is O(n²) in the window. It is capped at 120 stories for
that reason. If you want it over the whole archive, it needs the edges persisted rather
than recomputed.

## 9. Housekeeping

- `packages/*` have no `lint` script; they are covered only by the root `eslint .`.
  If someone adds a workspace-level config later, the root run will silently stop
  covering them.
- `apps/web/tailwind.config.ts` emits `MODULE_TYPELESS_PACKAGE_JSON` on every build.
- `apps/admin` is pinned to Next 15 by Payload 3.85.1. Track Payload's Next 16 support
  so the two apps can share a major version again.
- `CHANGES.md` still describes the Prisma/SQLite architecture. It reads as a changelog,
  so it is not urgent, but a note at the top pointing at the current architecture would
  stop it misleading newcomers the way `LAUNCH-GUIDE.md` did.
