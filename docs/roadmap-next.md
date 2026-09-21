# What to build next

Written 2026-09-21, after the site-readiness pass. Ordered by what blocks the most
downstream work, not by effort. Each item says why it matters here specifically, so
you can drop the ones you disagree with without unpicking the rest.

## 0. The one thing that undercuts everything else

**There is no test that renders a React component.** 570 tests pass, and every one of
them exercises a pure function, a route handler or a library module. The client
components — the paywall meter, the comment thread, the search view, the reader
preference panel, the consent gate — have no coverage at all. This pass rewrote a lot
of their hydration logic; the gates that caught my mistakes were `tsc` and ESLint, not
tests.

`happy-dom` is already in the dependency tree. Adding `@testing-library/react` and
writing tests for the six or seven components that hold real state would change the
risk profile of every future change more than anything else on this list.

Start with the ones where a bug is silent rather than loud:

- `MeteredPaywall` — an off-by-one in the free-article count is invisible until a
  reader complains, and it directly affects revenue.
- `CookieConsent` — a regression here is a legal problem, not a UX problem.
- `SearchView` — the most stateful component in the app.

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

## 3. The R2 binding is documented but not declared

`saveR2MediaFile` expects a Workers `MEDIA_BUCKET` binding. `apps/web/wrangler.jsonc`
declares no `r2_buckets` entry, so on the Cloudflare path the function returns `null`
and uploads silently fall through to Vercel Blob or local disk. Either declare the
binding or delete the R2 path — the current state reads like a working feature.

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
  Wiring it would have caught the dialog and the focus indicators automatically.
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

- **No scheduled publishing.** Articles go live the moment an editor hits publish.
  A newsroom wants a 6am embargo.
- **No revision history.** `nw_articles` stores current state. If an editor overwrites a
  reporter's copy there is no way back, and for a fact-check desk the absence of an
  audit trail on the article body is a credibility risk. The `audit-log` covers actions,
  not content.
- **No corrections workflow.** The ethics page promises corrections; there is no UI for
  issuing one, and no structured `correction` field that could surface on the article
  and in the RSS feed.

That last one matters more than its size suggests. A Devanagari-first independent
outlet's main asset is trust, and a visible corrections policy that the software
actually implements is the cheapest trust you will ever buy.

## 8. Performance, once there is content

The perf budget passes at 66 chunks under 500 KiB, but it is measuring an empty site.
Re-measure with 500 published articles before drawing conclusions. Specific things that
will bite at volume:

- `sitemap.ts` builds every URL in one pass. Split it at 1,000 URLs.
- The search index is built client-side from the full corpus. That does not survive a
  real archive; move to a server-side endpoint with pagination.
- `trending-stories.ts` and `ranking-signals.ts` recompute per request. Cache them on
  the same revalidate cadence as the homepage.

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
