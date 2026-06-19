# Editorial Workflow, Nagarik Watch

> How journalism moves from idea to published page, and the rules that protect trust.
> Pairs with `docs/content-model.md` (the data) and PRODUCT.md (the voice). The CMS
> (`apps/admin`, Payload) implements these roles, transitions, and rules in access control
> and hooks.

**Guiding principles** (PRODUCT.md): reader trust above all; hybrid editorial is honest;
bylines and source attribution are always shown; corrections are visible and unembarrassed;
sponsored content is distinguishable in a blind test., -

## 1. Roles & permissions

Six roles, mapped to Payload access policies. Smallest set that fits a real newsroom;
consolidate later if needed.

| Role           | Writes draft | Edits others' drafts | Sends to review | Publishes | Marks breaking | Manages taxonomy/menu | Manages ads/sponsored | Writes English version |
|, , , , |:, -:|:, -:|:, -:|:, -:|:, -:|:, -:|:, -:|:, -:|
| `author`       | ✓   | own only | ✓   |, | ,   |, | ,   |, |
| `copyeditor`   | ✓   | ✓   | ✓   |, | ,   | tags only |, | ,   |
| `translator`   |, (English fields only) | English fields only | ✓ (English) |, | , |, | , | ✓ |
| `editor`       | ✓   | ✓   | ✓   | ✓ (own section) | ✓ (own section) | ✓ (own section) |, | ✓ |
| `publisher` (Chief Sub / desk lead) | ✓ | ✓ | ✓ | ✓ (any) | ✓ (any) | ✓ | ✓ | ✓ |
| `admin` (technical) |, | , |, | , |, | ✓ | ✓ + system |, |

Notes:
- **`translator`** is a scoped role: it can only edit the `titleEn`/`deckEn`/`bodyEn`
  fields and move `englishStatus` along its sub-workflow (ADR-007). It cannot touch the
  Nepali body, publish the article itself, or manage taxonomy. This enforces "human-
  reviewed English, never auto-translation" at the access layer.

Notes:
- **`publisher` is the only role that may set `isBreaking = true`** at a site-wide level.
  Section editors may do so only within their section. This prevents "ब्रेकिङ" fatigue
  (PRODUCT.md voice rule) and the push-notification flood risk in architecture.md §8.
- **`author` cannot self-publish**, every story sees a second pair of eyes. This is a
  trust control, not a hierarchy flex.
- **`admin`** is the technical/operator role (the solo dev initially); does not publish
  editorial content but operates the system, ads, and integrations.
- **2FA required** for `publisher` and `admin` (security baseline, architecture.md §6)., -

## 2. The publish flow (state machine)

```
        ┌──────────┐   author/copyeditor    ┌──────────┐   editor/publisher   ┌──────────┐
 idea → │  DRAFT   │ ─────────────────────▶ │ REVIEW   │ ───────────────────▶ │ PUBLISHED│
        └──────────┘                        └──────────┘                      └──────────┘
              ▲                                   │                                  │
              │          ◀─ request changes ──────┘                                  │
              │                                                                     │
              └─────────────────────── edit (any state) ─────────────────────────────┘
                                                                                       │
                                              unpublish ◀──────────────────────────────┘
                                              (reverts to DRAFT)
```

States map to Payload's draft system + a `workflowStage` field:

| State          | Visibility                          | Who can advance it out              |
|, , , , |, , , , , , , , , -|, , , , , , , , , -|
| `draft`        | CMS only; not on site; noindex       | author, copyeditor, editor, publisher |
| `review`       | CMS only; flagged in the review queue | editor, publisher                  |
| `scheduled`    | CMS only until `publishAt`           | (auto-published by scheduler)       |
| `published`    | Public; indexed; in feeds            |, (terminal until unpublished)      |
| `unpublished`  | Reverts to `draft`; URL 410s or redirects to category | editor, publisher        |

### What happens on Publish (Payload `afterChange` hook)

