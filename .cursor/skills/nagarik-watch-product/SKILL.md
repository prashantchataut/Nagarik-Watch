---
name: nagarik-watch-product
description: >-
  Nagarik Watch product and UX rules for public vs admin surfaces, auth roles
  (reader/journalist/admin), launch readiness, and non-hardcoded content.
  Use when editing the news portal UI, auth, nav, launch banners, bookmarks,
  or publishing-related env/copy.
---

# Nagarik Watch product preferences

## Public vs developer surfaces

- Never show launch-readiness / preview-deployment checklists, CMS env labels, or Auth URL chips on public reader pages.
- Launch diagnostics live only under `/admin/launch` (newsroom session required).
- Do not put “pending verification” phone, address, legal, or registration placeholders in the public footer. Gate with `isPublicPublicationValue()` or equivalent.

## Accounts and roles

- One Better Auth user table; differentiate by `role` (default `reader`).
- Public sign-up cannot set newsroom roles (`input: false` on role).
- Readers: `/auth/login`, `/auth/signup`, `/saved`, `/reader-corner`, profile.
- Journalists/contributors: same account + elevated role; desk at `/journalist/*`. New accounts need an editor invite via `/admin/users` (or accept-invite flow) — explain that on journalist login; still offer “Create an account” → reader signup.
- Admin ops: `/admin/*` for newsroom roles; staff accounts are provisioned, not self-serve from public UI.
- Nav must expose a clear Account / Sign in entry (desktop masthead + mobile drawer).

## Auth UX

- Reader login/signup include a “Continue with Google” control; keep it disabled until `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` and real Better Auth Google providers are wired — no fake OAuth.
- Prefer env-driven feature flags for providers and publication identity. No hardcoded demo article lists in saved/history UI.
- Bookmarks and reading history come from device store + `/api/bookmarks` / `/api/reading` — never invent demo rows.

## Deploy / runtime

- Production needs a reachable `DATABASE_URL` (Postgres) for auth; ENOTFOUND → 503.
- Prefer `CONTENT_SOURCE=payload` when CMS is live; JSON store may boot preview without it, but empty CMS inventory is not a launch.
- Manifest `id` must be path-relative (`/`) so preview hosts stay same-origin.

## Copy tone

- Public empty states: honest (“No saved stories yet”), never fake seed news framed as user data.
- Staff links in footer may remain; primary chrome is reader-first.
