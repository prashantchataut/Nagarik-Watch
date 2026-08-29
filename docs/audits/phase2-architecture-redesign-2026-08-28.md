# Nagarik Watch phase-2 architecture + full-surface redesign audit

Date: 2026-08-28

## Executive summary

This pass treats Nagarik Watch as one publication system rather than a homepage plus dozens of
unrelated templates. The source tree was reviewed by route family and the bespoke exceptions were
checked individually. Mutable journalism is now Payload-first by default, source-code story
fixtures have been removed, calendar data is provider-synchronized instead of hand-entered,
sports adapters use sport-specific APIs, and the homepage contains live/service modules only when
trustworthy upstream data exists.

The design direction remains the phase-1 newsroom reset: warm paper, large Devanagari typography,
centered editorial hierarchy, one masthead plus one Civic Crimson desk rail, restrained borders,
and whitespace instead of SaaS-card density.

## Current route inventory

The generated route matrix contains 170 application routes:

- 81 public pages;
- 35 custom operations-admin pages;
- 52 APIs;
- 2 feeds.

The public review was not performed as 81 independent visual skins. The repository already has
shared owners for most route families; those owners were audited/redesigned so fixes propagate to
all category/topic/tag/province/institutional/utility routes. Bespoke routes such as search, saved,
e-paper, live coverage, disaster/status pages, sports scores and auth/journalist flows were then
checked separately.

## Competitor findings used as information architecture references

Current OnlineKhabar and Ratopati reinforce four useful principles:

1. separate fast-update streams from slower editorial packages;
2. give high-value services such as calendar/markets/scores a real destination instead of burying
   them in generic cards;
3. let different desks use different visual roles;
4. expose special/live/media packages as their own editorial zones.

References reviewed:

- https://www.onlinekhabar.com/
- https://www.onlinekhabar.com/content/news
- https://www.onlinekhabar.com/content/desh-samachar
- https://www.ratopati.com/
- https://www.ratopati.com/category/news
- https://www.ratopati.com/latest-news

Nagarik Watch intentionally does not copy their masthead, colors or card styling. It borrows the
information architecture while keeping its own restrained newsroom system.

## Fundamental repository problems found and disposition

### 1. Two editorial authorities could exist at once — fixed for normal production

The project contains Payload CMS and an older local/Postgres article store. That explains a
classic failure mode: an editor can "publish" into one store while readers are connected to the
other.

Current behavior:

- `CONTENT_SOURCE` defaults to `payload`;
- a Payload-declared deployment without a configured Payload URL fails closed;
- live launch may not silently fall back to JSON;
- custom article/taxonomy/media admin links redirect to Payload when canonical;
- custom article write APIs block local writes when Payload is canonical;
- operations dashboard metrics read the canonical authority;
- journalist draft APIs use the Payload draft bridge when Payload is canonical;
- scheduled publishing uses Payload when canonical.

The local store is compatibility debt only. See the deletion manifest for the post-cutover removal
sequence.

### 2. News inventory existed in source code — removed

The phase-1 archive still contained `apps/web/data/articles.json` with 87 prewritten `art-ed-*`
stories plus multiple starter-edition modules and reseed scripts. Those are now removed.

The safe development seed creates structural categories and shared desk identities only. It cannot
publish articles. Volatile tags/topics are no longer pre-seeded.

### 3. Specialty hubs could misclassify unrelated stories — fixed

Sparse specialty pages previously had a temptation to pad themselves from generic latest stories.
The shared hub now keeps the specialty result set pure. If it is sparse, unrelated recent stories
appear only in a separately labelled latest-newsroom stream.

### 4. Calendar failure paths produced plausible false data — fixed

Unsafe fallbacks that returned a generic 30-day month or passed Gregorian values through as BS
were removed in phase 1. Phase 2 removes hand-authored yearly calendar JSON as the normal workflow.

Current calendar pipeline:

1. resolve the current civil date in `Asia/Kathmandu`;
2. fetch a provider year/month feed (`bizzpatro` by default, normalized JSON also supported);
3. require valid bilingual event names and reject explicitly unverified provider events;
4. validate every BS date with the repository conversion library;
5. deduplicate events;
6. persist only a successful validated snapshot;
7. serve the fresh snapshot first;
8. attempt provider refresh when stale;
9. preserve the current-year last-known-good snapshot during a temporary upstream outage.

The admin now has a provider status/sync action rather than a raw calendar data authoring screen.
See `docs/calendar-api-setup.md`.

### 5. Sports data used the wrong schema — fixed

The old cricket path treated the upstream like a football fixture API. The new server adapters are
explicit:

- football-data.org v4;
- API-Football;
- CricketData / CricAPI current matches;
- Sportmonks Cricket v2.0 livescores/runs.

The homepage score band is independent from editorial sports stories, sorts live matches first,
labels the provider/time, and disappears when no trustworthy rows exist. No seeded/demo score is
created.

See `docs/sports-api-setup.md`.

### 6. Live-provider environment variables did not always represent real adapters — improved

A configured normalized licensed NEPSE JSON endpoint is now supported via `NEPSE_API_URL`; it wins
over the public-page fallback. Bullion has the same optional normalized provider contract via
`GOLD_SILVER_API_URL`. The homepage service desk displays NEPSE only when a valid reading exists.

Forex uses Nepal Rastra Bank's official daily buy/sell API; no third-party midpoint is turned into
an invented retail spread.

### 7. Static export conflicted with live CMS semantics — isolated/deprecated

A static Pages build cannot show a newly published CMS article until it rebuilds. The former static
param generation also depended on the checked-in story file. That dependency is removed.

