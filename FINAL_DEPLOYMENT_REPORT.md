# Final deployment remediation

## Root cause fixed
Vercel used `pnpm install --frozen-lockfile`, but `apps/cms/package.json` had no matching `apps/cms` importer in `pnpm-lock.yaml`. The lockfile still used the former `apps/admin` path. The importer is now renamed to `apps/cms` and contains every dependency and devDependency specifier from the CMS package.

## Build and routing repairs
- Pinned Node to `22.x` and pnpm to `10.17.1`.
- Restored a valid root App Router layout.
- Removed nested html/body elements from the admin layout.
- Restored locale-aware public home, category, article, latest and trending pages.
- Added dedicated utility routes for calendar, date conversion, Preeti/Unicode, currency, age and units.
- Added live sports and disaster alert pages with honest unavailable states.
- Added durable Postgres-backed engagement storage with guarded build-time database access.
- Added CI frozen-lockfile, static audit, typecheck and web build gates.

## Verification available in this environment
- Public-surface audit: pass
- Advertisement-placement audit: pass
- Architecture audit: pass
- TypeScript parser scan: pass

A dependency-backed Next.js build could not be executed here because registry access is unavailable and node_modules are not present. The exact Vercel install failure shown by the user is fixed at its source in the lockfile importer.
