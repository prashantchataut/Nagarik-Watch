# Nagarik Watch — production audit and critical-fix report

**Audit date:** 2026-07-10  
**Scope:** every member available in the uploaded ZIP, with targeted manual review of auth, admin access, database boot behavior, client hydration, launch gates, reader/journalist account components, accessibility, and static verification scripts.

## Executive judgment

The codebase has substantial product ambition and several good foundations: role-gated newsroom routes, durable Postgres paths, explicit launch gates, bilingual components, content workflows, ad inventory, and local audit scripts. The recovered upload is nevertheless **not launchable**. The immediate reason is not just application code: the ZIP lost every directory path and omits 70 source files recorded in its own TypeScript build metadata. A normal unzip silently overwrites repeated files, so any build performed from the raw archive would be invalid.

The auth failure described in the handoff was real. `buildAuth()` awaited boot-account seeding; `assignBootRole()` could reject; and the rejected singleton promise was cached forever. That failure path has been repaired. The upload also omitted the Better Auth catch-all API route, so it was reconstructed using the standard Next.js handler integration.

### Recovery-grade score, not a score for the intact original repository

| Area                         |  Grade | Reason                                                                                                                            |
| ---------------------------- | -----: | --------------------------------------------------------------------------------------------------------------------------------- |
| Archive integrity            |  **F** | Paths stripped, duplicate names overwrite, 70 source files absent                                                                 |
| Auth correctness after fixes |  **B** | Fatal singleton/seeding issue fixed; live database smoke test still required                                                      |
| Security posture             | **C+** | Server RBAC and secret-length checks exist; no staff 2FA, email verification, distributed auth throttling, or complete reset flow |
| Public UX                    |  **C** | Good components exist, but public route sources are absent from the upload and cannot be verified                                 |
| Accessibility                | **B-** | Mobile focus handling improved; full axe, keyboard, and screen-reader testing is blocked                                          |
| Newsroom operations          | **B-** | Strong role/workflow scaffolding; dual admin surfaces and missing CRUD routes remain                                              |
| Launch readiness             |  **D** | Required legal, content, provider, deployment, and end-to-end checks are not green                                                |

## Critical defects and disposition

### P0 — archive corruption and incomplete source

**Evidence**

- 672 ZIP entries, zero entries with directory paths.
- 27 duplicate filename groups.
- 190 duplicate entries beyond the first copy.
- Examples: `SKILL.md` ×95, `page.tsx` ×31, `route.ts` ×20, `package.json` ×8.
- Web `tsconfig.tsbuildinfo` references 68 local source files absent from the ZIP.
- Admin `tsconfig.tsbuildinfo` references 2 local source files absent from the ZIP.

**Impact**

A normal extraction overwrites unrelated files. The public application shell, homepage, category/article routes, reader account pages, journalist pages, and several admin APIs cannot be built from this upload.

**Disposition:** mitigated by reconstructing all recoverable paths and preserving 672/672 entries. Missing files are listed in `RECOVERY_STATUS.json`. A complete fix requires an intact re-upload.

### P0 — permanent auth outage after one initialization failure

**Original behavior**

- `getAuth()` cached `buildAuth()` permanently.
- `buildAuth()` awaited `seedBootAccounts()`.
- `seedOne()` caught signup errors but did not catch `assignBootRole()`.
- One transient DB failure permanently poisoned the singleton until process restart.

**Fix**

- clear `authPromise` when initialization rejects;
- detach boot seeding from handler creation;
- use `Promise.allSettled()` for boot users;
- catch and log role-assignment failure independently;
- skip boot seeding during static generation.

**File:** `apps/web/lib/auth/index.ts`

### P0 — Better Auth catch-all route absent from upload

The build metadata expects `apps/web/app/api/auth/[...all]/route.ts`, but the file was not present in the ZIP. It has been restored with lazy handler creation, retry after initialization failure, and controlled `503` handling.

