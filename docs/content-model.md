# Content Model, Nagarik Watch

> The authoritative schema for every content type in the CMS (Payload collections, blocks,
> and globals). This is the contract between the editorial CMS and the reader-facing site.
> Changes here ripple into `apps/admin` (collections), `packages/db` (shared types/Zod),
> and search, so changes are **"Ask first"** per SPEC.md boundaries.
>
> Field types use Payload's vocabulary: `text`, `textarea`, `richText`, `relationship`,
> `upload`, `array`, `select`, `date`, `checkbox`, `group`, `tabs`, etc. Access control
> per `docs/editorial-workflow.md`.

**Naming convention:** Nepali-primary fields use the `Ne` suffix (e.g. `titleNe`);
English fields use `En`. A field is **required** unless marked *(opt)*. Localization is
field-level (not document-level): one article holds both-language fields, surfaced by
locale on the site., -

## 1. `Article` (the core collection)

The primary editorial unit. One row = one story URL.

| Field                | Type            | Required | Notes                                                                  |
|, , , , , , |-, , , , |, , , |-, , , , , , , , , , , , , , , , , , -|
| `titleNe`            | text            | yes      | Devanagari headline. Max ~120 chars. Used as `<h1>` on `/ne`.          |
| `titleEn`            | text            | opt      | English headline. If absent, English section shows `titleNe`.          |
| `slug`               | text            | yes      | Unique within `category`. Auto-generated from a Latin transliteration; editor-overridable. Hook-enforced uniqueness. |
| `deckNe` / `deckEn`  | textarea        | opt      | Sub-headline/deck. Adds context; **must not repeat the headline** (PRODUCT.md voice). |
| `bodyNe`            | richText (blocks) | yes    | **Nepali body.** Block-based (see Body blocks).                              |
| `bodyEn`            | richText (blocks) | opt    | **English body.** Optional; present only if an author-reviewed English version exists (ADR-007). **Never machine-generated.** |
| `englishStatus`     | select          | yes      | `none` \| `requested` \| `in_progress` \| `ready` \| `published`. Default `none`. Drives `/en` visibility (ADR-007). |
| `englishBy`         | relationship → User | opt | The translator/editor responsible for the English version (audit).       |
| `category`           | relationship → Category | yes | Drives the first URL segment + the section grouping.                   |
| `tags`               | array → relationship → Tag | opt | For cross-category topic pages.                                  |
| `authors`            | array → relationship → Author | yes (≥1) | Ordered; first is byline lead.                                 |
| `heroImage`          | upload → Media  | yes (for lead/standard) | Hero/lead image. **Alt text enforced at Media level.**       |
| `heroCaption` / `heroCredit` | text    | opt      | Caption + image credit (photographer/source).                         |
| `body`               | richText (blocks) | yes    | The article body. See **Body blocks** below. **Renamed per-language:** `bodyNe` (required) + `bodyEn` (optional, ADR-007). |
| `sourceType`         | select          | yes      | `original` \| `aggregated` \| `wire`. **Drives attribution requirements.** |
| `sourceName`         | text            | cond.    | **Required if sourceType ≠ original.** The originating outlet.        |
| `sourceUrl`          | text            | cond.    | **Required if sourceType ≠ original.** Canonical link to the origin.  |
| `sourcePublishedAt`  | date            | cond.    | Original publish time at the source (for aggregated/wire).            |
| `isBreaking`         | checkbox        | no       | Breaking-news flag. Only `publisher` role may set true (workflow.md). |
| `featuredState`      | select          | no       | `lead` \| `secondary` \| `none`. Controls homepage placement.         |
| `locale`             | select          | yes      | Primary locale of the piece: `ne` \| `en`. Defaults `ne`.             |
| `publishAt`          | date            | opt      | Scheduled publish time (future). Story is hidden until then.          |
| `_status`            | (Payload draft) |, | `draft` \| `published`. Drafts are reviewable, not public.            |
| `publishedAt`        | date            | auto     | Set on first publish; shown as the dateline.                          |
| `updatedAt`          | date            | auto     | Last edit. Drives "यो लेख अपडेट भएको छ" notice if ≠ publishedAt.        |
| `seoTitle`           | text            | opt      | Overrides headline in `<title>`/OG.                                   |
| `seoDescription`     | textarea        | opt      | Meta description; falls back to deck.                                 |
| `seoImage`           | upload → Media  | opt      | OG/Twitter image; falls back to heroImage.                            |
| `noIndex`            | checkbox        | no       | Exclude from indexation (rare; e.g. legal holds).                     |
| `corrections`        | array(group)    | opt      | See **Correction** sub-fields.                                        |
| `adFree`             | checkbox        | no       | Suppress in-article ads for this story (e.g. sensitive content).      |
| `commentsEnabled`    | checkbox        | no       | Off by default in v1 (no comments shipped).                           |

