import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import {
  AdminPageHeader,
  AdminCard,
  AdminInput,
  AdminTextarea,
  AdminSelect,
  AdminButton,
} from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'न्युजलेटर',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Newsletter composer. The form is fully laid out — subject, body, audience,
 * send button — but the send action and the subscriber-count readout are
 * intentionally gated behind NEWSLETTER_API_KEY. Until that key is set,
 * the button stays disabled with a tooltip and the count placeholder
 * reads "configure provider to see count". No fake subscriber numbers.
 */
export default async function NewsletterPage() {
  const session = await requireNewsroomSession()
  void session // auth gate; session unused on this surface

  const apiKeyConfigured = Boolean(process.env.NEWSLETTER_API_KEY)

  return (
    <div>
      <AdminPageHeader
        title="न्युजलेटर"
        subtitle="इमेल अभियान तयार गर्नुहोस् र पठाउनुहोस्"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <AdminCard>
          <form className="grid gap-4">
            <AdminInput
              label="विषय"
              name="subject"
              placeholder="उदा: नागरिक वाच — आजको समाचार सारांश"
              required
              hint="पाठकको इनबक्समा देखिने शीर्षक। ८० अक्षरभित्र राख्नुहोस्।"
            />
            <AdminSelect
              label="श्रोता"
              name="audience"
              defaultValue="all"
              options={[
                { value: 'all', label: 'सबै सदस्य' },
                { value: 'breaking', label: 'ब्रेकिङ मात्र' },
                { value: 'weekly', label: 'साप्ताहिक सारांश' },
              ]}
              hint="कुन सदस्य समूहले यो इमेल पाउने छन् छान्नुहोस्।"
            />
            <AdminTextarea
              label="मूल सामग्री"
              name="body"
              rows={10}
              placeholder="मार्कडाउन समर्थित छ। सामग्री यहाँ लेख्नुहोस्।"
              required
              hint="मुख्य समाचार, लिंक र सम्पादकीय नोट समावेश गर्नुहोस्।"
            />

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <AdminButton
                type="submit"
                disabled={!apiKeyConfigured}
                title={apiKeyConfigured ? undefined : 'NEWSLETTER_API_KEY कन्फिगर गर्नुहोस्'}
              >
                ▶ पठाउनुहोस्
              </AdminButton>
              {!apiKeyConfigured && (
                <span className="text-caption text-mute" lang="ne">
                  पठाउनका लागि{' '}
                  <code className="font-mono text-ink-soft" lang="en">NEWSLETTER_API_KEY</code>{' '}
                  कन्फिगर गर्नुहोस्।
                </span>
              )}
            </div>
          </form>
        </AdminCard>

        <div className="space-y-4">
          <AdminCard>
            <h2 className="font-display text-h2 text-ink" lang="ne">
              सदस्य संख्या
            </h2>
            {apiKeyConfigured ? (
              <p className="mt-2 font-display text-display font-extrabold text-brand">
                —
              </p>
            ) : (
              <p className="mt-2 text-body text-mute" lang="ne">
                प्रदायक कन्फिगर गर्नुहोस् सदस्य संख्या देख्न।
              </p>
            )}
            <p className="mt-3 text-caption text-mute" lang="ne">
              <code className="font-mono text-ink-soft" lang="en">NEWSLETTER_API_KEY</code>{' '}
              जोडिएपछि यो संख्या प्रदायकबाट ताजा हुनेछ।
            </p>
          </AdminCard>

          <AdminCard>
            <h2 className="font-display text-h2 text-ink" lang="ne">
              प्रदायक स्थिति
            </h2>
            <p className="mt-2 text-body text-ink-soft" lang="ne">
              इमेल पठाउने प्रदायक:{' '}
              <span
                className={`rounded-full px-2 py-0.5 text-caption font-semibold ${
                  apiKeyConfigured
                    ? 'bg-brand-tint text-brand-strong'
                    : 'border border-rule text-mute'
                }`}
                lang="ne"
              >
                {apiKeyConfigured ? 'कन्फिगर भएको' : 'अव्यवस्थित'}
              </span>
            </p>
            <p className="mt-3 text-caption text-mute" lang="ne">
              हाल Mailchimp / Buttondown / Resend मध्ये कुनै पनि प्रदायक जोड्न सकिन्छ —
              env चर कन्फिगर गरेपछि स्वतः पहिचान हुन्छ।
            </p>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}
