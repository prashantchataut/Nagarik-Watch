# Live sports feeds — production setup

Date: 2026-08-28

Nagarik Watch does not ship demo scores. The reader-facing `/live-scores` surface and the
homepage `HomeSportsLive` band render only provider data that passes the server adapter, or a
source-labelled newsroom override. If neither exists, the live-score module stays absent/empty
rather than inventing a match.

## Supported football adapters

### Option A — football-data.org

Environment:

```dotenv
FOOTBALL_PROVIDER="football-data"
FOOTBALL_API_KEY="..."
FOOTBALL_DATA_API_BASE="https://api.football-data.org"
# Optional comma-separated competition IDs/codes supported by your plan.
FOOTBALL_COMPETITIONS=""
```

The adapter calls `/v4/matches` for the Kathmandu today/tomorrow window and sends the token as
`X-Auth-Token`. The public v4 docs describe the cross-competition matches resource, `dateFrom`,
`dateTo`, competition filters, and match status values.

Reference: https://www.football-data.org/documentation/quickstart

### Option B — API-Football

Environment:

```dotenv
FOOTBALL_PROVIDER="api-football"
FOOTBALL_API_KEY="..."
API_FOOTBALL_API_BASE="https://v3.football.api-sports.io"
```

The adapter first calls `/fixtures?live=all`. If nothing is live, it requests the current
Kathmandu date with `timezone=Asia/Kathmandu`. API-Football documents `live=all` as the live
fixture feed and states that fixtures/events are refreshed on a near-live cadence.

Reference: https://www.api-football.com/news/post/fifa-world-cup-2026-guide-to-using-data-with-api-sports

## Supported cricket adapters

### Option A — CricketData / CricAPI

Environment:

```dotenv
CRICKET_PROVIDER="cricketdata"
CRICKET_API_KEY="..."
CRICKETDATA_API_BASE="https://api.cricapi.com/v1"
```

The adapter calls `/currentMatches?apikey=...&offset=0`, reads the provider's innings `score`
array and maps only returned runs/wickets/overs. It does not synthesize a score when an innings
is missing.

Reference: https://cricketdata.org/live-cricket-score-api/

### Option B — Sportmonks Cricket

Environment:

```dotenv
CRICKET_PROVIDER="sportmonks"
CRICKET_API_KEY="..."
SPORTMONKS_CRICKET_API_BASE="https://cricket.sportmonks.com/api/v2.0"
```

The adapter calls `/livescores` and requests `localteam,visitorteam,runs,league`. Sportmonks
publishes a dedicated Cricket v2.0 livescores endpoint and innings/runs includes.

References:

- https://www.sportmonks.com/cricket-api/
- https://www.sportmonks.com/blogs/how-to-build-a-live-cricket-score-tracker/

## Homepage behavior

`apps/web/components/home/HomeSportsLive.tsx` is intentionally independent of the CMS sports
desk. This means a match can appear even when editors have not published a sports article.

Rules:

- live matches sort before fixtures, then finished matches;
- at most four football and four cricket rows appear on home;
- provider/source and Kathmandu update time are visible;
- the entire band disappears when neither adapter has trustworthy rows;
- the full reader surface remains `/live-scores`;
- provider failures never become fake `0-0`, `TBD`, or demo matches.

## Manual override policy

The operations panel still permits a manual football/cricket override for emergencies such as a
provider outage. An override must include a real source label and pass the live-data schema. It is
not seeded and is never inserted automatically.

## Verification

With dependencies installed and credentials configured:

```bash
pnpm --filter @nagarikwatch/web dev
```

Then verify:

1. `/live-scores` and `/en/live-scores` show the provider source.
2. The homepage band appears only when rows are returned.
3. `/admin/live-widgets` reports provider health.
4. Remove a key temporarily: no demo score should appear.
5. Check server logs for 401/403/quota/schema errors from the upstream.

Never commit provider keys. Keep them in the deployment secret store and local ignored env files.
