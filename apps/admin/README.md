# @nagarikwatch/admin

**Payload CMS**, the editorial tool. Scaffolded as a stub in Phase 0; the real Payload
config (collections, globals, access policies, hooks) lands in Phase 0 Task 0.3 and Phase 2
per `docs/phase-2-tasks.md`.

## Status (Phase 0)

Placeholder. The Payload install + Postgres adapter + first `users` collection + admin UI
happen in Phase 0 Task 0.3 (`docs/phase-0-tasks.md`).

## What lives here (planned)

- `src/payload.config.ts`, root config (DB adapter, collections, globals, plugins)
- `src/collections/`, Articles, Categories, Authors, Tags, Media, AdSlots, Menus
- `src/globals/`, SiteSettings, Menus, BreakingTicker, AdsConfig
- `src/access/`, role-based access policies (editorial-workflow.md §1)
- `src/hooks/`, slug generation, source-attribution validation, publish webhook
- `migrations/`, Drizzle migrations (versioned)
- `seed/`, dev sample content

See `docs/content-model.md` (the schema) and `docs/editorial-workflow.md` (the rules).
