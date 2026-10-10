# What is left

**Generated 2026-10-10.** Everything still outstanding, in the order it has to
happen, with who can actually do it. `docs/READINESS.md` explains _why_ each
item matters; this page is the checklist.

The ordering is not a preference. Items 1–4 gate everything below them: until
the apex serves the Node origin against a live database, nothing else can be
observed working, including the work that is already finished.

---

## 1. Operator — the site does not currently run

Nobody can do these from a pull request. They need credentials.

| #    | Item                                                                                                                 | Why it blocks                                                                                                                            |
| ---- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1  | Point `nagarikwatch.com` DNS at the **Vercel** project                                                               | ADR-004 decided this. The apex serves a static Pages export today, so every API, the newsroom and all auth are 404 on the public domain. |
| 1.2  | Provision Postgres, set `DATABASE_URL`                                                                               | The configured Aiven host no longer resolves. Accounts, comments, bookmarks, polls, view counts and ops migrations are all down.         |
| 1.3  | `pnpm db:push` then `pnpm migrate:ops` against it                                                                    | Schema must exist before anything writes.                                                                                                |
| 1.4  | Set `NEXT_PUBLIC_SITE_URL` + `BETTER_AUTH_URL` to the apex                                                           | Canonicals, OG, sitemaps and JSON-LD `@id` all derive from this. It currently resolves to `pages.dev`, which 502s.                       |
| 1.5  | Delete the root `wrangler.jsonc`; stop deploying Pages to the apex                                                   | Prevents the mirror being mistaken for production again.                                                                                 |
| 1.6  | Apply `docs/pending/workflow-fixes.patch` from a human checkout                                                      | Needs `workflow` scope — re-verified blocked for agents on 2026-10-10. Stops `ops-crons` failing every 5 minutes.                        |
| 1.7  | Set `CRON_SECRET` (≥32 ch) and `CRON_BASE_URL`                                                                       | Scheduled publish, notifications and cache revalidation do not run without them.                                                         |
| 1.8  | Set `BETTER_AUTH_SECRET`, `SUBMISSION_IP_SALT`, `REVALIDATE_SECRET` (≥32 ch, non-placeholder)                        | The gate fails closed on placeholders, correctly.                                                                                        |
| 1.9  | Attach blob storage (`BLOB_READ_WRITE_TOKEN`)                                                                        | `/api/health` reports `mediaStorage: fail`; staff cannot upload images.                                                                  |
| 1.10 | Set `SENTRY_DSN`                                                                                                     | Errors currently log to console only — i.e. nowhere.                                                                                     |
| 1.11 | Deploy `apps/admin`; set `PAYLOAD_SECRET`, `PAYLOAD_API_TOKEN`, `PAYLOAD_PUBLIC_SERVER_URL`, `PAYLOAD_DB_PUSH=false` | The CMS is built and not deployed.                                                                                                       |
| 1.12 | Enable secret scanning + Dependabot security updates                                                                 | Free, and should precede the first reader account.                                                                                       |
| 1.13 | Repair or delete the Cloudflare `Workers Builds` check                                                               | Red on every PR, carries no information.                                                                                                 |

**Exit:** `/api/health` on the apex returns `ok`, and `/admin/login` loads.

## 2. Editorial — the longest lead time, start now

| #   | Item                                                                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2.1 | **Thirty verified stories.** No engineering shortens this. It is what decides whether the client receives a publication or a template.                                   |
| 2.2 | **Seed the author taxonomy with real people.** Author pages resolve from it, so with it empty **every byline link 404s**. Fail-closed is correct; it is still a blocker. |
| 2.3 | Publish masthead, editorial policy, corrections policy.                                                                                                                  |
| 2.4 | Run one correction end to end in staging before it matters in public.                                                                                                    |
| 2.5 | Alt text, caption and credit on every asset — enforced in the collection, not in review.                                                                                 |

## 3. Legal — refuses to be faked, correctly

`launch:origin` fails the build rather than invent any of these.

