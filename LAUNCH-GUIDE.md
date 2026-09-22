# नागरिक वाच — Launch Guide

This is the short version. The maintained operator guide is
[`docs/launch-runbook.md`](./docs/launch-runbook.md) (topology, full env matrix,
soft → hard launch phases); the per-variable checklist is
[`docs/env-launch-checklist.md`](./docs/env-launch-checklist.md) and
[`.env.example`](./.env.example).

**Readiness is computed, not written down.** Run `pnpm launch:gate`, or open
`/admin/launch` on the Node host, and work the failing checks. Anything this
file claims that the gate contradicts — believe the gate: it reads the same
environment the app does (`apps/web/lib/launch-gate-core.ts`).

---

## 1. Database — Postgres

`apps/web/prisma/schema.prisma` is already `provider = "postgresql"`; there is
nothing to flip. Without `DATABASE_URL` the app falls back to an embedded PGlite
database, which is fine for local development and is **not** production-safe —
the launch gate fails on it.

1. Create a Postgres ([Neon](https://neon.tech), Vercel Postgres, Supabase…).
2. `DATABASE_URL="postgres://…" pnpm db:push` — auth and engagement tables.
3. `DATABASE_URL="postgres://…" pnpm migrate:ops` — the ops tables.
4. Optional demo newsroom data: `DATABASE_URL="postgres://…" pnpm seed`.
5. Set `DATABASE_URL` and `AUTH_AUTO_MIGRATE=false` on the deployment.

## 2. Media uploads

`POST /api/admin/media/upload` (staff-authenticated) writes through the first
backend that is configured, in this order:

1. **Cloudflare R2** — requires an `MEDIA_BUCKET` R2 binding on the Worker
   (add an `r2_buckets` entry to `apps/web/wrangler.jsonc`) plus
   `STORAGE_PUBLIC_BASE_URL` for the public object URL. The binding is what
   authenticates; there are no R2 API keys to set.
2. **Vercel Blob** — `BLOB_READ_WRITE_TOKEN`.
3. Local disk — development and E2E only.

Partial `STORAGE_*`/`S3_*` values without a public base URL fail the gate
rather than silently dropping uploads.

## 3. Site URL and auth origin

Set `NEXT_PUBLIC_SITE_URL` and `BETTER_AUTH_URL` to the production HTTPS origin.
These drive canonical URLs, OG tags, sitemap, RSS and the auth cookie domain;
the gate rejects `localhost` and plain HTTP once `NEXT_PUBLIC_LAUNCH_STATUS=live`.

## 4. Content authority

Soft launch runs on the JSON/Postgres desk (`CONTENT_SOURCE` unset or `json`).
Hard launch cuts over to Payload: `CONTENT_SOURCE=payload`, the `PAYLOAD_*`
variables, `REVALIDATE_SECRET`, and `PAYLOAD_DB_PUSH=false`. See ADR-014 in
`docs/adr/` and the cutover section of the runbook.

## 5. Origin topology

Reader → Cloudflare DNS/CDN → **Vercel Node** (`apps/web`). Do not point the
apex at the static Cloudflare Pages export: static export strips the API routes,
and `pnpm launch:origin` fails the build when it detects one. See ADR-004.

## 6. After the first deploy

- **Google Search Console** → verify the domain, submit `/sitemap.xml`.
- **Bing Webmaster Tools** (feeds DuckDuckGo) → import from GSC.
- **Google News Publisher Center** → articles already carry `NewsArticle`
  structured data.
- Validate OG once with the Meta Sharing Debugger.

## 7. Newsroom operations

Staff sign in at `/admin/login`; the desk is `/admin` — dashboard, articles,
submissions queue, live blogs, media library, ads, polls, comments, newsletter,
audit log, SEO, roles and the launch panel. Payload's own CMS UI is a separate
app (`apps/admin`).
