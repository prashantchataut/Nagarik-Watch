# Nagarik Watch — Site Readiness Roadmap

**Written:** 2026-09-25 · **Against:** `main` @ `d2d8647` · **Branch:** `agent/deepseek/site-readiness-2026-09-25`

**Model disclosure (policy):** this branch was authored by an AI agent running the
**DeepSeek** model inside the DeepSeek Harness runtime. Every measurement below was
taken on that machine, in this repository, on the date above.

This document is the successor to [`LAUNCH-ROADMAP.md`](./LAUNCH-ROADMAP.md)
(2026-09-23). That one mapped the distance between the repository and a live
publication. This one does three things it did not:

1. Records what **this pass changed**, with the measurement that motivated each change.
2. Separates "the engineering can be signed off today" from "the publication exists",
   because those are two different claims and only one of them is about code.
3. Names the remaining items with an owner, an exit criterion, and the command that
   proves it — so the next pass can be checked rather than believed.

Where a number appears, it was produced by a command in this repository on
2026-09-25 and the command is quoted next to it. Where something is blocked on a
credential or a human decision, it says so.

---

## 0. The honest summary

**The code was in good shape and is now in better shape. The publication still does
not exist.**

The previous pass left a repository whose gates passed but whose pipeline had been
red for 25 pushes. That pipeline is fixed. What was left was a set of real defects
that passed every existing gate because **no gate looked at the rendered page**, plus
a handful of structural problems that had been recorded and deferred.

This pass closes the measurement gap and fixes what it found:

| #   | What was wrong                                                                                            | Evidence                                                                                            | Now                                                                 |
| --- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | Unknown article and desk URLs answered **200**, not 404                                                   | `curl -o /dev/null -w '%{http_code}' /politics/no-such-slug` → `200`                                | `404`                                                               |
| 2   | The default e2e suite was **red on `main`**                                                               | `npx playwright test` → `68 failed, 78 passed`                                                      | `0 failed, 78 passed, 6 skipped`                                    |
| 3   | 34 desks could not be reached by the role that owns them                                                  | `photo_video_editor` was redirected away from `/admin/media`, which `MEDIA_MANAGER_ROLES` grants it | reachable, with a link in the journalist desk                       |
| 4   | `/admin/articles` had **no role rule**, so every staff role could read unpublished drafts through the API | `adminPathOutcome('viewer', '/admin/articles')` → `allow`                                           | `deny` for ops roles                                                |
| 5   | A single malformed body block **took down the article page** — and the 200 hid it                         | `stripInline(undefined)` → `TypeError` inside `ArticlePage`                                         | degrades to "no FAQ schema"                                         |
| 6   | ~33 modules held **per-layer** caches and write queues where the process needed one                       | two write queues on one JSON file are two locks, i.e. no lock                                       | all but one moved to `processState`; a test now forbids regressions |
| 7   | Devanagari kickers were being **letter-spaced** — the thing DESIGN.md §3 forbids first                    | rendered audit: `.editorial-kicker` at `1.792px` on "पाठक संवाद"                                    | `0` violations, enforced at the cascade                             |
| 8   | Touch targets below the WCAG 2.2 minimum on every page                                                    | 233 rendered instances, measured with the 2.5.8 spacing exception applied correctly                 | `0`                                                                 |
| 9   | No gate read the **rendered** page at all                                                                 | —                                                                                                   | `pnpm audit:live-ux`                                                |

Everything in that table is verified in §2. Nothing in it required a credential.

---

## 1. Verification ledger

Run on 2026-09-25, in this workspace, on the branch named at the top.

| Gate                  | Command                                                   | Result                                                                                                                                  |
| --------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Format                | `pnpm format:check`                                       | passed                                                                                                                                  |
| Lint                  | `pnpm lint`                                               | 2/2 turbo tasks, 0 errors                                                                                                               |
| Types                 | `pnpm typecheck`                                          | 8/8 projects                                                                                                                            |
| Unit + integration    | `pnpm test`                                               | **953 passed**, 0 failed — web 797/120 files, db 138/12, ui 4, ingest 9, infra 5                                                        |
| Reader e2e            | `npx playwright test`                                     | **78 passed, 6 skipped, 0 failed** (was 68 failed)                                                                                      |
| Admin e2e             | `npx playwright test --config=playwright.admin.config.ts` | **34 passed**                                                                                                                           |
| Static product audits | `pnpm verify:static`                                      | passed (9 audits + launch gate in preview mode)                                                                                         |
| Web build             | `pnpm --filter @nagarikwatch/web build`                   | passed                                                                                                                                  |
| Admin build           | `pnpm --filter @nagarikwatch/admin build`                 | passed                                                                                                                                  |
| Rendered UX/a11y      | `pnpm audit:live-ux --base <origin>`                      | **0** overflow, contrast, tap-target, alt, unnamed-control, duplicate-id and Devanagari-tracking findings across 9 routes × 4 viewports |

