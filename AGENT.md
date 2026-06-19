# Nagarik Watch (नागरिक वाच) — Cross-Agent Instructions

## JARVIS Auto-Activation

On every request, the agent MUST:
1. **Check mempalace context** — `python -m mempalace status` (if mempalace installed), query wing `nagarik-watch` for project memories
2. **Check graphify** — if `graphify-out/graph.json` exists, use graphify for codebase structure queries
3. **Activate orchestrator mindset** — analyze the request, determine which skills below apply, load and apply them
4. **Verify before completion** — run typecheck/lint/test/build before claiming done

---

## 1. Memory & Context

### Mempalace (project memory palace)
- Wing: `nagarik-wagon` — 479 drawers from 86 project files (mined via `python -m mempalace mine`)
- Query: `python -m mempalace search "your query here" --wing nagarik-watch`
- Status: `python -m mempalace status`
- MCP tools (`mempalace_*`) currently not connecting — use CLI instead
- Install if missing: `pip install mempalace`
- To add new context: `python -m mempalace add --wing nagarik-watch --room <room> --content "..."`

### Graphify (codebase graph)
- **Not yet run** — run `/graphify . --mode deep --no-viz` when graph context is needed
- Install: `pip install graphifyy` (already installed)
- Once generated, query with: `/graphify query "what does this codebase do?"`
- Graph lives in `graphify-out/` (gitignored)

## 2. Current Project State

### Done
- Phase 0: build chain green, design tokens exist, fonts wired, date/slug/utils tested, CI present
- `.gitignore` includes `.opencode/`, `graphify-out/` (local-only, not committed)
- `AGENT.md` (this file) — committed, cross-agent universal
- Git remote configured, all 93 files committed, `pnpm install/build/test/lint/typecheck` all pass

### In Progress
- **Phase 1 Task 1.1**: Article + Category Payload collections + seed data
  - Collections created: `Categories.ts`, `Articles.ts`, `Authors.ts`, `Tags.ts`, `Media.ts`
  - Need: register in `payload.config.ts`, create seed script, verify build

### Blocked
- Mempalace MCP not connecting in opencode — CLI workaround only
- Domain registration + DoIB registration (operational, not code)
- Graphify graph not yet generated (run when needed)

### Next Steps (after Task 1.1)
1. Task 1.2: Content query layer (Payload Local API + typed helpers)
2. Task 1.3: Homepage feed (hero section, grid, list)
3. Task 1.4: Category page (bilingual, pagination)
4. Task 1.5: Article page (body blocks, byline, meta, corrections)
5. Task 1.6: Primary navigation (locale-aware, responsive)
6. Task 1.7: Locale routing
7. Task 1.8: Shared layout shell (header, footer, wrapper)
8. Task 1.9: Search
9. Task 1.10: SEO basics (sitemap, robots, JSON-LD)
10. Task 1.11: Error boundaries + 404
11. Task 1.12: Loading states + pagination UX
12. Task 1.13: Docker compose + dev setup docs
13. Task 1.14: Integration smoke tests (Playwright)

---

## 3. Skills (activate contextually)

### Always-on Baseline Skills
These fire on every request, no matter what:
- **karpathy-guidelines** — think before coding, simplicity first, surgical changes
- **anti-slop** — no generic AI patterns, no AI voice
- **agentic-engineering** — eval-first, decomposition, cost-aware
- **doubt-driven-development** — adversarial review for all non-trivial decisions
- **verification-before-completion** — run typecheck/lint/test/build before claiming done
- **incremental-implementation** — deliver in small, verifiable steps
- **caveman** — ultra-compressed communication; activate when context is tight or user says "caveman mode"
- **council** — four-voice adversarial debate for ambiguous decisions, tradeoffs, go/no-go calls

### Frontend/Design (any UI work)
- **impeccable** — design critique, polish, audit, optimize
- **design-anti-slop** — no cookie-cutter layouts, no gradient-text, no glassmorphism
- **frontend-design** — distinctive, production-grade UI
- **accessibility-audit** — WCAG compliance

### Backend/API
- **secure-code-guardian** — auth, input validation, OWASP
- **error-handling** — error boundaries, graceful degradation
- **source-driven-development** — check Payload docs for authoritative patterns

