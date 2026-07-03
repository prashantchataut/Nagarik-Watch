# ADR-008: Salvage from the AI-generated evaluation portal (rate-limit, validators, reader-session, JSON-LD, content model)

- **Status:** Reference — partially adopted
- **Date:** 2026-07-02
- **Decision owner:** Architect
- **Supersedes:** none

## Context

An autonomous agent built a complete standalone Next.js portal (Prisma/SQLite/NextAuth,
its own shadcn/ui set, no i18n) and staged it at the monorepo root, colliding with the
existing pnpm/Turborepo monorepo (`apps/web` + `apps/admin` + `packages/*`). Rather than
discard it wholesale, the genuinely net-new pieces were salvaged into the canonical apps.
Most of the portal duplicated what `apps/web` already had — often in a weaker form
(no i18n, ignoring the shared `@nagarikwatch/ui` tokens, hand-rolled admin instead of
Payload CMS).

## Decision

### Adopted (live in `apps/web`)

1. **`apps/web/lib/json-ld.ts`** — JSON-LD builders for the schema types `apps/web` was
   missing: **Breadcrumb, Person, FAQ, Speakable, ImageGallery, LiveBlogPosting,
   VideoObject**. (`apps/web` already emitted NewsArticle, Organization, WebSite +
   SearchAction; those were kept as-is.) Adapted to web's content model
   (`Author`/`Locale` from `@nagarikwatch/db`, `SITE_URL`).

2. **`apps/web/lib/rate-limit.ts`** — an in-memory per-process rate limiter with an
   `enforceRateLimit()` helper returning a 429 response. Zero dependencies; ready to call
   from any future public POST route. Note: in-memory ⇒ per-instance; swap for Redis in
   multi-instance prod (interface unchanged).

### Not yet adopted (preserved here as reference)

3. **API request validators (zod)** — the portal's `api-validators.ts` paired `zod`
   schema parsing with the rate limiter. `apps/web` currently has **no `zod` dependency**
   and **no public POST routes** (only one GET health route), so adopting it now would add
   a dependency nothing consumes. When the first public POST endpoint lands
   (newsletter / contact / tips / vote), add `zod` to `apps/web` and lift the pattern:
   ```ts
   // reference shape — do not import until zod is a web dependency
   export async function validateBody<T>(req: Request, schema: ZodSchema<T>) {
     const json = await req.json().catch(() => null)
     if (!json) return { error: NextResponse.json({ error: 'अमान्य JSON' }, { status: 400 }) }
     const parsed = schema.safeParse(json)
     if (!parsed.success) {
       const msg = parsed.error.errors.map((e) => e.message).join('; ')
       return { error: NextResponse.json({ error: msg || 'अमान्य इनपुट' }, { status: 400 }) }
     }
     return { data: parsed.data }
   }
   ```

4. **Server-side reader accounts (`reader-session.ts` / `reader-auth.ts`)** — a clean
   design using a **separate signed jose JWT cookie** for reader sessions, intentionally
   decoupled from staff NextAuth to avoid dual-instance cookie conflicts. This is genuinely
   net-new (`apps/web`'s reader features today are client-side localStorage only). **Not
   integrated** because it depends on a Prisma `reader` table and `@/lib/db` that the
   Payload-based data layer does not provide. When reader accounts become a real
   requirement, model `Reader`/`Bookmark`/`ReadingHistory`/`AuthorFollow` as Payload
   collections (keeping ADR-002/005) and port this JWT-cookie session verbatim — the
   jose design holds regardless of the backing store.

5. **Content model (`prisma/schema.prisma`)** — a detailed editorial schema (articles,
   authors, categories, tags, provinces, comments, polls, newsletter, breaking news,
   live-widget config, contacts, tips, corrections, audit log, reader accounts). Useful as
   a **cross-check** against `docs/content-model.md` when adding Payload collections.
   **Not** promoted to a project data layer — ADR-002 (Payload) + ADR-005 (Postgres)
   remain canonical.

## Consequences

- One reader frontend (`apps/web`). The standalone portal is retired.
- New JSON-LD coverage and a ready rate-limiter, both verified against the real content
  types rather than the portal's Prisma-shaped guesses.
- Reader accounts and request validation are documented as the next steps, with the
   design already worked out, so they are a small lift when the requirement lands.