Two of those numbers are new capability rather than new code, and they are worth
being precise about:

- `pnpm audit:live-ux` is a **new** gate. It drives a real browser against a running
  build and measures what the reader's browser actually laid out. It is deliberately
  _not_ in `verify:static`, because `verify:static` must run before `pnpm install` in
  a clean checkout and this one needs a browser and a server. Run it in CI as a
  separate job against the deployed preview, or locally with
  `pnpm --filter @nagarikwatch/web build && pnpm --filter @nagarikwatch/web start`.
- `953` unit tests is up from `793` web + `156` others, and the increase is almost
  entirely the three structural guards added in §2.6, §2.4 and §2.3. Those tests do
  not test behaviour; they test that a class of mistake cannot be reintroduced
  silently.

---

## 2. What changed, and why

### 2.1 Unknown URLs now answer 404 (blocks Google News submission)

`LAUNCH-ROADMAP.md` §5.0 recorded this as the one item blocking Phase 5.2, and
recommended "option B" — restructure the two content route families so the existence
check runs before the HTTP status is committed — while declining to do it because it
"changes the perceived-performance characteristics of the two highest-traffic route
families".

Measured before, on a production build of `main`:

```
/politics/no-such-slug   200     ← an unknown article slug reached the App Router
/not-a-real-route-xyz    404     ← the proxy rejects this shape itself
/en/ne                   404
```

Measured after:

```
/politics/nope           404
/author/nobody           404
/topic/nobody            404
/photos/nope             404
/latest/nope             404
/district/nope           200     ← by design: a district hub with no stories is a real page
/tag/nope                308     ← a redirect, not a soft 404
```

**Cause.** A segment-level `loading.tsx` wraps its subtree in a Suspense boundary.
The fallback flushes as soon as the layout resolves, and the status is committed with
that first flush — before `notFound()` in the page body ever runs. This is documented
Next.js behaviour, not a repo bug. `export const dynamic = 'force-dynamic'` does not
change it.

**Fix.** Five route-level `loading.tsx` files were removed:
`app/[locale]/loading.tsx`, `[category]/loading.tsx`, `[category]/[slug]/loading.tsx`,
`author/[slug]/loading.tsx`, `topic/[slug]/loading.tsx`. Every one of them sat above a
page whose body calls `notFound()`, which is exactly the condition that makes the
boundary wrong.

**The cost, measured rather than assumed.** `/` renders in 369 ms cold on this
machine, and every other measured route is 15–65 ms. The locale-level boundary was
providing a skeleton during that window. The trade is: a skeleton flash on the home
page in exchange for correct status codes on five route families. That is the right
way round — a wrong 200 is permanent and invisible, a 370 ms hold is neither — but it
is a product call, and it is reversible per route.

**If the newsroom wants the home skeleton back**, the pattern is a route group, which
does not change the URL:

```
apps/web/app/[locale]/(home)/page.tsx
apps/web/app/[locale]/(home)/loading.tsx      ← boundary scoped to this route only
```

That was not done in this branch because two `verify:static` scripts
(`scripts/verify-recovery.mjs`, `scripts/audit-ui-bans.mjs`) hardcode the path
`apps/web/app/[locale]/page.tsx`, and a move that silently weakens two gates is a
worse trade than the one above.

### 2.2 The default e2e suite was red, and had been

`npx playwright test` on `main` reported **68 failed / 78 passed**. Every failure was
`e2e/admin-desk.spec.ts`, and every one failed at sign-in:

```
{"error":{"code":"AUTH_UNAVAILABLE","message":"Authentication is temporarily
unavailable. The account database could not be reached — check DATABASE_URL …"}}
```

