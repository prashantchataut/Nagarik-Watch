const live = process.env.NEXT_PUBLIC_LAUNCH_STATUS === 'live'
const blockers = []
const warnings = []

function value(name) {
  return process.env[name]?.trim() ?? ''
}

function looksUnverified(input) {
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

function requiredVerified(name, message) {
  if (looksUnverified(value(name))) blockers.push(message ?? `${name} is missing or still a placeholder`)
}

function requiredSecret(name, message) {
  const secret = value(name)
  if (secret.length < 32 || looksUnverified(secret)) {
    blockers.push(message ?? `${name} must be a non-placeholder secret of at least 32 characters`)
  }
}

if (live) {
  requiredVerified('NEXT_PUBLIC_SITE_URL', 'Canonical site URL is missing or unverified')
  requiredVerified('NEXT_PUBLIC_PUBLICATION_LEGAL_NAME', 'Legal publisher name is missing or unverified')
  requiredVerified('NEXT_PUBLIC_EDITOR_IN_CHIEF', 'Editor-in-chief is missing or unverified')
  requiredVerified('NEXT_PUBLIC_DOIB_NUMBER', 'Publication registration number is missing or unverified')
  requiredVerified('NEXT_PUBLIC_NEWSROOM_PHONE', 'Newsroom phone is missing or unverified')
  requiredVerified('NEXT_PUBLIC_NEWSROOM_ADDRESS', 'Newsroom address is missing or unverified')
  requiredVerified('NEXT_PUBLIC_NEWSROOM_EMAIL', 'Newsroom email is missing or unverified')
  requiredVerified('DATABASE_URL', 'DATABASE_URL is required for durable production state')
  requiredVerified('PAYLOAD_PUBLIC_SERVER_URL', 'Payload CMS server URL is missing or unverified')
  requiredVerified('PAYLOAD_API_TOKEN', 'Journalist-to-Payload service-account API key is missing or unverified')
  requiredSecret('AUTH_SECRET')
  requiredSecret('PAYLOAD_SECRET')
  requiredSecret('REVALIDATE_SECRET')
  requiredSecret('SUBMISSION_IP_SALT', 'SUBMISSION_IP_SALT must be a non-placeholder secret of at least 32 characters')

  const contentSource = value('CONTENT_SOURCE') || value('PAYLOAD_CONTENT_SOURCE')
  if (contentSource !== 'payload') {
    blockers.push('CONTENT_SOURCE=payload is mandatory for a live deployment')
  }
  if (value('PAYLOAD_DB_PUSH') !== 'false') {
    blockers.push('PAYLOAD_DB_PUSH must be false in production; apply checked-in migrations instead')
  }
  if (value('AUTH_AUTO_MIGRATE') === 'true') {
    blockers.push('AUTH_AUTO_MIGRATE must be false in production; migrate auth schema before serve')
  }
  warnings.push(
    'Confirm operational schema is current with: pnpm migrate:ops (apps/web/migrations)',
  )
  if (value('NEXT_PUBLIC_ADS_MODE') !== 'off' && !value('NEXT_PUBLIC_AD_SALES_EMAIL')) {
    blockers.push('Advertising sales email is missing')
  }
  if (!value('NEXT_PUBLIC_PLAUSIBLE_DOMAIN') && !value('NEXT_PUBLIC_GA4_ID')) {
    warnings.push('No analytics provider is configured')
  }
  const emailProviderReady = Boolean(
    value('RESEND_API_KEY') || (value('NEWSLETTER_API_KEY') && value('NEWSLETTER_API_BASE')),
  )
  if (!emailProviderReady) {
    blockers.push('Outbound email provider is required for password recovery, invitations and newsletter confirmation')
  }
  requiredVerified('AUTH_EMAIL_FROM', 'Verified account-email sender is missing')
  requiredVerified('NEWSLETTER_FROM', 'Verified newsletter sender is missing')

  const pushConfigured = Boolean(
    value('NEXT_PUBLIC_WEB_PUSH_VAPID_KEY') &&
      value('WEB_PUSH_PROVIDER_URL') &&
      value('WEB_PUSH_PROVIDER_API_KEY'),
  )
  if (!pushConfigured) {
    blockers.push(
      'Background browser notifications require NEXT_PUBLIC_WEB_PUSH_VAPID_KEY, WEB_PUSH_PROVIDER_URL and WEB_PUSH_PROVIDER_API_KEY',
    )
  }
  requiredSecret('CRON_SECRET', 'CRON_SECRET must protect scheduled notification delivery')

  // The repository currently has no Payload object-storage plugin wired into
  // payload.config.ts. Credentials alone would be a false green on Vercel.
  blockers.push('Payload media still uses local ephemeral storage; wire and verify a durable storage adapter before launch')
}

if (warnings.length) {
  console.warn('Launch gate warnings:')
  for (const warning of warnings) console.warn(`- ${warning}`)
}
if (blockers.length) {
  console.error('Launch gate failed:')
  for (const blocker of blockers) console.error(`- ${blocker}`)
  process.exit(1)
}
console.log(
  live
    ? 'Launch gate passed.'
    : 'Launch gate skipped strict checks because NEXT_PUBLIC_LAUNCH_STATUS is not live.',
)
