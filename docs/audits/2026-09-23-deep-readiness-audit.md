# Deep readiness audit — 2026-09-23

Scope: `apps/web`, `apps/admin`, root tooling/CI, security, accessibility, SEO,
data flow and operator contract. Everything below was reproduced locally against
a clean clone and a production build (`next start`) before being changed.

Author: Agent A · **model `deepseek-flash` (provider `deepseek`)** on the DeepSeek
Harness, working the `agent/deep-readiness-pass` branch.

---

## 0. Severity summary

| #   | Finding                                                                  | Severity           | Status                             |
| --- | ------------------------------------------------------------------------ | ------------------ | ---------------------------------- |
| 1   | `pnpm install --frozen-lockfile` fails; CI dies on its first gate        | **Blocker**        | fixed                              |
| 2   | `pnpm build:admin` fails on the Payload REST route type                  | **Blocker**        | fixed                              |
| 3   | Every reader-facing 404 answers HTTP 200 (soft 404s)                     | **High (SEO)**     | fixed                              |
| 4   | Mobile cookie banner sits behind the bottom nav; "Customize" unclickable | **High (privacy)** | fixed                              |
| 5   | Known desk with no stories answers 404 instead of an honest empty state  | Medium             | fixed                              |
| 6   | Staff CMS host: no security headers, indexable                           | Medium (security)  | fixed                              |
| 7   | pnpm 10 blocked all postinstall scripts                                  | Medium             | fixed                              |
| 8   | `Ops crons` red every 5 minutes (missing secret + NXDOMAIN default host) | Medium (ops)       | **patch included, needs operator** |
| 9   | 24 launch-contract env vars undocumented                                 | Medium (ops)       | fixed + gated                      |
| 10  | e2e/a11y suites could not pass against the shipped UI                    | Medium             | fixed                              |
| 11  | Article-slug soft 404 under a valid desk                                 | Low (SEO)          | documented, follow-up              |
| 12  | Apex vs `www` canonical origin disagreement; `www` is NXDOMAIN           | Medium (ops)       | documented, needs operator         |
| 13  | `pnpm audit --prod` reports 3 high (documented exceptions) + 7 moderate  | Low                | documented                         |

---

## 1. Install gate: the lockfile does not match the manifests

**Repro**

```bash
git clone https://github.com/prashantchataut/Nagarik-Watch && cd Nagarik-Watch
pnpm install --frozen-lockfile
# ERR_PNPM_LOCKFILE_CONFIG_MISMATCH
node scripts/verify-workspace-lock.mjs   # exit 1, 24 drift lines
```

The committed `pnpm-lock.yaml` was last regenerated long before the root
`devDependencies` and the `apps/admin` importer were added:

- 13 root `devDependencies` absent from the lockfile
- `apps/admin` missing entirely as an importer
- `apps/web` specifier drift on `sharp`, `postcss`, `typescript`, `vitest` + two stale entries
- `packages/{db,infra,ingest,ui}` `vitest` drift

