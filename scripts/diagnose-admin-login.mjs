/**
 * Diagnose newsroom login: env presence, SQL user rows, credential accounts.
 * Run: cmd /c "pnpm exec vercel env run --environment=production -- node scripts/diagnose-admin-login.mjs"
 */
import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

function mask(email) {
  const [local, domain] = String(email).split('@')
  if (!local || !domain) return '***'
  return `${local.slice(0, 2)}***@${domain}`
}

async function main() {
  const emails = [
    process.env.NEWSROOM_SUPERADMIN_EMAIL?.trim().toLowerCase(),
    process.env.NEWSROOM_ADMIN_EMAIL?.trim().toLowerCase(),
  ].filter(Boolean)

  console.log(
    JSON.stringify(
      {
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL?.trim()),
        hasAuthSecret: Boolean(
          (process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET)?.trim(),
        ),
        authSecretLen: (process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET || '').length,
        bootEmails: emails.map(mask),
        bootEmailCount: emails.length,
        hasSuperPassword: Boolean(process.env.NEWSROOM_SUPERADMIN_PASSWORD?.trim()),
        hasAdminPassword: Boolean(process.env.NEWSROOM_ADMIN_PASSWORD?.trim()),
        superPasswordLen: (process.env.NEWSROOM_SUPERADMIN_PASSWORD || '').trim().length,
        adminPasswordLen: (process.env.NEWSROOM_ADMIN_PASSWORD || '').trim().length,
        authBootSync: process.env.AUTH_BOOT_SYNC_PASSWORD === 'true',
        betterAuthUrl: process.env.BETTER_AUTH_URL || null,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
      },
      null,
      2,
    ),
  )

  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    console.error('DATABASE_URL missing — cannot query users.')
    process.exit(2)
  }

  const require = createRequire(import.meta.url)
  const pgPath = require.resolve('pg', {
    paths: [path.join(process.cwd(), 'apps/web'), process.cwd()],
  })
  const pgMod = await import(pathToFileURL(pgPath).href)
  const Client = pgMod.default?.Client || pgMod.Client
  const client = new Client({
    connectionString: url,
    ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false },
  })
  await client.connect()

  for (const email of emails) {
    const userRes = await client.query(
      `SELECT id, email, role, "emailVerified", disabled
       FROM "user"
       WHERE lower(email) = lower($1)
       LIMIT 1`,
      [email],
    )
    const user = userRes.rows[0]
    let account = null
    if (user) {
      const accRes = await client.query(
        `SELECT id, "providerId", "accountId",
                CASE WHEN password IS NULL OR password = '' THEN false ELSE true END AS has_password,
                length(password) AS password_len
         FROM account
         WHERE "userId" = $1 AND "providerId" = 'credential'
         LIMIT 1`,
        [user.id],
      )
      account = accRes.rows[0] || null
    }
    console.log(
      JSON.stringify(
        {
          email: mask(email),
          userFound: Boolean(user),
          userId: user?.id ? `${String(user.id).slice(0, 8)}…` : null,
          role: user?.role ?? null,
          emailVerified: user?.emailVerified ?? null,
          disabled: user?.disabled ?? null,
          credentialAccount: Boolean(account),
          hasPassword: account?.has_password ?? false,
          passwordLen: account?.password_len ?? null,
          accountIdMatchesUser: account ? account.accountId === user.id : null,
        },
        null,
        2,
      ),
    )
  }

  const allStaff = await client.query(
    `SELECT email, role FROM "user"
     WHERE role IS NOT NULL AND role <> 'reader'
     ORDER BY email
     LIMIT 20`,
  )
  console.log(
    'staff_users',
    allStaff.rows.map((r) => ({ email: mask(r.email), role: r.role })),
  )

  await client.end()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