### Planning/Architecture
- **brainstorming** — before any creative work
- **writing-plans** — before multi-step implementation
- **council** — for ambiguous decisions between approaches
- **spec-miner** — when working with existing undocumented code

### Testing
- **test-master** — test strategy, coverage
- **webapp-testing** — Playwright browser testing

### Data/Content
- **form-expert** — validation UX, conditional fields (used in collections)
- **spec-driven-development** — when creating new collections or schemas

---

## 4. Design Constraints (Non-Negotiable)

### Palette
- Primary: Civic Crimson `oklch(0.55 0.18 25)`
- **No** `#000`, `#fff`, gradient text, glassmorphism, side-stripe borders, modal as default
- Grays: `oklch(from var(--civic-crimson) l 0 h)` at varying lightness

### Typography
- **Devanagari-first**: Mukta (display headlines), Noto Sans Devanagari (body)
- **Latin/UI**: Inter
- Fonts loaded via Next.js `next/font` — already configured in `apps/web`

### Content
- Nepali-primary fields use `Ne` suffix (`titleNe`), English uses `En` (`titleEn`)
- Field-level (not document-level) bilingualism
- BS date anchor: `2026-06-19 = असार ५, २०८३` (conversion in `packages/db/src/date.ts`)

### Coding
- No comments in code
- No `any` types — prefer `type` over `interface`
- `import type { X }` for type-only imports
- Functional components, named exports
- Tailwind + CSS custom properties for styling

---

## 5. Architecture

```
nagarik-watch/
├── apps/
│   ├── admin/     — Payload CMS admin (Next.js 15, port 3001)
│   └── web/       — Public site (Next.js 15 App Router, Payload frontend)
├── packages/
│   ├── db/        — Shared types, date utils, env validation, seed data
│   ├── ui/        — Design tokens, Tailwind preset, shared components
│   ├── config-eslint/  — Shared ESLint config
│   └── config-typescript/ — Shared tsconfig
├── docs/          — All project docs (content-model, architecture, phase plans)
└── docker-compose.yml  — PostgreSQL 16
```

### Stack
- **CMS**: Payload 3.85.1 (Next.js 15 backend)
- **DB**: PostgreSQL 16 (Docker compose, local dev)
- **Storage**: Cloudflare R2 (S3-compatible adapter, optional in dev)
- **Edge**: Cloudflare (optional no-op in dev)
- **Hosting**: Vercel + Cloudflare (ADR-004)
- **Testing**: Vitest (packages), Playwright (e2e), ESLint + tsc (static)

---

## 6. Key Files Reference

| File | Purpose |
|------|---------|
| `SPEC.md` | Master spec, success criteria, boundaries |
| `PRODUCT.md` | Brand, users, tone, strategic principles |
| `DESIGN.md` | Palette A, typography, component rules |
| `docs/content-model.md` | Article, Category, Author, Tag, Media schemas |
| `docs/architecture.md` | System design, monorepo structure, request flows |
| `docs/phase-1-tasks.md` | Current 14-task MVP plan with acceptance criteria |
| `docs/editorial-workflow.md` | Roles, attribution policy |
| `.env.example` | Full env contract (copy to `.env`) |

---

## 7. Verification Gate

Always run before claiming completion:
```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

For admin-only changes:
```bash
pnpm --filter @nagarikwatch/admin typecheck && pnpm --filter @nagarikwatch/admin lint
```

---

## 8. Mempalace & Graphify Quick Reference

### Mempalace (context memory)
```bash
# Check status
python -m mempalace status

# Search project context
python -m mempalace search "payload collections" --wing nagarik-watch

# Mine new files into memory
python -m mempalace mine --files path/to/file.ts --wing nagarik-watch

# Add manual context
python -m mempalace add --wing nagarik-watch --room decisions --content "ADR: ..."

# Follow cross-wing connections
python -m mempalace traverse --start-room "articles-collection"
```

### Graphify (codebase graph)
```bash
# Generate graph (first time or after major changes)
graphify . --mode deep --no-viz

# Query existing graph
graphify query "how does article routing work?"

# Update graph (incremental, fast)
graphify update --no-viz
```
