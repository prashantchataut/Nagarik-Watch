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

| #   | Item                                                                                                                                                | Why it blocks                                                                                                                                                                                 | Owner      |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1.1 | **Provision Postgres.** The Aiven host in the current `DATABASE_URL` no longer resolves.                                                            | Auth, comments, bookmarks, reading history, polls, engagement are all Postgres-backed. Without it `/api/health` stays `degraded` and every reader account feature is dead.                    | maintainer |
| 1.2 | Run `pnpm db:push`, then `pnpm migrate:ops`                                                                                                         | Creates auth + ops tables. The launch gate explicitly reports ops migrations as unprobed.                                                                                                     | maintainer |
| 1.3 | **Point the domain at the app.** `www` needs a DNS record, or the canonical host moves to the apex; the apex must stop serving the Cloudflare stub. | Every canonical URL, OG tag, sitemap entry and JSON-LD `@id` is built from `NEXT_PUBLIC_SITE_URL`. Publishing with a wrong or dead canonical host poisons the index and is expensive to undo. | maintainer |
| 1.4 | Decide the canonical host — apex or `www` — and set `NEXT_PUBLIC_SITE_URL` + `BETTER_AUTH_URL` to match, with a 301 from the other                  | Split-host indexing and broken auth callbacks.                                                                                                                                                | maintainer |
| 1.5 | Set `BETTER_AUTH_SECRET`, `SUBMISSION_IP_SALT`, `CRON_SECRET`, `REVALIDATE_SECRET` (≥32 chars, non-placeholder)                                     | The gate fails closed on placeholders. `PARTNER_FEED_TOKENS` in particular prevents an unauthenticated syndication feed.                                                                      | maintainer |
| 1.6 | Attach blob storage (`BLOB_READ_WRITE_TOKEN` or R2)                                                                                                 | No media uploads without it; the media library is inert.                                                                                                                                      | maintainer |
| 1.7 | Set `SENTRY_DSN`                                                                                                                                    | Until then production errors are invisible. Launching without this means the first reader incident is discovered by a reader.                                                                 | maintainer |

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

## Phase 7 — Hardening the things that are currently honest but weak

These are real but not launch-blocking. Listed so they are not forgotten.

| #   | Item                                                    | Why                                                                                                                                                                               |
| --- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7.1 | Revisit CSP `'unsafe-inline'` in `script-src`           | Documented and deliberate — nonces would force every route dynamic and give up SSG/ISR. Worth revisiting if Next's nonce story improves. `hasWeakDirectives` already surfaces it. |
| 7.2 | `connect-src https:` is broad                           | Narrow to known hosts once Sentry/Plausible/storage origins are final.                                                                                                            |
| 7.3 | Two unpatched `image-size` DoS advisories (via Payload) | No fix exists upstream. Reachable only through staff-authenticated upload. Re-check each Payload release; drop the exemption the moment a patch ships.                            |
| 7.4 | Redis presence / real-time counts                       | Honest adapter today; needs Redis.                                                                                                                                                |
| 7.5 | Rate-limit review under real traffic                    | Limits exist; they have never met load.                                                                                                                                           |
| 7.6 | Restore e2e + a11y suites to green in CI                | They have not run in 25 pushes — they were failing at `Install`, not on their own merits. Confirm they still pass now that install works.                                         |

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
