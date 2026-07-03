import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import {
  AdminPageHeader,
  AdminButton,
  AdminEmptyState,
} from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'लाइभ ब्लग',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Live blogs list. Live blogs are event-scoped, ephemeral posts (a rolling
 * update stream during breaking news, elections, disasters). None are
 * persisted yet; this page shows the create affordance and explains when
 * they get used. The empty state intentionally avoids mock data — the
 * moment a real live blog exists, it lands here.
 */
export default async function LiveBlogsPage() {
  const session = await requireNewsroomSession()
  void session // auth gate; session unused on this surface

  return (
    <div>
      <AdminPageHeader
        title="लाइभ ब्लग"
        subtitle="ब्रेकिङ घटनाका क्रममा चलाइने रोलिङ अपडेट"
        action={
          <AdminButton disabled title="लाइभ ब्लग सिर्जना प्रकाशन कार्यप्रवाहसँगै सक्षम हुनेछ">
            + नयाँ लाइभ ब्लग
          </AdminButton>
        }
      />

      <AdminEmptyState
        title="कुनै लाइभ ब्लग छैन"
        body="लाइभ ब्लग ब्रेकिङ घटना, निर्वाचन, बजेट वा खेलकुद प्रतियोगिताका बेला मात्र खोलिन्छ। कुनै लाइभ ब्लग सक्रिय छैन।"
      />

      <div className="mt-6 rounded-lg border border-rule bg-surface-raised p-5">
        <h2 className="font-display text-h2 text-ink" lang="ne">
          कहिले लाइभ ब्लग खोल्ने?
        </h2>
        <ul className="mt-3 space-y-2 text-body text-ink-soft" lang="ne">
          <li className="flex gap-2">
            <span className="text-brand" aria-hidden="true">•</span>
            ब्रेकिङ राजनीतिक वा कूटनीतिक घटना — संसद् अधिवेशन, सन्धि घोषणा, अविश्वास प्रस्ताव।
          </li>
          <li className="flex gap-2">
            <span className="text-brand" aria-hidden="true">•</span>
            निर्वाचन दिन — मतगणना, परिणाम, विश्लेषण एकै थानामा।
          </li>
          <li className="flex gap-2">
            <span className="text-brand" aria-hidden="true">•</span>
            प्राकृतिक प्रकोप — भूकम्प, बाढी, पहिरो — सत्कृत अपडेट प्रवाह।
          </li>
          <li className="flex gap-2">
            <span className="text-brand" aria-hidden="true">•</span>
            प्रमुख खेल — नेपाली टोलीको क्रिकेट / फुटबल खेलको क्षण-क्षण विवरण।
          </li>
        </ul>
        <p className="mt-4 text-caption text-mute" lang="ne">
          सिर्जना प्रकाशन कार्यप्रवाह (LiveBlog + LiveBlogUpdate collection) जोडिएपछि
          «नयाँ लाइभ ब्लग» बटन सक्रिय हुनेछ।
        </p>
      </div>
    </div>
  )
}
