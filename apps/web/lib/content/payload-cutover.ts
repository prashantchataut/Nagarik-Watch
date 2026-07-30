/**
 * Payload CMS cutover readiness — honest checklist for /admin/launch.
 * Does not flip CONTENT_SOURCE; operators set env after each gate passes.
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

export function getPayloadCutoverChecklist(): {
  ready: boolean
  currentlyCanonical: boolean
  checks: CutoverCheck[]
} {
  const contentSource = value('CONTENT_SOURCE') || value('PAYLOAD_CONTENT_SOURCE') || 'json'
  const payloadUrl = value('PAYLOAD_PUBLIC_SERVER_URL') || value('PAYLOAD_ADMIN_URL')
  const token = value('PAYLOAD_API_TOKEN')
  const secret = value('PAYLOAD_SECRET')
  const revalidate = value('REVALIDATE_SECRET')
  const dbPush = value('PAYLOAD_DB_PUSH')
  const siteUrl = value('NEXT_PUBLIC_SITE_URL')
  const blob = value('BLOB_READ_WRITE_TOKEN')
  const storageBase = value('STORAGE_PUBLIC_BASE_URL') || value('R2_PUBLIC_BASE_URL')

  const checks: CutoverCheck[] = [
    {
      key: 'payload-url',
      label: 'Payload public URL',
      ok: Boolean(payloadUrl),
      detail: payloadUrl
        ? 'PAYLOAD_PUBLIC_SERVER_URL / PAYLOAD_ADMIN_URL set'
        : 'Set PAYLOAD_PUBLIC_SERVER_URL to the live CMS origin',
    },
    {
      key: 'payload-token',
      label: 'Journalist API token',
      ok: Boolean(token),
      detail: token
        ? 'PAYLOAD_API_TOKEN present (least-privilege service account)'
        : 'Create a Payload API key and set PAYLOAD_API_TOKEN',
    },
    {
      key: 'payload-secret',
      label: 'Payload secret',
      ok: secret.length >= 32,
      detail:
        secret.length >= 32
          ? 'PAYLOAD_SECRET length ok'
          : 'PAYLOAD_SECRET must be at least 32 characters',
    },
    {
      key: 'revalidate',
      label: 'Shared revalidation secret',
      ok: Boolean(revalidate),
      detail: revalidate
        ? 'REVALIDATE_SECRET shared with web app'
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
      ok: Boolean(siteUrl),
      detail: siteUrl ? 'NEXT_PUBLIC_SITE_URL set' : 'Set NEXT_PUBLIC_SITE_URL for absolute links',
    },
    {
      key: 'media',
      label: 'Durable media storage',
      ok: Boolean(blob || storageBase),
      detail: blob || storageBase
        ? 'Blob or R2 public base configured'
        : 'Configure BLOB_READ_WRITE_TOKEN or R2 + STORAGE_PUBLIC_BASE_URL',
    },
    {
      key: 'web-desk',
      label: 'Local web news desk',
      ok: true,
      detail:
        contentSource === 'payload'
          ? 'Web /admin/articles still writes the local store; Payload is linked via banner until cutover is intentional'
          : 'CONTENT_SOURCE is not payload — web desk is the primary CMS',
    },
    {
      key: 'source-flip',
      label: 'CONTENT_SOURCE flip',
      ok: contentSource === 'payload' && Boolean(payloadUrl),
      detail:
        contentSource === 'payload' && payloadUrl
          ? 'CONTENT_SOURCE=payload is live (public may read CMS; desk uses local store)'
          : 'After checks pass: set CONTENT_SOURCE=payload and redeploy web',
    },
  ]

  const gateChecks = checks.filter((check) => check.key !== 'source-flip' && check.key !== 'web-desk')
  const ready = gateChecks.every((check) => check.ok)

  return {
    ready,
    currentlyCanonical: contentSource === 'payload' && Boolean(payloadUrl),
    checks,
  }
}
