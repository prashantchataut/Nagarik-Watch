import type { Metadata } from 'next'
import { asLocale } from '@/lib/i18n/locales'
import { getDisasterAlerts } from '@/lib/live/disaster'
import { LiveDeskShell } from '@/components/public/LiveDeskShell'
import { canonicalAlternates } from '@/lib/seo/canonical'

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = asLocale((await params).locale)
  const en = locale === 'en'
  return {
    title: en ? 'Disaster alerts' : 'विपद् सूचना',
    description: en
      ? 'Verified newsroom notices and attributed earthquake alerts for Nepal.'
      : 'प्रमाणित समाचार कक्ष सूचना र नेपाल क्षेत्रका भूकम्प अलर्ट।',
    alternates: canonicalAlternates(locale, '/disaster-alerts'),
  }
}

export default async function DisasterAlertsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = asLocale((await params).locale)
  const en = locale === 'en'
  const alerts = await getDisasterAlerts()
  const updatedAt = new Date(alerts.updatedAt)
  const hasValidUpdate = Number.isFinite(updatedAt.getTime())

  return (
    <LiveDeskShell
      locale={en ? 'en' : 'ne'}
      title={en ? 'Disaster alerts' : 'विपद् सूचना'}
      dek={
        en
          ? 'Verified newsroom notices and attributed earthquakes detected in the Nepal region. Follow official local instructions during an emergency.'
          : 'समाचार कक्षबाट प्रमाणित सूचना र नेपाल क्षेत्रमा मापन गरिएका भूकम्प यहाँ देखाइन्छ। आपत्कालमा स्थानीय आधिकारिक निर्देशन पालना गर्नुहोस्।'
      }
    >
      <section aria-labelledby="current-alerts-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-3">
          <div>
            <h2
              id="current-alerts-heading"
              className="font-display text-h2 font-extrabold text-ink"
            >
              {en ? 'Current notices' : 'हालका सूचना'}
            </h2>
            <p className="mt-1 text-caption text-mute">
              {en ? 'Source' : 'स्रोत'}: {alerts.source}
              {hasValidUpdate
                ? ` · ${en ? 'checked' : 'जाँच'} ${updatedAt.toLocaleString(en ? 'en-GB' : 'ne-NP')}`
                : ''}
            </p>
          </div>
          <span className="text-caption font-semibold text-ink-soft">{alerts.status}</span>
        </div>

        {alerts.data.length ? (
          <ul className="divide-y divide-rule">
            {alerts.data.map((alert, index) => (
              <li
                key={alert.id ?? index}
                className="grid gap-2 py-5 sm:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div>
                  <p className="text-caption font-bold uppercase tracking-wide text-brand-strong">
                    {String(alert.severity)}
                  </p>
                  <h3 className="mt-1 font-display text-h3 font-bold text-ink">{alert.title}</h3>
                  <p className="mt-1 text-meta text-ink-soft">{alert.area}</p>
                  {alert.url ? (
                    <a
                      href={alert.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-2 inline-block text-meta font-semibold text-brand-strong"
                    >
                      {en ? 'Open source notice' : 'मूल सूचना खोल्नुहोस्'}
                    </a>
                  ) : null}
                </div>
                {alert.occurredAt ? (
                  <time dateTime={alert.occurredAt} className="text-caption text-mute">
                    {new Date(alert.occurredAt).toLocaleString(en ? 'en-GB' : 'ne-NP')}
                  </time>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <div
            className="border-y border-rule py-8"
            role={alerts.status === 'error' ? 'alert' : 'status'}
            lang={en ? 'en' : 'ne'}
          >
            <p className="font-display text-h3 font-bold text-ink">
              {alerts.status === 'error'
                ? en
                  ? 'Alert provider is temporarily unavailable'
                  : 'सूचना प्रदायक अस्थायी रूपमा उपलब्ध छैन'
                : en
                  ? 'No active verified alerts'
                  : 'हाल सक्रिय प्रमाणित सूचना छैन'}
            </p>
            <p className="mt-2 max-w-body text-body text-ink-soft">
              {alerts.status === 'error'
                ? en
                  ? 'Do not interpret this empty screen as an all-clear. Check Nepal Police, local authorities and official emergency channels.'
                  : 'यो खाली अवस्थालाई जोखिम नभएको संकेत नमान्नुहोस्। नेपाल प्रहरी, स्थानीय तह र आधिकारिक आपत्कालीन माध्यम जाँच गर्नुहोस्।'
                : en
                  ? 'The connected source currently has no Nepal-region alert.'
                  : 'जोडिएको स्रोतमा अहिले नेपाल क्षेत्रको सक्रिय सूचना छैन।'}
            </p>
          </div>
        )}
      </section>
    </LiveDeskShell>
  )
}
