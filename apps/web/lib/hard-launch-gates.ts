/**
 * Operator-facing hard-launch verification checklist.
 * Do not flip NEXT_PUBLIC_LAUNCH_STATUS=live until every item is true.
 * This file is documentation for /admin/launch and docs/launch-runbook.md —
 * it never invents DoIB/legal values.
 */
export const HARD_LAUNCH_OPERATOR_GATES = [
  'Production Postgres reachable; pnpm migrate:ops applied through 0014',
  'Payload deployed at admin.nagarikwatch.com with PAYLOAD_DB_PUSH=false',
  'BLOB_READ_WRITE_TOKEN present on the Payload Vercel project',
  'Desk → Payload migration applied; DESK_TO_PAYLOAD_MIGRATED=true',
  'Web CONTENT_SOURCE=payload while still preview; /api/health status=ok',
  'CMS /healthz: media ready, categories>0, publicArticles>0, publicationDrift=0',
  'STAFF_MFA_ENABLED=true and Turnstile keys live',
  'PARTNER_FEED_TOKENS, SUBMISSION_IP_SALT, CRON_SECRET, SENTRY_DSN set',
  'Verified legal/DoIB/contact env (operator-owned; never fabricated)',
  'NEXT_PUBLIC_LAUNCH_STATUS=live pnpm launch:gate exits 0',
] as const
