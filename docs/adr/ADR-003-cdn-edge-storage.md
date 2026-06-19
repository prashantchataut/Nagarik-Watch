# ADR-003: Edge/CDN + object storage, vendor-neutral interface, Cloudflare default

- **Status:** Accepted (with vendor-neutral abstraction)
- **Date:** 2026-06-18 (revised)
- **Decision owner:** Architect
- **Supersedes:** none

## Context

The reader base is mostly in Nepal on mobile data, with a diaspora tail worldwide. The
read path is **static + ISR pages** that change on the order of seconds-to-minutes. The
fastest, cheapest, most resilient read experience requires serving cached content from a
CDN edge close to Nepali networks, decoupled object storage for media, and DDoS/WAF on a
news site (a target for scrapers and abuse).

A **founder constraint** (clarified 2026-06-18): **do not be over-reliant on Cloudflare.**
The project may use other hosting, domain, and infrastructure providers. Cloudflare should
not be a hard dependency baked into code. The architecture must be **vendor-neutral at the
seam**, with a swappable provider behind a small interface.

Requirements for the edge/storage layer:
- Edge PoPs that reach Nepal well (Mumbai, Singapore, Chennai).
- Cache static assets + ISR HTML; honor on-demand purge/revalidate from the CMS publish
  webhook.
- DDoS protection + WAF + rate limiting.
- Object storage for media (images, ePaper PDFs) with low/zero egress.
- Swappable: the code talks to the edge/storage via an **adapter**, not via provider-
  specific calls scattered through the app.

## Decision

Define **two thin provider interfaces** in `packages/db` (or a new `packages/infra`), and
ship a **Cloudflare adapter as the default**, with at least one named alternative adapter
documented for each. The app code depends on the interface, never on `wrangler`, R2 APIs,
CF-specific headers, etc. directly outside the adapter.

```
packages/infra/
  src/
    edge.ts        # interface: cachePurge(keys[]), cacheHeadersFor(route)
    storage.ts     # interface: putMedia(key, stream, meta), getMediaUrl(key, opts)
    adapters/
      cloudflare/  # default: R2 (storage), CF Cache API / page rules (edge)
      aws/         # alternative: CloudFront (edge) + S3 (storage)
      bunny/       # alternative: Bunny CDN (edge) + Bunny Storage
      vercel/      # alternative: Vercel Edge (edge) + S3-compatible (storage)
```

**Default providers (configurable via env, not hard-coded):**
- **Edge/CDN:** Cloudflare (free tier strong; PoPs near Nepal). Replaceable by CloudFront,
  Bunny, Fastly, or Vercel Edge via a different adapter.
- **Object storage:** Cloudflare R2 (S3-compatible, **zero egress**). Replaceable by any
  S3-compatible store (AWS S3, Backblaze B2, MinIO, Bunny Storage) because R2 already
  speaks the S3 API, the storage adapter is essentially the S3 SDK pointed at different
  endpoints.
- **WAF/DDoS/rate-limit:** provided by the edge provider (Cloudflare by default).

## Rationale

- **Vendor neutrality at the seam:** swapping the edge or storage provider is a new
  adapter + an env change, not an app rewrite. This directly satisfies the founder's
  "don't be over-reliant on Cloudflare" constraint while still letting us *default* to
  Cloudflare for its strengths.
- **S3-compatibility is the de-facto standard:** R2, S3, B2, and MinIO all speak the S3
  API, so the storage adapter is trivially portable. We never use R2-specific features
  that lock us in.
- **Edge presence near Nepal:** Cloudflare's Mumbai/Chennai/Singapore PoPs reach Nepali
  ISPs (NTC, Ncell) well; cache HITs serve in tens of ms. If we later switch, CloudFront
  and Bunny also have regional PoPs.
- **Cost:** free/cheap tier at launch; R2's zero-egress model is genuinely valuable for an
  image-heavy news site, but it's a *benefit of the default*, not a lock-in.
- **Decoupled from origin vendor (ADR-004):** the edge layer is independent of where
  Next.js runs.

## Consequences

- **Positive:** real provider portability; Cloudflare's strengths where we want them; S3-
  compatible storage means any future migration is mostly config.
- **Positive:** the founder can switch hosting/domain/infra providers without rearchitecting.
- **Negative:** a small amount of adapter code to write and maintain (bounded, the
  interfaces are tiny: cache-purge, media get/put, header policy).
- **Negative:** provider-specific advanced features (e.g. Cloudflare Workers, R2 custom
  ML transforms) are opted into deliberately via the adapter, not used casually in app code.

## Trade-offs

A thin abstraction layer (small cost) is accepted in exchange for genuine provider
portability (large value), per the founder constraint. We do **not** over-abstract: the
interfaces stay minimal and behavior-identical across adapters.

## Alternatives considered

- **Cloudflare hard-wired everywhere**, rejected: violates the founder's constraint;
  future migration would be painful.
- **No CDN (origin serves everything)**, rejected: unacceptable latency to Nepal; origin
  carries every read; no abuse protection.
- **AWS-only (CloudFront + S3)**, viable alternative, not the default: more cost
  complexity, egress fees on S3, heavier ops at launch.
- **Vercel Edge only (no separate CDN choice)**, rejected: ties the CDN to the origin
  vendor (ADR-004 independence), and weaker WAF story than a dedicated edge.

## Open items

- Finalize the **edge adapter surface** (cache-purge key taxonomy) before Phase 1 deploy.
- Decide Cloudflare **Images** vs `next/image` + object storage only (cost/quality; the
  `next/image` option is the most portable).
- Confirm WAF managed-rules tier per provider when the default is challenged.
- Pick a **second storage adapter** to actually implement as proof of portability
  (recommend Backblaze B2 or AWS S3, since both are S3-compatible and the adapter is
  nearly free to write).
