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

- **Launch origin (ADR-004):** Vercel Node for reader+API; Cloudflare for DNS/CDN only.
  Cloudflare Pages static `out` is preview-only (APIs stripped). See `docs/launch-runbook.md`.
- Production needs a reachable `DATABASE_URL` (Postgres) for auth; ENOTFOUND → 503.
- Prefer `CONTENT_SOURCE=payload` for **hard / live** launch (ADR-014). Soft preview may
  use Postgres `nw_articles` / JSON desk (`CONTENT_SOURCE` unset or `json`) with
  `NEXT_PUBLIC_LAUNCH_STATUS=preview`; empty CMS inventory is still not a launch.
- Manifest `id` must be path-relative (`/`) so preview hosts stay same-origin.

## Monetization (Option A — 2026-07-19)

- Public site is **free to read + ads**. Do not show membership CTAs, paywall notices,
  free-reads meters, or “Premium / सदस्य” gates on reader surfaces unless
  `NEXT_PUBLIC_MEMBERSHIP_PUBLIC=true`.
- Keep payment/admin paywall code dormant behind that flag; do not delete without an
  explicit request.
- Accounts remain optional for saved stories / history — never framed as a paywall.

## Cookies and consent

- Cookie banner + `/cookies` must use proper Devanagari (never mojibake `????`).
- Categories: necessary (always on), personalization, analytics (Plausible after consent), house ad measurement only — no Meta/Google pixels, no data sale.
- Consent cookies last up to 12 months; re-prompt when categories change.

## Article reader UX

- Article tools (bookmark, text size, reader focus, listen, share) stay visible in a sticky bar — not buried in a collapsed menu at the bottom.
- Body copy must use `.reading-scale` so font-size controls work.
- Listen uses Web Speech API; pick Nepali/Hindi/Devanagari voices when available and show an honest hint when falling back or missing.
- Reader mode toggles `reader-focus-mode` on `html`/`body`: quieter chrome, hide topics/noise, narrower column — not a gimmick toggle with no CSS.
- Soften radii (`--radius-*`); avoid pure black text on light surfaces — use token ink/muted pairs; brand CTAs use `text-paper` on crimson/ink fills.

## Admin / static Pages

- Public Pages export cannot host the full OpenNext admin desk (APIs stripped; Worker often over Free 3 MiB gzip).
- `/admin` on static hosts shows a clear gateway (set `NEXT_PUBLIC_ADMIN_APP_URL` or Workers Paid / slim desk) — never “not enough data” wording.

## Copy tone

- Public empty states: honest (“No saved stories yet”), never fake seed news framed as user data.
- Staff links in footer may remain; primary chrome is reader-first.
- No em dashes in reader-facing UI copy (impeccable ban).
