# Architecture, Nagarik Watch

> System design for the Nagarik Watch news portal. Governed by the architecture-designer
> skill: requirements → patterns → design (with explicit trade-offs) → ADRs → review.
> Significant decisions are recorded as ADRs in `docs/adr/`.

This document is **host-agnostic** on the origin (per ADR-004's deferred decision) but
fixed everywhere else. The architecture is deliberately **monorepo + modular monolith**:
one deployable web app, one CMS app, a shared design-system package, and small shared
libraries. We are not building microservices for a news portal at this scale., -

## 1. Requirements

### Functional

- **Read experience (reader):** homepage, category/section pages, article pages, author
  pages, tag/topic pages, search, breaking ticker, bilingual (ne/en) with locale routing.
- **Signature content (Phase 3):** ePaper viewer, photo galleries, video stories, live
  blog, web push for breaking, newsletter, PWA installability + offline reading.
- **Editorial (CMS):** draft→review→publish workflow, roles, revisions, scheduling,
  media library with alt-text enforcement, menu manager, attribution for aggregated
  content, breaking toggle, search reindexing.
- **Ingestion:** scheduled jobs to pull wire/RSS feeds and create draft aggregated
  articles with source attribution for editor review.
- **Monetization (Phase 4):** ad slots (programmatic + direct), sponsored/native content
  type with labeling, ad-block recovery messaging.
- **Compliance (Phase 5):** DoIB registration number in footer, privacy policy + cookie
  consent, editorial ethics page, correction notices on articles.

### Non-functional (NFRs)

| Category        | Target                                                                              |
|, , , , -|, , , , , , , , , , , , , , , , , , , , , -|
| **Performance** | LCP < 2.5s, CLS < 0.1, INP < 200ms on mid-tier Android over throttled 4G (Lighthouse) |
| **Availability**| 99.9% for the read path (CDN-cached); degraded ISR acceptable on origin blips       |
| **Scalability** | Design for ~10× launch traffic without rearchitecture; CDN absorbs read spikes      |
| **Security**    | OWASP top-10 baseline; CSP; rate-limited APIs; signed CMS webhooks; no secrets in repo |
| **Accessibility**| WCAG 2.1 AA, automated (axe) + manual keyboard audit                               |
| **SEO**         | SSR/ISR on all content pages; JSON-LD `NewsArticle`; valid sitemaps; canonical URLs |
| **Latency (Nepal)** | CDN edge cache HIT serves reads; origin location matters only on MISS/ISR        |
| **Maintainability**| TS strict, ADRs for decisions, vertical-slice phases, ≤5 files per task          |
| **i18n**        | Devanagari-first; `lang` attributes; BS/AD date conversion; numerals by locale    |
| **Observability**| Plausible (privacy-lite) + GA4 + structured logs + uptime monitor                 |

### Constraints

- Solo developer + small editorial team → **low ops burden is a hard constraint**. This
  biases decisions toward managed services and away from self-operated infrastructure,
  except where Nepal-locality or cost forces otherwise.
- Free-to-read ad-supported model → ad slots are first-class surfaces, not afterthoughts,
  but must not poison the reading experience (PRODUCT.md principle 4).
- Nepal regulatory: online news must be registered with **DoIB** (operational gate, not
  architectural) and listed with Press Council Nepal.
- Budget-conscious at launch → prefer free/OFL fonts, OSS infra, generous free tiers., -

## 2. Architecture (high level)

```mermaid
graph TD
    Reader["Reader<br/>(browser / PWA, mostly mobile)"], >|HTTPS| CDN["Edge / CDN<br/>(adapter default: Cloudflare)<br/>static + ISR cache, WAF, DDoS, rate-limit"]

    CDN, >|cache HIT| Reader
    CDN, >|MISS / ISR revalidate| Origin["Next.js Origin<br/>App Router · Node runtime"]

    Origin, >|read content| CMS["Payload CMS<br/>(self-hosted, in-repo)<br/>REST/GraphQL + Local API"]
    CMS, > PG[("PostgreSQL<br/>articles, media, taxonomy,<br/>users, revisions, FTS index")]
    CMS, > OBJ["Object Storage<br/>(adapter default: Cloudflare R2, S3-compatible)<br/>images, ePaper PDFs"]

    Editors["Editors / Journalists / Translators"], >|admin UI| CMS
    Wire["Wire / RSS sources"], >|cron ingest| Ingest["packages/ingest<br/>(scheduled jobs)"]
    Ingest, >|create draft articles| CMS

    Origin, > ADS["Ad stack<br/>AdSense → GAM; lazy-loaded<br/>+ viewability"]
    Origin, > SRCH["Search<br/>Postgres FTS now<br/>→ Meilisearch later"]
    Origin, > ANAL["Analytics<br/>Plausible + GA4"]
    Origin, > PUSH["Web Push<br/>OneSignal / FCM<br/>(breaking news)"]
    Origin, > MAIL["Newsletter<br/>Listmonk / Buttondown<br/>(Phase 3)"]

    CMS -.->|publish webhook| Origin
    CMS -.->|publish event| PUSH
    CMS -.->|publish event| SRCH

    subgraph Observability
        MON["Uptime monitor<br/>(UptimeRobot/Better Stack)"]
        LOG["Structured logs"]
    end
    Origin, > Observability
    CMS, > Observability

    classDef store fill:#f9f1f0,stroke:#c02a2a;
    class PG,OBJ store;
    classDef external fill:#eef1f9,stroke:#1f3a7a;
    class ADS,ANAL,PUSH,MAIL,Wire,Editors external;
```

> **Vendor neutrality (ADR-003):** the **Edge/CDN** and **Object Storage** nodes above are
> **adapter interfaces**, not hard dependencies. Cloudflare (CDN + R2) is the *default*
> adapter; AWS (CloudFront + S3), Bunny, Backblaze B2, and Vercel Edge are swappable
> alternatives. App code depends on the interfaces in `packages/infra`, never on provider-
> specific APIs in business logic.

### Component responsibilities

- **`apps/web` (Next.js):** the reader-facing portal. Server Components by default,
  fetches content via Payload's **Local API** (in-process, no HTTP hop when co-located) or
  REST/GraphQL when deployed separately. Renders SSR + ISR. Owns SEO, JSON-LD, sitemaps,
  og images, ads, analytics. Locale-routed (`/ne`, `/en` with `ne` default at `/`).
- **`apps/admin` (Payload CMS):** the editorial tool. Defines collections (Article,
  Category, Author, Media, Tag, Menu, AdSlot, etc.), access control by role, hooks (slug
  generation, search-index updates, publish webhook to the web app), blocks (rich-text
  body elements), scheduled publishing, revisions.
- **`packages/ui`:** the design system, tokens (CSS variables from the chosen DESIGN.md
  palette), primitives (StoryCard, Hero, Ticker, AdSlot, etc.), Tailwind preset.
- **`packages/db`:** shared TypeScript types + Zod schemas for the content model, used by
  both web and admin so the contract is identical.
- **`packages/ingest`:** scheduled jobs (cron) pulling RSS/wire feeds, normalizing them
  into draft Articles with `sourceType: 'aggregated'`, source name + URL, and queuing
  them for editor review.
- **PostgreSQL:** the single source of truth. Payload's schema + a generated FTS index on
  articles (title + deck + body) for Phase-2 search.
- **Cloudflare R2:** object storage for all media (hero images, gallery images, ePaper
  PDFs), fronted by the CDN.
- **Cloudflare CDN/WAF:** global + Nepal-edge cache for static and ISR pages, DDoS/WAF,
  image transforms via Cloudflare Images (optional) or `next/image`.

### Request flows

**Reader opens an article (hot path):**
1. Browser → Cloudflare edge.
2. Cache HIT (ISR page) → served from edge, sub-100ms TTFB even in Nepal. ✅
3. Cache MISS → Cloudflare fetches origin; Next.js renders from Postgres via Payload Local
   API; response cached per ISR revalidation window (e.g. articles revalidate every 60s or
   on-demand via publish webhook).

**Editor publishes a story:**
1. Editor hits Publish in Payload.
2. Payload `afterChange` hook fires: updates search index, sends a signed revalidate
   webhook to `apps/web`, (if breaking) enqueues a push notification.
3. Next.js revalidates the affected routes (home, category, article) at the edge.

**Ingestion of a wire story:**
1. Cron triggers `packages/ingest` for a feed.
2. Feed is fetched, normalized, deduped (by source URL + title hash).
3. A draft Article is created with `sourceType: 'aggregated'`, source attribution, and
   `_status: 'draft'` → appears in the editor review queue., -

## 3. Patterns chosen (and why)

| Concern               | Pattern                          | Why                                            |
|, , , , , , -|, , , , , , , , , |-, , , , , , , , , , , , -|
| Topology              | Modular monolith (web + admin + libs) | Solo team; microservices add ops for no gain here |
| Rendering             | SSR + ISR (App Router)           | SEO + freshness + cache economy for news       |
| Data fetching         | Payload Local API (co-located)   | No HTTP hop, type-safe, fast SSR               |
| Content storage       | Relational (Postgres)            | Editorial data is relational; FTS avoids a 2nd store |
| Media                 | Object storage + CDN transforms  | Decouples binary blobs from DB; CDN-served     |
| Search                | Postgres FTS → Meilisearch later | Don't add infra before traffic justifies it    |
| Cache invalidation    | On-demand ISR revalidate webhook | Editors see published changes within seconds   |
| Auth (CMS)            | Payload's email/pass + RBAC      | Built-in, role-based, sufficient for a newsroom|
| Auth (reader)         | None in v1 (no accounts)         | Free-to-read; no paywall; no UGC; simpler + safer |
| Background jobs       | Cron (host) + Payload scheduled jobs | News ingestion is periodic, not event-driven |
| Config/secrets        | Env vars + `.env.example`; secrets in CI/host vault | Standard; no committed secrets          |
| Error reporting       | Sentry (web + admin)             | Quick to wire, generous free tier              |, -

## 4. Hosting decision framework (input to ADR-004)

The origin is the only undecided piece. CDN is Cloudflare either way. The table below is
the decision matrix; ADR-004 records the final pick before Phase 1 deploy.

| Criterion (weight)                | Option A: Managed Vercel origin + CF      | Option B: Nepal VPS (Babal/Vianet) origin + CF | Option C: Hybrid (Vercel origin, R2 + Postgres near readers) |
|, , , , , , , , , |, , , , , , , , , , , -|, , , , , , , , , , , , |, , , , , , , , , , , , , , , , |
| Dev experience / ops burden (×3)   | ★★★★★ zero ops                            | ★★ self-managed (backups, SSL, updates)        | ★★★★ mostly managed                                          |
| Latency to Nepali readers (×2)     | ★★★ origin far; CDN masks on HIT          | ★★★★★ origin in-country                        | ★★★ CDN-cached; origin far on MISS                            |
| Reliability / uptime (×2)          | ★★★★★ SLA'd                               | ★★★ depends on provider + your ops             | ★★★★ depends on Vercel + R2                                   |
| Cost at launch (×1)                | $$$ Vercel Pro ~$20/mo + usage            | $ VPS ~$10–20/mo flat                          | $$$ similar to A                                              |
| Runs Next.js App Router natively   | ★★★★★                                     | ★★★ via Docker/PM2                             | ★★★★★                                                         |
| Scalability on a spike             | ★★★★★ auto                                | ★★ vertical only                               | ★★★★★                                                         |
| Data residency / locality          | origin abroad                            | origin in Nepal                                | origin abroad, media on R2                                   |
| Solo-dev fit                       | ★★★★★ best                                | ★★ worst                                       | ★★★★ good                                                     |

**Recommendation to be confirmed in ADR-004:** **Option A (Vercel + Cloudflare)** for the
solo-dev reality, with the CDN doing the heavy lifting for Nepali latency. If real-world
testing shows Nepali-origin latency materially hurting MISS performance, **Option C**
(hybrid) is the cheapest upgrade. Option B is reserved for cases where Nepal data
residency becomes a regulatory requirement.

PostgreSQL location follows the origin decision: managed Postgres (Neon/Supabase) co-
region with Vercel for A/C; self-hosted on the VPS for B., -

## 5. Data & content flow (end to end)

```
Tip / beat ──▶ Editor writes Article in Payload CMS (draft)
                      │
                      ├──▶ Media Library (R2) for images, alt text enforced
                      ├──▶ Taxonomy: Category + Tags + Author(s)
                      ├──▶ sourceType: original | aggregated | wire
                      │       (aggregated/wire ⇒ source name + URL required)
                      │
                Copy edit ──▶ review (copy editor) ──▶ publish (publisher)
                      │
                      ▼ (afterChange hook on publish)
              ┌───────────────────────────┐
              │ 1. Revalidate ISR routes  │──▶ Cloudflare edge purges
              │ 2. Update search index    │
              │ 3. If breaking: push      │──▶ OneSignal/FCM
              │ 4. Sitemap regenerated    │
              └───────────────────────────┘
```

See `docs/content-model.md` for the field-level model and `docs/editorial-workflow.md`
for roles and transitions., -

## 6. Security

- **Transport:** HTTPS everywhere (Cloudflare edge certs + origin cert).
- **Headers:** strict CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
  `Permissions-Policy`, HSTS. No inline scripts (ad scripts sandboxed per-provider).
- **WAF:** Cloudflare managed rules + rate limiting on `/api/*`, search, and CMS login.
- **Auth:** Payload RBAC with strong password policy + optional 2FA for publisher role.
  Reader-facing site has no auth in v1 (no attack surface from user accounts).
- **Secrets:** never in repo; host/CI vault; `payload-secret`, DB URL, R2 keys, ad
  network secrets, push keys all via env.
- **Webhook signing:** the publish→revalidate webhook is HMAC-signed; origin verifies.
- **Ingestion safety:** RSS-sourced content is sanitized (no raw HTML injection), images
  re-hosted to R2 with alt text required before publish.
- **Backups:** nightly Postgres dumps (managed or cron + R2); test restore quarterly.
- **Dependency hygiene:** Dependabot/Renovate on; npm audit in CI; licenses checked., -

## 7. Observability

- **Plausible** for privacy-respecting traffic analytics (no cookies, GDPR/Nepal-friendly).
- **GA4** alongside for richer ad/attribution reporting (cookie banner required).
- **Sentry** for error tracking in web + admin.
- **Uptime monitor** (UptimeRobot or Better Stack) on home + a canonical article.
- **Structured logs** from origin + ingestion jobs, retained 30 days., -

## 8. Failure modes & mitigations

| Failure                              | Impact                  | Mitigation                                                   |
|, , , , , , , , , , |-, , , , , , |, , , , , , , , , , , , , , , , |
| Origin down                          | New/changed pages stale | CDN keeps serving cached ISR pages; status page communicates |
| Postgres unavailable                 | CMS can't edit          | Reads continue from ISR cache; managed DB HA if budget allows|
| CMS publish webhook lost             | Page not revalidated    | Periodic sitemap-driven revalidation sweep as a backstop      |
| Ad script slow/blocked               | Layout shift, blank gap | Reserve ad slot size; lazy-load; graceful fallback            |
| Ingestion feed malformed             | Bad draft created       | Strict Zod validation; bad items quarantined, never published |
| Breaking-news push flood             | Push fatigue, unsubscribes | Rate cap (≤N/hour); only publisher role can mark breaking    |
| Image without alt text               | A11y failure            | CMS hard-requires alt text on upload                         |
| Brand-name legal challenge (ADR-001) | Forced rename           | Composite name + domains kept; rename path documented        |, -

## 9. Open architectural questions

1. **Origin hosting final pick** → ADR-004 (Nepal VPS vs managed).
2. **Cloudflare Images vs `next/image` + R2 only**, cost/quality trade-off, decided in Phase 1.
3. **Meilisearch migration threshold**, at what search volume / latency do we move off Postgres FTS?
4. **Live blog realtime transport**, Server-Sent Events vs WebSocket vs polling (Phase 3).
5. **Multi-region**, not needed at launch; revisit if diaspora traffic dominates., -

## 10. Architecture review checkpoint

Before Phase 1 implementation begins, validate against this document:
- [ ] Origin decision recorded in ADR-004.
- [ ] NFR budgets encoded in CI (Lighthouse thresholds).
- [ ] Content model approved (`docs/content-model.md`).
- [ ] Editorial workflow approved (`docs/editorial-workflow.md`).
- [ ] Security headers + CSP baseline defined as code.
- [ ] Backup/restore procedure documented.