Static Pages tooling is now documented as preview/recovery only. The live reader should use a
dynamic Next/Vercel/OpenNext runtime connected to Payload. If static preview is not needed, remove
it after launch using the deletion manifest.

### 8. Secondary pages looked like unrelated generic templates — redesigned by family

Shared public families now use publication hierarchy rather than repeated rounded cards:

- categories / latest / trending / most-read;
- topic / tag / province / district;
- author / columns / team;
- about / ethics / privacy / policy / terms / help;
- contact / advertise;
- utility directory and individual tools;
- Patro/calendar;
- live/market/sports reader services;
- search / saved / archive;
- photos / video / data / e-paper;
- auth/profile/membership;
- journalist workspace.

The remaining custom operations admin is a flatter task product with consistent newsroom colors,
spacing and hierarchy; Payload receives the same visual direction but remains the canonical CMS.

## Homepage service architecture

The homepage is an edition first. Live modules are subordinate service context, not dashboard KPI
cards.

After the core editorial desks:

- `HomeSportsLive` renders up to four verified football and four verified cricket rows when data
  exists;
- `HomeServiceDesk` renders the computed current BS date, next validated calendar event, NEPSE
  when available and NRB USD/NPR when available;
- each service shows source/freshness where appropriate;
- a failed optional provider does not blank the page or create a placeholder value.

## CMS/data ownership rules

### Source code may contain

- stable category/navigation definitions;
- shared desk identities;
- route and placement IDs;
- BS month/zodiac identifiers;
- validation bounds and UI labels;
- test-only fixtures that cannot leak into the public source.

### Payload/operational stores must own

- articles and publication workflow;
- real journalist identities/bylines;
- current tags/topics/special packages;
- media;
- polls, live blogs and other mutable editorial records;
- provider snapshots and sourced service data.

### Never fabricate on failure

- current news;
- calendar events/holidays;
- BS dates/month lengths;
- live scores;
- NEPSE/forex/bullion values;
- disaster/election/result status.

## Admin architecture

Two interfaces are intentionally retained, with separate responsibilities:

- **Payload CMS:** articles, categories, tags, authors, canonical media and publication workflow;
- **Nagarik Watch operations admin:** ads, comments/community, live blogs, provider health,
  calendar sync, live overrides, analytics, SEO, experiments, launch checks, roles/settings.

When Payload is canonical, the operations admin's content links open Payload rather than pretending
its local fallback store is another live CMS.

## Files removed and remaining deletion debt

See `docs/audits/deletion-manifest-2026-08-28.md` for the exact 31 files removed now and the
post-cutover compatibility files that should be deleted later.

## Provider setup summary

### Calendar

```dotenv
CALENDAR_PROVIDER="bizzpatro"
CALENDAR_API_KEY="..."
CALENDAR_API_BASE="https://bizzpatro.com"
CALENDAR_MAX_STALE_HOURS="36"
```

### Football

```dotenv
FOOTBALL_PROVIDER="football-data" # or api-football
FOOTBALL_API_KEY="..."
```

### Cricket

```dotenv
CRICKET_PROVIDER="cricketdata" # or sportmonks
CRICKET_API_KEY="..."
```

### Optional licensed NEPSE JSON

```dotenv
NEPSE_API_URL="https://provider.example/nepse"
NEPSE_API_KEY="..."
NEPSE_SOURCE_NAME="Provider name"
```

### Optional licensed Nepal bullion JSON

```dotenv
GOLD_SILVER_API_URL="https://provider.example/bullion"
GOLD_SILVER_API_KEY="..."
GOLD_SILVER_SOURCE_NAME="Provider name"
```

Secrets belong in the deployment secret store; do not commit them.

## Technical debt intentionally not papered over

- the explicit JSON emergency content store still exists until Payload cutover proof is complete;
- `nw_live_manual` / `live/manual.ts` is now semantically broader than "manual" because it also
  holds validated provider snapshots; rename it in a schema migration later;
- global public CSS is large and partially overlaid by `editorial-redesign.css`; consolidate only
  with dependency-backed visual regression coverage;
- best-effort NEPSE public-page parsing should be replaced by a contracted licensed feed when one
  is selected;
- provider entitlements/quotas must be validated against the plan you actually purchase.

## Verification gate

The repository's own static gates must remain green after this phase:

```bash
node scripts/route-matrix.mjs
node scripts/audit-public-surface.mjs
node scripts/audit-ad-placements.mjs
node scripts/audit-architecture.mjs
node scripts/audit-ui-bans.mjs
node scripts/internal-links.mjs
node scripts/verify-canonical-workspaces.mjs
node scripts/verify-workspace-lock.mjs
```

A syntax-only TypeScript/TSX parser pass is also used in this sandbox.

Final sandbox result for this phase:

- route matrix: **170** routes — 81 public pages, 35 admin pages, 52 APIs, 2 feeds;
- TypeScript syntax: **796 TS/TSX files**, 0 parser failures;
- public-surface audit: pass;
- ad-placement audit: pass — 14 registered / 14 rendered, max 4 slots per file;
- architecture audit: pass;
- UI-ban audit: pass — 231 files scanned;
- internal-link audit: pass;
- canonical-workspace and lockfile audits: pass.

The archive does not include `node_modules`, so the final dependency-backed deployment gate still
must run in a normal networked environment:

```bash
corepack pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @nagarikwatch/web build
pnpm test:e2e
```

Do not treat source-level/static audit success as a substitute for the final Next build and browser
regression pass.
