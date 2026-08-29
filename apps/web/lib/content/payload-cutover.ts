/**
 * Payload CMS cutover readiness — honest checklist for /admin/launch.
 * Does not flip CONTENT_SOURCE; operators set env after each gate passes.
 * See docs/launch-runbook.md Phase 1.
 */
export type CutoverCheck = {
  key: string
  label: string
  ok: boolean
  detail: string
}

function value(name: string): string {
  return process.env[name]?.trim() ?? ''
}

function looksUnverified(input: string): boolean {
  const lower = input.toLowerCase()
  return (
    !input ||
    lower.includes('placeholder') ||
    lower.includes('pending') ||
    lower.includes('replace-before-launch') ||
    lower.includes('change-me') ||
    lower.includes('0000000')
  )
}

export function getPayloadCutoverChecklist(): {
  ready: boolean
  currentlyCanonical: boolean
  checks: CutoverCheck[]
} {
  const contentSource = value('CONTENT_SOURCE') || value('PAYLOAD_CONTENT_SOURCE') || 'payload'
  const payloadUrl = value('PAYLOAD_PUBLIC_SERVER_URL') || value('PAYLOAD_ADMIN_URL')
  const token = value('PAYLOAD_API_TOKEN')
  const secret = value('PAYLOAD_SECRET')
  const revalidate = value('REVALIDATE_SECRET')
  const dbPush = value('PAYLOAD_DB_PUSH')
  const siteUrl = value('NEXT_PUBLIC_SITE_URL')
  const blob = value('BLOB_READ_WRITE_TOKEN')
  const storageBase = value('STORAGE_PUBLIC_BASE_URL') || value('R2_PUBLIC_BASE_URL')
  const starterSeed = value('ALLOW_STARTER_SEED').toLowerCase()
  const staticExport =
    value('NEXT_PUBLIC_STATIC_EXPORT') === '1' ||
    value('CF_PAGES_STATIC') === '1' ||
    value('NEXT_PUBLIC_STATIC_EXPORT').toLowerCase() === 'true'
  const launchStatus = (value('NEXT_PUBLIC_LAUNCH_STATUS') || 'preview').toLowerCase()

  const checks: CutoverCheck[] = [
    {
      key: 'origin-node',
      label: 'Node origin (not static Pages)',
      ok: !staticExport,
      detail: staticExport
        ? 'Static export strips APIs — point apex at Vercel Node (ADR-004), not CF Pages out'
        : 'Reader host is not a static-export build',
    },
    {
      key: 'payload-url',
      label: 'Payload public URL',
      ok: Boolean(payloadUrl) && !looksUnverified(payloadUrl),
      detail: payloadUrl
        ? 'PAYLOAD_PUBLIC_SERVER_URL / PAYLOAD_ADMIN_URL set'
        : 'Set PAYLOAD_PUBLIC_SERVER_URL to the live CMS origin',
    },
    {
      key: 'payload-token',
      label: 'Journalist API token',
      ok: Boolean(token) && !looksUnverified(token),
      detail: token
        ? 'PAYLOAD_API_TOKEN present (least-privilege service account)'
        : 'Create a Payload API key and set PAYLOAD_API_TOKEN',
    },
    {
      key: 'payload-secret',
      label: 'Payload secret',
      ok: secret.length >= 32 && !looksUnverified(secret),
      detail:
        secret.length >= 32
          ? 'PAYLOAD_SECRET length ok'
          : 'PAYLOAD_SECRET must be at least 32 characters',
    },
    {
      key: 'revalidate',
      label: 'Shared revalidation secret',
      ok: Boolean(revalidate) && revalidate.length >= 32 && !looksUnverified(revalidate),
      detail: revalidate
        ? 'REVALIDATE_SECRET shared with web app — prove publish → public ≤60s after flip'
        : 'Set the same REVALIDATE_SECRET on web + Payload',
    },
    {
      key: 'db-push',
      label: 'Schema push disabled',
      ok: !payloadUrl || dbPush === 'false',
      detail:
        dbPush === 'false'
          ? 'PAYLOAD_DB_PUSH=false (migrations authoritative)'
          : 'Set PAYLOAD_DB_PUSH=false before cutover',
    },
    {
      key: 'site-url',
      label: 'Public site URL',
      ok: Boolean(siteUrl) && !looksUnverified(siteUrl),
      detail: siteUrl ? 'NEXT_PUBLIC_SITE_URL set' : 'Set NEXT_PUBLIC_SITE_URL for absolute links',
    },
    {
      key: 'media',
      label: 'Durable media storage',
      ok: Boolean(blob || storageBase),
      detail:
        blob || storageBase
          ? 'Blob or R2 public base configured'
          : 'Configure BLOB_READ_WRITE_TOKEN or R2 + STORAGE_PUBLIC_BASE_URL',
    },
    {
      key: 'corpus-migrate',
      label: 'Desk → Payload corpus migration',
      ok:
        contentSource === 'payload' ||
        value('DESK_TO_PAYLOAD_MIGRATED').toLowerCase() === 'true' ||
        value('DESK_TO_PAYLOAD_MIGRATED') === '1',
      detail:
        contentSource === 'payload'
          ? 'CONTENT_SOURCE=payload (migration expected before flip)'
          : value('DESK_TO_PAYLOAD_MIGRATED').toLowerCase() === 'true' ||
              value('DESK_TO_PAYLOAD_MIGRATED') === '1'
            ? 'DESK_TO_PAYLOAD_MIGRATED set after pnpm migrate:desk-to-payload -- --apply'
            : 'Run pnpm migrate:desk-to-payload (dry-run) then --apply; set DESK_TO_PAYLOAD_MIGRATED=true',
    },
    {
      key: 'seed-off',
      label: 'Starter seed disabled',
      ok: starterSeed !== 'true' && starterSeed !== '1',
      detail:
        starterSeed === 'true' || starterSeed === '1'
          ? 'Legacy ALLOW_STARTER_SEED is obsolete and must be removed; runtime article fixtures are no longer shipped'
          : 'Runtime article fixtures are not shipped',
    },
    {
      key: 'launch-status',
      label: 'Launch status still preview until hard gate',
      ok: launchStatus !== 'live' || contentSource === 'payload',
      detail:
        launchStatus === 'live' && contentSource !== 'payload'
          ? 'Cannot stay live without CONTENT_SOURCE=payload'
          : launchStatus === 'live'
            ? 'Live status with Payload canonical — keep MFA/legal gate green'
            : 'NEXT_PUBLIC_LAUNCH_STATUS is preview (correct until hard launch)',
    },
    {
      key: 'web-desk',
      label: 'Local web news desk',
      ok: true,
      detail:
        contentSource === 'payload'
          ? 'Web /admin/articles writes are blocked when Payload is canonical — publish in Payload'
          : 'CONTENT_SOURCE is not payload — web desk / JSON store is still primary',
    },
    {
      key: 'source-flip',
      label: 'CONTENT_SOURCE flip',
      ok: contentSource === 'payload' && Boolean(payloadUrl),
      detail:
        contentSource === 'payload' && payloadUrl
          ? 'CONTENT_SOURCE=payload is live'
          : 'After checks pass: set CONTENT_SOURCE=payload and redeploy web on Vercel',
    },
  ]

  const gateChecks = checks.filter(
    (check) =>
      check.key !== 'source-flip' &&
      check.key !== 'web-desk' &&
      check.key !== 'launch-status' &&
      check.key !== 'corpus-migrate',
  )
  const ready = gateChecks.every((check) => check.ok)

  return {
    ready,
    currentlyCanonical: contentSource === 'payload' && Boolean(payloadUrl),
    checks,
  }
}
