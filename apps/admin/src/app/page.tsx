import { redirect } from 'next/navigation'

/**
 * Root of apps/admin redirects to the Payload dashboard. The admin UI itself is mounted
 * under /(payload)/admin by Payload's App-Router integration.
 */
export default function IndexPage() {
  redirect('/admin')
}
