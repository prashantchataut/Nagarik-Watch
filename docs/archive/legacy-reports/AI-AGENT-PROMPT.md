# Nagarik Watch — Build & Auth Fix Prompt

## Mission

Fix the build, auth, and admin-page issues so that:

1. `pnpm --filter @nagarikwatch/web... build` passes on Vercel (static generation)
2. `/api/auth/sign-in/email` does NOT return 500 — admin credentials work
3. Admin pages (`/admin`, `/admin/login`) render and function correctly

Return a zip of the **entire updated project directory** (including all fixes).

---

## Context — What Was Already Done

### Build Fix (DB connections during static generation)

The build was crashing with `getaddrinfo ENOTFOUND` because 11 files create `pg.Pool` pointing to `DATABASE_URL`, and the Aiven Postgres host is unreachable from Vercel build workers. A guard was added to every `getPool()`/`createDialect()`/`getOperationalPool()` function:

```typescript
if (process.env.NEXT_PHASE === 'phase-production-build') return null
```

**Files already fixed:**

- `apps/web/lib/live/manual.ts`
- `apps/web/lib/auth/auth-pool.ts`
- `apps/web/lib/ops-db.ts`
- `apps/web/lib/ad-events.ts`
- `apps/web/lib/engagement/store.ts`
- `apps/web/lib/submissions.ts`
- `apps/web/lib/journalist-workspace.ts`
- `apps/web/app/api/newsletter/store.ts`
- `apps/web/lib/house-ads.ts`
- `apps/web/lib/content/index.ts`
- `apps/web/lib/content/payload-source.ts`

The build now passes clean in local testing with `DATABASE_URL=postgresql://nonexistent-host-fake:5432/db`:

```
✓ Generating static pages (116/116)
```

### Remaining Issues

## 1. `/api/auth/sign-in/email` Returns 500 — Auth Broken

### Root Cause

**File: `apps/web/lib/auth/index.ts`**

```typescript
async function seedBootAccounts(auth: AuthInstance): Promise<void> {
  // ...
  await Promise.all(
    BOOT_ACCOUNTS.map(([emailKey, pwKey, role, displayName]) =>
      seedOne(auth, emailKey, pwKey, role, displayName),
    ),
  )
}

async function seedOne(auth, emailKey, passwordKey, role, displayName) {
  const email = process.env[emailKey]?.trim().toLowerCase()
  const password = process.env[passwordKey]
  if (!email || !password) return

  try {
    // signUp may fail — DB unreachable, account exists, etc. Silently caught.
    await auth.api.signUpEmail({
      body: { email, password, name: email.split('@')[0], displayName },
    })
  } catch {
    // Account already exists, or DB unreachable — carry on
  }

  await assignBootRole(email, role, displayName) // ← NOT wrapped in try/catch!
}

async function assignBootRole(email, role, displayName) {
  const dialect = await createDialect()
  const db = new Kysely<{ user: Record<string, unknown> }>({ dialect })
  await db
    .updateTable('user')
    .set({ role, displayName })
    .where('email', '=', email)
    .executeTakeFirst()
}
```

The **`assignBootRole()`** call is NOT wrapped in try/catch. If it throws (e.g., DB unreachable), it propagates through `seedBootAccounts()` → `buildAuth()` → the `authPromise` is rejected permanently:

```typescript
let authPromise: Promise<AuthInstance> | null = null

export function getAuth(): Promise<AuthInstance> {
  if (!authPromise) authPromise = buildAuth()
  return authPromise // ← once rejected, stays rejected forever
}
```

Every future call to `getAuth()` returns the same rejected promise → `await getAuth()` in the route handler throws → **500 on ALL auth endpoints**.

### Fix Required

**Option A (minimal):** Wrap `assignBootRole()` in try/catch in `seedOne()`:

```typescript
try {
  await assignBootRole(email, role, displayName)
} catch {
  // DB unreachable or account doesn't exist yet — role will be missing until next boot
}
```

**Option B (robust):** Fire `seedBootAccounts()` as fire-and-forget AFTER returning the auth instance, so seeding failure never blocks auth initialization:

