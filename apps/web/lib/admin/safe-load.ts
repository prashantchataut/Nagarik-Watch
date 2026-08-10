import 'server-only'

/**
 * Fail-soft wrapper for admin RSC data loads. Logs and returns a fallback
 * instead of throwing into the desk error boundary.
 */
export async function safeAdminLoad<T>(
  label: string,
  load: () => Promise<T>,
  fallback: T,
): Promise<{ value: T; error: string | null }> {
  try {
    return { value: await load(), error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[admin-load:${label}]`, message)
    return { value: fallback, error: message }
  }
}

export function firstAdminLoadError(...results: Array<{ error: string | null }>): string | null {
  for (const result of results) {
    if (result.error) return result.error
  }
  return null
}