1. `publishedAt` set (if first publish).
2. Search index updated (Postgres FTS row upsert).
3. Sitemap regenerated for affected routes.
4. **Signed revalidate webhook** sent to `apps/web` → the **edge adapter** purges the
   home, category, and article routes (ISR revalidate). Default edge: Cloudflare; swappable
   per ADR-003.
5. If `isBreaking`: enqueue a web push (subject to the rate cap).
6. If `featuredState = lead`: it may displace another lead → that one is demoted to
   `secondary` by the same hook.

### Scheduling

`publishAt` in the future ⇒ story stays hidden publicly until then. Payload's scheduling
runs the publish transition automatically. Editors see upcoming items in a calendar view.
A scheduled story can be unscheduled (reverts to `draft`).

### Revisions

Every save creates a revision (Payload built-in). Editors can diff and roll back.
Retention: keep the **last 25 revisions per article** (bounds DB growth, open item in
ADR-002). The published revision is always retained., -

## 3. Source attribution policy (the hybrid model)

This is the core of editorial honesty. Every Article has a `sourceType` that drives
hard rules (content-model.md §1):

### `original`
- Reported and written by Nagarik Watch staff.
- Byline shows our author(s). No source attribution line needed.
- This is the brand's claim to authority and should be the plurality of lead stories.

### `aggregated` (curated from another outlet)
- **Mandatory:** `sourceName` (the originating outlet) and `sourceUrl` (canonical link).
- **Mandatory:** `sourcePublishedAt` (the original timestamp).
- The byline area renders: **"`<Outlet name>`बाट संकलित"** with a link to `sourceUrl`.
- The deck and body must add **editorial value**: translation, context, verification, or
  additional reporting, not a verbatim lift. Verbatim copying is plagiarism and is
  **never** published.
- Fair-use/quotable excerpts only; link to the origin for the rest.
- Wire/agency text (PTI, RSS feeds) that we re-publish under license is `wire`, not
  `aggregated`.

### `wire` (syndicated/agency)
- E.g. agency feeds ingested by `packages/ingest`.
- **Mandatory:** `sourceName` (agency) + `sourceUrl` + license reference (in `Media.license`
  or an internal field).
- Byline renders the agency credit (e.g. "एजेन्सी रिपोर्ट").
- Ingestion creates drafts with `sourceType: wire`; an editor reviews, edits the headline/
  deck for our voice, and publishes. Wire copy is never auto-published.

### Enforcement (structural, not discretionary)
- The CMS **refuses to save or publish** an Article with `sourceType ≠ original` and any
  of `sourceName`/`sourceUrl`/`sourcePublishedAt` missing (Payload field-level `required`
  + a `validate` hook).
- The on-site attribution line is rendered from these fields, editors cannot remove it
  by editing copy.
- The reader always sees, at minimum: byline (or agency/source), dateline, and (where
  applicable) a linked attribution line., -

## 3b. Translation sub-workflow (bilingual, author-reviewed), see ADR-007

The English toggle serves only **human-reviewed** English; the system never publishes
machine translation. A Nepali article gets an English version through this parallel
sub-flow on `englishStatus`:

```
Nepali published ──▶ editor "request English version"  (englishStatus = requested)
                          │
                          ▼
                    translator writes titleEn + deckEn + bodyEn  (in_progress)
                          │
                          ▼
                    englishStatus = ready  ──▶ editor/publisher approves ──▶ published
                                                                      │
                                                                      ▼
                                                           hasEnglish = true
                                                           (story now eligible for /en)
```

Rules:
- **`hasEnglish` is derived** (true only when `englishStatus = published` **and**
  `titleEn`+`bodyEn` are non-empty). It drives `/en` visibility, nothing else.
- The `/en` toggle is a **content filter**, not a translator. Nepali-only stories are
  simply absent from `/en`; their page shows no "Read in English" CTA (we never tease or
  auto-translate).
- The `translator` role can edit only the `*En` fields and the `englishStatus` field;
  it cannot touch the Nepali body or publish the article (§1).
- The two language versions are **linked but independent** editorial products: editing one
  does not silently change the other. A factual correction to one flags the other for the
  same fix (editorial prompt, not automatic).
