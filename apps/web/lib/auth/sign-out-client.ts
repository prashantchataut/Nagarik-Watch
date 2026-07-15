/** Shared client helper for Better Auth sign-out (requires JSON content-type). */
export async function signOutRequest(): Promise<Response> {
  return fetch('/api/auth/sign-out', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: '{}',
  })
}
