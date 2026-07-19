import 'server-only'

/** Better Auth's encrypted TOTP plugin is registered in lib/auth/index.ts. */
export const STAFF_MFA_PLUGIN_WIRED = true

export function twoFactorConfigured(): boolean {
  return STAFF_MFA_PLUGIN_WIRED && process.env.STAFF_MFA_ENABLED?.trim().toLowerCase() === 'true'
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