### Body blocks (`body` richText)

The article body is a **block-based** rich text (Payload blocks), not a free WYSIWYG,
so every element maps to a typed component on the site.

| Block              | Fields                                              | Notes                                     |
|, , , , , |, , , , , , , , , , , , , -|, , , , , , , , , , , -|
| `paragraph`        | `text (richText, inline only)`                      | The default prose unit.                   |
| `heading2` / `heading3` | `text`                                         | In-body section headings.                 |
| `image`            | `upload → Media`, `caption`, `credit`, `size`       | Inline image; alt from Media.             |
| `gallery`          | `relationship → Gallery`                            | Embed a photo gallery (Phase 3).          |
| `video`            | `relationship → Video`                              | Embed a video story (Phase 3).            |
| `embed`            | `url`, `provider` (youtube/twitter/facebook/instagram/custom) | OEmbed or safe-iframe.        |
| `pullQuote`        | `quote`, `attribution`                              | Renders as `PullQuote` (no side-stripe).  |
| `adSlot`           | `placementKey`                                      | Reserved-size in-article ad slot.         |
| `liveBlog`         | `relationship → LiveBlog`                           | Embed a live blog (Phase 3).              |
| `list`             | `ordered`, `items[]`                                | Numbered/bulleted list.                   |

### Correction sub-fields (`corrections[]`)

| Field          | Type   | Required | Notes                                            |
|, , , , |, , |, , , |-, , , , , , , , , , , , -|
| `at`           | date   | yes      | When the correction was made.                    |
| `summary`      | textarea | yes    | What was changed and why (reader-facing).        |
| `madeBy`       | relationship → User | yes | Who made it (audit).                       |

Renders on the article as a visible, dated `CorrectionNotice`., -

## 2. `Category` (taxonomy)

| Field          | Type        | Required | Notes                                                       |
|, , , , |, , , -|, , , |-, , , , , , , , , , , , , , , |
| `nameNe`       | text        | yes      | Devanagari label (e.g. राजनीति).                            |
| `nameEn`       | text        | yes      | English label (e.g. Politics).                              |
| `slug`         | text        | yes      | Unique. URL segment (e.g. `politics`). Latin, lowercase.    |
| `parent`       | relationship → Category | opt | For sub-categories (e.g. Sports → Cricket).       |
| `description`  | textarea    | opt      | Section blurb; shown on category page + for SEO.           |
| `seoImage`     | upload → Media | opt   | Category-page OG image.                                    |
| `navOrder`     | number      | opt      | Sort order in primary nav.                                  |
| `showInNav`    | checkbox    | no       | Include in primary navigation.                              |
| `template`     | select      | no       | Section-page layout variant (default `standard`).           |

