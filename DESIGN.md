# DESIGN.md — नागरिक वाच Design Contract

The design contract for the Nagarik Watch news portal. Every reader-facing
surface is answerable to the rules below. When code and this document disagree,
this document wins.

**It states rules, not components.** An earlier revision listed the components
each band rendered and the endpoints each feature called; both moved, and the
contract spent months describing a site that no longer existed while three gates
kept citing it. A rule outlives a refactor. Where a rule is machine-checkable it
names the gate that checks it, so the contract fails a build rather than
drifting quietly (see §10).

---

## 1. Principle

A Devanagari-first newsroom, not a dashboard. Chrome, then the edition. The page
is the navigation: topics live inside the edition, not in extra nav rows. Facts
(BS date, place, market) sit in the chrome as facts, not as menus. One colour
does the pointing — Civic Crimson — and it is rationed to the rail, kickers and
links.

## 2. Surface

| Token            | Light (paper)        | Dark (ink)         |
| ---------------- | -------------------- | ------------------ |
| `--paper`        | `#F4F1EC` warm paper | `#17120F` deep ink |
| `--surface`      | `#FFFFFF` card       | `#211A16` card     |
| `--ink`          | `#1A1012`            | `#EDE6DC`          |
| `--ink-soft`     | `#5C5148`            | `#A99D91`          |
| `--crimson`      | `#C02A2A`            | `#E8484B`          |
| `--crimson-deep` | `#8E1F22`            | rail gradient      |
| `--rule`         | `#E2DCD2` hairlines  | `#322A24`          |

Warm paper everywhere; pure white only for cards. Dark mode is the same
newspaper printed at night: deep ink, warm cream text, crimson unchanged in
spirit. No raw hex in components — colour reaches a component through a token.

## 3. Type

- **Headlines**: Mukta (Devanagari-strong), weight 700–800.
- **Body**: Noto Sans Devanagari, 18–19px, line-height 1.85–1.95.
- **Latin/numerals**: Mukta + Noto Sans Devanagari fallback stack.
- Lead headline **38–56px** (fluid `clamp`), support pair ~24–30px, rails and
  cards 16–19px, kickers 12–13px uppercase with a **12px floor**.
- **letter-spacing is FORBIDDEN everywhere** — no tracking utilities, no
  spaced-out wordmarks, in either Devanagari or Latin. Devanagari conjuncts and
  matras require zero inter-glyph spacing to render correctly, and spaced Latin
  small caps read as artificial. Hierarchy comes from weight, size and colour
  only. ("NAGARIK WATCH", never "N A G A R I K W A T C H".)

Measure: article body **680px, centred**. Edition container **1180px**. Never
justify body text; ragged right.

## 4. Chrome

Chrome is thin and finite. Its job is to get out of the way of the first
headline.

1. **Brand band** — logo lockup left (नागरिक वाच + NAGARIK WATCH eyebrow). To
   the right, quiet utility icons only: search, saved, account, theme, locale,
   पात्रो. Icons, not labelled menus.
2. **Primary nav** — desk labels in Mukta, the active desk marked. Desks that do
   not fit collapse into a single overflow menu; they do not wrap into a second
   row.
3. **Facts strip** — BS date, reader place, NEPSE. Facts, and each one names its
   source or its staleness (§7).

Mobile: one brand row, the desk nav becomes a horizontal swipe strip, and a
**five-item bottom nav** replaces it — home, ताजा, पात्रो, search, account.
Bottom nav respects safe-area insets.

No mega-menus. No topic rows above stories. Nothing above the brand band except
तत्काल (§8).

## 5. The edition (homepage order)

