# Nagarik Watch — Launch Roadmap

**Written:** 2026-09-23 · **Against:** `main` @ `c167a45` · **Author:** Claude Opus 5 (`claude-opus-5`)

This is the plan to get from where the repository actually is today to a
newsroom that can be presented as ready. It differs from [`ROADMAP.md`](../ROADMAP.md),
which tracks _feature_ status. This one tracks _launch_ status: what is
preventing the site from being a live publication, in the order those things
have to be solved.

Every claim here was measured in the workspace or against the live origin on the
date above. Where something is blocked on a credential or a human decision, it
says so and names who can unblock it, because the single most expensive failure
mode in this repo's history has been marking things complete that had never run.

---

## 0. Where the project actually stands

Honest summary in three lines:

- **The code is in good shape.** Every gate passes on `main`.
- **The pipeline was broken.** CI had been red for 25 straight pushes and
  production had not received a deploy in the same span.
- **The publication does not exist yet.** There is no database, no verified
  content, no legal masthead, and the domain serves a stub.

### What passes today

| Gate                                   | Result                             |
| -------------------------------------- | ---------------------------------- |
| `pnpm lint`                            | 0 problems                         |
| `pnpm typecheck`                       | 8/8 projects                       |
| `pnpm test`                            | 130 test files                     |
| `pnpm build:web`                       | passes                             |
| `pnpm build:admin`                     | passes _(after the fix in PR #30)_ |
| `pnpm verify:static`                   | passes — 9 product audits          |
| `pnpm audit --prod --audit-level high` | 0 unignored                        |

### What exists

81 public page files, 54 API route handlers, 32 admin desk surfaces and 6
Payload collections. Bilingual routing, SEO infrastructure (sitemaps incl. news/image/
video, RSS, JSON Feed, JSON-LD), reader accounts, comments and moderation,
metered paywall, ad slots, recommendations, live data widgets, PWA.

**The CMS and admin panel asked for in the brief are already built.** The work
that remains on them is not construction — it is the cutover in §3 and the
credentials in §2.

### What does not exist

| Thing                         | Evidence                                                                                                 |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| A production database         | `/api/health` → `getaddrinfo ENOTFOUND nagarikwatch-nagarikwatch.d.aivencloud.com`                       |
| A working custom domain       | `www.nagarikwatch.com` has no DNS; apex serves `200 Hello world` from a Cloudflare stub                  |
| Any published journalism      | launch gate: `0/30 verified published articles declared`                                                 |
| A legal masthead              | `NEXT_PUBLIC_PUBLICATION_LEGAL_NAME`, `NEXT_PUBLIC_EDITOR_IN_CHIEF`, `NEXT_PUBLIC_DOIB_NUMBER` all unset |
| Error visibility              | `SENTRY_DSN` unset — errors go to console only                                                           |
| Spam protection in production | `CAPTCHA_PROVIDER` / Turnstile keys unset                                                                |

---

## Phase 0 — Stop the bleeding _(pipeline)_

**Status: done in PR #30, except two operator items.**

The root cause was one edit. Commit `b1b170f` added a `pnpm.overrides` block to
`package.json` and did not regenerate `pnpm-lock.yaml`. Nothing local notices,
because local checks run against a warm `node_modules`. Only a clean install
does — and a clean install is exactly what CI runs and what `vercel.json` uses
as its `installCommand`.

| #   | Item                                                                                           | State                      | Owner      |
| --- | ---------------------------------------------------------------------------------------------- | -------------------------- | ---------- |
| 0.1 | Regenerate `pnpm-lock.yaml`                                                                    | done                       | —          |
| 0.2 | `verify-lockfile-overrides.mjs` guard, in `verify:static` + CI                                 | done                       | —          |
| 0.3 | `apps/admin` → Next 16 (was outside Payload's supported range)                                 | done                       | —          |
| 0.4 | Payload REST route `[payload]` → `[...slug]`                                                   | done                       | —          |
| 0.5 | Drop `X-Powered-By`, add `onlyBuiltDependencies`, patch `deepmerge-ts`, align `tailwind-merge` | done                       | —          |
| 0.6 | Apply `docs/pending/workflow-fixes.patch`                                                      | **needs `workflow` scope** | maintainer |
| 0.7 | Set `CRON_BASE_URL` secret to the real deployed origin                                         | **needs repo admin**       | maintainer |

**Exit criteria:** a push to `main` produces a green CI run and a Vercel deploy
whose commit SHA matches `main`.

> Verify 0.7 with: `curl -sI https://<origin>/ | grep -i content-security-policy`
> — if CSP comes back, the new code is live.

---

## Phase 1 — Restore production _(infrastructure)_

Nothing below this line can be validated until the site is actually serving.

### 1.0 — First, decide which platform actually deploys this site

This is listed before the credential work because it invalidates part of it,
and because it is the answer to a question the repo currently answers three
different ways.

The apex serves a Cloudflare Worker starter template:

```
$ curl -sI https://nagarikwatch.com/
HTTP/2 200
server: cloudflare
content-type: text/plain;charset=UTF-8

Hello world
```

That is not a "Cloudflare stub" in the generic sense — it is the literal
default Worker script. The reason it is still there is visible in CI:

- A Cloudflare **Workers Build** named `nagarik-watch` runs on every push and
  **fails on every push**, including on `main` today. It predates any recent
  branch.
- The repo contains **two** `wrangler` configs that declare the **same** Worker
  name, `nagarik-watch`:

  | File                      | `main` / assets                                     | Valid? |
  | ------------------------- | --------------------------------------------------- | ------ |
  | `wrangler.jsonc` (root)   | assets from `./apps/web/out`                        | **no** |
  | `apps/web/wrangler.jsonc` | `.open-next/worker.js` via `@opennextjs/cloudflare` | yes    |

- `apps/web/out` **cannot ever exist**. It is the output of a Next static
  export, and `apps/web/next.config.ts` sets no `output: 'export'` — nor could
  it, because the app has 54 API route handlers and middleware.

So the root config points the build at a directory that is impossible to
produce, the build fails, the Worker never receives real code, and the Worker
the apex is bound to keeps answering `Hello world`. Meanwhile the actual
application deploys to Vercel via `vercel.json`, on a different origin.

Two further details worth knowing before choosing:

- `apps/web/wrangler.jsonc` pins `NEXT_PUBLIC_SITE_URL` to
  `https://nagarik-watch.pages.dev` and `CONTENT_SOURCE` to `json`. If the
  Cloudflare path were fixed today it would serve with a `pages.dev` canonical
  host and the JSON store rather than Payload — correct for a preview, wrong
  for production. These must change with the platform decision, not after it.
- The earlier framing of the domain problem as "`www` has no DNS record" is
  true but secondary. The apex resolves fine. It is pointed at a deployment
  target that has never successfully built.

**Decide one of these, then do the rest of Phase 1 against it:**

| Option                                  | What it means                                                                                                                                                                              | Cost                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| **Vercel is canonical** _(recommended)_ | Point the apex at Vercel. Delete the root `wrangler.jsonc`, disconnect the Workers Build integration, and keep `apps/web/wrangler.jsonc` only if a Cloudflare preview is genuinely wanted. | Lowest. It is where the app already builds and where every green deploy has come from. |
| **Cloudflare is canonical**             | Delete the root `wrangler.jsonc`, point the Workers Build at `apps/web`, fix the `vars` block, and verify `@opennextjs/cloudflare` handles ISR, middleware and the 54 API routes.          | Real migration work, and it must be finished before any content is indexed.            |

Either way, **delete the root `wrangler.jsonc`** — two configs claiming one
Worker name is a bug under both options.

I have deliberately not made this change. Which platform owns production is an
operator decision with a live blast radius, and the wrong guess moves the site
to a different origin.

| #   | Item                                                                                                                               | Why it blocks                                                                                                                                                                                 | Owner      |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1.1 | **Provision Postgres.** The Aiven host in the current `DATABASE_URL` no longer resolves.                                           | Auth, comments, bookmarks, reading history, polls, engagement are all Postgres-backed. Without it `/api/health` stays `degraded` and every reader account feature is dead.                    | maintainer |
| 1.2 | Run `pnpm db:push`, then `pnpm migrate:ops`                                                                                        | Creates auth + ops tables. The launch gate explicitly reports ops migrations as unprobed.                                                                                                     | maintainer |
| 1.3 | **Point the domain at the winner of 1.0.** Then give `www` a record, or move the canonical host to the apex.                       | Every canonical URL, OG tag, sitemap entry and JSON-LD `@id` is built from `NEXT_PUBLIC_SITE_URL`. Publishing with a wrong or dead canonical host poisons the index and is expensive to undo. | maintainer |
| 1.4 | Decide the canonical host — apex or `www` — and set `NEXT_PUBLIC_SITE_URL` + `BETTER_AUTH_URL` to match, with a 301 from the other | Split-host indexing and broken auth callbacks.                                                                                                                                                | maintainer |
| 1.5 | Set `BETTER_AUTH_SECRET`, `SUBMISSION_IP_SALT`, `CRON_SECRET`, `REVALIDATE_SECRET` (≥32 chars, non-placeholder)                    | The gate fails closed on placeholders. `PARTNER_FEED_TOKENS` in particular prevents an unauthenticated syndication feed.                                                                      | maintainer |
| 1.6 | Attach blob storage (`BLOB_READ_WRITE_TOKEN` or R2)                                                                                | No media uploads without it; the media library is inert.                                                                                                                                      | maintainer |
| 1.7 | Set `SENTRY_DSN`                                                                                                                   | Until then production errors are invisible. Launching without this means the first reader incident is discovered by a reader.                                                                 | maintainer |

**Exit criteria:** `/api/health` returns `status: ok`, `/admin/launch` shows no
red items in the infrastructure group, and a staff account can sign in on the
production host.

---

## Phase 2 — Trust, identity and law

Nepal-specific and non-negotiable before calling the site a news publication.
The code renders all of this from environment values and refuses placeholders —
the work is supplying real ones.

| #   | Item                                                                                           | Notes                                                                                                                                                           |
| --- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | `NEXT_PUBLIC_PUBLICATION_LEGAL_NAME`, `NEXT_PUBLIC_EDITOR_IN_CHIEF`, `NEXT_PUBLIC_DOIB_NUMBER` | The Department of Information and Broadcasting registration number is what makes the masthead lawful. Google News and readers both look for it.                 |
| 2.2 | `NEXT_PUBLIC_NEWSROOM_ADDRESS`, `_EMAIL`, `_PHONE`                                             | Contactability is a Google News requirement and a trust signal.                                                                                                 |
| 2.3 | Review the trust pages end to end                                                              | `/trust/*` — ethics, corrections, ownership, masthead. The corrections workflow was built in `cc615ec`; confirm it matches the policy text now that both exist. |
| 2.4 | Turn on Turnstile: `CAPTCHA_PROVIDER=turnstile` + site/secret keys                             | Contact, tips and poll votes are open endpoints. The CSP already allows `challenges.cloudflare.com`.                                                            |
| 2.5 | Enforce staff MFA: `STAFF_MFA_ENABLED=true`                                                    | Available but off. A newsroom CMS with password-only staff auth is the softest target on the site.                                                              |
| 2.6 | Privacy and cookie policy review against what actually fires                                   | Consent gating exists; confirm the copy matches the beacons now that Plausible/ads are configurable.                                                            |

**Exit criteria:** every `/trust/*` page states a real, verifiable fact; the
launch gate's legal group is clear.

---

## Phase 3 — Content authority cutover _(the biggest architectural item)_

The repo currently has **two** content backends:

- the bespoke **desk store** (`lib/content/store`) — JSON or Postgres, driven by `/admin`
- **Payload CMS** (`apps/admin`) — 6 collections, driven by `/admin` on port 3001

`resolveContentSource()` picks between them and **fails closed**: if
`CONTENT_SOURCE=payload` without `PAYLOAD_PUBLIC_SERVER_URL`, it throws rather
than silently serving the shadow store. `NEXT_PUBLIC_LAUNCH_STATUS=live`
_requires_ `CONTENT_SOURCE=payload`. That is good design, and it means the
cutover is a hard gate on launch, not an optional cleanup.

| #   | Item                                                                   | Notes                                                                                                                                                                            |
| --- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1 | Deploy `apps/admin` as its own service; confirm `/healthz`             | Node 22.x. It is a separate Vercel project — see `docs/`.                                                                                                                        |
| 3.2 | Set `PAYLOAD_SECRET`, `PAYLOAD_API_TOKEN`, `PAYLOAD_PUBLIC_SERVER_URL` | Currently the 5 "live blockers" the gate reports.                                                                                                                                |
| 3.3 | `PAYLOAD_DB_PUSH=false` + run checked-in migrations                    | Push-mode against a production database is how schemas get silently diverged.                                                                                                    |
| 3.4 | Run `pnpm migrate:desk-to-payload`                                     | The migration script exists. It has not been run against real data.                                                                                                              |
| 3.5 | Validate with `payload-source.contract.test.ts` against the live CMS   | The contract test is the thing that proves parity. `pnpm test:integration`.                                                                                                      |
| 3.6 | Flip `CONTENT_SOURCE=payload`, verify `/admin/cutover/status`          |                                                                                                                                                                                  |
| 3.7 | **Retire the desk store as a content authority**                       | Leaving two writable backends live is the highest-probability source of "the article I edited reverted". Reduce the desk to operational surfaces (ads, moderation, launch) only. |

**Exit criteria:** `/api/admin/cutover/status` reports Payload canonical,
contract tests green against production, and the desk store is read-only for
articles.

> **Risk:** 3.7 is the one item here that is genuinely ambiguous and worth a
> human decision. The desk has 32 surfaces and Payload has 6 collections — they
> are not equivalent, and several desk surfaces (ads, paywall, experiments,
> algorithms) have no Payload counterpart and should probably _stay_ on the desk.
> Decide explicitly which surfaces move and which do not, and write it down,
> rather than discovering the boundary during the cutover.

---

## Phase 4 — Editorial readiness

The launch gate requires **30 verified published articles**
(`LAUNCH_MIN_PUBLISHED_ARTICLES`, default 30). There are 0. This
is deliberate: the repo refuses to ship fixture text as journalism, and
`README.md` says so. It is also the longest-lead item on this list, because it
is the only one that cannot be solved by writing code or buying a service.

| #   | Item                                                                                                                                      |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1 | Recruit and onboard reporters/editors into the roles that already exist                                                                   |
| 4.2 | Publish 30 real stories through the full workflow: pitch → draft → review → publish                                                       |
| 4.3 | Exercise the corrections workflow once, deliberately, before it is needed in anger                                                        |
| 4.4 | Confirm every published asset carries alt text, caption and credit _(the newsroom CMS rule; enforce it in the collection, not in review)_ |
| 4.5 | Seed desk taxonomy and author pages with real people                                                                                      |

**Exit criteria:** 30 articles live, each with a real byline, a real author page
and a correct canonical URL.

---

## Phase 5 — Discovery

Do not start before Phase 1.4 (canonical host) is final. Submitting a
publication and then changing its canonical host is the most expensive
self-inflicted SEO wound available.

| #   | Item                                                                                                |
| --- | --------------------------------------------------------------------------------------------------- |
| 5.1 | Google Search Console + Bing Webmaster verification                                                 |
| 5.2 | Google News Publisher Center submission                                                             |
| 5.3 | Confirm `/news-sitemap.xml` only carries recent news URLs, not evergreen pages                      |
| 5.4 | Validate `NewsArticle`, `Organization`, `BreadcrumbList` against the Rich Results Test on live URLs |
| 5.5 | Plausible behind consent; verify no beacon fires pre-consent                                        |
| 5.6 | Social cards — OG/Twitter — spot-checked on real articles                                           |

### 5.0 — Unknown content URLs are soft 404s

Blocks 5.2. Verified against a production build of `main`:

```
/_not-a-route            404   proxy rejects the shape, answers itself
/en/ne                   404   locale duplication (fixed in this branch)
/not-a-real-route-xyz    200   ← reaches the App Router
/politics/no-such-slug   200   ← reaches the App Router
```

The recovery UI is correct in every case — reader-facing, this is not broken,
and every one of those responses carries `<meta name="robots" content="noindex">`.
What is wrong is the status line.

The cause is **not** the locale rewrite. `/en/*` is served through
`NextResponse.next()` with no rewrite at all and behaves identically, and the
proxy's own `hardNotFound()` proves a rewrite can carry a 404 fine. The cause is
`app/[locale]/loading.tsx`: a segment `loading.tsx` wraps its subtree in a
Suspense boundary, the fallback flushes as soon as the layout resolves, and the
HTTP status is committed with that first flush — before `notFound()` in the page
body ever runs. This is documented Next.js behaviour, not a bug in this repo
([notFound reference](https://nextjs.org/docs/app/api-reference/functions/not-found),
[vercel/next.js#93239](https://github.com/vercel/next.js/issues/93239)).
`export const dynamic = 'force-dynamic'`, which `[category]/page.tsx` already
sets, does not change it.

`lib/public-path-allowlist.ts` was written to prevent exactly this — its header
comment says so. It works for every shape except the one that matters: a
lowercase kebab slug, which is what essentially every crawled bad URL looks like.
`looksLikeCategorySlug` lets those through on purpose, so a desk created in the
CMS is not hard-404'd before the seed list or
`NEXT_PUBLIC_EXTRA_PUBLIC_SEGMENTS` catches up.

Three ways out, ranked:

| Option                                                                                                                                                       | Fixes                        | Cost                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **A.** Make `looksLikeCategorySlug` opt-in and drive live taxonomy through `NEXT_PUBLIC_EXTRA_PUBLIC_SEGMENTS`                                               | unknown categories only      | A new desk hard-404s until the env var is set. Trades a soft 404 on junk URLs for a hard 404 on a real desk — needs an operator decision. |
| **B.** Delete `app/[locale]/loading.tsx` and the two content-segment `loading.tsx` files; move skeletons into in-page `<Suspense>` after the existence check | both categories and articles | Loses the route-level skeleton; each page must be restructured to validate before it returns JSX.                                         |
| **C.** Accept it                                                                                                                                             | nothing                      | Free. `noindex` already keeps these out of the index; the cost is crawl budget and a dirty Search Console coverage report.                |

**Recommendation: B, scoped to `[category]` and `[category]/[slug]`, before 5.2.**
It is the only option that also covers unknown article slugs, and unknown article
slugs are what a news crawler actually generates. Not done in this branch: it
changes the perceived-performance characteristics of the two highest-traffic
route families, which is a product call, not a test-fixing one.

Pinned meanwhile by `e2e/routes-trust.spec.ts` and `e2e/chrome.spec.ts`, which
accept either status, assert `noindex` unconditionally, and emit a `known-gap`
annotation when the answer is 200 — so the day this is fixed, the annotation
disappears rather than a test going red.

---

## Phase 6 — Revenue and growth _(post-launch)_

Deliberately last. Every item is dormant behind a flag and should stay that way
until readers exist.

| #   | Item                                                                        | Current                                                     |
| --- | --------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 6.1 | House ads → network (`NEXT_PUBLIC_ADS_MODE=network`)                        | CSP already adapts to the ad network automatically          |
| 6.2 | Paywall tuning — 8 free stories/month, editor-adjustable                    | meter gates correctly as of `1fc48c3`                       |
| 6.3 | Newsletter: set `RESEND_API_KEY` / `NEWSLETTER_API_KEY` + `AUTH_EMAIL_FROM` | digest cron reports `email-adapter-disabled` honestly today |
| 6.4 | Memberships (Stripe)                                                        | dormant unless `NEXT_PUBLIC_MEMBERSHIP_PUBLIC=true`         |
| 6.5 | Web push (VAPID)                                                            | in-app alerts work without it                               |

---

## Phase 7.0 — One scope bug, four symptoms _(fixed)_

Recorded because it explains several things this document previously listed as
separate mysteries, and because the pattern is still live elsewhere in the repo.

Next emits a shared module into both the RSC/SSR graph and the route-handler
graph. A module-level `let cached` in such a module therefore exists **once per
layer**, not once per process. Instrumenting `lib/auth/auth-pool.ts` caught it
outright: one PGlite created from `chunks/ssr/[root-of-the-server]__*.js` under
`AdminLoginPage`, a second from `chunks/[root-of-the-server]__*.js` under
`getOperationalPool` — same pid, same data directory, two instances.

Two PGlite instances on one directory do not share a page cache. Every symptom
below is the same bug:

| Symptom                                                                                                  | Mechanism                                                                                                                                                                |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `relation "nw_taxonomy_terms" does not exist` on `/journalist/articles/new`                              | `CREATE TABLE IF NOT EXISTS` ran on one instance, the `SELECT` two lines later on the other                                                                              |
| A filed draft never reached the editor: `/admin/journalists` showed "no handoffs" for a just-filed story | `POST /api/journalist/articles` inserted through the route-handler instance; the desk read through the RSC one. Both statements succeeded. No error was logged anywhere. |
| A just-published story could 404 for up to 30s                                                           | `invalidateArticleStoreCache()` runs in the publish handler and cleared that layer's cache; reader pages served the other layer's copy until the TTL expired             |
| `SHARED_POOL_MAX_PER_INSTANCE = 1` silently became 2                                                     | `pg-pool` kept its pool in module state, so each layer opened its own — against a database that had already hit Postgres 53300                                           |

Fixed by `lib/runtime/process-singleton.ts`, which keys the state off
`globalThis` via a registered symbol — the only scope both layers share — and
memoises the in-flight promise rather than the resolved value, so two concurrent
first callers cannot both construct. Applied to `auth-pool`, `pg-pool` and
`json-store`.

**Still outstanding.** Roughly forty other modules under `apps/web/lib` hold
module-level `memory` maps, `localWrite` queues and short-TTL caches with the
same shape. They are lower risk — most are development fallbacks used only when
no database is configured, and `rate-limit.ts` already fails closed in
production rather than trusting its in-memory buckets — but every `localWrite`
/ `writeQueue` promise chain guarding a file write has the same "two locks are
no lock" flaw `json-store` had. Worth a sweep before launch; not a blocker.

Two related findings worth writing down:

- **PGlite must be `serverExternalPackages`.** Bundled, it builds its WASM and
  filesystem paths with `new URL(..., import.meta.url)`, which yields a URL from
  a different realm than the one `node:fs` validates against; every call then
  fails `instanceof URL` with the self-contradictory "must be ... an instance of
  URL. Received an instance of URL". This took out staff sign-in completely
  wherever `DATABASE_URL` is unset.
- **A PGlite data directory does not survive an unclean shutdown.** `kill -9` on
  the dev server leaves it in a state where the next `PGlite.create()` aborts in
  WASM (`Aborted(). Build with -sASSERTIONS`) with no recovery path in the app.
  Only affects PGlite-backed local/E2E runs, never production Postgres, but it
  costs ten confusing minutes the first time it happens. Delete the directory.

---

## Desk authorization lived in a layout _(fixed)_

Role rules for the admin desks (`canAccessAdminPath`) were applied in
`app/admin/(desk)/layout.tsx`. That is correct exactly once: on a full page
load. **App Router does not re-render a shared layout on client-side
navigation** — a navigation request returns only the segments that changed and
the layout is reused from the router cache. Instrumenting the layout and driving
a sidebar click under Playwright printed one `[LAYOUT-RUN] /admin/dashboard` for
the hard load and nothing at all for the soft navigation to `/admin/articles`.

All 36 desk pages call `requireNewsroomSession()`, which authenticates but does
not authorize. So the rules were checked against the first desk an editor opened
and against nothing after it.

Measured as the seeded `section_editor` (not a `USER_MANAGER_ROLE`) by replaying
a real navigation request — same captured `Next-Router-State-Tree`, which is what
tells the server the client already holds the `(desk)` layout:

| Route              | With the guard         | Without the guard                                                                |
| ------------------ | ---------------------- | -------------------------------------------------------------------------------- |
| `/admin/users`     | 6,918 B, metadata only | **13,913 B** — "भूमिका र निष्क्रियता व्यवस्थापन", the staff list, its search box |
| `/admin/audit-log` | 6,907 B, metadata only | **7,599 B** — "Sensitive newsroom actions" and the event table                   |

So any authenticated staff account could read any desk, including the user list
and the audit log, by issuing the navigation request itself. A demoted account
also kept its old reach until something forced a full reload.

Fixed by moving the decision into `lib/auth/desk-access.ts` and calling it from
`requireNewsroomSession()`. Pages and server actions always run, so no desk can
skip it, and a desk server action's POST carries that desk's own pathname. It is
gated on `x-nw-shell: admin`, which both `proxy.ts` and the slim Cloudflare
middleware `set` (not append) for `/admin` and `/admin/*` only — a client can
neither forge it onto another route nor strip it from an admin one.

Three tests hold it down: the outcome table in `lib/admin-roles.test.ts`, a
Playwright replay in `e2e/admin-desk.spec.ts` with an allowed desk as a positive
control, and a structural test in `lib/auth/desk-access.test.ts` asserting every
file under `app/admin/(desk)` reaches `requireNewsroomSession()` — so the next
desk cannot be added unguarded without deleting that test on purpose.

**Worth generalising.** "The check is in a layout" is not a local mistake; it is
a shape. Any per-request decision in a layout — authorization, entitlement,
feature gating — is a decision that runs once per hard load. Grep for
`headers()` in layouts before trusting one.

---

## Why the site feels slow _(measured; not yet fixed)_

A production build says it plainly: `/`, `/[locale]`, `/[locale]/[category]` and
`/[locale]/[category]/[slug]` all render `ƒ` (dynamic). **The home page, every
desk index and every article are rendered from scratch on every request.** Only
about ten low-traffic route groups prerender — `district/[slug]`,
`photos/[slug]`, `newsletter/archive`, `reader-corner` and friends. Across the
app, **106 of 189 route files declare `export const dynamic = 'force-dynamic'`.**

Each case has a specific and small cause, which is the good news:

| Route                         | What actually forces it dynamic                                                                                                                        | What it would take to cache                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/[locale]/[category]`        | `await searchParams` for `?page=N` (`page.tsx:66`). Nothing else — no cookie, header or session read                                                   | Move pagination into the path (`/desk/page/2`). Page 1 is most of the traffic and becomes ISR-cacheable                                                           |
| `/[locale]/[category]/[slug]` | `await headers()` for the Save-Data hint at `page.tsx:187`, **unconditionally**. `cookies()` is touched only when public membership is on (`:161-184`) | Decide Save-Data on the client, or put the metered/paywall strip behind Suspense, so the article body caches and only the reader-specific strip stays per-request |

Both files also declare `export const revalidate = 60` on the line directly
above `export const dynamic = 'force-dynamic'`, which overrides it. They are the
only two files in the app that do this. The `revalidate` is dead — the files
claim a caching policy they do not have, and `generateStaticParams()` on the
article page currently buys nothing.

Note what this means for sequencing: **deleting `force-dynamic` from either file
changes nothing on its own**, because `searchParams` and `headers()` would each
force a dynamic render anyway. These are refactors, not config flips, and the
article one has paywall-correctness stakes — the free-article meter must not be
served from a shared cache. Do them deliberately, with the paywall e2e green
before and after.

Not yet measured, and worth doing before any of the above: server response time
against the real content source. The route table proves nothing is cached; it
does not prove the render is what is slow. If `getStories`/`getArticleBySlug` are
the cost, request-scoped memoisation is a smaller fix with a larger effect.

---

## Phase 7 — Hardening the things that are currently honest but weak

These are real but not launch-blocking. Listed so they are not forgotten.

| #   | Item                                                    | Why                                                                                                                                                                                                                                                                       |
| --- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7.1 | Revisit CSP `'unsafe-inline'` in `script-src`           | Documented and deliberate — nonces would force every route dynamic and give up SSG/ISR. Worth revisiting if Next's nonce story improves. `hasWeakDirectives` already surfaces it.                                                                                         |
| 7.2 | `connect-src https:` is broad                           | Narrow to known hosts once Sentry/Plausible/storage origins are final.                                                                                                                                                                                                    |
| 7.3 | Two unpatched `image-size` DoS advisories (via Payload) | No fix exists upstream. Reachable only through staff-authenticated upload. Re-check each Payload release; drop the exemption the moment a patch ships.                                                                                                                    |
| 7.4 | Redis presence / real-time counts                       | Honest adapter today; needs Redis.                                                                                                                                                                                                                                        |
| 7.5 | Rate-limit review under real traffic                    | Limits exist; they have never met load.                                                                                                                                                                                                                                   |
| 7.6 | Restore e2e + a11y suites to green in CI                | They have not run in 25 pushes — they were failing at `Install`, not on their own merits. Confirm they still pass now that install works.                                                                                                                                 |
| 7.7 | Sweep the remaining per-layer module caches             | See Phase 7.0. ~40 modules, mostly development fallbacks; the file-write queues are the ones that can lose data.                                                                                                                                                          |
| 7.8 | Desk authorization for admin **API** routes             | The new guard is scoped to the admin shell: it keys off `x-nw-shell: admin` and `ADMIN_PATH_ROLE_RULES` is keyed on `/admin/...` prefixes, so `/api/admin/...` is deliberately out of scope. Those handlers keep their own checks; nothing audits that they all have one. |
| 7.9 | `MEDIA_MANAGER_ROLES` includes `photo_video_editor`     | That role is in `JOURNALIST_DESK_ROLES`, so it is redirected to the journalist desk and can never reach the admin shell. The media sidebar entry for it is unreachable — grant it differently or drop it.                                                                 |

---

## Critical path

Only one ordering actually matters:

```
0.6/0.7 pipeline  →  1.1 database  →  1.3/1.4 domain  →  3.x Payload cutover
                                            ↓
                                  2.x legal identity
                                            ↓
                                  4.x 30 real articles   ← longest lead
                                            ↓
                                  5.x Google News
```

**Phase 4 is the critical path**, and it is the one no amount of engineering
shortens. Everything in Phases 0–3 is days of work by someone with the right
credentials. Phase 4 is a newsroom producing journalism. If the launch date
matters, start recruiting before the cutover, not after.

## What "ready" means

The site can be presented as ready when all of these are simultaneously true:

1. `pnpm launch:gate` passes with `NEXT_PUBLIC_LAUNCH_STATUS=live` — no warnings suppressed.
2. `/api/health` returns `ok` on the production host.
3. CI is green on `main` and the deployed commit SHA equals `main`.
4. `/admin/launch` shows no red items to a signed-in editor.
5. 30 real articles are published, each with a real byline and author page.
6. The masthead names a real legal entity, a real editor-in-chief and a real DoIB number.
7. Staff MFA is enforced and Turnstile is live.
8. Sentry is receiving events.

Items 1–4 are mechanical. Items 5–6 are the publication. Do not present the
site as ready on the strength of 1–4 alone — that is precisely the failure this
repo's own launch gate was built to prevent.
