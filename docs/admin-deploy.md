# Payload CMS and web application deployment

Nagarik Watch deploys as two applications from one repository:

| Project    | Root                               | Purpose                                                            |
| ---------- | ---------------------------------- | ------------------------------------------------------------------ |
| Reader/web | `apps/web` (or root Vercel config) | Public portal, Better Auth, journalist desk, operations admin      |
| Newsroom   | `apps/admin`                       | Payload CMS, editorial workflow, media and public content REST API |

Payload is the canonical production content source. The web app reads the separately
deployed CMS through server-side REST requests; it does not import `@payload-config`.

## 1. Provision shared infrastructure

Provision managed Postgres with backups and point-in-time recovery. Both applications need
`DATABASE_URL`: Payload owns editorial tables while the web app uses the same database for
Better Auth and namespaced `nw_*` operational tables.

Provision durable media storage before editors upload production media. The canonical
`apps/admin` deployment is currently wired to Payload's **Vercel Blob** adapter, not a generic
S3 adapter. Attach a Blob store to the Payload Vercel project so that project receives
`BLOB_READ_WRITE_TOKEN`. Merely setting `STORAGE_ENDPOINT` / `STORAGE_BUCKET` does not wire
Payload uploads in the current codebase. If R2/S3 is preferred later, add and test the matching
Payload storage adapter first.

## 2. Deploy Payload (`apps/admin`)

Required values:

- `DATABASE_URL`
- `PAYLOAD_SECRET` (unique, at least 32 random characters)
- `PAYLOAD_PUBLIC_SERVER_URL=https://admin.example.com`
- `PAYLOAD_DB_PUSH=false`
- `NEXT_PUBLIC_SITE_URL=https://example.com`
- `REVALIDATE_SECRET` shared with the web project
- `BLOB_READ_WRITE_TOKEN` injected by the Blob store attached to **this Payload project**

Apply migrations before or during the controlled deployment:

```bash
DATABASE_URL="<production-url>" pnpm --filter @nagarikwatch/admin migrate
```

Create the first super-admin through Payload's first-user flow. Then create newsroom users
with the minimum required roles.

For the journalist bridge, create a dedicated Payload user, enable its API key, grant only
article-create access, and place the key in the web project's `PAYLOAD_API_TOKEN`. Each
journalist also needs an active Authors document whose email matches the Better Auth account.

## 3. Deploy the web application

Required values include:

- `DATABASE_URL`
- `AUTH_SECRET`, `BETTER_AUTH_SECRET`, `REVALIDATE_SECRET`
- `CONTENT_SOURCE=payload`
- `PAYLOAD_PUBLIC_SERVER_URL=https://admin.example.com`
- `PAYLOAD_ADMIN_URL=https://admin.example.com/admin`
- `PAYLOAD_API_TOKEN` for journalist draft creation
- `NEXT_PUBLIC_SITE_URL=https://example.com`
- verified publication identity and storage/provider configuration

Set `ENABLE_WEB_ADMIN_SCAFFOLD=true` only when the role-gated operations dashboard should be
available. Content links in that dashboard redirect to Payload in canonical mode.

## 4. Verify the boundary

1. Payload `/api/articles?where[_status][equals]=published` returns only intended public data.
2. The web homepage and article routes render Payload content and CMS-hosted media.
3. A journalist can create a draft; it appears in Payload with the matching Author.
4. Direct POSTs to the web shadow article API return a conflict in Payload mode.
5. A journalist cannot open privileged `/admin/*` routes or invoke their actions.
6. The launch gate and full test/build/e2e suite pass.

## Security

- Rotate every credential that appeared in an archive, terminal log, or chat attachment.
- Never expose `PAYLOAD_API_TOKEN` or database credentials through `NEXT_PUBLIC_*` variables.
- Protect the CMS domain with rate limiting/WAF and use MFA/SSO when available.
- Keep `PAYLOAD_DB_PUSH=false` in production and review every migration.
- Restrict media licenses and preserve alt text, credit, caption, and source metadata.
