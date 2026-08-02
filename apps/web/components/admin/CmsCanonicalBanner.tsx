import Link from 'next/link'
import { AdminCallout, AdminButton } from '@/components/admin/primitives'
import {
  isPayloadCanonical,
  isPayloadSourceMisconfigured,
  payloadCollectionAdminUrl,
} from '@/lib/content/payload-admin-client'

/** Honest banner when CONTENT_SOURCE=payload — local desk article writes are blocked. */
export function CmsCanonicalBanner({
  collection = 'articles',
}: {
  collection?: string
}) {
  if (isPayloadSourceMisconfigured()) {
    return (
      <AdminCallout tone="danger" className="mb-4">
        <p className="text-meta font-semibold text-ink" lang="ne">
          CONTENT_SOURCE=payload छ तर PAYLOAD_PUBLIC_SERVER_URL सेट छैन। सार्वजनिक साइट स्थानीय
          स्टोर पढ्छ; CMS URL थप्नुहोस् वा CONTENT_SOURCE=json राख्नुहोस्।
        </p>
      </AdminCallout>
    )
  }
  if (!isPayloadCanonical()) return null
  const cmsUrl = payloadCollectionAdminUrl(collection)
  return (
    <AdminCallout tone="attention" className="mb-4">
      <p className="text-meta font-semibold text-ink" lang="ne">
        CONTENT_SOURCE=payload सेट छ। सार्वजनिक साइट CMS बाट पढ्छ; यो डेस्कबाट लेख सुरक्षित/प्रकाशित
        गर्न सकिँदैन।
      </p>
      <p className="mt-1 text-caption text-ink-soft" lang="ne">
        प्रकाशन Payload CMS बाट गर्नुहोस्, वा सार्वजनिक स्रोत CONTENT_SOURCE=json मा फर्काउनुहोस्।
      </p>
      <div className="mt-3">
        <AdminButton href={cmsUrl} variant="secondary" target="_blank" rel="noopener noreferrer">
          Payload CMS खोल्नुहोस्
        </AdminButton>
      </div>
    </AdminCallout>
  )
}

export function AdminLoadErrorBanner({
  message,
  href = '/admin/launch',
}: {
  message: string | null
  href?: string
}) {
  if (!message) return null
  return (
    <AdminCallout tone="danger" className="mb-4">
      <p className="text-meta font-semibold text-ink" lang="ne">
        सामग्री लोड गर्न सकिएन। खाली सूची देखाइएको छ; सुरक्षित/प्रकाशन फेरि प्रयास गर्नुहोस्।
      </p>
      <p className="mt-1 break-all font-mono text-caption text-mute" lang="en">
        {message.slice(0, 280)}
      </p>
      <p className="mt-2 text-caption text-ink-soft" lang="ne">
        <Link href={href} className="font-semibold text-brand-strong underline-offset-2 hover:underline">
          Launch जाँच
        </Link>{' '}
        मा DATABASE_URL र CONTENT_SOURCE हेर्नुहोस्।
      </p>
    </AdminCallout>
  )
}
