# Admin override

Overrides `MASTER.md` for `/admin/*` newsroom operations.

## Register

**Restrained desk**: Civic Crimson accents, flat surfaces, readable tables. Functional density without consumer-marketing chrome.

## Structure

1. **AdminShell** owns the visible page title (topbar H1). Pages use `AdminPageHeader` for subtitle/eyebrow/action only — do not duplicate loud page titles.
2. Section headings: `admin-section-title` (h2/h3 inside panels), not `text-h1` / `text-display`.
3. KPI numbers: `admin-metric-grid` + `AdminMetric` — not `font-display text-display` inside `AdminCard`.
4. Data tables: `AdminTable` / `admin-table` — not raw bordered `<table>` stacks.
5. CTAs: `AdminButton` / `admin-button` — no `rounded-full` pill buttons.
6. Status: square `admin-status` / `StatusBadge` / `OpsCheckBadge` — no rainbow pill clusters.
7. Tables and forms on `--surface-raised` with `--rule` borders.
8. Launch diagnostics only here, never on public reader pages.

## Primitives

Import from `apps/web/components/admin/primitives.tsx`: `AdminCard`, `AdminPageHeader`, `AdminButton`, `AdminFilterLink`, `AdminCallout`, `AdminMetric`, `AdminTable`, `StatusBadge`, `OpsCheckBadge`, form fields.

## Anti-patterns

- Public launch checklist leaking to reader routes
- Rainbow status pills as default
- Identical card grids for unrelated metrics
- Side-stripe cards as the only affordance (left accent bars are admin-only; keep minimal)
- Duplicating shell H1 on page content

## Motion

Subtle. No decorative motion on data tables.
