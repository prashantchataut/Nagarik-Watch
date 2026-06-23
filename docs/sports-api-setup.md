# Live Sports Scores — API Setup

The `/sports/live` page renders real football (incl. FIFA World Cup 2026) and cricket
(incl. Nepal matches when available) scores the moment you add API keys. Without keys the
widget falls back to a clearly-labelled mock so the page never breaks.

The code is **key-ready**: `apps/web/lib/live/sports.ts` already implements both providers
with the same mock-fallback contract as weather/forex. You only register the free keys.

## Providers (both have genuine, free tiers)

| Sport    | Provider            | Free quota                 | Covers                          |
| -------- | ------------------- | -------------------------- | ------------------------------- |
| Football | football-data.org   | 10 requests/min            | FIFA World Cup, Premier League + a few major leagues |
| Cricket  | api-sports.io       | 100 requests/day           | ICC, bilateral, Nepal matches   |

Both keys are **server-side only** — `sports.ts` has `import 'server-only'` and reads them
from `process.env`. They never ship to the browser.

## Step 1 — Register the keys

### Football (football-data.org)
1. Go to <https://www.football-data.org/client/register>
2. Register a free account; confirm via email.
3. Open the profile page; copy your **API Token**.
4. The free tier exposes a curated competition set (WC, PL, CL, etc.). For full coverage
   (all leagues, live scores) you'd need a paid plan — the free tier is enough for
   World Cup + headline leagues.

### Cricket (api-sports.io)
1. Go to <https://api-sports.io/explorer/> → **Cricket API**.
2. Create a free account (100 requests/day, forever free).
3. Dashboard → **API Keys** → copy your key.
4. The free tier covers fixtures, scores, and standings for ICC + bilateral series.

## Step 2 — Add the keys to your environment

### Local dev (`.env.local`, gitignored):
```
FOOTBALL_PROVIDER="football-data-org"
FOOTBALL_API_KEY="your-football-data-token"

CRICKET_PROVIDER="api-sports"
CRICKET_API_KEY="your-api-sports-key"
```

### Production (Vercel project settings → Environment Variables):
Add the same two pairs. Redeploy after saving. Never paste real keys into `.env.example`
(that file is committed) — keep them in `.env.local` locally and Vercel's dashboard in prod.

## Step 3 — Verify

1. `pnpm --filter @nagarikwatch/web dev`
2. Visit <http://localhost:3000/sports/live> and <http://localhost:3000/en/sports/live>.
3. The widget's source line should read "football-data.org" / "api-sports.io" (not "Mock").
4. The admin dashboard at `/admin/live-widgets` will show the provider status as `ok`.

## How the fallback works

`sports.ts` fetches only when the relevant key is set. Any failure (HTTP error, timeout,
empty payload, quota exceeded) degrades to the mock value with `mock: true` and a source
line explaining the failure — so the widget renders an honest placeholder, never broken.

Caching: a 60-second in-process TTL cache (per key) so a page render doesn't double-fetch.
This also keeps you well under the free-tier rate limits: at one refresh per minute, the
football free tier (10/min) and cricket free tier (100/day ≈ one every ~15 min) are both safe.

## Notes on World Cup / Nepal coverage

- **FIFA World Cup 2026**: covered by football-data.org while the tournament is in session.
  The fetcher filters to matches within ±2 days of now so the widget stays relevant.
- **Nepal national-team football/cricket**: football-data.org covers FIFA-sanctioned Nepal
  fixtures; api-sports.io covers Nepal's ICC + bilateral cricket. Both surface "Nepal"
  naturally when matches are scheduled.
