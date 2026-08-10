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

  if (status === 429 || /TOO_MANY|RATE/i.test(`${code}${serverMessage ?? ''}`)) {
    return locale === 'ne'
      ? 'धेरै पटक प्रयास भयो। करिब एक मिनेट पर्खेर फेरि प्रयास गर्नुहोस्।'
      : 'Too many sign-in attempts. Wait about a minute, then try again.'
  }

  if (
    code === 'INVALID_ORIGIN' ||
    code === 'MISSING_OR_NULL_ORIGIN' ||
    /ORIGIN|CSRF/i.test(`${code}${serverMessage ?? ''}`)
  ) {
    return locale === 'ne'
      ? 'उत्पत्ति जाँचले अनुरोध रोकेको छ। https://www.nagarikwatch.com बाट खोल्नुहोस्।'
      : 'Request blocked by origin checks. Open the site on https://www.nagarikwatch.com and try again.'
  }

  if (code === 'ACCOUNT_DISABLED') {
    return locale === 'ne'
      ? 'यो खाता न्यूजरुमद्वारा निष्क्रिय गरिएको छ।'
      : 'This account has been disabled by the newsroom.'
  }

  if (status === 403) {
    return serverMessage ?? (locale === 'ne' ? 'लगइन अनुमति छैन।' : 'Sign-in was forbidden.')
  }

  return (
    serverMessage ??
    (locale === 'ne' ? 'इमेल वा पासवर्ड मेल खाएन।' : 'Email or password is incorrect.')
  )
}
