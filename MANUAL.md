# Nagarik Watch Owner Manual / सञ्चालक पुस्तिका

This manual distinguishes code-complete paths from launch-time configuration and from
work that still requires a licensed provider or business decision. **Do not present the
preview environment, seed stories, or manual fallback values as live reporting.**

## 1. Runtime topology / चल्ने संरचना

| Surface | Responsibility | Production source |
|---|---|---|
| `apps/web` | Public portal, reader accounts, journalist desk, operations admin | Payload REST + Postgres operational tables |
| `apps/admin` | Editorial CMS, media, taxonomy, revisions, publishing | Payload + Postgres + object storage |
| Local JSON/PGlite files | Developer convenience only | Never accepted by live launch gate |

Payload is the sole production content authority. When `CONTENT_SOURCE=payload`, content
editing links in `/admin/*` redirect to Payload and direct shadow-store mutations return a
conflict instead of pretending to save.

## 2. Secrets and environment / गोप्य कन्फिगरेसन

Start from `.env.example`. Store real values only in the hosting provider's secret vault or
an ignored local file.

Mandatory for a live deployment:

- `DATABASE_URL` — durable Postgres for Payload, Better Auth, and operational records.
- `PAYLOAD_SECRET`, `AUTH_SECRET`, `BETTER_AUTH_SECRET`, `REVALIDATE_SECRET` — unique,
  non-placeholder secrets.
- `PAYLOAD_PUBLIC_SERVER_URL` — public/internal-reachable CMS origin used by server-side
  REST reads.
- `PAYLOAD_ADMIN_URL` — optional explicit newsroom URL; otherwise derived from the CMS
  origin.
- `CONTENT_SOURCE=payload` and `PAYLOAD_DB_PUSH=false`.
- Durable object storage (`STORAGE_BUCKET` or another launch-gate-supported adapter).
- Verified publisher name, editor-in-chief, registration number, phone, email, and address.

`PAYLOAD_API_TOKEN` is required for the journalist desk to create Payload drafts. Use an
API key owned by a least-privilege Payload service account with article-create access. A
matching active Author record must exist for each journalist's Better Auth email.

### Secret incident response

The supplied archive previously contained real-looking local environment files. Those
files have been removed from the repaired repository, but **every value that ever appeared
in the archive must be rotated by its owner**. Code cannot rotate third-party credentials.

## 3. Authentication / प्रमाणीकरण

### Reader accounts

- Nepali: `/register`, `/login`, `/profile`, `/saved`
- English: `/en/register`, `/en/login`, `/en/profile`, `/en/saved`
- Better Auth stores accounts and sessions in Postgres in production.
- When `DATABASE_URL` is omitted during local development, auth uses persistent PGlite at
  `PGLITE_DATA_DIR`; it is not process-memory auth.

### Newsroom operations admin

1. Set `ENABLE_WEB_ADMIN_SCAFFOLD=true` only when the operations dashboard is intended to
   be reachable.
2. Configure `NEWSROOM_SUPERADMIN_*` for initial provisioning.
3. Start the web app after the auth database is reachable. Schema migration and boot-account
   provisioning are awaited; failures stop auth initialization rather than being swallowed.
4. Sign in at `/admin/login`, change the password, then remove the bootstrap password from
   the environment.

### Journalist desk

- Login: `/journalist/login` or `/en/journalist/login`
- Dashboard: `/journalist/dashboard`
- Journalists see assignments, their draft flow, feedback, and profile—not the full admin.
- Admin-level newsroom roles may enter the journalist desk; journalist roles cannot enter
  privileged admin routes.

Payload CMS has its own newsroom account system at the CMS origin. Keep its service-account
API key and human editor credentials separate from Better Auth reader/newsroom credentials.

## 4. Content and publication / सामग्री तथा प्रकाशन

- Articles, authors, categories, tags, and media are managed in Payload in production.
- Nepali is the canonical article language. English listing visibility requires
  `englishStatus=published`.
- Publishing stamps `publishAt` when it is absent; public ordering and article timestamps
  use this field.
- Premium stories show three paragraph blocks before the membership gate unless the reader
  is entitled through the configured membership mechanism.
- Corrections, attribution, author links, dates, and publisher schema are rendered from the
  content contract.

Do not turn `NEXT_PUBLIC_LAUNCH_STATUS` to `live` while publication identity fields still
contain “placeholder”, “pending”, “change-me”, or dummy registration/phone values.

## 5. Operational data / सञ्चालन डेटा

The following records use Postgres in production and may use explicit memory/file fallback
only in local development:

- comments, poll votes, bookmarks, reading history;
- newsletter subscriptions and newsroom newsletter issues;
- reader submissions and contact messages;
- live-blog entries and manual live-data overrides;
- audit events, settings, taxonomy helpers, ads, analytics events, paywall grants;
- journalist draft metadata and newsroom invitations.

A missing database or schema failure now surfaces as an error in production. It must not
silently “succeed” into process memory.

## 6. Live data / प्रत्यक्ष डेटा

Every widget must communicate source, timestamp, status, and whether an editor supplied a
manual fallback.

- Weather and AQI: Open-Meteo keyless endpoints.
- Forex: Nepal Rastra Bank daily feed.
- Disaster: verified manual override plus configured official feed; the code can use USGS
  earthquake data filtered to Nepal when appropriate.
- NEPSE, bullion, football, cricket, elections, exams, parliament, and other licensed data:
  configure an approved provider or maintain a clearly attributed manual newsroom value.

The application no longer fabricates plausible-looking values when a provider fails. A
provider outage produces an unavailable/error state and must not take down the homepage.

## 7. Reader submissions and contact / पाठक सम्पर्क

- `/submit-story` accepts tips and evidence references with consent and anonymity choices.
- `/contact` stores messages for `/admin/contact` review.
- `/admin/submissions` is a moderated queue; publication is never automatic.
- Current evidence intake accepts a URL/reference. Secure binary upload, malware scanning,
  retention rules, and source-protection procedures remain launch work if direct file upload
  is required.

## 8. Newsletter, polls, membership / न्यूजलेटर, मतसर्वेक्षण, सदस्यता

- Newsletter signup uses double opt-in and durable Postgres state in production.
- Newsroom issues can be drafted/queued without a provider; actual delivery requires
  Resend, SMTP, or another configured adapter and unsubscribe compliance.
- Poll definitions and votes persist through the operational store; one-vote controls are
  fingerprint/account based, not a substitute for high-assurance election polling.
- Membership/paywall UX is implemented. Real recurring billing, webhooks, refunds, tax,
  and entitlement reconciliation require a selected payment provider.

## 9. SEO and trust / SEO तथा विश्वसनीयता

Verify after deploying the real domain:

- `/sitemap.xml`, `/news-sitemap.xml`, `/rss.xml`, `/robots.txt`;
- article `NewsArticle` JSON-LD, author and publisher data;
- About, Team, Editorial Policy, Ethics, Corrections, Fact-check, Privacy, Terms, Contact;
- canonical URLs and English/Nepali alternate links;
- Google Search Console and Publisher Center ownership.

Do not place placeholder legal identity or generic “team” copy into structured data. The
launch gate rejects known placeholder patterns.

## 10. Deployment sequence / परिनियोजन क्रम

1. Rotate exposed credentials.
2. Provision managed Postgres and object storage with backups.
3. Install dependencies from the checked-in lockfile.
4. Apply checked-in Payload migrations with `PAYLOAD_DB_PUSH=false`.
5. Apply operational schema migrations against the same Postgres: `pnpm migrate:ops` (from repo root; requires `DATABASE_URL`).
6. Deploy `apps/admin`; create human users and the least-privilege journalist bridge account.
7. Seed/enter verified categories, authors, and launch inventory in Payload.
8. Deploy `apps/web` with `CONTENT_SOURCE=payload` and reachable CMS URLs.
9. Run the full verification suite and browser/e2e tests (`pnpm test:a11y`, `pnpm test:e2e`).
10. Fill legal identity, provider, email, analytics, and ad configuration.
11. Run `NEXT_PUBLIC_LAUNCH_STATUS=live pnpm launch:gate`; launch only when it passes.

## 11. Required manual QA / अनिवार्य मानव परीक्षण

Test at minimum 320, 375, 390, 414, and 768 CSS pixels plus desktop:

- masthead, locale/theme controls, nav drawer, footer, bottom navigation;
- homepage hierarchy, category/latest/trending, search, article reading and premium gate;
- login/signup/profile/saved, bookmark and reading sync;
- journalist draft submission into Payload;
- all role boundaries and direct API mutation attempts;
- contact/submission moderation, live widgets, newsletter, polls, admin logout;
- keyboard-only navigation, focus visibility, contrast, screen-reader names and error text.

The repair environment could not execute Playwright or dependency-backed builds because it
had no pnpm installation and no package-registry network access. Treat
`VERIFICATION_LOG_CURRENT.md` as evidence of static verification—not a substitute for this
launch QA.