The lead system is the **full portal feed** (locked, §9 #1): centred
mega-headline blocks for the top stories, then desks. Not a newspaper split hero
with a side rail — that grammar lost to the incumbent portals on the one metric
that matters here, which is how fast a reader finds the story they came for.

1. **तत्काल ticker** when breaking news is live, and never repeating the lead.
2. **Portal feed** — centred mega-headline leads with deck and photograph, then
   a denser pair of picks.
3. **Labelled billboard slot** — bordered, labelled "विज्ञापन", never disguised.
4. **Editorial spotlight**, then desks by role:
   - news desks (राजनीति, समाज): text-forward list plus one photo;
   - market desk (बजार): market well and movers;
   - photo desks (खेलकुद, मनोरञ्जन): large photograph cards;
   - voices (विचार): pull-quote typography, no photos.
5. **ताजा rail** — dense timestamped list, interleaved between desk blocks so no
   single band runs longer than a screen.
6. **Service desks** — live scores and utilities, as summaries that link out.
7. **Province strip** — seven provinces, story counts, crimson numerals.
8. **Poll of the day**, remaining desks, then a **closing band** (newsletter,
   archive, photo) so the page ends deliberately instead of trailing off.

Sections rotate layout (desk / mosaic / stack) so twelve desks do not read as
twelve copies of one block. Gaps are a single rhythm, not per-section guesses.

When there is no published edition, the page says so plainly. It never fills the
hole with fixture text (§8).

## 6. Article page

Centred 680px column: kicker (crimson), large Mukta headline (32–44px), deck,
byline, dateline, reading time, hero with caption **and** credit, body with `h2`
section heads, pull-quotes set large with a crimson rule, lists with crimson
markers. Save and share above the fold and at the end. Related stories under the
column. Progress hairline on top (crimson).

A correction is part of the article, not a footnote to it: visible on the story
itself, dated, describing what was wrong.

## 7. Utilities and live data (पात्रो, बजार, राशिफल, उपकरणहरू)

Tools keep the newspaper skin: same paper, same type, crimson reserved for
active states and numbers.

**पात्रो** runs an astronomical panchanga engine (astronomy-engine): tithi,
nakshatra, yoga and karana computed from the apparent Moon/Sun ecliptic
longitudes at Kathmandu sunrise. Lunar festivals (Dashain, Tihar, Teej,
Purnimas) are **derived** from those tithis for any year, never hardcoded dates.
Weekly public holidays: **Saturday and Sunday** (since 2082 Saun).
Preeti→Unicode is a live two-way converter. The date converter converts both
ways, Devanagari numerals out.

**बजार** — every panel names its source, and a stale panel says it is stale:

- **विदेशी मुद्रा** — Nepal Rastra Bank official API, server-cached, labelled
  fallback snapshot.
- **सुन–चाँदी** — international spot × NRB USD rate × tola conversion (0.375 oz)
  with dealer premium, labelled सूचक मूल्य.
- **नेप्से** — live when the host can reach nepalstock.com.np; otherwise an
  honestly labelled अन्तिम उपलब्ध snapshot.
- **इन्धन** — NOC revision table, revision date always shown.

**Never fake a live feed.** A panel with no data says it has no data. This is the
rule the whole site's credibility rests on, and it is not tradeable for a
demo that looks fuller.

**Numerals.** Devanagari numerals on Nepali surfaces. The exception is
market and technical readouts — NEPSE indices, forex rates, metal prices, version
strings — which stay Latin, because that is how the source prints them and how a
reader cross-checks them.

## 8. Behaviour contract

- **Real routes, locale-prefixed.** `/` is the Nepali edition, `/en/*` the
  English one; `/ne/*` canonicalises to `/` with a 308. Desk, article, topic,
  district, province, utility and trust pages are all real URLs — there are no
  hash routes.
- **An unknown URL is a 404.** Never a 200 with an empty page and an invented
  heading: a soft 404 keeps the site out of Google News and lies to the reader.
  Where a page cannot resolve its subject it calls `notFound()` itself.
- **तत्काल** is the only band allowed above the brand band: crimson-deep strip,
  white tab, bold headline, optional link, dismissible for the session.
  Dismissal hides the strip, never the news. Editors control it from the
  newsroom; readers only read it.
- Saved stories: device-local for anonymous readers, account-synced (merged on
  sign-in) once signed in. Whichever is in force is stated on the page.
- Polls: server-counted, one vote per person (account when signed in, device key
  otherwise), crimson bars with Devanagari percentages, and the honest label
  "मत सर्भरमा गणना हुन्छ".
- Comments at the end of every article; composer for signed-in readers, a
  sign-in prompt for everyone else; moderation from the newsroom.
- Theme: light and dark, persisted, default light paper.
- Every interactive element is at least **44px** on its touch dimension, and has
  a visible `focus-visible` ring.
- Images: `alt` always. Every story has a visual — a real photograph, an
  assigned stock photo, or the desk's editorial illustration. Never a blank or
  broken placeholder.
- The page works before JavaScript does: content is server-rendered, and the
  skeleton a route shows while loading has the geometry of what replaces it.

### Accounts — two audiences, one system

Better Auth over Postgres backs both, and the separation is by **role**, not by
a second login stack:

- **पाठक (reader)** — signs in under `/[locale]/auth/*`, gets bookmarks,
  reading history, comments, newsletter and notification preferences.
- **न्यूजरुम (staff)** — signs in at `/admin/login` and works in the desk at
  `/admin/*`. Twenty-one newsroom roles, from `contributor` to `super_admin`.

Authorisation is enforced **server-side on every route and every API handler**.
Hiding a button is not a permission. Staff MFA is available and is expected to be
on in production.

### The newsroom

Pitch → draft → review → publish, with the desk surfaces that workflow needs:
articles, submissions, corrections, media, taxonomy, authors, comments, polls,
live blogs, ads, paywall, newsletter, experiments, SEO, roles, audit log and a
launch readiness board. Editors keep the paper aesthetic inside `/admin`; it is
the same newspaper, at a desk.

**No fixture journalism.** The store starts empty and stays empty until an editor
publishes. Sample article text must never reach a reader as though it were
reporting, and no amount of demo pressure makes that acceptable.

## 9. Locked decisions

Decisions, with the date they were taken. A locked decision is reopened by
amending this list, not by a component quietly disagreeing with it.

| #   | Decision         | Choice                                                                          | Locked     |
| --- | ---------------- | ------------------------------------------------------------------------------- | ---------- |
| 1   | Lead system      | Full portal feed: centred mega-headline blocks for the top stories, then desks  | 2026-08-07 |
| 2   | पात्रो subdomain | `patro.nagarikwatch.com`; `/patro` 308s to it once DNS is live                  | 2026-08-07 |
| 3   | Brand band       | Left logo plus ad leaderboard slot                                              | 2026-08-07 |
| 4   | Trending source  | **Open.** Editorial tags vs automated entity extraction; CMS tags until decided | —          |

Design read, for anyone extending a surface: this is a Devanagari-first Nepali
news portal for mid-range Android readers. Variance low (portals win on
predictable packing, not asymmetry), motion low (hover and ticker only, no
scroll theatre), density high (match incumbent story packing; SaaS whitespace is
the wrong instinct here).

## 10. Enforcement

Rules that can be checked are checked, in `pnpm verify:static`:

| Rule                                                  | Gate                     |
| ----------------------------------------------------- | ------------------------ |
| No raw hex or off-token colour in components          | `audit:design-tokens`    |
| Contrast on every token pair                          | `audit:contrast`         |
| letter-spacing ban, kicker floor, banned UI patterns  | `audit:ui-bans`          |
| Font weight and family budget                         | `audit:font-budget`      |
| Labelled ad slots, never disguised                    | `audit:ads`              |
| Internal links resolve                                | `audit:internal-links`   |
| Reader shell mounts its chrome; no fixture journalism | `verify:repo-invariants` |

`pnpm audit:live-ux` checks the rendered result — letter-spacing, touch targets,
transfer weight, a11y — against a running production server, across routes and
viewports. It needs an origin, so it is not in `verify:static`; run it before
calling a UI change done.
