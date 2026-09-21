# What to build next

Written 2026-09-21, after the site-readiness pass. Revised 2026-09-22 — the items that
have since been done say so instead of being deleted, because "why is this no longer a
problem" is the question a reader of a roadmap actually has. Ordered by what blocks the
most downstream work, not by effort. Each item says why it matters here specifically, so
you can drop the ones you disagree with without unpicking the rest.

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
still declares no live `r2_buckets` entry. What changed is that it no longer *reads like
a working feature*: `wrangler.jsonc` carries the three enable steps in a comment above
the commented-out block, and `app/api/admin/media/upload/route.ts` returns 503 naming
the missing binding instead of falling through to local disk.

So this is a deployment step, not a code gap: create the bucket, uncomment the block,
redeploy. Leaving it off is a valid choice — Vercel Blob is the configured path — but
then `BLOB_READ_WRITE_TOKEN` has to be set, and today it is not.

## 4. Split `globals.css`

7,600 lines and 190 KB in one file. This pass had to add a separate stylesheet for the
reduced-motion rules rather than extend it. Nobody can hold that file in their head,
which is why the same patterns (focus rings, card chrome) are redefined at several
depths with slightly different values.

Suggested seams, roughly by surface: `base`, `public-chrome`, `admin`, `utilities`
(patro/calendar/market), `editorial`. Do it mechanically, one section at a time, with a
visual diff after each — no rewriting while you move.

## 5. Accessibility: finish what this pass started

Fixed here: reduced motion, two missing focus indicators, the media dialog's focus trap,
an admin skip link. Still open:

- **No axe run in CI.** `pnpm test:a11y` exists and is not in `.github/workflows/ci.yml`.
  Wiring it would have caught the dialog and the focus indicators automatically. This is
  a two-line change to the workflow file and has to be made by a human or a token with
  the `workflow` scope; agent pushes to `.github/workflows/**` are rejected.
- **Colour contrast is unverified.** The Civic Crimson palette against `--surface` and
  `--mute` text has never been measured. This is a Devanagari-first site, and Devanagari
  matras are thin strokes — contrast that passes for Latin can still be hard to read
  here. Measure it, and treat 4.5:1 as the floor for body text.
- **Touch targets.** Most controls use `min-h-11` (44px), but the ticker links, the
  calendar day cells and the tag chips do not.

## 6. Rate limiting is per-instance

`enforceRateLimit` holds counters in process memory. On Vercel that means each
serverless instance has its own budget, so the effective limit is your limit times the
number of warm instances. For comments and submissions on a news site that will be
abused, this needs a shared store — Postgres is already there, and a small table with a
sliding window is enough. No new infrastructure required.

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
- **`trending-stories.ts` does not exist**, and `lib/ranking-signals.ts` already caches
  engagement at `ENGAGEMENT_TTL_MS = 30_000`.

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
