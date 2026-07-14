import type { Metadata } from 'next'
import { asLocale } from '@/lib/i18n/locales'
import { getDisasterAlerts } from '@/lib/live/disaster'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Disaster alerts',
  description: 'Verified newsroom notices and attributed earthquake alerts for Nepal.',
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
    <main className="live-page">
      <header>
        <p className="section-kicker">{en ? 'Public safety' : 'सार्वजनिक सुरक्षा'}</p>
        <h1>{en ? 'Disaster alerts' : 'विपद् सूचना'}</h1>
        <p>
          {en
            ? 'Verified newsroom notices and attributed earthquakes detected in the Nepal region. Follow official local instructions during an emergency.'
            : 'समाचार कक्षबाट प्रमाणित सूचना र नेपाल क्षेत्रमा मापन गरिएका भूकम्प यहाँ देखाइन्छ। आपत्कालमा स्थानीय आधिकारिक निर्देशन पालना गर्नुहोस्।'}
        </p>
      </header>

      <section className="alert-section" aria-labelledby="current-alerts-heading">
        <div className="score-section__head">
          <div>
            <h2 id="current-alerts-heading">{en ? 'Current notices' : 'हालका सूचना'}</h2>
            <p className="text-caption text-mute">
              {en ? 'Source' : 'स्रोत'}: {alerts.source}
              {hasValidUpdate
                ? ` · ${en ? 'checked' : 'जाँच'} ${updatedAt.toLocaleString(en ? 'en-GB' : 'ne-NP')}`
                : ''}
            </p>
          </div>
          <span data-status={alerts.status}>{alerts.status}</span>
        </div>

        {alerts.data.length ? (
          <div className="alert-list">
            {alerts.data.map((alert, index) => (
              <article key={alert.id ?? index} data-severity={alert.severity}>
                <div>
                  <span>{String(alert.severity).toUpperCase()}</span>
                  <h2>{alert.title}</h2>
                  <p>{alert.area}</p>
                  {alert.url ? (
                    <a href={alert.url} target="_blank" rel="noreferrer noopener">
                      {en ? 'Open source notice' : 'मूल सूचना खोल्नुहोस्'}
                    </a>
                  ) : null}
                </div>
                {alert.occurredAt ? (
                  <time dateTime={alert.occurredAt}>
                    {new Date(alert.occurredAt).toLocaleString(en ? 'en-GB' : 'ne-NP')}
                  </time>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="live-empty" role={alerts.status === 'error' ? 'alert' : 'status'}>
            <strong>
              {alerts.status === 'error'
                ? en
                  ? 'Alert provider is temporarily unavailable'
                  : 'सूचना प्रदायक अस्थायी रूपमा उपलब्ध छैन'
                : en
                  ? 'No active verified alerts'
                  : 'हाल सक्रिय प्रमाणित सूचना छैन'}
            </strong>
            <p>
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
    </main>
  )
}
