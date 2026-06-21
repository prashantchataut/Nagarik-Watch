import {
  getAQI,
  getDisasterAlerts,
  getForexRates,
  getGoldSilverRates,
  getNepseMarket,
  getSportsScores,
  getWeather,
  type LiveDataEnvelope,
} from '@/lib/live-data'

function WidgetShell<T>({
  title,
  envelope,
  children,
}: {
  title: string
  envelope: LiveDataEnvelope<T>
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-rule bg-surface-raised p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-h3 text-ink">{title}</h2>
        {envelope.status === 'mock' && (
          <span className="rounded-full bg-brand-tint px-2 py-1 text-caption font-semibold text-brand-strong">
            MOCK
          </span>
        )}
      </div>
      <div className="mt-3">{children}</div>
      <p className="mt-3 text-caption text-mute">
        Source: {envelope.source}. Updated {new Date(envelope.updatedAt).toLocaleString('en-GB')}.
      </p>
    </section>
  )
}

export async function UtilityWidgetRail() {
  const [weather, aqi, nepse, metals, forex, scores, alerts] = await Promise.all([
    getWeather(),
    getAQI(),
    getNepseMarket(),
    getGoldSilverRates(),
    getForexRates(),
    getSportsScores(),
    getDisasterAlerts(),
  ])

  return (
    <aside className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Live utility widgets">
      <WidgetShell title="Weather" envelope={weather}>
        <p className="text-body text-ink">
          {weather.data.city}: {weather.data.temperatureC}°C, {weather.data.condition}
        </p>
      </WidgetShell>
      <WidgetShell title="AQI" envelope={aqi}>
        <p className="text-body text-ink">
          {aqi.data.city}: AQI {aqi.data.aqi}, {aqi.data.label}
        </p>
      </WidgetShell>
      <WidgetShell title="NEPSE" envelope={nepse}>
        <p className="text-body text-ink">
          {nepse.data.index} {nepse.data.value.toLocaleString('en-NP')} ({nepse.data.changePercent}
          %)
        </p>
      </WidgetShell>
      <WidgetShell title="Gold and Forex" envelope={metals}>
        <ul className="text-body text-ink-soft">
          {metals.data.map((rate) => (
            <li key={rate.label}>
              {rate.label}: {rate.sell} {rate.unit}
            </li>
          ))}
          {forex.data.map((rate) => (
            <li key={rate.label}>
              {rate.label}: {rate.buy}/{rate.sell} {rate.unit}
            </li>
          ))}
        </ul>
      </WidgetShell>
      <WidgetShell title="Sports" envelope={scores}>
        <ul className="text-body text-ink-soft">
          {scores.data.map((score) => (
            <li key={`${score.league}-${score.home}`}>
              {score.league}: {score.home} vs {score.away}, {score.score}
            </li>
          ))}
        </ul>
      </WidgetShell>
      <WidgetShell title="Disaster Alerts" envelope={alerts}>
        <ul className="text-body text-ink-soft">
          {alerts.data.map((alert) => (
            <li key={`${alert.area}-${alert.title}`}>
              {alert.severity.toUpperCase()}: {alert.title}, {alert.area}
            </li>
          ))}
        </ul>
      </WidgetShell>
    </aside>
  )
}