That is not a code defect. `playwright.config.ts` sets `E2E_TEST=true` without
`E2E_NEWSROOM`, which is precisely the combination that makes `lib/auth/session.ts`
return a null session and `lib/auth/auth-pool.ts` refuse a pool. `admin-desk.spec.ts`
signs staff in, so it can only run under `playwright.admin.config.ts`, which
provisions PGlite and seeds the accounts.

The spec was missing from the default config's `testIgnore`, where
`newsroom-lifecycle.spec.ts` already sat for the same reason. One line, and the
default suite is green: `78 passed, 6 skipped, 0 failed`. The admin suite still
passes on its own runner: `34 passed`.

This is the concrete content of roadmap item 7.6 ("restore e2e + a11y suites to green
in CI"), which could not be completed earlier because the suites were failing at
`Install`, not on their own merits.

### 2.3 A photo/video editor could not reach the media library

Roadmap item 7.9, now fixed. `MEDIA_MANAGER_ROLES` contains `photo_video_editor`, but
`photo_video_editor` is also in `JOURNALIST_DESK_ROLES`, and `adminPathOutcome`
returned `'journalist-desk'` for _every_ `/admin/*` path before it consulted any rule.
So the media sidebar entry for that role was dead code and the grant was unreachable.

`ADMIN_BASE_ROLES` was deliberately **not** widened to fix this: an unlisted prefix
defaults to _allowed_, so adding the role there would have handed a photo editor every
unrestricted desk in the console. Instead there is now an explicit, narrow list:

```ts
JOURNALIST_DESK_EXTRA_GRANTS = [{ prefix: '/admin/media', roles: { 'photo_video_editor' } }]
```

and the journalist desk renders a **मिडिया लाइब्रेरी / Media library** link for the
roles that hold the grant — a permission nobody can see is not a feature.

### 2.4 `/admin/articles` was the only desk with no role rule

The desk holding every unpublished draft — bodies, editor pitches, source notes — was
the one prefix in `ADMIN_PATH_ROLE_RULES` with no entry, so it inherited the
fail-open fallback and was open to the whole of `ADMIN_BASE_ROLES`: `viewer`,
`moderator`, `ad_manager`, `analyst`.

The admin sidebar already hides the Articles entry from exactly those roles (it keys
on the `'ops'` desk variant), so this change removes no link anyone can see. It closes
the URL, and `GET /api/admin/articles/[id]` behind it — that handler authenticated the
caller and then returned the whole stored record without ever asking whether the role
was allowed to read a draft.

`ARTICLE_DESK_ROLES = EDITOR_ROLES ∪ {copy_editor, fact_checker}` — the second pair
because both can create and submit copy and their desk variant renders the Articles
entry.

**This is a deliberate authorization change and it is reversible in one line** if the
product wants viewers to read drafts. It is called out here so that it is a decision
someone made rather than a diff someone skimmed.

### 2.5 One malformed block could take down an article page

Removing the loading boundary in §2.1 turned a **silently masked** failure into a
visible one, which is how it was found:

```
TypeError: Cannot read properties of undefined (reading 'replace')
  at stripInline (lib/seo/structured-content.ts:51)
  at sections (lib/seo/structured-content.ts:64)
  at extractFaqPairs (lib/seo/structured-content.ts:94)
  at ArticlePage (app/[locale]/[category]/[slug]/page.tsx:207)
```

`stripInline` is fed by `HeadingBlock.text` / `ParagraphBlock.text`, which the type
declares as required. A _stored row_ is not type-checked: a legacy record, a
half-migrated CMS document or a hand-edited JSON store can carry a block without one.
Before the guard, that threw during render; because the status had already been
committed by the loading boundary, the reader got the error UI **with a 200**, and
neither a status check, a monitor nor a crawler could see it.

`stripInline` now returns `''` for a non-string. Structured data is a decoration and
must not be able to take down the page it decorates. Two tests pin it.

> This is the strongest argument for §2.1 that exists: the boundary was not merely
> producing wrong status codes, it was **hiding render failures behind them**.

### 2.6 Module scope is not process scope — 33 modules swept

`LAUNCH-ROADMAP.md` §7.0 recorded this bug class after it caused four separate
newsroom failures, and item 7.7 recorded ~40 remaining instances as "worth a sweep
before launch; not a blocker".

Swept. Every module-scope cache, write queue and `schemaReady` promise under
`apps/web/lib` now lives in `processState()`, which keys off `globalThis` — the only
scope the RSC graph and the route-handler graph share. 33 modules: the engagement
stores, the local JSON fallbacks, the content-source cache, the search index, the
taxonomy catalog, the media list, the calendar provider, the auth instance, the boot
provisioning guard, the live-data caches.

The one that matters most is the write queues. Two queues guarding one JSON file are
two locks, which is no lock: a concurrent read-modify-write interleaves and silently
drops one of the writes. The second is the `schemaReady` promises, where two layers
running the same DDL is how a `CREATE TABLE IF NOT EXISTS` and the `SELECT` two lines
after it ended up disagreeing about whether the table existed.

`lib/reader/matrix-factorization.ts` is deliberately **not** converted and is
allowlisted with a reason: it is reachable from a client component
(`components/reader/RecommendedForYou.tsx` → `personalize.ts`), so it runs in the
browser bundle too and cannot import the server-only registry. The build catches this
— it did, on the first attempt.

`lib/runtime/process-scope.test.ts` now fails if any file under `lib/` declares
top-level `let`/`var` without being on that allowlist. The next module has to be added
on purpose.

### 2.7 Devanagari letter-spacing, enforced where it can actually be checked

DESIGN.md §3 forbids letter-spacing outright and gives the reason rather than a
preference: Devanagari conjuncts and matras need zero inter-glyph spacing to render
correctly. The rule was honoured element by element — `.category-pill` had its own
`[lang='ne']` override, React components gated tracking utilities on `locale === 'en'`
— and the ones nobody remembered stayed wrong.

`pnpm audit:live-ux` found them because it asks the browser, which knows the language
a kicker actually rendered in:

```
letter-spacing 1.792px on <p class="editorial-kicker"> "पाठक संवाद"
letter-spacing 0.6528px on <span class="article-tools-bar__label"> "अक्षर आकार"
```

Neither is visible to a source-level gate: the class name says nothing about the
language. Two more were fixed by hand where the tracking sat on a React component with
a Nepali branch (`DeskHoldingPage`, `HomeSportsLive`).

The systemic fix is one unlayered rule, imported last so it outranks the rules it
corrects:

```css
:lang(ne) {
  letter-spacing: normal;
}
```

Latin islands inside a Nepali page keep their tracking — the `NAGARIK WATCH` eyebrow
still measures `0.96px`, and English display type keeps its negative tracking, because
DESIGN.md's objection is specifically to Devanagari and to spaced-out wordmarks. The
same pass raised four kickers from 10.9–11.2px to the 12px floor the design contract
sets.

Rendered violations: **8 → 0**.

### 2.8 Touch targets below the WCAG 2.2 minimum

`pnpm audit:live-ux` applies SC 2.5.8 the way the specification actually reads,
including the **spacing exception** — an undersized target conforms when a
24px-diameter circle centred on it does not intersect another target. Applying the
exception correctly is what separates a real finding from a headline link in a list
whose rows are 70px apart; without it the number was 233 and most of it was noise.

After the exception: **4 real findings**, all the same shape — a byline link 18px tall
in a meta row whose neighbours crowd it. Fixed by giving the link a 24px minimum
height. Footer and "see all" links below the minimum were raised the same way.

Rendered findings: **233 raw → 4 real → 0**.

### 2.9 The new gate itself

`scripts/audit-live-ux.mjs`, wired as `pnpm audit:live-ux`. It drives Chromium via the
repo's existing `@playwright/test` dependency, against 9 routes × 4 viewports, and
reports:

- **horizontal overflow** — `document.scrollWidth` beyond the viewport, with the
  offending elements named
- **text contrast** — every text node's colour against its _effective_ background,
  computed by resolving both through a canvas. This matters here: the palette is
  authored in `oklch`, and the browser hands `lab()`/`oklab()` back verbatim from
  `getComputedStyle`. A regex over `rgb()` silently reports a false `1.02:1` on a brand
  button — which is exactly what the first version of this script did.
- **tap targets** — with both the inline exception and the spacing exception
- **Devanagari letter-spacing** — the DESIGN.md §3 rule, measured
- **structure** — heading order, `h1` count, landmarks, images without `alt`, controls
  with no accessible name, duplicate ids
- **weight** — DOM nodes, resource count, transfer size, blocking CSS, script count

It exits `0` with a `skipped` notice when no browser is available, so it can sit in a
pipeline that has none. `--strict` turns any finding into a non-zero exit.
`--json out.json` writes the full per-route report for a diff between two revisions.

**This is the durable part of the pass.** The other eight items are fixed defects; this
is the instrument that finds the next eight.

---

## 3. What is left, in the order it has to happen

Nothing below was attempted in this branch, because each one needs a credential, a
human decision, or a running production origin. Each has an owner and a command.

### Phase 0 — Pipeline (two operator items, unchanged from the previous roadmap)

| #   | Item                                                               | Owner      | Proof                              |
| --- | ------------------------------------------------------------------ | ---------- | ---------------------------------- |
| 0.1 | Apply `docs/pending/workflow-fixes.patch` — needs `workflow` scope | maintainer | `git push` produces a green CI run |
| 0.2 | Set `CRON_BASE_URL` to the real deployed origin                    | repo admin | the ops-cron workflow succeeds     |

### Phase 1 — Infrastructure (nothing below validates until the site is serving)

| #   | Item                                                                                                                                                                                                                                                                                                          | Why it blocks                                                                                                                                    | Owner      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| 1.1 | **Decide the canonical platform** (Vercel vs Cloudflare). The apex still serves the literal default Worker script `Hello world`. Either way, **delete the root `wrangler.jsonc`** — two configs claim the same Worker name and the root one points at `apps/web/out`, a directory this app can never produce. | Every canonical URL, OG tag, sitemap entry and JSON-LD `@id` is built from `NEXT_PUBLIC_SITE_URL`. Publishing on a wrong host poisons the index. | maintainer |
| 1.2 | Provision Postgres (the Aiven host in the current `DATABASE_URL` no longer resolves)                                                                                                                                                                                                                          | Auth, comments, bookmarks, reading history, polls and engagement are Postgres-backed                                                             | maintainer |
| 1.3 | `pnpm db:push`, then `pnpm migrate:ops`                                                                                                                                                                                                                                                                       | Creates the auth and ops tables                                                                                                                  | maintainer |
| 1.4 | Point the domain at the winner of 1.1, then decide apex vs `www` and 301 the other                                                                                                                                                                                                                            | Split-host indexing and broken auth callbacks                                                                                                    | maintainer |
| 1.5 | Set `BETTER_AUTH_SECRET`, `SUBMISSION_IP_SALT`, `CRON_SECRET`, `REVALIDATE_SECRET` (≥32 chars, non-placeholder)                                                                                                                                                                                               | The gate fails closed on placeholders; `PARTNER_FEED_TOKENS` is what stops an unauthenticated syndication feed                                   | maintainer |
| 1.6 | Attach blob storage (`BLOB_READ_WRITE_TOKEN` or R2)                                                                                                                                                                                                                                                           | Without it the media library is inert                                                                                                            | maintainer |
| 1.7 | Set `SENTRY_DSN`                                                                                                                                                                                                                                                                                              | Until then the first reader incident is discovered by a reader                                                                                   | maintainer |

**Exit criteria:** `/api/health` returns `ok` on the production host, `/admin/launch`
shows no red items, and a staff account can sign in there.

### Phase 2 — Trust, identity and law

Nepal-specific and non-negotiable before calling the site a news publication. The code
renders all of it from environment values and refuses placeholders; the work is
supplying real ones.

| #   | Item                                                                                                                                                                                     |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | `NEXT_PUBLIC_PUBLICATION_LEGAL_NAME`, `NEXT_PUBLIC_EDITOR_IN_CHIEF`, `NEXT_PUBLIC_DOIB_NUMBER` — the Department of Information and Broadcasting number is what makes the masthead lawful |
| 2.2 | `NEXT_PUBLIC_NEWSROOM_ADDRESS`, `_EMAIL`, `_PHONE` — contactability is a Google News requirement                                                                                         |
| 2.3 | Walk `/trust/*` end to end and confirm the corrections workflow matches the published policy                                                                                             |
| 2.4 | Turn on Turnstile: `CAPTCHA_PROVIDER=turnstile` + site/secret keys — contact, tips and poll votes are open endpoints                                                                     |
| 2.5 | `STAFF_MFA_ENABLED=true` — available and off; a newsroom CMS with password-only staff auth is the softest target on the site                                                             |
| 2.6 | Re-read the privacy and cookie copy against what actually fires                                                                                                                          |

### Phase 3 — Content authority cutover

The repo has two content backends: the bespoke desk store and Payload CMS.
`resolveContentSource()` fails closed, and `NEXT_PUBLIC_LAUNCH_STATUS=live` _requires_
`CONTENT_SOURCE=payload`, so this is a hard gate rather than a cleanup.

| #   | Item                                                                                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 3.1 | Deploy `apps/admin` as its own service; confirm `/healthz`                                                                                                                     |
| 3.2 | Set `PAYLOAD_SECRET`, `PAYLOAD_API_TOKEN`, `PAYLOAD_PUBLIC_SERVER_URL`                                                                                                         |
| 3.3 | `PAYLOAD_DB_PUSH=false` + run the checked-in migrations                                                                                                                        |
| 3.4 | Run `pnpm migrate:desk-to-payload` against real data                                                                                                                           |
| 3.5 | `pnpm test:integration` — the contract test is what proves parity                                                                                                              |
| 3.6 | Flip `CONTENT_SOURCE=payload`, verify `/admin/cutover/status`                                                                                                                  |
| 3.7 | Decide explicitly which of the 32 desk surfaces move to Payload and which stay (ads, paywall, experiments, algorithms have no Payload counterpart) and write the boundary down |

### Phase 4 — Editorial readiness (**the critical path**)

The launch gate requires 30 verified published articles. There are 0. This is
deliberate — the repo refuses to ship fixture text as journalism — and it is the only
item no amount of engineering shortens.

| #   | Item                                                                                                                                                                                                                                                                              |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1 | Recruit and onboard reporters and editors into the roles that already exist                                                                                                                                                                                                       |
| 4.2 | Publish 30 real stories through pitch → draft → review → publish                                                                                                                                                                                                                  |
| 4.3 | Exercise the corrections workflow once, deliberately, before it is needed in anger                                                                                                                                                                                                |
| 4.4 | Confirm every asset carries alt text, caption and credit — enforce it in the collection, not in review                                                                                                                                                                            |
| 4.5 | Seed the desk taxonomy and author pages with real people. **Note:** author pages resolve authors from the taxonomy store, so with an empty taxonomy every byline link is a 404. That is correct fail-closed behaviour, and it means 4.5 is a launch blocker rather than a nicety. |

### Phase 5 — Discovery

Do not start before 1.4. Submitting a publication and then changing its canonical host
is the most expensive self-inflicted SEO wound available.

| #   | Item                                                                                                        |
| --- | ----------------------------------------------------------------------------------------------------------- |
| 5.1 | Google Search Console + Bing Webmaster verification                                                         |
| 5.2 | Google News Publisher Center submission — **now unblocked**: the soft 404s that blocked it are fixed (§2.1) |
| 5.3 | Confirm `/news-sitemap.xml` carries only recent news URLs                                                   |
| 5.4 | Validate `NewsArticle`, `Organization`, `BreadcrumbList` against the Rich Results Test on live URLs         |
| 5.5 | Plausible behind consent; verify no beacon fires pre-consent                                                |
| 5.6 | Spot-check OG/Twitter cards on real articles                                                                |

### Phase 6 — Revenue and growth (post-launch, flag-gated)

House ads → network (`NEXT_PUBLIC_ADS_MODE=network`); paywall tuning; newsletter
(`RESEND_API_KEY`); memberships (Stripe, dormant); web push (VAPID).

### Phase 7 — Hardening that is honest but weak

| #    | Item                                                                                                    | State after this pass                                                                                     |
| ---- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 7.1  | Revisit CSP `'unsafe-inline'` in `script-src`                                                           | unchanged, deliberate: nonces would force every route dynamic and give up SSG/ISR                         |
| 7.2  | `connect-src https:` is broad                                                                           | unchanged; narrow once Sentry/Plausible/storage origins are final                                         |
| 7.3  | Two unpatched `image-size` DoS advisories via Payload                                                   | unchanged; reachable only through staff-authenticated upload                                              |
| 7.4  | Redis presence / real-time counts                                                                       | unchanged; the adapter is honest today                                                                    |
| 7.5  | Rate-limit review under real traffic                                                                    | unchanged; the limits have never met load                                                                 |
| 7.6  | Restore the e2e suites to green                                                                         | **done** — §2.2                                                                                           |
| 7.7  | Sweep the per-layer module caches                                                                       | **done** — §2.6, with a test forbidding regressions                                                       |
| 7.8  | Desk authorization for admin **API** routes                                                             | **done** — §2.4, plus a structural test over every handler                                                |
| 7.9  | `MEDIA_MANAGER_ROLES` includes an unreachable role                                                      | **done** — §2.3                                                                                           |
| 7.10 | **New:** the `(home)` route-group skeleton                                                              | open, optional — see §2.1                                                                                 |
| 7.11 | **New:** `lib/observability/sentry.ts` keeps one module-scope boolean                                   | allowlisted in the process-scope test with a reason; the flag is not something anyone makes a decision on |
| 7.12 | **New:** `/district/[slug]` and `/tag/[slug]` render an empty state for an unknown slug rather than 404 | deliberate, but worth a decision: a typo'd tag URL is a 200 with an empty page                            |

---

## 4. What "ready" means

Two different claims, and conflating them is the failure this repository's own launch
gate was built to prevent.

### 4.1 Engineering-ready — can be signed off on code alone

All of these are true today on this branch:

1. `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test` — clean (953 tests).
2. `pnpm verify:static` — clean, all 9 product audits.
3. `pnpm --filter @nagarikwatch/web build` and `.../admin build` — both pass.
4. `npx playwright test` — 78 passed, 0 failed. `... --config=playwright.admin.config.ts` — 34 passed.
5. `pnpm audit:live-ux --base <origin>` — zero findings across 9 routes × 4 viewports.
6. Every unknown URL under a known hub answers 404, and no 200 can be produced by a
   render failure.

### 4.2 Publication-ready — needs humans and credentials

None of these is a code problem, and no branch can make them true:

1. `pnpm launch:gate:live` passes with no suppressed warnings.
2. `/api/health` returns `ok` on the production host.
3. CI is green on `main` and the deployed commit SHA equals `main`.
4. 30 real articles are published, each with a real byline and author page.
5. The masthead names a real legal entity, a real editor-in-chief and a real DoIB number.
6. Staff MFA is enforced and Turnstile is live.
7. Sentry is receiving events.

**Do not present the site as ready on the strength of 4.1 alone.** 4.1 is what makes it
safe to point a domain at; 4.2 is what makes it a publication.

---

## 5. Critical path

```
0.1/0.2 pipeline  →  1.1 platform  →  1.2 database  →  1.4 domain  →  3.x Payload cutover
                                                             ↓
                                                     2.x legal identity
                                                             ↓
                                                     4.x 30 real articles   ← longest lead
                                                             ↓
                                                     5.x Google News
```

Phase 4 is the critical path and it is the one no engineering shortens. If a launch
date matters, start recruiting before the cutover, not after.

---

## 6. Reproducing this document

```bash
# static gates
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm verify:static

# builds
pnpm --filter @nagarikwatch/web build && pnpm --filter @nagarikwatch/admin build

# e2e (each runner provisions what it needs)
npx playwright test
npx playwright test --config=playwright.admin.config.ts

# rendered UX/a11y, against a running production server
pnpm --filter @nagarikwatch/web start &
pnpm audit:live-ux --base http://localhost:3000 --json /tmp/ux.json
pnpm audit:live-ux --base http://localhost:3000 --strict   # non-zero on any finding

# the status codes in §2.1
for u in /politics/nope /author/nobody /topic/nobody /photos/nope /district/nope; do
  printf '%-24s ' "$u"; curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:3000$u"
done
```

Two notes for whoever runs this next:

- `pnpm audit:live-ux` needs a **production** build. A dev server serves unminified
  bundles and reports roughly twice the transfer size; the a11y numbers are unaffected
  but the weight numbers are not comparable.
- The e2e runners cannot run concurrently — `next dev` refuses a second instance from
  the same project directory whatever port you give it. Run them one after the other.
