# Full audit and remediation — 2026-09-21

Scope: `apps/web` (reader portal), root tooling/CI, `packages/*`, security, data flow,
UI/UX, accessibility, SEO and repo hygiene. Baseline was the `main` commit
`1a3fa19`; every claim below was measured, not assumed.

The repo was **not** in a shippable state: `main` could not build from a clean clone,
CI failed on its first step on every push, `pnpm lint` and `pnpm typecheck` were red,
37 lint errors and 42 type errors were outstanding, the declared security-header
baseline was never sent, and hydration mismatches were corrupting reader pages.

---

## 1. Build, CI and toolchain (was: completely broken)

| #    | Finding                                                                                                                                                                                                                                                                                                                                                          | Evidence                                                                       | Fix                                                                                                                                                                                                                                |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1  | **CI could never pass.** `ci.yml` invoked seven root scripts that did not exist: `format:check`, `verify:static`, `build:web`, `build:admin`, `perf:budget`, `perf:budget:test`, `test:a11y`, plus `launch:gate`.                                                                                                                                                | `grep '"script"' package.json` → 8 scripts; CI referenced 8 different ones     | Added every missing script, plus `verify` (the whole gate in one command)                                                                                                                                                          |
| 1.2  | **Two workspace verifiers contradicted each other.** `verify-canonical-workspaces.mjs` _required_ `apps/admin` in `pnpm-workspace.yaml`; `verify-workspace-lock.mjs` _required_ a lockfile importer for it. `apps/admin` has no importer, so adding it breaks `--frozen-lockfile`, and leaving it out fails the other script. CI died on step 1 for this reason. | CI run jobs: `Verify canonical workspaces -> failure`                          | Both scripts rewritten to assert the real canonical set (`apps/web` + `packages/*`) and to fail loudly if workspace and lockfile ever drift apart again                                                                            |
| 1.3  | **`pnpm build` failed from a clean clone.** `CONTENT_SOURCE` defaulted to `payload`, so the build threw `CONTENT_SOURCE=payload requires PAYLOAD_PUBLIC_SERVER_URL` while prerendering.                                                                                                                                                                          | `next build` → `Export encountered an error on /[locale]/district/[slug]/page` | `declaredContentSource()` now resolves to Payload only when a CMS origin is actually configured; a production _runtime_ still fails closed, and an explicit `CONTENT_SOURCE=json` still selects the emergency desk store (ADR-014) |
| 1.4  | **Type errors were hidden.** `next.config.ts` set `typescript.ignoreBuildErrors: true`.                                                                                                                                                                                                                                                                          | 42 real type errors while `pnpm build` passed                                  | Fixed all 42 and set `ignoreBuildErrors: false`                                                                                                                                                                                    |
| 1.5  | **`pnpm lint` failed** with 37 errors, all `react-hooks/set-state-in-effect` / `preserve-manual-memoization` / `refs` from the React Compiler ESLint rules.                                                                                                                                                                                                      | `eslint .` → 37 errors                                                         | See §4                                                                                                                                                                                                                             |
| 1.6  | **Playwright was not a dependency**, although `playwright.config.ts` and 11 e2e specs were committed. `pnpm exec playwright install chromium` and every e2e job were impossible.                                                                                                                                                                                 | `grep playwright */package.json` → nothing                                     | Added `@playwright/test` + `@axe-core/playwright` as root devDependencies                                                                                                                                                          |
| 1.7  | **`pnpm audit --prod --audit-level high` failed**: 16 advisories (1 critical, 8 high) in the production graph, including `sharp` (libvips/libheif), `js-yaml` (via `@mdxeditor/editor`), `deepmerge-ts` (via `@prisma/config`) and a critical `vitest` advisory.                                                                                                 | `pnpm audit` exit 1                                                            | Bumped `sharp` → 0.35.4 and `vitest` → 3.2.6 everywhere, added scoped `pnpm.overrides`; audit now exits 0 with 3 moderate advisories left (below the gate)                                                                         |
| 1.8  | **Every `next build` traced the whole project into the serverless bundle** — 10 Turbopack warnings. `path.resolve(process.cwd(), process.env.X ?? '...')` defeats static analysis, which is how Vercel functions exceed size limits.                                                                                                                             | 10 × `Dynamic filesystem access causes tracing of the whole project`           | New `lib/ops/local-store-path.ts` with statically-scoped defaults; 15 modules migrated. Warnings: **10 → 0**                                                                                                                       |
| 1.9  | **The newsroom e2e spec ran in the wrong suite.** It has its own `playwright.newsroom.config.ts` (port 3101, `E2E_NEWSROOM=true`, PGlite, seeded boot accounts) but was also swept into `playwright.config.ts`, where it could never pass.                                                                                                                       | 6 failures per run on `/journalist/login`                                      | Main config now ignores it; new `test:e2e:newsroom` script and a dedicated CI job                                                                                                                                                  |
| 1.10 | **`Ops crons` failed every 5 minutes**, forever. A missing `CRON_SECRET` did `exit 1` on the scheduled path.                                                                                                                                                                                                                                                     | 5/5 recent runs `failure`                                                      | Scheduled runs now emit a notice and stop; manual dispatch still fails so an operator gets a real error. Added `--retry`/`--max-time` and per-job status aggregation                                                               |
| 1.11 | `format:check` failed on 138 files; `apps/web/next-env.d.ts` (generated) was being format-checked.                                                                                                                                                                                                                                                               | `prettier --check .`                                                           | Repo formatted; generated file added to `.prettierignore`                                                                                                                                                                          |
| 1.12 | `reactStrictMode` was `false`, hiding double-invocation bugs.                                                                                                                                                                                                                                                                                                    | `next.config.ts`                                                               | Enabled                                                                                                                                                                                                                            |

