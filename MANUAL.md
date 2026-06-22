# Nagarik Watch Manual

## Functional vs Scaffolded

| Area            | Current status                                                              | Owner action before launch                                                               |
| --------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Content         | Seed/Payload content-source seam exists                                     | Configure `PAYLOAD_CONTENT_SOURCE=payload`, database, Payload collections and migrations |
| Bookmarks       | Functional anonymous browser bookmarks                                      | Add authenticated sync when auth is live                                                 |
| Reading history | Functional browser reading sessions, scroll depth and completion            | Persist server-side analytics after consent review                                       |
| Recommendations | Functional local hybrid ranking over available stories                      | Replace synthetic engagement placeholders with analytics/warehouse signals               |
| Live widgets    | Typed providers with mock/unconfigured health labels                        | Contract legal providers and fill env vars below                                         |
| Utilities       | Utility portal, partial typing helper, age/currency tools, live widget rail | Replace partial converters with licensed full AD/BS and Preeti/Unicode libraries         |
| Admin dashboard | Provider health table and workflow scaffold                                 | Add server-side auth, RBAC, audit persistence and hard-delete protections                |
| SEO             | Sitemap/news-sitemap/RSS routes exist                                       | Verify production domain, Publisher Center, logo, registration and private noindex rules |

## Environment Variables

Required for production setup:

| Variable                            | Purpose                             |
| ----------------------------------- | ----------------------------------- |
| `DATABASE_URL`                      | PostgreSQL for CMS/content          |
| `PAYLOAD_SECRET`                    | Payload CMS secret                  |
| `PAYLOAD_CONTENT_SOURCE=payload`    | Enables CMS-backed content          |
| `NEXT_PUBLIC_SITE_URL`              | Canonical URL, sitemap, JSON-LD     |
| `AUTH_SECRET`, `BETTER_AUTH_SECRET` | Auth/session signing                |
| `REVALIDATE_SECRET`                 | Publish-to-web ISR revalidation     |
| `NEXT_PUBLIC_DOIB_NUMBER`           | Publication registration disclosure |

Provider variables:

| Variable                                                     | Provider setup                                     |
| ------------------------------------------------------------ | -------------------------------------------------- |
| `WEATHER_API_KEY`, `WEATHER_API_BASE`                        | Weather provider for city weather                  |
| `AQI_API_KEY`, `AQI_API_BASE`                                | AQI provider with Nepal city coverage              |
| `NEPSE_API_KEY`, `NEPSE_API_BASE`                            | Licensed NEPSE/share-market vendor                 |
| `GOLD_SILVER_API_KEY`, `GOLD_SILVER_API_BASE`                | Nepal bullion rates source                         |
| `FOREX_API_KEY`, `FOREX_API_BASE`                            | Nepal Rastra Bank or licensed forex source         |
| `SPORTS_API_KEY`, `FOOTBALL_API_KEY`, `CRICKET_API_KEY`      | Sports scores and fixtures                         |
| `ELECTION_API_KEY`                                           | Election results vendor or official source adapter |
| `EXAM_RESULTS_API_KEY`                                       | Official SEE/NEB result source adapter             |
| `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID`                      | Live video status                                  |
| `DISASTER_ALERT_API_KEY`                                     | Disaster/emergency alert source                    |
| `PARLIAMENT_LIVE_URL`                                        | Official parliament stream URL                     |
| `CAPTCHA_PROVIDER`, `CAPTCHA_SITE_KEY`, `CAPTCHA_SECRET_KEY` | Anti-spam for comments/submissions                 |

## Provider Signup Checklist

1. Weather/AQI: choose providers with Nepal city coverage and redistribution rights. Do not scrape paid or restricted feeds.
2. NEPSE: contract a licensed market-data vendor if official pages block edge traffic or prohibit reuse.
3. Gold/silver: confirm rates source, update cadence, attribution and archival rights.
4. Forex: prefer Nepal Rastra Bank-compatible data or licensed aggregator with NPR pairs.
5. Sports: use provider terms that allow public scoreboard display for football and cricket.
6. Election/exam results: use official APIs/files where available; otherwise publish only source links and manual editor updates.
7. YouTube/parliament: use official channel IDs and public embed URLs only.
8. Newsletter/push: configure provider, consent copy, unsubscribe flows and data retention.
9. CAPTCHA: wire public forms before enabling comments or submissions.

## Mock/Demo Inventory

Known demo or scaffolded surfaces that must not be marketed as production-complete:

| Surface                                                                                  | Current fallback                                                  |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Weather/AQI/NEPSE/forex/bullion/sports/election/exam/parliament/YouTube/disaster widgets | Typed mock envelopes with `mock` or `unconfigured` health         |
| Currency converter                                                                       | Demo USD/NPR rate until forex provider is connected               |
| Preeti-to-Unicode                                                                        | Partial character map only                                        |
| Admin CMS                                                                                | UI scaffold plus provider health, not protected production CMS    |
| Analytics-based most-read/trending                                                       | Synthetic ranking signals until analytics source is wired         |
| Legal identity                                                                           | Publisher, owner, phone, address and DoIB values are placeholders |
| Images                                                                                   | Seed/demo images need licensing review and replacement            |

## Production Launch Blockers

1. Legal registration, DoIB number, ownership disclosure, editor-in-chief and newsroom address must be verified.
2. CMS database, migrations, admin auth and RBAC must be deployed.
3. Provider contracts and env vars must be configured; provider health must show no unconfigured critical widgets.
4. Public forms need CAPTCHA, moderation queue and abuse policy.
5. Analytics/cookie-consent and privacy policy must match actual tracking.
6. Google News/Publisher Center setup requires production domain, logo, news sitemap, editorial policies and original content review.
7. All demo images need license confirmation or replacement.
8. Private, draft, preview and admin routes must remain noindexed and guarded.

## Verification Checklist

Run before release:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

Also manually inspect `/api/provider-health`, `/admin/dashboard`, `/utilities`, article save/history behavior, `/saved`, `sitemap.xml`, `news-sitemap.xml`, `rss.xml`, mobile drawer and 320/375/414px layouts.
