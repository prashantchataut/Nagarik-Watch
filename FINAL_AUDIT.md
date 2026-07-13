# FINAL AUDIT — Nagarik Watch / नागरिक वाच

**Audit date:** 2026-07-12  
**Commit baseline:** `ed040dd` plus the documentation commit containing this report  
**Verdict:** Substantially recovered and production-hardened, but **not honestly certifiable as fully production-ready** until dependency-aware tests, database-backed runtime tests, Payload integration tests, and browser QA pass.

## नेपाली कार्यकारी सारांश

यो archive सुरुमा पूर्ण buildable codebase थिएन: `packages/db` र `pnpm-lock.yaml` हराएका थिए, duplicate Payload app थियो, real `.env` secrets zip मा थिए, public shell bypass भएको थियो, production content boundary गलत थियो, र धेरै operational writes serverless memory/filesystem मा हराउन सक्थे। ती foundational समस्या सच्याइएका छन्।

मुख्य architecture निर्णय: **Payload CMS production editorial source of truth हो; custom `/admin` operational newsroom surface हो।** Production मा shadow JSON content write गर्न पाइँदैन। Reader, moderation, contact, submissions, polls, newsletter, live overrides, audit र rate-limit state Postgres मा टिकाउ रहन्छ; database नभए production fail loudly हुन्छ।

तर client-ready घोषणा अझै रोकिन्छ, किनकि यो environment मा pnpm/dependencies नभएकाले full `typecheck`, lint, tests, Next builds र Playwright चल्न सकेनन्। साथै payment, full journalist assignment/editing, binary evidence upload, first-party experiment analytics, 2FA/password-reset email, and licensed live feeds remain incomplete.

## Architecture established

- `apps/admin`: canonical Payload CMS at port 3001.
- `apps/web`: public reader site, dedicated reader/journalist flows, and role-gated operational admin.
- Production editorial reads use Payload REST via `PAYLOAD_PUBLIC_SERVER_URL`.
- Journalist draft creation uses a least-privilege Payload API-key service account.
- Production operational state requires Postgres.
- Local development may use PGlite and `.data/` files; production may not.
- Live launch is blocked unless URLs, legal identity, secrets, storage, database, Payload, and content mode are verified.

## Requested issue matrix (A–W)

| ID | Status | Audit result |
|---|---|---|
| A. Admin login | **Code repaired; runtime verification required** | Persistent PGlite dev fallback, explicit Better Auth migrations, awaited boot provisioning, visible errors, redirect path, and production Postgres requirement are implemented. End-to-end login still needs a running dependency tree and DB. |
| B. UI/UX | **Partial** | Full public masthead/footer/mobile shell restored, generic third logo line removed, editorial homepage/article hierarchy improved, empty states made honest, and fake data removed. Full visual critique, screenshots, and WCAG browser audit were not executable here. |
| C. Theme/locale interaction | **Code repaired; browser verification required** | Theme pre-paint initialization and state synchronization were repaired; locale URL switching remains separate. Cross-navigation flash and system-theme changes need Playwright/manual verification. |
| D. Admin panel | **Architecture fixed; runtime verification required** | 31 admin pages exist. Production content editing redirects to Payload; operational pages use real stores and server-side RBAC. Runtime form-by-form QA remains. |
| E. Journalist login | **Partial** | Dedicated `/journalist/login`, dashboard, profile, feedback, assignments, and new-draft flow exist; admins may enter while journalists are blocked from `/admin`. Draft creation bridges to Payload. Full assignment ownership, editing existing drafts, revision history, and editor feedback loop remain. |
| F. Reader login | **Mostly implemented; runtime verification required** | Reader login, registration, profile, saved stories, bookmark API, reading activity, consent, and sign-out error states are connected. Password reset and email delivery/verification UX remain incomplete. |
| G. Role hierarchy | **Implemented with remaining operational QA** | Role matrix, sidebar visibility, route guards, mutation guards, user listing, role assignment, invites, and super-admin boundaries are present. Invitation email delivery and full role-by-role E2E tests remain. |
| H. Live data | **Partial, trustworthy** | Weather/AQI use Open-Meteo; forex uses NRB; NEPSE has best-effort fetch plus verified manual override; bullion and unsupported feeds require manual/provider data. Every surfaced widget carries source/time/error/empty state; invented numbers were removed. Licensed providers and real credentials remain external work. |
| I. Paywall | **UX implemented; payments incomplete** | Premium badges and three-paragraph article gate are wired; membership page and manual member access exist. Payment checkout, webhook reconciliation, invoices, cancellation, and entitlement lifecycle remain. |
| J. Reader submissions | **Core workflow implemented; file upload incomplete** | Real bilingual submission form, consent/anonymity/evidence fields, rate-limited API, durable store, admin queue, and moderation transitions exist. Direct document/photo/video binary upload, malware scanning, and retention workflow remain. |
| K. Categories | **Implemented** | Literature, technology, health, education, interview, photo-story, and video categories were added. Navigation is data-driven. Production taxonomy editing is canonical in Payload rather than a shadow web store. |
| L. Sports/FIFA/NEPSE | **Partial** | Dedicated sports/live-score and NEPSE pages exist; football/cricket provider adapters and manual newsroom fallback exist. FIFA 2026 and market feeds cannot be called “working live” until API keys/provider contracts are configured and tested. |
| M. Production persistence | **Foundational fix implemented** | Payload is canonical for content; production JSON writes are rejected; operational stores require Postgres; write failures surface instead of disappearing. Formal versioned migrations should replace remaining lazy operational DDL. |
| N. Security | **Substantially hardened; not complete** | Secret-bearing env files and credential-bearing prompt were removed; `.gitignore`, strong-secret checks, trusted-origin checks, RBAC, DB-backed write throttles, Better Auth DB rate limits, and fail-loud production storage are present. All exposed secrets still need owner-side rotation. Turnstile enforcement, staff 2FA, password-reset email, and security penetration testing remain. |
| O. Publication credentials | **Preview-safe, not launch-ready** | Reasonable placeholders are documented, but schema filters and the launch gate reject them as public legal claims. Real registered details must be supplied by the owner. |
| P. SEO / Google News | **Code implemented; runtime XML validation required** | Dynamic sitemap, news sitemap, RSS, robots, manifest, llms files, article JSON-LD, author data, and trust pages exist and use the active content source. Contact form is real. Team/legal content still requires verified people and credentials; generated XML must be fetched and schema-validated after build. |
| Q. Recommendations/trending | **Implemented** | Shared recommendation and trending functions are now called by homepage, related stories, continue-reading, and trending surfaces using content and persisted engagement signals. |
| R. Dead code/cleanup | **Substantially completed** | Missing workspace package/lock restored, duplicate CMS and old live-data system removed, empty directories/recovery debris removed, empty catches fixed, root redirect defect removed, old reports archived. One exact duplicate loading component is harmless but may be consolidated. |
| S. PWA manifest | **Implemented** | `/manifest.webmanifest` and service-worker route exist and are excluded correctly by middleware. Installability still needs a production Lighthouse/browser check. |
| T. Analytics/A-B/LTV | **Partial and now honest** | Ranking functions and real recent reading/comment signals power the admin panel. Synthetic impressions/clicks/LTV were removed. Consent-aware first-party event ingestion, experiment assignment, Bayesian credible intervals, unique live visitors, conversion attribution, and revenue LTV are not implemented. |
| U. Contact form | **Implemented** | Real bilingual form, validation, origin check, shared rate limiting, durable local/Postgres storage, and admin inbox exist. Outbound notifications and SLA automation remain optional. |
| V. Newsletter | **Partial** | Double opt-in subscriber state, newsroom drafts/queue, and provider-ready configuration are present. Real provider delivery, bounce reconciliation, unsubscribe/export, and scheduled worker execution remain. |
| W. Polls | **Implemented** | Admin-created polls persist to `.data/polls.json` locally or Postgres in production; one active poll is surfaced on the homepage; votes are server-validated, rate-limited, uniquely persisted, and counted without fictional seed totals. Concurrent DB tests remain. |

