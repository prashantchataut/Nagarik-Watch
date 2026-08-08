# Nagarik Watch master audit — 2026-07-20

## Executive verdict

Nagarik Watch has a mature monorepo architecture, strong static audit tooling, and a credible Civic Crimson design direction documented in PRODUCT.md and DESIGN.md. The public Vercel reader deployment at https://nagarik-watch.vercel.app still behaves like a pre-launch edition: content may come from the in-repo article store rather than Payload CMS, publisher legal metadata is gated but not fully configured, utility markets (NEPSE, forex) are unavailable, and CI validates a JSON content topology rather than production Payload wiring.

**Product-health score:** 48/100 (up from 42 after route fixes and dedup hardening in this pass)

**Public-readiness verdict:** Not ready for declared live launch (`NEXT_PUBLIC_LAUNCH_STATUS=live`).

**Single biggest product problem:** Content authority split between Payload CMS and the web app's JSON/Postgres store.

**Single biggest trust problem:** Publisher registration and responsible-editor fields remain unverified in production environment variables.

**Single biggest systems problem:** Production build and CI do not consistently exercise the Payload-canonical content path.

---

## Verification run (2026-07-20)

| Command | Result |
|---|---|
| `node scripts/verify-canonical-workspaces.mjs` | Pass (8 workspaces) |
| `pnpm verify:static` | Pass |
| `node scripts/route-matrix.mjs` | Pass (153 routes → `docs/audits/route-matrix.csv`) |
| Git HEAD | `d5b6794` on `main` |
| Live `/about`, `/privacy`, `/ethics` | 200 |
| Live `/en/ne` | 404 (correct) |

Pending on connected machine: full `pnpm test`, `pnpm build:web`, `pnpm build:admin`, `pnpm test:e2e`, Payload admin deploy verification.

---

## Evidence table

| ID | Page/flow | Viewport | Evidence | Severity | User harm | Root cause | Required fix | Verification |
|---|---|---|---|---|---|---|---|---|
| A1 | Public homepage content | all | Live site shows starter seed stories; `resolveSource()` previously skipped Payload at build | P0 | Readers see demo inventory; CMS publishes may not appear | `CONTENT_SOURCE` not payload on Vercel; build bypass removed in this pass | Wire Payload env; deploy admin; contract tests | Publish in Payload → appears on reader ≤60s |
| A2 | Footer publisher block | all | `PUBLICATION.*` defaults contain "pending verification" | P0 | Trust erosion if shown | Missing launch env vars | Set verified `NEXT_PUBLIC_*` or keep hidden via `isPublicPublicationValue` | Footer shows real DoIB only when configured |
| A3 | Trust routes | all | `/about`, `/privacy`, `/ethics` return 200 | P1 | Was 404 | Fixed in prior pass | Add `e2e/routes-trust.spec.ts` | Playwright green |
| A4 | Locale `/en/ne` | all | HTTP 404 | P1 | Was malformed URL | Middleware allowlist | e2e malformed path tests | Playwright green |
| A5 | Notification desk copy | all | Previously exposed "provider configuration" | P1 | Implementation jargon on reader UI | NotificationCenter copy | Reader-safe messaging (fixed) | Public surface audit |
| A6 | Homepage modules | desktop/mobile | Same lead in breaking + sections on live | P2 | Repetitive, unprofessional IA | No cross-module dedup | `dedupeHomepage()` (fixed) | Unit + e2e ticker test |
| A7 | Dual admin | admin | Payload + web `/admin` | P2 | Editor confusion | ADR-014 by design | Redirect article CRUD to Payload (already implemented) | Manual admin audit |
| A8 | CI topology | CI | `CONTENT_SOURCE=json` in Playwright | P1 | Production regressions undetected | E2E uses dev store | Optional payload-integration job | CI workflow |
| A9 | Utility strip NEPSE/forex | desktop | Live shows unavailable | P2 | Incomplete utility product | Missing upstream adapter/keys | Normalize provider layer; hide when empty | Utility page audit |
| A10 | Ad slots | all | Reserved sizes when mode on | P2 | Layout shift / placeholder feel | AdSlot min-heights | Collapse when `ads mode=off` | `audit:ads` + visual check |

---

## Design critique (summary)

- **First impression:** Devanagari-first masthead reads as a news brand, not SaaS; homepage still feels repetitive when dedup is absent.
- **Hierarchy:** Lead + secondary + latest rail structure is sound; breaking ticker must not duplicate lead.
- **Typography:** Mukta/Noto + Source Sans 3 appropriate; verify long Nepali headlines at 360px.
- **AI tells:** Public surface audit passes; watch eyebrow density in admin-only surfaces.
- **Accessibility:** Skip link and landmarks present in PublicShell; axe suite exists.
- **Nielsen heuristics (0–4):** Visibility 3, Match 3, Control 3, Consistency 3, Error prevention 2, Recognition 3, Flexibility 2, Minimalist 2, Error recovery 3, Help 3.

---

## Systems critique (summary)

| Area | Status |
|---|---|
| Content model | Documented in `docs/content-model.md`; Payload canonical per ADR-014 |
| CMS lifecycle | Payload workflow defined; web shadow store blocked when canonical |
| Localization | ne root / en prefix; `swapLocale()` preserves path |
| Search | Postgres FTS; Meilisearch planned |
| Security | Launch gate, rate limits, origin checks present |
| SEO | Sitemaps, JSON-LD components exist; validator pass pending |
| Tests | Unit + e2e + a11y; payload integration missing |
| Observability | Cron probes defined; full dashboards pending |

---

## Competitor pattern study (abstract principles only)

| Pattern | Onlinekhabar / Ratopati / eKantipur | Nagarik Watch response |
|---|---|---|
| Nav density | Many section links + utilities | Cap primary nav at 6–8; mega menu for rest |
| Homepage | Lead + grids + trending sidebars | Lead package + latest rail + desk modules with dedup |
| Article | Dense ads, social widgets | Calm measure, labeled ads, trust block first |
| Utilities | Prominent market/weather strips | Show only when data healthy with source + freshness |
| Trust footer | Registration, contact, policies | Hide unverified fields; link complete policy set |

---

## Remediation completed in this pass

1. Removed Payload build-time bypass in `apps/web/lib/content/index.ts`
2. Added `dedupeHomepage()` and homepage integration
3. Reader-safe notification copy
4. Route matrix script + CSV (`153` routes)
5. `e2e/routes-trust.spec.ts` for policy and malformed paths
6. Playwright laptop (1024×768) and narrow mobile (360×800) projects

---

## Remaining blockers

1. Deploy Payload CMS (`apps/admin`) with Postgres + blob adapter
2. Configure production reader env (`CONTENT_SOURCE=payload`, secrets per `launch-gate.mjs`)
3. Provide verified publisher legal metadata (DoIB, editor-in-chief, address)
4. Wire NEPSE/forex providers or remove from utility strip until ready
5. Run full CI + e2e on connected environment and attach evidence to FINAL DELIVERY REPORT