**Seed categories (matching Setopati's depth):** राजनीति (Politics), समाज (Society),
बजार (Business/Market), खेलकुद (Sports), मनोरञ्जन (Entertainment), विश्व (World),
ब्लग/राय (Opinion/Blog), plus an English section (`english`) and a catch-all
प्रवास (Diaspora), final list confirmed in Phase 0., -

## 3. `Author` / `Columnist`

| Field          | Type        | Required | Notes                                                       |
|, , , , |, , , -|, , , |-, , , , , , , , , , , , , , , |
| `name`         | text        | yes      | Display name (Devanagari or Latin as appropriate).          |
| `slug`         | text        | yes      | Unique. URL segment (`/author/:slug`).                      |
| `role`         | select      | yes      | `staff` \| `columnist` \| `contributor` \| `wire`.          |
| `bio`          | textarea    | opt      | Shown on the author page.                                   |
| `photo`        | upload → Media | opt   | Author headshot (alt = name).                               |
| `email`        | email       | opt      | Internal; not exposed unless opted in.                      |
| `social`       | group       | opt      | `twitter`, `facebook`, `instagram`, `linkedin` URLs.        |
| `columns`      | relationship → Category | opt | If a columnist, the column/category they write under.|
| `isActive`     | checkbox    | yes      | Hide departed authors from bylines without deleting them.   |, -

## 4. `Tag` / `Topic`

Cross-category grouping for running stories (e.g. an election, a tournament, a court case).

| Field          | Type        | Required | Notes                                                       |
|, , , , |, , , -|, , , |-, , , , , , , , , , , , , , , |
| `nameNe` / `nameEn` | text   | yes      | Tag label.                                                  |
| `slug`         | text        | yes      | Unique. URL `/topic/:slug`.                                 |
| `description`  | textarea    | opt      | Topic-page blurb.                                           |
| `seoImage`     | upload → Media | opt   |                                                             |, -

## 5. `Media` (the upload collection, images, PDFs, video posters)

All editorial media lives here and is served via the **object-storage adapter** (default:
Cloudflare R2; swappable per ADR-003, S3-compatible, so AWS S3 / Backblaze B2 / MinIO
drop in by changing endpoints).

| Field          | Type        | Required | Notes                                                       |
|, , , , |, , , -|, , , |-, , , , , , , , , , , , , , , |
| `filename`     | (auto)      |, | Generated by Payload.                                       |
| `alt`          | textarea    | **yes**  | **Mandatory.** A11y gate; CMS refuses save without it.      |
| `credit`       | text        | opt      | Photographer/source.                                        |
| `caption`      | textarea    | opt      | Default caption; overridable per use.                       |
| `license`      | select      | opt      | `owned` \| `purchased` \| `cc-by*` \| `press-handout` \| `social`. |
| `sourceUrl`    | text        | cond.    | Required if `license` indicates external origin.           |
| `tags`         | array(text) | opt      | Library search aid.                                         |
| `width`/`height` | (auto)    |, | For reserved aspect ratios (CLS budget).                    |

`next/image` transforms on the way out; AVIF/WebP served; the CDN caches transforms., -

## 6. `Menu` (global)

Editable navigation so editors don't need code changes to reorder nav.

| Field          | Type        | Notes                                                       |
|, , , , |, , , -|, , , , , , , , , , , , , , , -|
| `location`     | select      | `primary` \| `footer` \| `mobile` \| `utility`.             |
| `items[]`      | array(group)| `label`, `link` (internal category/page or external URL), `order`, `children[]` (one level deep). |

Implemented as a Payload **Global** (one per location), not a collection., -

## 7. `AdSlot` (configuration)

Where ad units live and how they're filled. The reader-side `<AdSlot placementKey=…/>`
component reads this config.

| Field            | Type        | Notes                                                     |
|, , , , , |-, , , |, , , , , , , , , , , , , , , -|
| `placementKey`   | text        | Unique. e.g. `header_leaderboard`, `inarticle_mid`.       |
| `label`          | text        | Reader-facing label ("विज्ञापन" / "Advertisement").      |
| `network`        | select      | `adsense` \| `gam` \| `direct` \| `house`.                |
| `adUnit`         | text        | Network-specific unit id.                                 |
| `sizes[]`        | array       | Reserved sizes (e.g. `728x90`, `fluid`). **Reserved to protect CLS.** |
| `lazyLoad`       | checkbox    | Default true.                                             |
| `targeting`      | group       | `categories[]`, `tags[]`, `locales[]` for direct/house.   |
| `isActive`       | checkbox    | Toggle without deleting.                                  |

Canonical placements defined in `docs/ad-placements.md` (Phase 1 artifact; open item in
ADR-006)., -

## 8. `SponsoredContent` (native), Phase 4

A **distinct** content type, never a disguised Article. Shares Article's body model but
adds mandatory labeling.

| Field              | Type | Required | Notes                                                  |
|, , , , , |, , |-, , -|, , , , , , , , , , , , , , |
| *(all Article fields)* |, | ,        | Inherits the editorial model.                          |
| `sponsor`          | text | **yes**  | The paying sponsor's name.                             |
| `sponsorUrl`       | text | opt      |                                                        |
| `sponsorLogo`      | upload → Media | opt |                                                        |
| `isSponsored`      |, | **always true** | Hard-coded; the `SponsoredBadge` renders on cards + page top. Blind-test distinguishable. |, -

## 9. Signature content types (Phase 3+)

### `Gallery` (photo gallery)
| Field           | Type            | Notes                                              |
|, , , , -|, , , , -|, , , , , , , , , , , , , |
| `titleNe`/`titleEn` | text        |                                                    |
| `slug`          | text            |                                                    |
| `images[]`      | array(upload → Media) | Each with its own caption/credit.            |
| `category`      | relationship → Category |                                              |

### `Video`
| Field           | Type            | Notes                                              |
|, , , , -|, , , , -|, , , , , , , , , , , , , |
| `titleNe`/`titleEn` | text        |                                                    |
| `slug`          | text            |                                                    |
| `provider`      | select          | `self` \| `youtube` \| `facebook`.                 |
| `videoUrl` / `file` | text/upload | External URL or R2 upload if self-hosted.      |
| `posterImage`   | upload → Media  | Thumbnail.                                         |
| `duration`      | number          | Seconds; shown as meta.                            |
| `category`      | relationship → Category |                                              |

### `LiveBlog`
| Field             | Type             | Notes                                              |
|, , , , , -|, , , , , |-, , , , , , , , , , , , , -|
| `titleNe`/`titleEn` | text          |                                                    |
| `slug`            | text             |                                                    |
| `status`          | select           | `live` \| `paused` \| `ended`.                     |
| `entries[]`       | array(group)     | `timestamp`, `author`, `text (richText)`, `highlight` (checkbox). Newest first. |
| `category`        | relationship → Category |                                              |

### `EpaperEdition`
| Field             | Type             | Notes                                              |
|, , , , , -|, , , , , |-, , , , , , , , , , , , , -|
| `editionDate`     | date             | The publication date (BS + AD).                    |
| `label`           | text             | e.g. "काठमाडौं अंक".                                |
| `pages[]`         | array(upload → Media PDF) | Per-page PDFs or a single doc.             |
| `thumbnail`       | upload → Media   |                                                    |
| `isPublished`     | checkbox         |                                                    |, -

## 10. Globals (singletons)

- **SiteSettings**: `siteNameNe`/`siteNameEn`, `tagline`, `logo` (light/dark), `favicon`,
  `defaultSeoImage`, `socialLinks[]`, `doibRegistrationNumber` (footer legal), `pressCouncilId`.
- **Menus**: one global per location (`primary`, `footer`, `mobile`, `utility`).
- **BreakingTicker**: the current breaking item(s) + active flag, surfaced across the site.
- **AdsConfig**: global ad settings (network account ids, default labels, consent config)., -

## Relationships map (simplified)

```
Category 1───∗ Article ∙───∗ Tag
        └── (self: parent)
Author  ∙───∗ Article        (many-to-many via authors[])
Media   1───∗ (used by Article hero, body images, Gallery, Video, Epaper…)
Article 1───∗ Correction
Article 1───1 SponsoredContent (extends; Phase 4)
Menu(Global) ──> Category | external URL
```, -

## Validation rules (enforced in Payload hooks / field config)

- **Alt text required** on every `Media` upload (cannot save without it).
- **sourceName + sourceUrl + sourcePublishedAt required** when `Article.sourceType ≠ original`.
- **Slug uniqueness** within `category` (hook validates on save).
- **`isBreaking`** may be set true only by `publisher` role (access control).
- **SponsoredContent.isSponsored** is read-only-true; cannot be unset.
- **Future `publishAt`** hides the story from public queries until the time arrives (Payload
  scheduling + a query filter).
- **`noIndex`** articles excluded from sitemap + `robots`., -

## Open items

- Confirm the final **seed category list** in Phase 0 (PRODUCT.md open question).
- **Devanagari tokenization** for Postgres FTS on `titleNe` + `deckNe` + body (ADR-005).
- **Revisions retention** policy (ADR-002 open item).
- Author bylines: support **"रु. एजेन्सी"** style wire attributions cleanly (e.g.
  `role: wire` + `sourceName` interplay).