## Additional defects discovered and addressed

1. The supplied archive omitted `packages/db` and `pnpm-lock.yaml`; both were recovered from the nested archive.
2. Two near-duplicate Payload apps existed; the stale duplicate was removed.
3. The public web app attempted an in-process Payload Local API import despite Payload being a separately deployed app and `apps/web` lacking the dependency. Replaced with the REST boundary.
4. Public pages read Payload while custom admin forms wrote a shadow JSON store. Production shadow writes now redirect/reject instead of reporting false success.
5. `apps/web/app/page.tsx` accidentally redirected `/` to admin; middleware merely hid the bug. The duplicate root route was removed.
6. The simplified public layout bypassed real reader shell, auth, bookmarks, and footer components. They were reconnected.
7. Weather/market failures silently fell back to invented values while health checks reported success. Fake fallbacks were removed.
8. Admin analytics manufactured impressions, clicks, CTR, and LTV. It now uses persisted events and declares uninstrumented metrics.
9. Multiple production operational stores silently fell back to memory. Production now requires durable state.
10. Public API rate limits were process-local. They now use atomic Postgres counters in production.
11. SEO sitemap/LLM outputs could publish stale seed authors/topics while Payload was active. They now use the selected content backend.
12. Several server actions trusted layout-level authorization. Mutation-level role checks were added.
13. Homepage polls remained hardcoded despite a durable admin store and vote API. The entire path is now connected.
14. A credential-bearing archived remediation prompt was removed from the deliverable.
15. Strict launch checks previously accepted non-empty placeholder values. They now reject placeholders and weak/default secrets.

## Verification result

Passed:

- Syntax parsing of 326 TypeScript/TSX files: 0 diagnostics.
- Public-surface audit.
- Architecture audit.
- Ad-placement audit: 20/20 placements rendered.
- Recovery verification.
- Empty-catch scan.
- Strict launch negative test: correctly exits non-zero with incomplete production configuration.

Not run:

- pnpm install, full TypeScript typecheck, ESLint, Prettier check, Vitest, Next builds, Payload migrations against a real DB, Playwright, Lighthouse, axe, and live provider calls.

See `VERIFICATION_LOG_CURRENT.md` for exact commands and limitations.

## Release recommendation

**Do not present this build as production-verified yet.** Use it as the repaired candidate branch. The next gate is a connected workstation/CI run with Postgres and Payload, followed by responsive browser and accessibility QA. No production deployment should set `NEXT_PUBLIC_LAUNCH_STATUS=live` until the strict gate passes with real organization details and rotated secrets.