- **Optional MT aid:** a *clearly-labeled, never-published* machine-translation pre-fill
  may be offered to translators as a draft aid, opt-in per editor, default off. It can
  never reach the public site., -

## 4. Breaking news

- Only `publisher` (site-wide) or `editor` (own section) may set `isBreaking = true`.
- Breaking items feed the **BreakingTicker** and (optionally) a **web push**.
- **Push rate cap:** ≤ 3 pushes/hour, ≤ 10/day site-wide (architecture.md §8). Over-cap,
  the item still appears in the ticker; the push is suppressed with an editor-visible note.
- Breaking is a *state*, not a permanent label. Editors **un-flag** once the story is no
  longer unfolding; the ticker then drops it.
- "ब्रेकिङ" is reserved for events actually unfolding (PRODUCT.md voice). Misuse is an
  editorial error, corrected like any other., -

## 5. Corrections & updates

Two distinct mechanisms:

### Correction (factual error fixed)
- Add a `corrections[]` entry: `at`, `summary` (reader-facing), `madeBy`.
- Renders as a visible, dated `CorrectionNotice` on the article, above the body or in a
  dedicated corrections strip.
- Never silently rewrite history. The original claim is acknowledged in the summary.
- Serious corrections (e.g. wrong identity, wrong result) are also surfaced as a short
  note on the homepage and may warrant a fresh story.

### Update (story developing, not an error)
- `updatedAt` changes; if it differs from `publishedAt`, the article shows
  **"यो लेख अपडेट भएको छ"** with the timestamp.
- No correction notice needed unless a fact was wrong.

The distinction matters: corrections protect trust; updates signal freshness., -

## 6. Sponsored / native content (Phase 4)

- Created as the `SponsoredContent` content type (content-model.md §8), **never** as a
  plain Article. `isSponsored` is hard-coded true and read-only.
- A `SponsoredBadge` ("प्रायोजित / Sponsored") renders on the card, the page header, and
  in feeds, unmissable. **Blind-test distinguishability is a success criterion**
  (SPEC.md).
- Sponsored items do not appear in the breaking ticker, the most-read list, or the lead
  hero. They appear only in dedicated ad slots or clearly labeled sponsored rails.
- Sponsored content is reviewed by the commercial team but **never edited to mimic
  editorial voice** in a way that hides its nature.
- The sponsored-content policy is written into the ethics page (Phase 5) before the first
  unit is sold., -

## 7. Comments

- **No comments in v1.** Reader engagement is via social, newsletter, and (later) a
  pre-moderated channel.
- If added later: **pre-moderated** (editor approves before a comment appears), with a
  clear community policy, rate limiting, and a blocklist. No open anonymous commenting., -

## 8. Editorial calendar & operations

- A simple in-CMS calendar shows scheduled (`publishAt`) stories per day/section.
- A **review queue** lists items in `review` state, oldest first, per section.
- Section editors own their queues; the publisher has a cross-section view., -

## 9. Ethics & legal baseline (published on the site, Phase 5)

- An **Editorial Code of Ethics** page: accuracy, independence, attribution, corrections,
  conflicts of interest, treatment of sources and the bereaved, off-record practice.
- A **Sponsored Content Policy** page (linked from every sponsored item).
- A **Corrections Policy** page (how to report an error).
- Footer carries the **DoIB registration number** and Press Council listing (legal norm).
- Privacy policy + cookie consent (architecture.md §6; CMP integration in Phase 5)., -

## Open workflow questions

- **Wire licensing:** which agencies/feeds do we actually license? (Business/legal, Phase 0–1.)
- **Embargoes:** do we need an embargo/hold mechanism in the CMS? (Likely yes for
  budget/press releases; add a `holdUntil` field if so.)
- **Translation workflow:** should the English version of a Nepali original be a separate
  Article (linked) or field-level translation on the same Article? Field-level (current
  model) is simpler; revisit if translation volume grows.
- **Author photos + bios:** who writes/maintains them? (Editorial ops, not a blocker.)
