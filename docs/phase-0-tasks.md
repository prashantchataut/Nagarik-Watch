# Phase 0, Foundation & planning artifacts

> Goal: lock the plan, stand up the repo + tooling, secure the operational pre-requisites.
> **No reader-facing app code ships here**, this phase de-risks everything that follows.
> Governed by planning-and-task-breakdown: vertical slices, S/M tasks (≤5 files), explicit
> acceptance criteria + verification, checkpoints.

## Overview

Phase 0 turns the approved plan into a working monorepo with CI, the design tokens
encoded, dependencies installed, environments wired, and the operational gates (domain,
DoIB registration started, accounts) in motion. When Phase 0 ends, Phase 1 starts from a
clean, building, lint-green, CI-passing foundation.

## Architecture decisions active this phase
- All decisions in `docs/adr/ADR-001..006` are the reference; nothing here overrides them.
- ADR-004 (origin) is **intentionally deferred**, Phase 0 work is origin-agnostic., -

## Task list

### Task 0.1: Monorepo scaffolding
**Description:** create the pnpm + Turborepo workspace structure with the three apps and
three packages, base tsconfig, and a clean first build.
- **Acceptance:**
  - [ ] `apps/web`, `apps/admin`, `packages/{db,ui,ingest}` exist and are workspace members.
  - [ ] `pnpm install` runs clean; `pnpm -v` ≥ 9.
  - [ ] Root `turbo.json` defines `build`, `dev`, `lint`, `typecheck`, `test` pipelines.
  - [ ] `tsconfig.base.json` (strict) extended by each workspace.