**Impact:** CI run [`35727757749`](https://github.com/prashantchataut/Nagarik-Watch/actions/runs/35727757749)
fails at `Verify workspace lockfile`; the four install steps then fail or skip, so
lint, typecheck, unit tests, static audits, both builds, a11y and e2e have never
run on `main`. Any Vercel deploy using the documented
`pnpm install --frozen-lockfile` install command fails the same way.

**Fix:** lockfile regenerated against all eight manifests; verified with
`pnpm install --frozen-lockfile` and `verify-workspace-lock.mjs`.

**Why it happened:** nothing regenerates the lockfile when a manifest changes, and
the gate that would have caught it never ran because it was the failing step.
`verify-workspace-lock.mjs` is correct and stays as-is; the CI ordering is what
made it invisible. Recommendation: keep it first (it is cheap) and treat a red
`launch verification` job as release-blocking.

### 1b. pnpm 10 blocked every postinstall script

`pnpm install` printed, as a warning only:

```
Ignored build scripts: @parcel/watcher, @prisma/client, @prisma/engines,
@sentry/cli, @swc/core, esbuild, prisma, unrs-resolver, workerd
```

So `prisma generate`, the `esbuild` binary, `workerd` (wrangler), the Sentry CLI
and `unrs-resolver` were not installed. The repo's `seed`, `db:push`, local
Cloudflare and ESLint tooling silently depended on a machine that had approved
them once. `package.json` now carries an explicit `pnpm.onlyBuiltDependencies`
allowlist of exactly those nine packages.

---

## 2. `pnpm build:admin` fails its route-type check

```
Type error: Type 'typeof import(".../api/[payload]/route")' does not satisfy the
constraint 'RouteHandlerConfig<"/api/[payload]">'.
  Types of property 'GET' are incompatible.
    Type 'Promise<{ slug?: string[] | undefined; }>' is not assignable to
    Type 'Promise<{ payload: string; }>'.
```

`@payloadcms/next@3.85.1` types `REST_GET`/`REST_POST` against a **catch-all**
segment. The generated route lived in `(payload)/api/[payload]/route.ts`.

**Fix:** `git mv` to `(payload)/api/[...slug]/route.ts` (Payload's own template
name), stale comment in `apps/admin/next.config.ts` corrected, and a new
`scripts/audit-payload-routes.mjs` (in `verify:static`) that fails in
milliseconds if the folder shape or the exported handlers drift — so this can
never again cost a full web+admin build to discover.

---

## 3. Soft 404s: every reader-facing 404 answered HTTP 200

**Repro (production build):**

```
GET /no-such-category-xyz            -> 200 (body = recovery page, meta robots noindex)
GET /not-a-real-route-xyz            -> 200
GET /en/ne                           -> 200
GET /politics/nonexistent-slug-xyz   -> 200
```

`e2e/chrome.spec.ts` and `e2e/routes-trust.spec.ts` assert `404` and failed.

**Two independent causes, both verified:**

1. `NextResponse.rewrite(dest, { status: 404 })` does not carry the status.
   `next/dist/server/lib/router-utils/resolve-routes.js` propagates `statusCode`
   only in the `location` (redirect) branch. The existing `hardNotFound()` helper
   was therefore a no-op for the status.
2. `notFound()` renders the nearest `not-found.tsx` boundary with **200** once a
   `loading.tsx` Suspense boundary has streamed. This is
   [vercel/next.js#93253](https://github.com/vercel/next.js/issues/93253),
   closed by a maintainer as _"expected for streamed responses … the 200 status is
   committed before `notFound()` is reached and cannot be changed"_, naming
   "remove `loading.tsx`" as the only framework-level workaround.

Removing the reader `loading.tsx` boundaries **does** produce real 404s — and also
turned `/topic/[slug]` and `/utilities/[tool]` into `DYNAMIC_SERVER_USAGE` 500s,
so it is not a safe trade for a skeleton.

**Fix:** the status decision moved to `proxy.ts`. An unknown top-level path is
rewritten to an unmatched four-segment path, so Next serves its internal
`_not-found` route, whose status is forced to `404` **before** rendering, with
`app/not-found.tsx` as the body.

**Second half of the fix:** `lib/public-path-allowlist.ts` used a
`looksLikeCategorySlug()` fallback that let _every_ unknown kebab-case segment
through to the App Router (and therefore to the soft 404). That fallback is now
opt-in via `NEXT_PUBLIC_PERMISSIVE_PUBLIC_SEGMENTS=1`, for deployments whose desk
taxonomy is fully CMS-managed. The allowlist is otherwise authoritative, and a new
unit test fails if a route is added under `app/[locale]` without an entry — the
heuristic retirement had already hard-404'd `/preeti-unicode`, which was caught
only by probing a production build (both the fix and the guard are in this branch).

---

## 4. Mobile cookie banner was unreachable (privacy)

`e2e/mobile.spec.ts` failed with Playwright reporting that the bottom navigation
intercepted the pointer:

```
<svg …> from <nav aria-label="मुख्य द्रुत नेभिगेसन" class="nw-bottom-nav … z-40 …">
subtree intercepts pointer events
```

`app/styles/02-reader-chrome.css` positions the banner above the nav:

```css
.nw-cookie-banner {
  bottom: calc(var(--nw-bottom-nav-height) + var(--nw-bottom-ad-height));
}
```

…inside `@layer components`, while the element also carried the Tailwind
`bottom-0` **utility**. In Tailwind v4, `utilities` beats `components`, so the
banner was pinned at `bottom: 0` behind the `z-40` nav on phones and the
"Customize" button could not be clicked at all. On a privacy-sensitive site that
means consent preferences were unreachable on the majority of traffic.

**Fix:** the `bottom-0` utility is gone; the component rule applies, `sm:bottom-6`
still wins on desktop, and the reason is commented in place.

---

## 5. A known desk with no stories answered 404

`app/[locale]/[category]/page.tsx` did:

```ts
if (!category || !resolvedName || !result || page > result.totalPages) notFound()
```

`!result` conflates "unknown desk" with "the source returned no page". On an empty
store (the documented default — _"The newsroom starts empty"_) every desk 404s, so
the honest empty state written twenty lines below was unreachable and the whole
soft-launch window served 404s or soft 404s for every section.

**Fix:** only an unknown desk 404s; a known desk with no page renders the existing
empty state. `e2e/article.spec.ts` asserts this and now passes.

---

## 6. Staff CMS host: no hardening, indexable

`apps/admin` (newsroom credentials, unpublished journalism, uploads) sent no
security headers. Now: `X-Robots-Tag: noindex, nofollow, noarchive` + a
`robots.txt` that refuses the host, `Referrer-Policy: no-referrer`,
`X-Frame-Options: DENY`, a directive-scoped
`Content-Security-Policy: frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'`
(a `default-src` would blank Payload's inline/eval-dependent admin UI),
`Permissions-Policy`, `Cross-Origin-Opener-Policy`, `nosniff`, HSTS in production,
and `poweredByHeader: false`.

`payload.config.ts` pins `cors: []` explicitly and disables Payload telemetry.

**Still recommended (not changed here):** set explicit
`auth.maxLoginAttempts` / `auth.lockTime` / cookie options on the `Users`
collection rather than relying on Payload defaults, and consider
`graphQL.disable` if nothing consumes the GraphQL API.

---

## 7. `Ops crons` has been red every 5 minutes

Latest runs on `main` (2026-09-23 10:45, 10:03, 08:37, …) all fail at
`Call cron endpoints`. Two causes:

1. The step hard-fails when `CRON_SECRET` is unset — before launch the operator
   has not created it, so every scheduled run is red and the signal that matters
   (a configured cron returning non-2xx) is buried.
2. The default base URL is `https://www.nagarikwatch.com`, which is **NXDOMAIN**
   today. Only the apex resolves; `admin.` and `cms.` do not exist yet.

**Patch (cannot be pushed from this branch — see below):** replace the
`Call cron endpoints` step in `.github/workflows/ops-crons.yml` with:

```yaml
- name: Call cron endpoints
  env:
    CRON_SECRET: ${{ secrets.CRON_SECRET }}
    CRON_BASE_URL: ${{ secrets.CRON_BASE_URL || vars.CRON_BASE_URL }}
    JOBS: ${{ steps.pick.outputs.jobs }}
  run: |
    set -euo pipefail

    if [ -z "${CRON_SECRET:-}" ] || [ "${#CRON_SECRET}" -lt 32 ]; then
      echo "::warning title=ops-crons not configured::CRON_SECRET repo secret is missing or shorter than 32 chars. No cron endpoint was invoked. Create the secret (openssl rand -hex 32) before launch; pnpm launch:gate blocks the live launch until it exists."
      exit 0
    fi

    # Default must be a host that actually serves the app. `www` was the
    # old default while only the apex resolved (2026-09-23: www was
    # NXDOMAIN), so every run failed on DNS. Pin the canonical origin with
    # the CRON_BASE_URL secret or repo variable.
    base="${CRON_BASE_URL:-https://nagarikwatch.com}"
    base="${base%/}"

    if ! curl -sS --max-time 20 -o /dev/null "${base}/robots.txt"; then
      echo "::error title=ops-crons base URL unreachable::Could not reach ${base}. Point CRON_BASE_URL (repo secret or variable) at the deployed canonical origin, and make sure its DNS record exists."
      exit 1
    fi

    for job in $JOBS; do
      path="/api/cron/${job}"
      echo "POST ${base}${path}"
      code=$(curl -sS --max-time 60 -o /tmp/cron-body.txt -w '%{http_code}' \
        -X POST \
        -H "Authorization: Bearer ${CRON_SECRET}" \
        -H 'Content-Type: application/json' \
        "${base}${path}")
      echo "status=${code}"
      head -c 2000 /tmp/cron-body.txt || true
      echo
      case "$code" in
        200|204) ;;
        *)
          echo "::error title=cron ${job} failed::HTTP ${code} from ${base}${path}"
          exit 1
          ;;
      esac
    done
```

Then set the repo secret `CRON_SECRET` (≥32 chars) and the repo variable
`CRON_BASE_URL=https://nagarikwatch.com`.

**Why it is a patch and not a commit:** the OAuth token behind this agent cannot
write `.github/workflows/*` (GitHub answers `404 Not Found` for those paths
without the `workflow` scope). The same limitation is why the lockfile had to be
pushed through the platform's HTTP gateway rather than `actl connector call`.

---

## 8. Env documentation drift

`scripts/audit-env-docs.mjs` (new, wired into `verify:static`) reads the launch
contract (`launch-gate-core.ts`, `launch-readiness.ts`, `hard-launch-gates.ts`,
`launch-phases.ts`, `security/response-headers.ts`, `public-path-allowlist.ts`,
`admin/src/payload.config.ts`) and fails if a variable it names is absent from
`.env.example` / `apps/admin/.env.example`. Before this branch it reported 24
undocumented variables, including everything an operator needs to clear the live
launch gate. It now passes: 70 contract vars against 102 documented keys.

---

## 9. e2e / a11y drift

The suites were unrunnable in CI (install failed first). Once runnable they
contained stale expectations and, worse, several locators that hang for the full
test timeout on a zero-match locator instead of skipping — which is what killed
the **entire** a11y audit before axe ever analysed a page. Fixed in
`e2e/{a11y,article,chrome,homepage,mobile,routes-trust}.spec.ts`; details in the
PR description.

---

## 10. Remaining risks and follow-ups

1. **Article-slug soft 404** (`/politics/this-does-not-exist` → 200 + `noindex`).
   Mitigations already in place: `noindex` is emitted by Next's fallback boundary,
   and renamed slugs `permanentRedirect` via `lib/content/slug-redirects.ts`.
   Proper fix: resolve the article (and call `notFound()`) before rendering any
   `<Suspense>` child, and drop `[category]/[slug]/loading.tsx`. Verify against a
   seeded store, because removing the boundary changes the route's rendering mode
   (`DYNAMIC_SERVER_USAGE` risk demonstrated on `/topic` and `/utilities`).
2. **Canonical origin disagreement.** Code fallbacks say `https://www.nagarikwatch.com`
   (`lib/site.ts`, `lib/auth/origin-config.ts`), `.env.example` says the apex, and
   `www` does not resolve. Decide apex vs `www`, add the missing DNS record and a
   redirect, then set `NEXT_PUBLIC_SITE_URL` + `BETTER_AUTH_URL` to the winner.
   `docs/LAUNCH-READINESS-ROADMAP.md` treats this as a Phase 1 gate.
3. **Production domain serves a placeholder.** `https://nagarikwatch.com/` returns
   `Hello world` (11 bytes, `text/plain`) for every path including `/api/health`
   and `/robots.txt`. The code is close to launch-ready; the deployment is not
   attached yet. Nothing in this repo can fix that — it is a Vercel/DNS step.
4. **Dependency majors.** `next` 16.3.x is current; `apps/admin` is pinned to
   `next@15.5.25` because Payload 3.85 targets Next 15. Dependabot PRs #9 (next 16
   for the whole repo), #23 (prisma 7), #24 (lucide 1.x), #8 (graphql 17) and #10
   (tailwind-merge 3) are open and conflict with `main`; each needs a deliberate
   migration, not a merge.
5. **`pnpm audit --prod`** reports 3 high advisories, all three inside the repo's
   documented `auditConfig.ignoreGhsas` exceptions, plus 7 moderate. CI's
   `--audit-level high` gate passes today; re-check the exceptions each quarter.
6. **Payload auth hardening** (§6): explicit lockout, cookie and GraphQL policy.
