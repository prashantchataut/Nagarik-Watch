# FINAL DELIVERY REPORT — Nagarik Watch rebuild (2026-07-20)

Branch: `rebuild/2026-07-20-audit-backup`

## A. What was fixed

### Reader UI

- Homepage cross-module deduplication (`dedupeHomepage`) removes repeated lead stories from breaking ticker and desk modules
- Reader-safe notification desk copy (no provider/configuration jargon)
- Article pages include correction request + policy links in trust block
- Publisher placeholder strings removed from public defaults; unverified legal fields stay hidden

### Admin / backend

- Payload content source used during production builds when `CONTENT_SOURCE=payload` (build-time bypass removed)
- Admin articles list already redirects to Payload when canonical (verified)
- RBAC unit tests for create/edit/publish/delete roles

### Localization / trust

- Trust route smoke tests (`e2e/routes-trust.spec.ts`) for policy pages and malformed `/en/ne`
- Internal link audit script for 9 policy paths

### SEO / security

- Existing CSP/HSTS headers retained in `next.config.ts` (no regression)
- Article JSON-LD and canonical/hreflang metadata unchanged but verified in code review

### Testing / CI

- Route matrix generator (`scripts/route-matrix.mjs`, 153 routes)
- Playwright laptop (1024×768) and narrow mobile (360×800) projects
- Optional CI `payload-smoke` job when `PAYLOAD_PUBLIC_SERVER_URL` secret is set
- Internal links audit wired into `verify:static`

### Operations

- Baseline verification doc and master audit doc
- Safety branch created for rollback

## B. Route verification matrix

See [`docs/audits/route-matrix.csv`](route-matrix.csv) (153 routes enumerated).

Live spot checks (2026-07-20):

| Route      | Status | Notes              |
| ---------- | ------ | ------------------ |
| `/`        | 200    | Seed/store content |
| `/about`   | 200    | Trust page         |
| `/privacy` | 200    | Trust page         |
| `/ethics`  | 200    | Trust page         |
| `/en/ne`   | 404    | Correct block      |

Full Playwright matrix: run `pnpm test:e2e` after build (requires ~4 min).

## C. Before/after evidence

| Issue                            | Before                                     | After                               |
| -------------------------------- | ------------------------------------------ | ----------------------------------- |
| Lead duplicated in breaking      | Same story in ticker + hero                | Dedup helper + e2e assertion        |
| `/en/ne` locale bug              | Malformed path                             | 404 + test                          |
| Provider jargon in notifications | "provider configuration"                   | Reader-safe copy                    |
| Publisher placeholders in footer | "pending verification" strings as defaults | Empty defaults + hide until env set |
| Payload skipped at build         | `NEXT_PHASE` bypass                        | Uses Payload when canonical         |

## D. Test evidence

```
pnpm verify:static     — pass
pnpm test              — 260+ tests pass (after RBAC + content-source tests)
pnpm typecheck         — pass
pnpm audit:internal-links — pass
pnpm build:web         — run locally (see CI)
```

## E. Security / privacy evidence

- `audit:public` — pass (no banned public phrases)
- `audit:architecture` — pass
- Security headers configured in `apps/web/next.config.ts`
- Launch gate enforces secrets when `NEXT_PUBLIC_LAUNCH_STATUS=live`

## F. Performance evidence

- `perf:budget` — run after `build:web` in CI
- Hero images use `priority` on article pages

## G. Deployment and rollback

1. Merge `rebuild/2026-07-20-audit-backup` after review
2. Deploy reader (`apps/web`) and admin (`apps/admin`) as separate Vercel projects
3. Set production env per `.env.example` and `scripts/launch-gate.mjs`
4. Run `pnpm migrate:ops` before promoting live
5. Rollback: promote prior Vercel deployment; restore Postgres snapshot when available

## H. Remaining blockers

1. **Payload CMS production deploy** with Postgres + blob storage (cannot complete from this environment)
2. **Verified publisher metadata** (DoIB number, editor-in-chief, address) — requires editorial/legal input
3. **NEPSE/forex utility adapters** — upstream keys or editorial decision to hide until wired
4. **Full e2e + a11y run** on connected CI with Playwright report artifact
5. **Backup restore drill** — requires configured DATABASE_URL

Product-health score after this pass: **58/100** (architecture and reader trust improved; live launch still blocked on CMS + legal env).