- `NEXT_PUBLIC_DOIB_NUMBER` — DoIB registration; what makes the masthead lawful
- `NEXT_PUBLIC_PUBLICATION_LEGAL_NAME`
- `NEXT_PUBLIC_EDITOR_IN_CHIEF`
- `NEXT_PUBLIC_NEWSROOM_ADDRESS` / `_EMAIL` / `_PHONE` — contactability is a
  Google News requirement
- Privacy and cookie copy re-read against what actually fires

## 4. Engineering — genuinely open

Ordered by value, not by effort.

| #    | Item                                                                           | Note                                                                                                                                                                 |
| ---- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1  | **Corrections as their own collection**                                        | Highest-value item left. An append-only ledger embedded inside a versioned article document has no good answer to "restore a previous version". This is a migration. |
| 4.2  | Staff MFA (`STAFF_MFA_ENABLED`) verified **under test**, not merely configured | Configured ≠ enforced.                                                                                                                                               |
| 4.3  | Turnstile live (`CAPTCHA_PROVIDER=turnstile`)                                  | Contact, tips and poll votes are open endpoints today.                                                                                                               |
| 4.4  | Backup **and restore** rehearsed with evidence                                 | An untested restore is not a backup.                                                                                                                                 |
| 4.5  | Security headers verified against production                                   | `lib/security/response-headers.ts` proves intent, not delivery.                                                                                                      |
| 4.6  | Manual screen-reader pass                                                      | `audit:contrast` catches a real fraction and misses the ones that matter most.                                                                                       |
| 4.7  | Decide which of the 32 desk surfaces move to Payload                           | Ads, paywall, experiments and algorithms have no Payload counterpart. Write the boundary down.                                                                       |
| 4.8  | Narrow CSP `connect-src https:`                                                | Once Sentry, analytics and storage origins are final.                                                                                                                |
| 4.9  | Extend official-source ingestion                                               | Seismic ships; central bank, exchange, hydrology and government notices are the same pattern. See `apps/web/lib/ingest/official.ts`.                                 |
| 4.10 | Wire `ingest-official` into `ops-crons.yml`                                    | One line, blocked on 1.6.                                                                                                                                            |

## 5. Content pipeline — a decision, not a task

The site has no route to a full front page that does not involve a person.
Pick one, or more than one:

1. **Reporters.** The CMS, workflow, 21 roles and byline system are built and
   waiting. The only route that produces a publication.
2. **A licensed agency feed.** The parser exists in `packages/ingest` and has no
   source registered. Legal and real — and licensing _requires_ crediting and
   linking the agency, so this is incompatible with "never mention another
   outlet". Decide which constraint wins.
3. **More official primary sources.** Instruments and institutions, no upstream
   article to copy. Honest, already building, fills desks rather than a front
   page.

**Not an option:** writing article text that reads as reporting. `DESIGN.md` §8
and `verify:repo-invariants` forbid it, and they are right to.

---

## Housekeeping — done 2026-10-10

- 23 merged branches deleted (42 → 16 remote refs).
- Empty `mini-services/` removed.
- Static-export builds now `Disallow: /` — the preview mirror no longer invites
  Google to index a build with no API, no newsroom and canonicals pointing at a
  502 host.

### Still to triage (human call — these are unmerged, no open PR)

```
agent-b/full-audit-fixes            agent/deep-readiness-pass
codex/cms-audit-readiness-roadmap   codex/production-readiness-hardening
align-pnpm-versions                 deps/prune-unused-web-dependencies
tembo/newsroom-ui-live-widgets-reading
```

Each may hold work worth keeping or may be superseded. Deleting unmerged work
is not an agent's call.

### Open pull requests

| PR           | Note                                                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| #56          | `ui: delete 1,480 lines of unreachable CSS` — real cleanup, worth reviewing                                                        |
| #34          | `docs: launch-readiness roadmap` — **superseded** by `docs/READINESS.md`, which consolidated ten roadmap files into one. Close it. |
| #41–#44, #58 | Dependabot. Take them in their lockstep groups (`audit:dependency-lockstep` enforces this).                                        |