```typescript
async function buildAuth(): Promise<AuthInstance> {
  const dialect = await createDialect()
  const auth = betterAuth({ ... })

  // Don't await — fire and forget. If seeding fails, admin login won't work
  // but reader sign-up/sign-in still will (they get 'reader' role by default).
  seedBootAccounts(auth).catch(err => console.error('[auth] seed failed:', err))

  return auth
}
```

**Option C (full fix):** Do BOTH — fire-and-forget seeding, AND wrap `assignBootRole()` in try/catch.

## 2. No Local Postgres Running

The `.env` file has:

```
DATABASE_URL="postgresql://nagarik:nagarik_dev@localhost:5432/nagarik_watch"
```

There's a `docker-compose.yml` to start Postgres:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: nagarik
      POSTGRES_PASSWORD: nagarik_dev
      POSTGRES_DB: nagarik_watch
    ports:
      - '5432:5432'
```

**Fix:** Run `docker compose up -d` before starting the dev server. Without this, Better Auth has no database to write users/sessions to.

## 3. Duplicate `NEXT_PUBLIC_SITE_URL` in `.env`

**File: `.env`** — lines 23 and 86 both define `NEXT_PUBLIC_SITE_URL`:

```
Line 23: NEXT_PUBLIC_SITE_URL="https://nagarikwatch.com"
Line 86: NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Line 86 overwrites line 23. Remove the duplicate on line 23 (or line 86, keeping whichever is correct for the environment).

## 4. Admin Page Build Status

In the build output:

```
├ ƒ /admin                         227 B         102 kB
├ ƒ /admin/login                 2.22 kB         113 kB
```

The `/admin` and `/admin/login` pages compile and build. They're marked as `ƒ (Dynamic)` — server-rendered on demand. The admin login page should work once auth is fixed.

---

## Files to Modify

### Primary

| File                         | Issue                                                                              | Fix                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `apps/web/lib/auth/index.ts` | `assignBootRole()` not wrapped in try/catch, `seedBootAccounts()` blocks auth init | Wrap in try/catch OR fire seeding as fire-and-forget |
| `.env` (root)                | Duplicate `NEXT_PUBLIC_SITE_URL`, possibly wrong DB URL                            | Clean up duplicates                                  |

### Verify Only (already fixed, but confirm no regression)

| File                                     | Guard Added                                          |
| ---------------------------------------- | ---------------------------------------------------- |
| `apps/web/lib/live/manual.ts`            | `NEXT_PHASE` check in `getPool()`                    |
| `apps/web/lib/auth/auth-pool.ts`         | `NEXT_PHASE` → PGlite fallback in `createDialect()`  |
| `apps/web/lib/ops-db.ts`                 | `NEXT_PHASE` check in `getOperationalPool()`         |
| `apps/web/lib/ad-events.ts`              | `NEXT_PHASE` check + try/catch in `ensureSchema()`   |
| `apps/web/lib/engagement/store.ts`       | `NEXT_PHASE` check in `getPool()`                    |
| `apps/web/lib/submissions.ts`            | `NEXT_PHASE` check in `getPool()`                    |
| `apps/web/lib/journalist-workspace.ts`   | `NEXT_PHASE` check in `getPool()`                    |
| `apps/web/app/api/newsletter/store.ts`   | `NEXT_PHASE` check in `getPool()`                    |
| `apps/web/lib/house-ads.ts`              | `NEXT_PHASE` check + existing try/catch              |
| `apps/web/lib/content/index.ts`          | try/catch + JSON store fallback in `resolveSource()` |
| `apps/web/lib/content/payload-source.ts` | Eager `getPayload()`, cached `_payload`              |

---

## Verification Commands

Run these in the project root:

```bash
# 1. Start Postgres (if not running)
docker compose up -d

# 2. Build (should pass)
pnpm --filter @nagarikwatch/web... build

# 3. Start dev server (in another terminal)
pnpm --filter @nagarikwatch/web dev

# 4. Verify auth endpoint
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/sign-in/email
# Should return 200, not 500

# 5. Verify admin renders
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin
# Should return 200 (may redirect to /admin/login)

# 6. Login with admin credentials
# Email: admin@nagarikwatch.com
# Password: nagarikwatch@admin_
```

---

## Delivery

Return a **zip file** containing the complete project directory with all fixes applied. Do NOT create patch files.
