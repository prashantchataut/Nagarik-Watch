import 'server-only'

/**
 * MFA is not yet wired into the Better Auth staff session flow. Keep this
 * capability false even if an environment flag is set so callers cannot
 * mistake configuration intent for enforced authentication.
 */
export function twoFactorConfigured(): boolean {
  return false
}

export function twoFactorEnabled(): boolean {
  return twoFactorConfigured()
}

export function requireStaffMfaConfigured(): void {
  if (!twoFactorConfigured()) {
    throw new Error(
      'Staff MFA is not configured or enforced. Wire a supported Better Auth two-factor provider before enabling it.',
    )
  }
}