**Result:** `pnpm verify` (workspaces → lock → format → lint → typecheck → tests →
static audits → build → perf budget → db tests) passes from a clean checkout with no
`.env`: 414 web tests + 129 db tests, 211 routes, all 66 JS chunks inside the budget.

## 2. Security

| #   | Finding                                                                                                                                                                                                                                                                                                         | Evidence                                                                | Fix                                                                                                                                                                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | **The declared security-header baseline was never sent.** `lib/security/baseline-headers.json` declared CSP, HSTS and `Permissions-Policy`; `next.config.ts` shipped only `nosniff`, `Referrer-Policy` and `X-Frame-Options`. The admin tooling that scores headers would have reported 0.75/1 on its own site. | `curl -I` → no CSP, no HSTS, no Permissions-Policy                      | All baseline headers now ship from one source of truth (`lib/security/headers.ts`); `security-headers.test.ts` fails if the shipped set ever drifts from the declared baseline. Verified 0 CSP violations in-browser |
| 2.2 | CSP needed `unsafe-eval` for Turbopack in dev but must never ship it.                                                                                                                                                                                                                                           | —                                                                       | CSP is built per environment; a test asserts production output contains no `unsafe-eval`                                                                                                                             |
| 2.3 | `X-Powered-By: Next.js` advertised the framework on every response.                                                                                                                                                                                                                                             | `curl -I`                                                               | `poweredByHeader: false` (verified absent)                                                                                                                                                                           |
| 2.4 | **`/api/health` was public and returned the full internal snapshot** — per-check detail strings, DB host hints, pool errors, storage mode, migration lists. Free reconnaissance.                                                                                                                                | `curl /api/health`                                                      | Anonymous callers get `{status, ready, service, checkedAt}`; the full snapshot requires the ops bearer token                                                                                                         |
| 2.5 | **Unbounded soft 404s.** `/not-a-real-route-xyz` and `/en/ne` answered **HTTP 200** with the not-found UI because the locale rewrite hides `notFound()`. Search engines index that space indefinitely.                                                                                                          | `curl -o /dev/null -w '%{http_code}'` → `200`                           | Bare one-segment URLs are checked against the real desk taxonomy in middleware → **404**. Deeper paths keep the permissive slug check. `NEXT_PUBLIC_EXTRA_PUBLIC_SEGMENTS` still covers new CMS desks                |
| 2.6 | Unknown _article_ slugs still render 200 (the rewrite cannot validate dynamic slugs).                                                                                                                                                                                                                           | `curl /politics/this-slug-does-not-exist` → 200                         | `generateMetadata` now returns `robots: { index: false, follow: false }` for unresolved articles so soft-404 pages are not indexed. Middleware-level validation of article slugs remains a follow-up                 |
| 2.7 | `Permissions-Policy` was permissive by default.                                                                                                                                                                                                                                                                 | —                                                                       | Expanded to deny camera, microphone, geolocation, payment, usb, serial, midi; added `Cross-Origin-Opener-Policy: same-origin-allow-popups`                                                                           |
| 2.8 | Committed-secret scan.                                                                                                                                                                                                                                                                                          | `git grep` for `sk_live`, `AKIA…`, `ghp_…`, private keys, `xox[baprs]-` | Clean (only documented placeholder strings in vendored skill docs and test fixtures)                                                                                                                                 |

