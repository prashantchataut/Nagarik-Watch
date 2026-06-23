# Admin (Payload CMS) — Production Deployment

This deploys `apps/admin` (Payload 3 CMS with built-in email/password auth, sessions, JWT,
and the full newsroom RBAC role system) as a **second Vercel project**, separate from the
public web app. The web app's `/admin/*` demo scaffold stays gated off — this is the real
newsroom CMS.

## What's already done (code)

- `apps/admin` is a complete Payload-on-Next.js app: admin UI, REST + GraphQL API,
  Users/Media/Categories/Authors/Tags/Articles collections, RBAC access control.
- `apps/admin/vercel.json` — Vercel build config for the admin project.
- `payload.config.ts` — `push` is now env-driven (`PAYLOAD_DB_PUSH`): `true` in dev,
  `false` in prod (migrations become source of truth).
- `packages/db/src/env.ts` — storage vars made optional so a fresh prod deploy without
  an R2 bucket boots (uploads degrade gracefully; media is not required to launch).

## What you must provision (cannot be code)

### 1. Managed Postgres database (required)

Payload's postgres adapter needs a real DB. Pick one — all have free tiers:

- **Neon** (recommended): <https://neon.tech> — serverless Postgres, branching, generous free tier.
- **Supabase**: <https://supabase.com> — Postgres + extras.
- **Vercel Postgres**: integrated into Vercel (Neon-backed).

Create a project, copy the **connection string** (it looks like
`postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`).

### 2. (Optional) Object storage for media (R2)

Only needed when editors upload images. Skip to launch, add later.

- **Cloudflare R2**: <https://dash.cloudflare.com> → R2 → create bucket.
- Copy the S3-compatible endpoint, access key, secret, public URL.

### 3. Two Vercel projects

In <https://vercel.com> → Add New → Project, import this repo **twice**:

| Project             | Root Directory | Build command                              | Output       |
| ------------------- | -------------- | ------------------------------------------ | ------------ |
| `nagarik-watch`     | (repo root)    | (from root `vercel.json`)                  | `../web/.next` |
| `nagarik-watch-admin` | `apps/admin` | (from `apps/admin/vercel.json`)            | `.next`      |

For the **admin** project, set the Root Directory to `apps/admin` in Vercel project
settings so it picks up `apps/admin/vercel.json`.

### 4. Admin project environment variables

In Vercel → `nagarik-watch-admin` → Settings → Environment Variables:

| Variable                 | Value                                                          |
| ------------------------ | -------------------------------------------------------------- |
| `DATABASE_URL`           | (the Neon/Supabase connection string from step 1)             |
| `PAYLOAD_SECRET`         | a random ≥32-char string: `openssl rand -base64 32`            |
| `PAYLOAD_PUBLIC_SERVER_URL` | `https://admin.nagarikwatch.com` (your admin domain)        |
| `PAYLOAD_DB_PUSH`        | `false` (use migrations in prod — see step 5)                 |
| `NEXT_PUBLIC_SITE_URL`   | `https://nagarikwatch.com`                                    |
| `REVALIDATE_SECRET`      | a random ≥16-char string (shared with the web project)         |

Optional (only when wiring media uploads):
`STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY_ID`,
`STORAGE_SECRET_ACCESS_KEY`, `STORAGE_PUBLIC_BASE_URL`.

### 5. Generate and run the first migration (one-time)

Payload's `push: true` syncs schema in dev. In prod (`push: false`), schema changes go
through migrations. Generate the first one against a *dev* DB (your local docker Postgres
or a Neon dev branch):

```bash
# With DATABASE_URL pointing at a dev DB and the app running:
pnpm --filter @nagarikwatch/admin generate:types
pnpm --filter @nagarikwatch/admin migrate:create   # name it "initial"
```

Then apply it to the **production** DB once (Payload runs pending migrations on boot, but
you can run them explicitly against the prod connection string):

```bash
DATABASE_URL="<prod connection string>" pnpm --filter @nagarikwatch/admin migrate
```

Commit the generated `src/migrations/` files — they become the prod schema source of truth.

### 6. Create the first admin user

After the first deploy, Payload's `/admin` will show a "create first user" screen. Create
your super-admin account there with a strong password. That account gets full access;
subsequent users are created inside the CMS with appropriate roles.

### 7. Wire the web app to read from the CMS (optional, separate task)

The web app currently renders from in-repo seed data (`PAYLOAD_CONTENT_SOURCE` unset).
To serve real CMS content on the public site, set `PAYLOAD_CONTENT_SOURCE=payload` on the
**web** Vercel project and point it at the admin's REST API. That's a follow-up task — the
admin can deploy and operate independently first.

## Verify

1. Visit `https://<admin-domain>/admin` → Payload login screen (not a 404).
2. Create the first user, log in, see the dashboard.
3. `users` collection enforces auth; RBAC roles drive collection access per `apps/admin/src/access/`.

## Security notes

- Payload's auth is on by default for the `users` collection (hashed passwords, sessions,
  JWT, optional API keys). No custom auth code to write or audit.
- `robots: { index: false }` keeps the admin out of search engines.
- Restrict the admin domain in production (Cloudflare WAF / Vercel access protection)
  before launch for defense in depth.
