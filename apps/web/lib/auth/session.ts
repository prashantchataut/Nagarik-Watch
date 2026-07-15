/**
 * Server-side session helpers. Use these in Server Components, route handlers,
 * and Server Actions to read the current reader session without making a
 * network round-trip (Better Auth reads the signed cookie directly).
 *
 * Two surfaces:
 *   - `getSession()` → reader session (or null). Used by bookmark/history pages,
 *     profile, comment forms.
 *   - `requireNewsroomSession()` → throws a redirect to /admin/login if the
 *     current user is not a newsroom role. Used by /admin/* pages.
 *   - `getNewsroomSession()` → returns the session or null, without throwing.
 *
 * Newsroom roles are mapped from the `role` additional field set at signup or
 * provisioned via env. See `lib/admin-roles.ts` for the role list.
 */
import 'server-only'
import { cache } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Kysely } from 'kysely'
import { getAuth } from './index'
import { createDialect } from './auth-pool'
import type { NewsroomRole } from '@/lib/admin-roles'

export type ReaderSession = {
  userId: string
  email: string
  displayName: string | null
  role: string
  locale: 'ne' | 'en'
}

export type NewsroomSession = ReaderSession & {
  newsroomRole: NewsroomRole
}

const NEWSROOM_ROLES: ReadonlySet<NewsroomRole> = new Set<NewsroomRole>([
  'viewer',
  'contributor',
  'journalist',
  'photo_video_editor',
  'reviewer',
  'copy_editor',
  'fact_checker',
  'assistant_editor',
  'sub_editor',
  'section_editor',
  'province_editor',
  'managing_editor',
  'editor_in_chief',
  'seo_manager',
  'moderator',
  'ad_manager',
  'analyst',
  'publisher',
  'admin',
  'super_admin',
])

/**
 * Request-scoped cached session read. Layout + page can both call this without
 * doubling Better Auth / cookie work on the same navigation.
 */
export const getSession = cache(async (): Promise<ReaderSession | null> => {
  try {
    const auth = await getAuth()
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return null
    const user = session.user as {
      role?: string
      displayName?: string
      locale?: string
      disabled?: boolean | null
    }
    if (user.disabled === true) return null
    const role = user.role ?? 'reader'
    const displayName = user.displayName ?? null
    const locale = user.locale === 'en' ? 'en' : 'ne'
    return {
      userId: session.user.id,
      email: session.user.email,
      displayName,
      role,
      locale,
    }
  } catch {
    return null
  }
})

export const getNewsroomSession = cache(async (): Promise<NewsroomSession | null> => {
  const session = await getSession()
  if (!session) return null
  if (!NEWSROOM_ROLES.has(session.role as NewsroomRole)) return null
  return { ...session, newsroomRole: session.role as NewsroomRole }
})

export async function requireNewsroomSession(): Promise<NewsroomSession> {
  const session = await getNewsroomSession()
  if (!session) redirect('/admin/login')
  return session
}

/**
 * Elevate a user to a newsroom role. The founder (seeded from
 * NEWSROOM_ADMIN_EMAIL at boot) uses the /admin/users screen to promote
 * staff; this helper is the backing call.
 *
 * Writes directly to Better Auth's `user` table via the same Kysely dialect
 * the auth instance uses — no admin plugin needed, no Extra Dependency. The
 * `role` column is an additionalField declared in lib/auth/index.ts.
 *
 * Returns true if a row was updated, false if the user wasn't found or the
 * role was invalid. Callers must already be authorised (super_admin/admin)
 * — this function does not re-check permissions.
 */
export async function elevateUserToRole(email: string, role: string): Promise<boolean> {
  const newsroomRoles: ReadonlySet<string> = new Set([
    'viewer',
    'contributor',
    'journalist',
    'photo_video_editor',
    'reviewer',
    'copy_editor',
    'fact_checker',
    'assistant_editor',
    'sub_editor',
    'section_editor',
    'province_editor',
    'managing_editor',
    'editor_in_chief',
    'seo_manager',
    'moderator',
    'ad_manager',
    'analyst',
    'publisher',
    'admin',
    'super_admin',
  ])
  if (!newsroomRoles.has(role)) return false

  try {
    const dialect = await createDialect()
    const db = new Kysely<{ user: Record<string, unknown> }>({ dialect })
    const result = await db
      .updateTable('user')
      .set({ role })
      .where('email', '=', email.toLowerCase())
      .executeTakeFirst()
    return Number(result.numUpdatedRows ?? 0) > 0
  } catch {
    return false
  }
}
