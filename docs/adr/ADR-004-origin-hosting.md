# ADR-004: Origin hosting — Vercel Node + Cloudflare edge

- **Status:** Accepted
- **Date:** 2026-08-02
- **Decision owner:** Founder + Architect
- **Supersedes:** deferred framework of 2026-06-18

## Context

Next.js App Router requires a Node origin. Cloudflare Pages static `apps/web/out` strips
`app/api` and `app/admin` and cannot host auth, engagement, comments, polls, contact, or
cron. Workers Free also rejects the full OpenNext bundle (~3 MiB gzip vs 3 MiB limit).

Nepali readers are served primarily from the Cloudflare edge on cache HIT; origin location
matters mainly on MISS. Solo-ops burden dominates over in-country origin preference.

## Decision

**Option A (with CF edge):** 

| Layer | Choice |
|-------|--------|
| Public reader + API + Better Auth + ops | **Vercel** (Node Next.js) |
| Edge / DNS / WAF / CDN | **Cloudflare** (proxied CNAME to Vercel) |
| CMS | **Payload** (`apps/admin`) on its own host (same or sibling Vercel project) |
| Postgres | Managed (Neon / Supabase) shared by web + Payload |
| Media | Vercel Blob and/or R2 with public base URL |

**Cloudflare Pages static `out` is not the launch origin.** It may remain a preview/mirror
only. Declaring `NEXT_PUBLIC_LAUNCH_STATUS=live` while apex points at static Pages is a
launch failure mode.

See `docs/CLOUDFLARE-DOMAIN.md` and `docs/launch-runbook.md`.

## Consequences

- **Positive:** Full product surface works (APIs, auth, engagement, cron, revalidate).
- **Positive:** Matches existing launch gate (`CONTENT_SOURCE=payload`, Postgres, email).
- **Negative:** Apex DNS must target Vercel, not Pages; CF static deploys must not be
  mistaken for production.
- **Negative:** Payload down ⇒ public content down until failover is designed (out of
  soft-launch scope).

## Rejected for launch

- **Option B (Nepal VPS)** — deferred unless data residency becomes mandatory.
- **Workers Free full app** — size-blocked.
- **Hybrid static HTML + separate API host** — extra split complexity; not chosen.

## Follow-ups

- Soft → hard launch phases: `docs/launch-runbook.md`
- Cutover checklist: `apps/web/lib/content/payload-cutover.ts` + `/admin/launch`