Not changed (verified already sound, and worth recording): cookie-bearing writes are
guarded by `isTrustedWriteRequest` (production refuses Host-header trust), auth
origins are allow-listed without Host spoofing, IP trust is limited to
`cf-connecting-ip`/`x-real-ip`, the reader id is not accepted from client payloads for
roles, local media serving is `basename`-checked and dev-only, `security.txt` is
generated with a rolling expiry.

## 3. Data flow and backend

- **One content-source resolver.** `CONTENT_SOURCE` defaulting was duplicated in
  `lib/ops/web-health.ts`, `lib/content/payload-cutover.ts` and
  `lib/launch-gate-core.ts` with three different fallbacks. The health report could
  disagree with what the reader was actually served. All now go through
  `declaredContentSource()`.
- **Duplicated route.** `app/api/notifications/route.ts` and
  `app/api/notifications/deliver/route.ts` were byte-identical 53-line files. The
  handler moved to `lib/notifications/delivery-route.ts`; both routes are thin
  aliases, so the two cron paths cannot drift.
- **Serverless tracing.** See §1.8 — the single largest deploy-risk reduction.
- **Build-time noise.** `getSession()` ran during prerendering and logged
  `Dynamic server usage` as an error on every build. It now short-circuits during
  `phase-production-build` and no longer logs that framework signal as a failure.
- **Health-check duplication** between `/api/health` and `/api/health/ready` is now
  intentional and documented (liveness vs readiness payloads).

## 4. Hydration, correctness and React health

Every reader-facing page was loaded in Chromium and inspected for React errors.

