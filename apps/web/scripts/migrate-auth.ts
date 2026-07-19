/**
 * Apply Better Auth's generated schema migrations (including encrypted TOTP).
 * Run as a deployment migration, never from request handling:
 *   pnpm --filter @nagarikwatch/web migrate:auth
 */
async function main() {
  process.env.AUTH_AUTO_MIGRATE = 'true'
  const { getAuth } = await import('../lib/auth')
  await getAuth()
  console.log('[migrate:auth] Better Auth schema is current.')
}

main().catch((error) => {
  console.error('[migrate:auth] failed:', error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