**File:** `apps/web/app/api/auth/[...all]/route.ts`

### P0 — database availability is still a hard runtime dependency

The local `.env` points at Postgres on `localhost:5432`. Better Auth cannot create users, sessions, or boot accounts if that database is not running. This environment had no Docker executable, so the database-backed login could not be smoke-tested here.

**Required local sequence**

```bash
docker compose up -d
pnpm --filter @nagarikwatch/web dev
```

### P1 — React hydration mismatch paths

The minified React error is consistent with server/client HTML divergence. Several client components rendered time-dependent values during the initial render:

- `Masthead.tsx`: current date during render;
- `NepaliCalendar.tsx`: `new Date()` inside initial memo/state derivation;
- `UtilityTools.tsx`: current date as the initial controlled input value;
- client-localized timestamps without an explicit timezone.

**Fix**

- defer current-date values to `useEffect()`;
- render deterministic initial states;
- use `Asia/Kathmandu` for client timestamp formatting.

### P1 — duplicate public site URL

The root `.env` defined `NEXT_PUBLIC_SITE_URL` twice. The recovered local environment now contains only:

```env
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Production must set the real HTTPS URL in Vercel environment settings.

### P1 — missing public account routes in the uploaded source

Reader and journalist form components exist, but the route files referenced by build metadata are absent, including:

- reader login, signup, profile, and saved pages;
- journalist login, dashboard, assignments, feedback, profile, and new-article pages;
- localized root layout.

This explains why “there is no login” can be true in the recovered source even though form components exist. These routes cannot be safely recreated without the intact layout and route implementations.

### P1 — incomplete account lifecycle

- email verification is disabled;
- forgot-password flows are `mailto:` links;
- session/device management is absent;
- no newsroom 2FA is implemented;
- reader profile editing is explicitly deferred;
- no clear account export/deletion implementation was verified.

Before launch, staff accounts should require verified email and phishing-resistant MFA; reader accounts need reset, verification, session revocation, export, and deletion flows.

### P1 — per-process rate limiting

Auth and public-write controls use memory-backed limits. In serverless/multi-instance deployment, limits reset per instance and can be bypassed by spreading requests. Use a shared Redis/Upstash-compatible limiter and apply it to sign-in, sign-up, password reset, comments, tips, polls, and newsletter routes.

### P1 — dual admin architecture

The repository contains both Payload CMS (`apps/admin`) and a custom web newsroom (`apps/web/app/admin`). Existing ADRs designate Payload as canonical, but the custom admin still exposes substantial editing and operations functionality. This creates permission drift, duplicated validation, and source-of-truth risk. Keep Payload canonical for content; narrowly define the web admin as operations-only or retire overlapping screens.

### P1 — missing admin mutation routes

Build metadata references, but the ZIP omits:

- `app/api/admin/articles/[id]/route.ts`;
- `app/api/admin/comments/[id]/route.ts`;
- `app/api/admin/submissions/[id]/route.ts`;
- `app/admin/articles/[id]/edit/page.tsx`.

The list pages can render, but update/moderation workflows cannot be certified.

### P1 — advertising placement audit fails

The ad registry is present, but the static placement audit reports 14 required placements as not rendered. This is a direct consequence of missing homepage/category/article/latest/trending route files. Do not enable network ads until placement rendering, labels, layout reservation, click/impression consent, and sponsored-content separation pass.

### P1 — live/mock data trust risk

`lib/live/mock.ts` still contains placeholder weather, AQI, and market values. The UI must never present these as current reporting. In live mode, missing providers should render an unavailable/delayed state, not plausible numbers.

### P2 — reader persistence is split across account storage and browser storage

Bookmarks/history have server paths, but several client components still use `localStorage`. Anonymous-to-account merge, cross-device consistency, consent withdrawal, and conflict resolution need explicit product behavior and tests.

### P2 — mobile navigation accessibility defect

The drawer claimed to trap focus but only moved focus initially; keyboard users could tab behind it. `aria-controls` referenced an ID that was not attached to the controlled element.

**Fix:** implemented a real Tab/Shift+Tab loop, added the target ID, restored trigger focus on close, and retained Escape support.

### P2 — forms need stronger accessible error association

Login/signup errors use `role="alert"`, which is good, but fields do not consistently use `aria-invalid` and `aria-describedby` tied to field-specific errors. Add per-field validation messages, preserve server error codes, and avoid exposing adapter/database text.

### P2 — cookie preferences are not a complete preference center

The banner offers granular choices, but the recovered source does not prove a persistent, reachable preference-management screen with current status, withdrawal, and vendor details. Verify that analytics and personalization scripts do not execute before consent.

### P2 — operational observability is incomplete

Error boundaries were added, but console logging is not production observability. Add structured logs and a server/client error tracker with release tags, route, digest, request ID, and redaction. Add health checks for Postgres, Payload, mail, object storage, and data providers.

### P2 — legal/editorial trust inputs remain external blockers

Launch requires real publisher identity, editor-in-chief, registration, address, phone, corrections log, ad policy, privacy policy, and daily editorial volume. Code cannot invent these.

## Files changed or created in this recovery

- `.env`
- `apps/web/lib/auth/index.ts`
- `apps/web/app/api/auth/[...all]/route.ts` _(restored)_
- `apps/web/components/Masthead.tsx`
- `apps/web/components/utilities/NepaliCalendar.tsx`
- `apps/web/components/utilities/UtilityTools.tsx`
- `apps/web/app/admin/wire/WireBrowser.tsx`
- `apps/web/components/article/CommentSection.tsx`
- `apps/web/components/reader/SavedStoriesClient.tsx`
- `apps/web/components/MobileNav.tsx`
- `apps/web/app/admin/login/AdminLoginForm.tsx`
- `apps/web/components/reader/ReaderLoginForm.tsx`
- `apps/web/components/reader/ReaderSignupForm.tsx`
- `apps/web/components/journalist/JournalistLoginForm.tsx`
- `apps/web/lib/launch-readiness.ts`
- `apps/web/app/[locale]/error.tsx` _(restored/recreated)_
- `apps/web/app/admin/error.tsx` _(new)_
- `apps/web/app/global-error.tsx` _(new)_
- `scripts/verify-recovery.mjs` _(new)_
- recovery/audit documents and manifests

## Skill/checklist lenses applied

The repository's local skill material was used as the working framework:

- `auto-skill-orchestrator`
- `systematic-debugging`
- `codebase-auditor`
- `code-doctor`
- `react-expert`
- `secure-code-guardian`
- `accessibility-audit`
- `test-master`
- `newsroom-cms-architecture-skill`
- `shipping-and-launch`

These are repository-local engineering checklists. They were applied to diagnosis, repair, security review, accessibility review, and verification; they are not evidence that the missing source has been audited.

## Correct auth smoke test

`/api/auth/sign-in/email` is a POST endpoint. A bare GET `curl` is not a valid login test and may correctly return a non-200 status. Use:

```bash
curl -i http://localhost:3000/api/auth/sign-in/email \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3000' \
  --data '{"email":"admin@nagarikwatch.com","password":"<your-local-admin-password>"}'
```

Then preserve the returned cookie and request `/admin/dashboard`.

## Production definition of done

Do not call the portal production-ready until an intact repository passes:

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm audit:public
pnpm audit:ads
pnpm audit:architecture
NEXT_PUBLIC_LAUNCH_STATUS=live pnpm launch:gate
pnpm --filter @nagarikwatch/web... build
```

Also verify database migrations, real auth login/logout/reset/verification, role denial, reader/journalist flows, mobile keyboard navigation, screen readers, ads, provider outages, and rollback in staging.
