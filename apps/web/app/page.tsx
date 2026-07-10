import { redirect } from 'next/navigation'

/**
 * /admin redirects to the newsroom login at /admin/login. The login surface,
 * its form, and the "किन आवद्ध हुने" pitch live at /admin/login — keeping the
 * canonical route in one place rather than mirroring it at the index.
 */
export default function AdminIndexPage() {
  redirect('/admin/login')
}