- **Verify:** `pnpm install && pnpm turbo run build` exits 0 (even if apps are stubs).
- **Dependencies:** none.
- **Files:** `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, per-package `package.json`/`tsconfig.json`.
- **Size:** M.

### Task 0.2: Next.js web app shell
**Description:** initialize `apps/web` with Next.js 15 App Router + TypeScript + Tailwind,
running on the standard dev port.
- **Acceptance:**
  - [ ] `pnpm, filter web dev` serves a stub homepage at `localhost:3000`.
  - [ ] App Router layout under `app/[locale]/` with `ne` and `en` locale folders.
  - [ ] Tailwind configured, `globals.css` imported.
- **Verify:** manual load of `/` and `/en`; `pnpm, filter web build` succeeds.
- **Dependencies:** 0.1.
- **Files:** `apps/web/{package.json, next.config.ts, tailwind.config.ts, tsconfig.json, app/**, postcss.config.cjs}`.
- **Size:** M.

### Task 0.3: Payload CMS admin app shell
**Description:** initialize `apps/admin` with Payload 3 (Next.js-integrated), Postgres
adapter configured, a single `users` collection, and the admin UI reachable.
- **Acceptance:**
  - [ ] `pnpm, filter admin dev` serves Payload admin at `/admin`.
  - [ ] Postgres connection works (local or containerized).
  - [ ] First admin user can be created and can log in.
- **Verify:** log in to `/admin` and see the dashboard.
- **Dependencies:** 0.1; a local Postgres (Docker compose).
- **Files:** `apps/admin/{package.json, src/payload.config.ts, src/collections/Users.ts, next.config.ts, docker-compose.yml (root)}`.
- **Size:** M.

### Task 0.4: Design tokens package + Tailwind preset
**Description:** encode the chosen palette (from DESIGN.md, once picked) as CSS variables
in `packages/ui` and expose a Tailwind preset that web consumes.
- **Acceptance:**
  - [ ] `packages/ui` exports `tokens.css` (OKLCH vars for brand/ink/surface/rule/etc.)
    and `tailwind-preset.js`.
  - [ ] Web app consumes the preset and a test element renders in `brand` color.
  - [ ] No `#000` / `#fff` anywhere, all neutrals are tinted.
- **Verify:** a temporary page renders a `bg-brand` element; computed color is the OKLCH value.
- **Dependencies:** palette decision (ask founder); 0.2.
- **Files:** `packages/ui/{package.json, src/tokens.css, src/tailwind-preset.ts, src/index.ts}`, `apps/web/tailwind.config.ts`.
- **Size:** M.

### Task 0.5: Devanagari + Latin fonts wired
**Description:** self-host Noto Sans Devanagari, Mukta, and Inter (OFL) and wire them
through `next/font` with proper `font-display` and a Devanagari-appropriate line-height
baseline.
- **Acceptance:**
  - [ ] Fonts load from local files (no Google Fonts runtime request), privacy + perf.
  - [ ] A Nepali paragraph renders in Noto Sans Devanagari with correct matras; an English
    paragraph renders in Inter.
  - [ ] Lighthouse "Eliminate render-blocking" shows no external font hosts.
- **Verify:** visual check of a bilingual stub page; network tab shows no fonts.googleapis.com.
- **Dependencies:** 0.2.
- **Files:** `apps/web/app/fonts.ts`, `apps/web/styles/globals.css`, font files in `apps/web/public/fonts`.
- **Size:** S.

### Task 0.6: Date / i18n / slug helpers (in `packages/db` + `apps/web/lib`)
**Description:** build and unit-test the core helpers everything depends on: BS/AD date
conversion, locale-aware date formatting, Devanagari numeral formatting, Latin slug
transliteration from Devanagari.
- **Acceptance:**
  - [ ] `formatDate(iso, 'ne')` returns a BS string with Devanagari numerals; `'en'`
    returns AD with Latin numerals.
  - [ ] `toSlug("नेपाली राजनीति")` returns a stable lowercase Latin slug.
  - [ ] Unit tests cover edge cases (matras, conjuncts, leading/trailing spaces).
- **Verify:** `pnpm test` green for these helpers.
- **Dependencies:** 0.1.
- **Files:** `packages/db/src/{date.ts, slug.ts, numerals.ts}`, `packages/db/src/__tests__/*`.
- **Size:** M.

### Task 0.7: Lint/format/typecheck + CI
**Description:** ESLint (Next + Payload configs), Prettier, strict TS, and a GitHub
Actions workflow that runs install/lint/typecheck/test on every PR.
- **Acceptance:**
  - [ ] `pnpm lint`, `pnpm format:check`, `pnpm typecheck` all green on a clean repo.
  - [ ] `.github/workflows/ci.yml` runs the matrix on push + PR; fails the build on red.
  - [ ] `eslint-config-prettier` applied (no lint-vs-format conflicts).
- **Verify:** open a PR with a lint error; CI fails. Fix it; CI passes.
- **Dependencies:** 0.1–0.3.
- **Files:** `.eslintrc`, `.prettierrc`, `.github/workflows/ci.yml`, root `package.json` scripts.
- **Size:** M.

### Task 0.8: Environments, secrets hygiene, `.env.example`
**Description:** define the env var contract for web + admin; ship `.env.example`; wire a
tiny typed env loader (zod-validated) so missing/invalid env fails fast at boot.
- **Acceptance:**
  - [ ] `.env.example` documents every var (DB url, payload secret, R2 keys, etc.).
  - [ ] `.gitignore` excludes `.env*` (except `.env.example`).
  - [ ] Apps fail to boot with a clear error if a required env var is missing/invalid.
- **Verify:** delete `DATABASE_URL`, run `dev`; it refuses to start with a named error.
- **Dependencies:** 0.2, 0.3.
- **Files:** `.env.example`, `.gitignore`, `packages/db/src/env.ts` (shared validator).
- **Size:** S.

### Task 0.9: Domain + DNS + Cloudflare account (operational)
**Description:** register `nagarikwatch.com` (+ `.com.np` if a Nepali entity exists),
point nameservers to Cloudflare, set up the account, and create R2 + API tokens.
- **Acceptance:**
  - [ ] Domain registered; DNS resolves; Cloudflare is authoritative.
  - [ ] R2 bucket created; scoped API tokens stored in the secret store (not in repo).
  - [ ] Email forwarding (e.g. `editor@`, `tips@`) configured.
- **Verify:** `dig nagarikwatch.com` shows Cloudflare nameservers; a test file is readable
  from R2 via its public URL.
- **Dependencies:** none (parallel to code tasks).
- **Files:** none in repo; credentials in the host/CI vault. Note completion in `docs/ops-runbook.md` (created Phase 5).
- **Size:** S (operational).

### Task 0.10: DoIB registration kick-off (operational)
**Description:** begin Nepal's Department of Information & Broadcasting online media
registration (requires company registration first). This is a business task; track it
here because it gates public launch.
- **Acceptance:**
  - [ ] Company registration initiated (if not already a registered entity).
  - [ ] DoIB application submitted (NPR 5,000 fee).
  - [ ] Press Council Nepal listing requested.
- **Verify:** application reference numbers recorded in `docs/ops-runbook.md`.
- **Dependencies:** none (parallel; lead time is weeks).
- **Files:** none in repo.
- **Size:** operational.

### Task 0.11: Confirm seed categories + masthead wordmark direction
**Description:** finalize the seed Category list (content-model.md open item) and pick the
masthead lockup treatment (DESIGN.md open question) with the founder.
- **Acceptance:**
  - [ ] Seed Category list written into `docs/content-model.md` (Phase 0 update).
  - [ ] Masthead lockup decision recorded in `DESIGN.md` decision log.
- **Verify:** founder sign-off in the doc.
- **Dependencies:** none.
- **Files:** `docs/content-model.md`, `DESIGN.md`.
- **Size:** S., -

## Checkpoint: Phase 0 → Phase 1 gate
- [ ] `pnpm install && pnpm turbo run build && pnpm test && pnpm lint` all green.
- [ ] Web stub renders in both locales with the chosen palette and Devanagari fonts.
- [ ] Payload admin reachable; one user can log in.
- [ ] `.env.example` complete; missing-env fails fast.
- [ ] Domain + Cloudflare + R2 ready.
- [ ] DoIB application submitted.
- [ ] **ADR-004 (origin hosting) decision made** from the latency probe + ops budget, this is a hard gate before Phase 1 deploy.
- [ ] Founder review of the foundation set (PRODUCT/DESIGN/SPEC/architecture/ADRs).

## Risks this phase surfaces
| Risk | Mitigation |
|, -|, -|
| Founder hasn't picked a palette | Gate Task 0.4; default to DESIGN.md recommended (Civic Crimson) if undecided by Phase 1 |
| DoIB rejects the name (ADR-001 trigger) | Reopen ADR-001; fall back to the documented rename path |
| Origin probe shows Nepal latency poor on managed origin | Lean to ADR-004 Option C/B |