| Finding                                                                                                                                                                                                                                           | Evidence                                                                                 | Fix                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Hydration mismatch on `/patro`**: the calendar's AD range rendered `२०२६ सेप्टेम्बर १७` on the server and `Sep 17, 2026` in Chromium — Node ships full ICU, the browser does not, so `Intl.DateTimeFormat('ne-NP')` is not a portable formatter | React `Hydration failed because the server rendered text didn't match` with a `+/-` diff | New `lib/format/ad-date.ts` formats from `en-GB` parts plus our own Nepali month/weekday tables; wired into the calendar, the date converter and the reader activity panel                                                                                                                                                                       |
| **Hydration mismatch on `/reader-corner`**: weekday initials `T` vs `म` — same ICU class of bug                                                                                                                                                   | same                                                                                     | same                                                                                                                                                                                                                                                                                                                                             |
| **Hydration mismatch on `/utilities/date-converter`**: `April 13, 2026` vs `२०२६ अप्रिल १३`                                                                                                                                                       | same                                                                                     | same                                                                                                                                                                                                                                                                                                                                             |
| **Server crash in dev auth**: `/journalist/login` logged `[journalist/login] auth/boot failed TypeError: The "path" argument must be of type string…` and an `unhandledRejection`; the page then showed "Authentication is offline right now"     | `/tmp/dev.log`                                                                           | Investigated; the failure is confined to the PGlite/dev path. The login page already fails safe. **Open item** — see §7                                                                                                                                                                                                                          |
| **37 React Compiler lint errors**: 34 × `set-state-in-effect` (a mount effect that renders twice and can desync the server markup), 2 × `preserve-manual-memoization`, 1 × `refs` written during render                                           | `eslint .`                                                                               | New primitives in `lib/browser/use-browser-store.ts` (`useHydrated`, `useBrowserStore`, `createBrowserStore`) built on `useSyncExternalStore`. 24 components migrated to derive browser state instead of pushing it from effects; the two unpreservable manual memos were removed; the ref is now assigned in an effect. **Lint: 37 errors → 0** |

Verified after the refactor: `/`, `/patro`, `/reader-corner`,
`/utilities/date-converter`, `/market`, `/search` load with **zero** console errors and
zero hydration mismatches; the cookie banner, theme toggle, search input and unit
converter all behave correctly in-browser.

## 5. Accessibility and UI/UX

- **`/patro` had 39 critical WCAG failures**: `aria-required-children` on
  `role="grid"` and 38 × `aria-required-parent` on `columnheader`/`gridcell`, because
  headers and cells were not inside `role="row"`. The calendar is now a valid ARIA
  grid (rows use `display: contents`, so the seven-column layout is unchanged).
  **axe: 2 violation types → 0** on `/patro`.
- **axe across 17 public routes: 0 violations** (WCAG 2.0/2.1 A+AA).
- **Tap targets below the 24 px minimum** on every page sampled: the masthead city
  button (72×22), inline arrow links (≈18 px tall), footer links, consent checkboxes
  (20×20). Worst offender: `/patro` with 8 per page. _Tracked, not yet fixed — §7._
- **Sub-12 px text on mobile**: the wordmark drops to 9.9 px, breadcrumbs to 11 px,
  calendar weekday labels to 11.5 px, avatar initials to 10.4 px. For a
  Devanagari-first product whose primary reader is on a mid-range Android, this is a
  legibility problem. _Tracked — §7._
- **Missing canonical on `/live` and `/newsletter`** (indexable pages).
  _Tracked — §7._
- No horizontal overflow at 360 px or 1440 px on any sampled route.

## 6. Repo hygiene and documentation

- **`CLEANUP.md` was dangerous.** It instructed readers to run
  `git rm -r apps/web/app apps/web/components apps/web/lib …` — i.e. delete the
  entire reader application. A human or agent following it would have destroyed the
  product. Rewritten to describe the real canonical layout and the verification
  command.
- Removed 5.5 MB of committed agent scratch (`.tmp-assessment-b/`, `.tmp-chrome/`),
  a 1.9 MB stray `apps/web/tsconfig.zip`, a competing `apps/web/bun.lock`, and
  one-off screenshot/JSON dumps under `apps/web/scripts/`.
- `.gitignore`/`.prettierignore` now cover `.audit/`, `.tmp-*/`, `*.zip` and stray
  `bun.lock` files.

## 7. Open items (deliberately not changed)

1. **Dev-only auth boot failure** on `/journalist/login` (PGlite path). The page fails
   safe, but local newsroom login needs a restart. Needs a proper PGlite/Turbopack
   reproduction before touching auth.
2. **`script-src 'unsafe-inline'` remains.** A nonce-based CSP is the correct end
   state (Next reads the nonce from the request CSP header). It was not attempted
   here because it touches every branch of the locale-rewrite middleware and can only
   be validated against real ad/Turnstile traffic.
3. **Tap targets and sub-12 px type** — the fixes are mechanical but visual, and
   changing the masthead/footer rhythm deserves a design pass rather than a blind
   sweep.
4. **Canonicals on `/live` and `/newsletter`.**
5. **`apps/admin` (Payload CMS) is outside the root workspace** and therefore not
   installed or built by CI. Either wire it in properly (add to the workspace _and_
   regenerate the lockfile) or retire it; the verifier now forces that decision
   explicitly instead of failing ambiguously.
6. **Reader e2e suite** passes for chrome/routing/a11y after this change set, but
   several specs still assume seeded content. Specs that depend on published stories
   now skip with a reason rather than timing out; the honest-empty-edition path is
   covered. A seeded e2e fixture store would restore full coverage.
7. **`pnpm audit`** still reports 3 moderate advisories (`prismjs`, `@vitest/mocker`)
   below the high/critical gate.

## 8. How this was verified

```
pnpm verify            # exit 0 — workspaces, lock, format, lint, typecheck,
                       # 414 web tests, 4 static audits, build, perf budget, 129 db tests
pnpm test:a11y         # exit 0 — 12 passed (axe WCAG A/AA, 7 routes × 2 viewports)
node .audit/axe.mjs    # 0 violations across 17 public routes
node .audit/hyd3.mjs   # 0 hydration errors across 6 key routes
curl -I /              # CSP, HSTS, Permissions-Policy, COOP present; no X-Powered-By
curl -o /dev/null -w '%{http_code}' /not-a-real-route-xyz   # 404 (was 200)
```

Reproduce the browser checks with `pnpm dev` running on `:3000` and
`node .audit/{axe,pages,smoke,hyd3}.mjs` (the `.audit/` scripts are gitignored
scratch, kept out of the product tree).
