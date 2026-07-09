import 'server-only'
import { operationalStorageMode } from '@/lib/ops-db'

export type LaunchCheck = {
  key: string
  label: string
  status: 'pass' | 'warn' | 'fail'
  detail: string
}

export function getLaunchChecks(): LaunchCheck[] {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const authUrl = process.env.BETTER_AUTH_URL ?? ''
  const dbMode = operationalStorageMode()
  const hasSecret = Boolean(process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET)
  const checks: LaunchCheck[] = [
    {
      key: 'site-url',
      label: 'Public site URL',
      status: siteUrl.startsWith('https://') ? 'pass' : 'fail',
      detail: siteUrl || 'NEXT_PUBLIC_SITE_URL is missing',
    },
    {
      key: 'auth-url',
      label: 'Better Auth URL',
      status: authUrl.startsWith('https://') ? 'pass' : 'fail',
      detail: authUrl || 'BETTER_AUTH_URL is missing',
    },
    {
      key: 'database',
      label: 'Persistent database',
      status: dbMode === 'postgres' ? 'pass' : 'fail',
      detail: dbMode === 'postgres' ? 'DATABASE_URL points to Postgres' : 'Memory/PGlite mode is not production-safe',
    },
    {
      key: 'secret',
      label: 'Auth secret',
      status: hasSecret ? 'pass' : 'fail',
      detail: hasSecret ? 'Auth secret present' : 'AUTH_SECRET or BETTER_AUTH_SECRET is missing',
    },
    {
      key: 'email',
      label: 'Email provider',
      status: process.env.RESEND_API_KEY || process.env.SMTP_HOST ? 'pass' : 'warn',
      detail: process.env.RESEND_API_KEY || process.env.SMTP_HOST ? 'Email provider configured' : 'Password reset/newsletter invite email will not send',
    },
    {
      key: 'storage',
      label: 'Media storage',
      status: process.env.BLOB_READ_WRITE_TOKEN || process.env.S3_BUCKET || process.env.STORAGE_BUCKET ? 'pass' : 'warn',
      detail: process.env.BLOB_READ_WRITE_TOKEN || process.env.S3_BUCKET || process.env.STORAGE_BUCKET ? 'Persistent media storage configured' : 'Local upload storage is unsafe on Vercel',
    },
    {
      key: 'payments',
      label: 'Payment provider',
      status: process.env.STRIPE_SECRET_KEY || process.env.PAYMENT_PROVIDER ? 'pass' : 'warn',
      detail: process.env.STRIPE_SECRET_KEY || process.env.PAYMENT_PROVIDER ? 'Payment provider configured' : 'Paywall uses manual subscriber override only',
    },
    {
      key: 'live-data',
      label: 'Live data providers',
      status: process.env.FOOTBALL_API_KEY || process.env.NEPSE_API_URL ? 'pass' : 'warn',
      detail: process.env.FOOTBALL_API_KEY || process.env.NEPSE_API_URL ? 'At least one paid/official live provider configured' : 'Manual newsroom live data overrides required',
    },
  ]
  return checks
}

export function launchScore(checks = getLaunchChecks()): number {
  const points = checks.reduce((sum, check) => sum + (check.status === 'pass' ? 1 : check.status === 'warn' ? 0.5 : 0), 0)
  return Math.round((points / checks.length) * 100)
}
