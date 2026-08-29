# Hard-launch operator checklist (Payload + live flip)
# Do not invent DoIB / legal / contact values. Do not flip live until green.

## Deploy Payload (nagarik-watch-admin)

**Status (2026-08-15):** Production deployment exists at
`https://nagarik-watch-admin.vercel.app`. Domain `admin.nagarikwatch.com` is attached
to the project. `/healthz` currently returns 503 until operator sets `DATABASE_URL`,
`PAYLOAD_SECRET`, Blob, and related env (see below).

1. In Vercel project settings for `nagarik-watch-admin`:
   - Prefer Root Directory: `apps/admin`
   - Framework: Next.js
   - Or deploy from monorepo root with build `pnpm --filter @nagarikwatch/admin build`
   - Node: 22.x
2. Domain `admin.nagarikwatch.com` is already on the project (confirm DNS if healthz is unreachable by hostname).
3. Env (Production):
   - `DATABASE_URL` (same Postgres as web; prefer pooler URL)
   - `PAYLOAD_SECRET` (≥32)
   - `PAYLOAD_PUBLIC_SERVER_URL=https://admin.nagarikwatch.com`
   - `PAYLOAD_DB_PUSH=false`
   - `NEXT_PUBLIC_SITE_URL=https://www.nagarikwatch.com`
   - `REVALIDATE_SECRET` (shared with web, ≥32 chars)
   - Attach Vercel Blob store → `BLOB_READ_WRITE_TOKEN` (required in production)
4. Apply Payload migrations: `DATABASE_URL=... pnpm --filter @nagarikwatch/admin migrate`
   (includes `20260816_001000_editorial_delivery_hardening`)
5. Deploy; confirm `https://admin.nagarikwatch.com/healthz`

## Editorial path (Payload canonical)

1. **Upload media** in Payload Media: JPEG/PNG/WebP/AVIF ≤8MB, required alt + credit.
2. **Draft** via journalist desk (bridge) or Payload Articles. Journalist saves cannot rewind
   stages past draft once editors advance the CMS stage.
3. **Review** in Payload: workflow graph is enforced; review timestamps auto-set on stage entry.
4. **Schedule:** set future `publishAt` + Publish → stage becomes `scheduled`. Readers do **not**
   see scheduled rows until cron promotes to `published`.
5. **Publish / update:** Payload Publish with hero image; English `englishStatus=published`
   requires `titleEn` + `bodyEn`. Sidebar shows `readerRevalidateStatus` after webhook.
6. **Unpublish / retract / delete:** move to `archived`/`retracted` or hard-delete. Both bust
   reader caches via signed `/api/revalidate` (`article.changed` or `article.deleted`).

## Cut web to Payload (still preview)

1. Web env: `CONTENT_SOURCE=payload`, `PAYLOAD_PUBLIC_SERVER_URL`, `PAYLOAD_API_TOKEN`, `REVALIDATE_SECRET`
2. Keep `NEXT_PUBLIC_LAUNCH_STATUS=preview`
3. `pnpm migrate:desk-to-payload` then `-- --apply` (uploads transferable heroes); set `DESK_TO_PAYLOAD_MIGRATED=true`
4. Confirm web `/api/health` → `status=ok`, `contentMode=payload`
5. Confirm `/api/health/ready` → 200
6. Confirm desk `/api/admin/articles/*` and `/api/admin/media*` return 409 (no dual-write)

## Emergency fallback (`CONTENT_SOURCE=json`)

Use only when Payload is down **and** `nw_articles` still holds a usable corpus.

1. Set web `CONTENT_SOURCE=json` explicitly and redeploy. Do **not** dual-write to Payload.
2. Desk uploads/edits write `nw_articles` / `nw_media_items` only.
3. Media URL registrations require `https://` (or `http://localhost` in non-production).
4. After Payload recovers: migrate desk delta if needed, then restore `CONTENT_SOURCE=payload`.

## Flip live (only when /admin/launch has zero fails)

1. Verified legal env (operator-owned)
2. `STAFF_MFA_ENABLED=true`, Turnstile keys, `PARTNER_FEED_TOKENS`, `SUBMISSION_IP_SALT`, Sentry DSN
3. Cron 48h green window
4. `NEXT_PUBLIC_LAUNCH_STATUS=live pnpm launch:gate` → exit 0
5. Set `NEXT_PUBLIC_LAUNCH_STATUS=live` on Vercel web project and redeploy
6. Run first-hour checks in `docs/launch-runbook.md`
