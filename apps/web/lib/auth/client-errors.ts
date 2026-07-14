/**
 * Map auth API JSON/status into a reader-facing message.
 * Prefer server message for AUTH_UNAVAILABLE so operators know DB is down.
 */
export function authClientErrorMessage(
  status: number,
  body: { message?: unknown; error?: { code?: unknown; message?: unknown } } | null,
  locale: 'ne' | 'en',
): string {
  const code = typeof body?.error?.code === 'string' ? body.error.code : ''
  const serverMessage =
    (typeof body?.error?.message === 'string' && body.error.message) ||
    (typeof body?.message === 'string' && body.message) ||
    null

  if (status === 503 || code === 'AUTH_UNAVAILABLE') {
    return locale === 'ne'
      ? 'लगइन अहिले उपलब्ध छैन। खाता डाटाबेस पुग्न सकेन — DATABASE_URL जाँच गर्नुहोस्।'
      : 'Sign-in is temporarily unavailable. The account database could not be reached — check DATABASE_URL.'
  }

  if (status === 403 || code === 'ACCOUNT_DISABLED') {
    return locale === 'ne'
      ? 'यो खाता न्यूजरुमद्वारा निष्क्रिय गरिएको छ।'
      : 'This account has been disabled by the newsroom.'
  }

  if (serverMessage && code === 'AUTH_UNAVAILABLE') return serverMessage

  return (
    serverMessage ??
    (locale === 'ne' ? 'इमेल वा पासवर्ड मेल खाएन।' : 'Email or password is incorrect.')
  )
}
