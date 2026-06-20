# ADR-001: Brand name "Nagarik Watch", collision risk accepted

- **Status:** Accepted
- **Date:** 2026-06-18
- **Decision owner:** Founder
- **Supersedes:** none

## Context

The project's working brand name is **"Nagarik Watch" (नागरिक वाच)**. The word "Nagarik"
(नागरिक, meaning _citizen_ in Nepali) overlaps with an established, major Nepali media
brand:

- **Nagarik** (नागरिक) is a national Nepali-language daily newspaper, the flagship of
  **Nepal Republic Media Limited (NRM)**, founded 2009 (founder Shova Gyawali, publisher
  Binod Raj Gyawali, editor Gunaraj Luitel; ~128 employees).
- NRM's sister outlets: **Republica** (English daily, a _New York Times_ partner),
  myRepublica, Radio Nagarik, AP1 TV.
- They operate under the **"Nagarik Network"** umbrella at `nagariknetwork.com`,
  `nagariknews.nagariknetwork.com`, plus a Google Play news app, over 15 years of brand
  use and SEO authority.

### Risks created by the overlap

1. **Trademark / legal.** "Nagarik" is a generic word, but **in the media class of goods
   it has acquired distinctiveness** via NRM's long use. A cease-and-desist from NRM is
   plausible, especially as Nagarik Watch grows visible.
2. **SEO.** We will not rank for any query containing "Nagarik" for a very long time, if
   ever. Readers searching "Nagarik news" hit the incumbent.
3. **Brand confusion.** Readers may assume Nagarik Watch is part of NRM. That erodes the
   independent credibility a news brand depends on.
4. **DoIB registration.** Online news in Nepal must register with the Department of
   Information & Broadcasting. DoIB keeps a registry of existing media names and may
   reject a name deceptively similar to "Nagarik."

The architect's recommendation was to **rename** to a distinctive, ownable brand. The
decision owner reviewed this and chose to **keep "Nagarik Watch" as-is**.

## Decision

Proceed with the brand name **"Nagarik Watch" (नागरिक वाच)**, accepting the risks above.

This ADR records that the risks were surfaced and understood before any branding, domain,
code, or registration was committed. The architect will not raise the rename again unless
(a) a legal challenge arrives, (b) DoIB rejects the name, or (c) the decision owner asks.

## Mitigations (baked into the plan, not optional)

1. **Use the full composite name everywhere**, "Nagarik Watch" / "नागरिक वाच", never the
   bare word "Nagarik" on its own. The word "Watch" / "वाच" is the distinctiveness lever;
   always pair them.
2. **Register the full name with DoIB** as "Nagarik Watch," not "Nagarik," and secure the
   matching `.com.np` (requires a Nepali entity) plus `.com`, `.net`, social handles
   early.
3. **Distinct visual identity** (DESIGN.md), a different palette, masthead, and
   typography than NRM, so there is no passing-off.
4. **Positioning clarity in footer + about page**, make independence explicit; do not
   imply any affiliation with NRM or the Nagarik Network.
5. **Keep a documented rename path.** All branding lives in tokens, a single
   `wordmark.tsx`, and dictionary strings; a future rename touches a small surface, not a
   deep refactor. The domain strategy keeps a non-"Nagarik" fallback domain available if
   ever needed.
6. **Monitor**, set a quarterly reminder to check (a) NRM trademark activity and (b) our
   own search visibility for the brand terms.

## Consequences

- **Positive:** the founder keeps the name they want; "नागरिक" (citizen) is a strong,
  meaning-rich word for a civic-minded news brand; "Watch" communicates scrutiny.
- **Negative:** SEO will be an uphill climb for brand terms; a small but non-zero legal
  risk persists forever; some readers will initially confuse us with NRM.

## Trade-offs

Brand-owner preference and the strength of the composite name are prioritised over SEO
convenience and the theoretical legal risk. The mitigations above bound the downside; the
documented rename path bounds the worst-case cost if a pivot becomes necessary.

## Triggers to reopen this ADR

- Any communication (legal or informal) from NRM or its counsel.
- DoIB rejection of the name on similarity grounds.
- Decision-owner request.
