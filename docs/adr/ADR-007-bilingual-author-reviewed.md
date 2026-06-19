# ADR-007: Bilingual model, author-reviewed English, never auto-translation

- **Status:** Accepted
- **Date:** 2026-06-18
- **Decision owner:** Founder + Architect
- **Supersedes:** the "field-level translation" note in content-model.md §1 and the
  open translation-workflow question in editorial-workflow.md §9.

## Context

The portal is **Nepali-primary with a dedicated English section** (locked decision). The
founder clarified (2026-06-18) that the user-facing **language toggle must deliver
on-point, author-reviewed English content, not machine translation.** This is a strong
editorial-ethics stance: a credible news brand does not serve readers automated
translation presented as journalism, because:

- Machine translation of Nepali → English is unreliable on names, quotations, legal/political
  terminology, and nuance. Errors erode trust (PRODUCT.md principle 1).
- Presenting auto-translation as "the English version" misrepresents authorship.
- A news brand's authority rests on a human taking responsibility for every published word.

So the toggle must only ever surface English that a human (the author or an editor) has
written and approved.

## Decision

Adopt an **author-reviewed bilingual model** with these rules:

1. **Every Article may have both `titleNe`/`bodyNe` (Nepali) and `titleEn`/`bodyEn`
   (English), but English fields are OPTIONAL.** An article with no English content is a
   Nepali-only story; the English toggle simply does not show it.
2. **English is never generated from Nepali by the system.** No auto-translation pipeline,
   no machine-translation preview presented as the article. (Aids/assists for translators
   may exist in the CMS as an editor tool, clearly marked as a draft aid, never as a
   published surface, see Open items.)
3. **The toggle is a content filter, not a translator.** Switching to `/en` shows only
   stories that have approved English content. Switching to `/ne` shows everything
   (Nepali is the primary language; an English-first story is the rare inverse).
4. **Authoring/translation is a CMS workflow.** An editor can "request English version" on
   a Nepali story; that creates a linked draft English body for a translator/editor to
   write, which is reviewed and published through the normal workflow (editorial-
   workflow.md). Until then, the English toggle does not surface the story.
5. **Integrity:** the two language versions are **linked but independent** editorial
   products. Editing the Nepali does not silently change the English, and vice versa. They
   can diverge in wording (translator's prerogative) while reporting the same facts.
6. **Source attribution + corrections** are maintained per language version (a correction
   to the Nepali applies factually to the English; both get a notice if both exist).

## Rationale

- **Trust:** readers see only human-vetted content in either language. The brand never
  vouches for machine output.
- **Quality:** on-point English requires a human translator/editor; the workflow makes
   that explicit and resourced, not accidental.
- **Simplicity of the toggle:** it becomes a pure content filter, so the UX is honest and
  predictable, "no English version" means the story is absent from `/en`, not badly
  translated.
- **Pairs with content-model.md:** the existing `titleNe`/`titleEn` field pairs are
  extended to `bodyNe`/`bodyEn` (block-based, same schema), with a `hasEnglish` derived
  flag and an `englishStatus` workflow field.

## Effect on the content model (content-model.md update)

The `Article` collection gains explicit bilingual body fields and a translation workflow:

| Field             | Type                | Notes                                                       |
|, , , , , -|, , , , , -|, , , , , , , , , , , , , , , |
| `titleNe`         | text                | Required. Devanagari headline.                             |
| `bodyNe`          | richText (blocks)   | Required. Nepali body.                                      |
| `titleEn`         | text                | Optional. English headline; only if an English version exists. |
| `bodyEn`          | richText (blocks)   | Optional. English body.                                     |
| `deckNe`/`deckEn` | textarea            | Per-language deck.                                          |
| `englishStatus`   | select              | `none` \| `requested` \| `in_progress` \| `ready` \| `published`. Default `none`. |
| `englishBy`       | relationship → User | The translator/editor responsible for the English version. |
| `hasEnglish`      | (derived)           | True only when `englishStatus = published` AND `titleEn`+`bodyEn` present. Drives `/en` visibility. |

`locale` (the *primary* language of the piece) is retained: a story can be `ne`-primary
(usual) or `en`-primary (rare; an English-first wire/origin item translated *into* Nepali).

## Effect on the site (web)

- **`/` serves Nepali** (all stories); **`/en` serves English** (only `hasEnglish`
  stories). The toggle switches path + `html[lang]`.
- A Nepali-only story's page offers **no** "Read in English" CTA if `englishStatus ≠
  published` (we do not tease or auto-translate). If an English version exists, a clear
  "English" link appears and vice versa.
- hreflang on article pages points to the sibling locale only when both exist.
- Search is per-locale (Phase 2 FTS indexes `titleNe`+`bodyNe` and `titleEn`+`bodyEn`
  separately).

## Effect on the editorial workflow (editorial-workflow.md update)

Add a **translation sub-workflow** parallel to the publish flow:

```
Nepali published ──▶ editor "request English version"
                          │
                          ▼
                  englishStatus = requested / in_progress
                  (translator writes titleEn + bodyEn)
                          │
                          ▼
                  englishStatus = ready  ──▶ reviewer approves ──▶ published
                                                                  │
                                                                  ▼
                                                           hasEnglish = true
                                                           (story now appears in /en)
```

- The translator role (a new lightweight role, or a capability on `author`/`copyeditor`)
  owns the English body. The English version goes through review like any story.
- Both language versions keep independent revisions.
- A correction to facts propagates: correcting the Nepali flags the English for the same
  factual fix (editorial prompt, not automatic text change).

## Consequences

- **Positive:** trust and quality in both languages; the toggle is honest; no machine-
  translation liability; clean separation of concerns.
- **Negative:** English coverage is **bounded by human translation capacity**, `/en` will
  be a curated subset, not a mirror of `/ne`. This is a feature (quality), not a bug, but
  it must be communicated to readers ("English edition: selected stories").
- **Negative:** more CMS surface (bilingual fields + translation workflow). Bounded, it
  reuses the existing block editor and review flow.

## Trade-offs

Editorial integrity and reader trust are prioritised over the appearance of full English
coverage. We accept a smaller, human-vetted English edition over a large, machine-
translated one. This is consistent with PRODUCT.md's "reader trust above all."

## Open items

- **Translator role:** add a dedicated `translator` role or extend `copyeditor`? Decide in
  Phase 2 (lean: dedicated capability, same login).
- **Optional CMS aid:** may we offer a *clearly-labeled, never-published* MT draft assist
  (e.g. Google Translate pre-fill) that a human translator then fully rewrites? Acceptable
  only if it can never reach the public site and is opt-in per editor. Default: off.
- **Translation memory / glossary:** maintain a Nepali↔English term glossary (proper nouns,
  political terms) to keep translations consistent. Phase 2 nicety.
- **Numerals/dates per locale:** confirm Devanagari numerals + BS dates in `/ne`, Latin +
  AD in `/en` (already in SPEC.md / DESIGN.md, restated for completeness).
- **What `/en` shows when empty:** a clear, on-brand empty state ("हाल यो समाचार अंग्रेजीमा
  उपलब्ध छैन" / "This story is not available in English yet"), never a machine translation.
