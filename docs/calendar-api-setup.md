# Bikram Sambat calendar — automatic provider setup

Date: 2026-08-28

The public calendar is not authored as a hardcoded list and the normal admin workflow no longer
requires staff to write a yearly holiday JSON blob. The application synchronizes an upstream
calendar provider, validates every returned BS date, persists a last-known-good snapshot and
renders that snapshot on the public Patro service.

## Default provider — BizzPatro

BizzPatro publishes documented REST endpoints for BS/AD conversion and day/month/year calendar
payloads. Its developer guide documents `GET /api/v1/calendar/month` and the OpenAPI example
includes per-day events plus verification state.

References:

- https://www.bizzpatro.com/docs
- https://www.bizzpatro.com/openapi.json

Configure:

```dotenv
CALENDAR_PROVIDER="bizzpatro"
CALENDAR_API_KEY="..."
CALENDAR_API_BASE="https://bizzpatro.com"
CALENDAR_MAX_STALE_HOURS="36"
```

The adapter requests all 12 BS months for the current year, three months at a time. It accepts
only events with both Nepali and English names and rejects explicitly non-`VERIFIED` events.
Every event is checked again with the repository's BS conversion library before storage.

## Alternate normalized JSON provider

For another licensed or first-party feed:

```dotenv
CALENDAR_PROVIDER="json"
CALENDAR_API_URL="https://provider.example/calendar"
CALENDAR_API_KEY="..." # optional Bearer token
CALENDAR_SOURCE_NAME="Provider name"
CALENDAR_MAX_STALE_HOURS="36"
```

The endpoint receives `?bs_year=2083` and must return either the object directly or under `data`:

```json
{
  "year": 2083,
  "source": "Licensed calendar provider",
  "updatedAt": "2026-08-28T12:00:00Z",
  "events": [
    {
      "month": 5,
      "day": 12,
      "nameNe": "...",
      "nameEn": "...",
      "holiday": true
    }
  ]
}
```

No invalid date, duplicate event, empty source, unsupported BS year or malformed event is
published.

## Automatic synchronization

Endpoint:

```text
/api/cron/calendar-sync
```

The route is protected by the common cron secret. It resolves the current BS year in
`Asia/Kathmandu`, downloads the provider schedule, validates it and persists it only after a
successful pass.

Scheduling already exists in:

- `vercel.json` — daily sync;
- `.github/workflows/ops-crons.yml` — six-hour sync plus manual dispatch.

The operations panel can trigger the same provider sync for a selected BS year. It does **not**
expose the former raw calendar JSON editor.

## Last-known-good policy

Reader requests first read the persisted validated snapshot. If the snapshot is older than
`CALENDAR_MAX_STALE_HOURS`, the server may refresh from the configured provider. If the provider
is temporarily unavailable, the current-year last-known-good snapshot remains readable instead
of replacing it with guessed dates.

The calendar never:

- returns `30` merely because month-length calculation failed;
- disguises a Gregorian date as a BS date;
- invents a festival/holiday to fill an empty day;
- silently publishes a date outside the supported BS conversion range.

## Authority and editorial verification

Nepal's Ministry of Home Affairs publishes the official Government/Public Holidays schedule, but
the current publication is a notice/PDF rather than a convenient public JSON API. Treat that
notice as an authority check for the provider feed; do not make editors transcribe the entire
calendar into application source code.

MoHA reference: https://www.moha.gov.np/en/post/government-and-public-holidays-in-2083-bs

## Verification

After configuring a provider:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://www.nagarikwatch.com/api/cron/calendar-sync
```

Then check:

1. `/patro` shows the current Kathmandu BS date.
2. Month navigation has real month lengths from the BS library/provider contract.
3. Provider source/freshness is visible.
4. `/admin/live-widgets` reports the current cached year/event count.
5. Disconnect the provider: the last-known-good current-year snapshot remains, but no new data is
   invented.
