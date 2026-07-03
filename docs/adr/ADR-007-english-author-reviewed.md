# ADR-007: English versions are author-reviewed only

**Status:** Accepted
**Date:** 2024

## Context

Nagarik Watch is Nepali-primary. An English section is valuable for the diaspora and international
readers, but machine-translation of news carries accuracy and voice risks.

## Decision

English versions (`titleEn`, `bodyEn`) are **only** published when an author/editor has written or
reviewed them. The `englishStatus` field (none / requested / in_progress / ready / published)
tracks this. Machine translation may assist a translator but never auto-publish.

## Consequences

- The English section grows slower than Nepali — accepted.
- Readers trust that English content meets the same editorial standard.
- The `locale` field on Article marks the primary language; the English path is opt-in per article.
