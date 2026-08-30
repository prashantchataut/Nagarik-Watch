# Nagarik Watch — reader web app (redesign build)

Next.js 16 + TypeScript + Tailwind CSS 4 + Prisma (SQLite) + shadcn/ui.

## Quick start

```bash
bun install               # or npm/pnpm install
cp .env.example .env      # SQLite database URL
bunx prisma db push       # create Reader/Journalist/Session/Newsletter/Pitch tables
bun run scripts/seed_auth.ts   # seed demo journalist accounts (optional)
bun run dev               # http://localhost:3000
```

Demo journalist logins (after seeding):

| email | password | desk |
|---|---|---|
| sushila@nagarikwatch.com | demo1234 | राजनीति |
| rajesh@nagarikwatch.com | demo1234 | बजार |
| manisha@nagarikwatch.com | demo1234 | विचार |

Reader accounts are created in-app from the masthead **लगइन** button
(signup tab). Reader and journalist logins are deliberately separate systems.

## Live data

- `GET /api/patro?year&month` — astronomical panchanga (tithi/nakshatra/yoga/
  karana at Kathmandu sunrise) + derived lunar festivals + Sat/Sun holidays.
- `GET /api/market/summary|forex|metals|nepse` — NRB official forex,
  international gold/silver converted to tola, NEPSE (live when reachable),
  NOC fuel table.
- `POST /api/newsletter` — साँझ ब्रिफिङ subscriptions.
- `/api/auth/*`, `/api/desk/pitches` — accounts and the journalist desk.

External services are called server-side only, cached in memory, and fall
back to labelled snapshots when unreachable.
