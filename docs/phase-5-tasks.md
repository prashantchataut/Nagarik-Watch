# Phase 5, Scale, ops & compliance

> Goal: harden the site for real traffic, real abuse, and real legal/compliance
> obligations. Caching and ISR at scale, monitoring and backups, the DoIB/Press Council
> footer compliance, privacy + cookie consent, an accessibility audit, performance budgets
> in CI, and security hardening. This is the phase that takes Nagarik Watch from "launch"
> to "operating newsroom."
>
> Governed by planning-and-task-breakdown: vertical slices, S/M tasks (≤5 files),
> acceptance + verification, checkpoints. Reference: architecture.md §6 (security), §7
> (observability), §8 (failure modes).

## Overview
Many of these tasks are **continuous** (monitoring, backups) rather than one-and-done.
Phase 5 establishes the baseline; the runbook (Task 5.10) becomes the living operational
reference. Several tasks should be **started earlier** and only *finalized* here (e.g.,
security headers can land in Phase 1; this phase audits and closes gaps).

## Architecture decisions active this phase
- ADR-001 (DoIB/Press Council compliance), ADR-003 (Cloudflare WAF/rate-limit), and all
  prior ADRs. Operational NFRs from architecture.md §1., -

## Task list

### Task 5.1: Caching + ISR tuning at scale
**Description:** set ISR revalidation windows per route type (home seconds, category
minutes, article on-demand), tune Cloudflare cache rules + tiered caching, and add a
stale-while-revalidate strategy for traffic spikes.
- **Acceptance:**
  - [ ] Cache HIT rate > 90% on the read path under load.
  - [ ] Origin CPU stays bounded during a simulated traffic spike.
  - [ ] Editors still see published changes within seconds (on-demand revalidate).
- **Verify:** load test (k6) against staging; observe cache ratios + origin load.
- **Dependencies:** Phase 1 deploy.
- **Files:** `apps/web/next.config.ts` (revalidate config), Cloudflare page rules, cache headers.
- **Size:** M.

### Task 5.2: Image optimization at scale
**Description:** finalize the image pipeline (`next/image` vs Cloudflare Images, ADR-003
open item), enforce AVIF/WebP, set sensible sizes/srcset, and cap the transform cost.
- **Acceptance:**
  - [ ] All editorial images served AVIF/WebP with correct srcset; no upscaled hero.
  - [ ] Image bytes per article page within budget on mobile.
- **Verify:** Lighthouse image audit; inspect network responses.
- **Dependencies:** 5.1.
- **Files:** `apps/web/lib/media.ts`, Cloudflare Images config (if chosen), `next.config.ts`.
- **Size:** S.

### Task 5.3: Monitoring + alerting + uptime
**Description:** wire Sentry (web + admin errors), an uptime monitor (home + a canonical
article + admin login), structured logs, and alert routing (email/Slack).
- **Acceptance:**
  - [ ] Errors surface in Sentry with source maps; an uptime break pages on-call within 1 min.
  - [ ] Logs structured and retained 30 days; searchable.
- **Verify:** trigger a test error + a downtime event; alerts fire.
- **Dependencies:** Phase 1.
- **Files:** Sentry config, monitor setup, logging lib.
- **Size:** M.

### Task 5.4: Backups + disaster recovery + restore test
**Description:** nightly Postgres backups (managed or cron→R2), point-in-time recovery if
available, R2 media lifecycle, and a **documented + rehearsed** restore procedure.
- **Acceptance:**
  - [ ] Backups run nightly; retention ≥ 30 days; encrypt at rest.
  - [ ] A quarterly restore test recovers a clean DB + media to a throwaway environment.
  - [ ] Restore runbook in `docs/ops-runbook.md`.
- **Verify:** perform a real restore to staging; confirm data integrity.
- **Dependencies:** 5.3.
- **Files:** backup scripts/config, `docs/ops-runbook.md`.
- **Size:** M.

### Task 5.5: DoIB + Press Council compliance in footer
**Description:** once DoIB registration is granted (Phase 0 task 0.10), place the
registration number + Press Council listing in the footer (SiteSettings → rendered).
- **Acceptance:**
  - [ ] Footer shows DoIB registration number and Press Council reference.
  - [ ] About page carries the full legal identity of the publisher.
- **Verify:** visual + content review against the actual registration certificate.
- **Dependencies:** DoIB granted.
- **Files:** `apps/admin/src/globals/SiteSettings.ts`, `apps/web/components/footer.tsx`.
- **Size:** S.

### Task 5.6: Privacy policy, terms, cookie consent (CMP)
**Description:** publish privacy policy + terms + editorial ethics + sponsored policy +
corrections policy pages; wire a CMP cookie banner with Google consent mode (GA4/GAM
default-deny until consent).
- **Acceptance:**
  - [ ] All policy pages live and linked from the footer.
  - [ ] Cookie banner blocks GA4/GAM + non-essential scripts until consent.
  - [ ] Consent choice persisted; withdrawable.
- **Verify:** fresh visit → no GA4/GAM network calls until accept; reject path honored.
- **Dependencies:** Phase 1 analytics, Phase 4 GAM.
- **Files:** `apps/web/app/[locale]/legal/*`, `apps/web/components/cookie-banner.tsx`, consent lib.
- **Size:** M.

### Task 5.7: Security hardening audit
**Description:** audit and enforce the security baseline (architecture.md §6): CSP (with
ad-network allowlists), headers, rate limiting on `/api/*` + search + CMS login, 2FA for
publisher/admin, signed webhooks (Phase 2) rechecked, dependency audit, secrets scan in CI.
- **Acceptance:**
  - [ ] Security headers (CSP, HSTS, nosniff, Referrer-Policy, Permissions-Policy) A-grade
    (securityheaders.com).
  - [ ] Rate limiting throttles abuse on login + search + APIs.
  - [ ] 2FA enforced for publisher/admin.
  - [ ] `npm audit` + secret-scan gates in CI.
- **Verify:** securityheaders.com scan; brute-force login test; secret-scan on a test leak.
- **Dependencies:** 5.3.
- **Files:** `next.config.ts` (headers), Cloudflare WAF rules, `apps/admin` 2FA, CI steps.
- **Size:** M.

### Task 5.8: Accessibility audit (manual + automated)
**Description:** a full a11y audit beyond the Phase-1 pass: axe on every template, a
keyboard-only walkthrough, screen-reader testing (NVDA + VoiceOver) on Devanagari content,
color-contrast recheck in dark mode.
- **Acceptance:**
  - [ ] WCAG 2.1 AA across all templates; manual SR review sign-off.
  - [ ] Devanagari pronunciation/announcement acceptable in NVDA/VoiceOver.
- **Verify:** audit report filed in `docs/`; remediation tasks closed.
- **Dependencies:** Phase 3 (all features present).
- **Files:** `docs/a11y-audit.md`, fixes across components.
- **Size:** M (the audit); fixes may spawn follow-up tasks.

### Task 5.9: Performance budget + CI enforcement
**Description:** encode the SPEC.md perf budgets (LCP < 2.5s, CLS < 0.1, INP < 200ms) as
hard CI gates across home, category, and article; track bundle size budgets.
- **Acceptance:**
  - [ ] PRs that regress LCP/CLS/INP or bundle budget are blocked.
  - [ ] Weekly perf trend visible (Lighthouse CI reporter or dashboard).
- **Verify:** open a PR that adds a heavy client dep; CI blocks it.
- **Dependencies:** 5.1.
- **Files:** `.github/workflows/lighthouse.yml`, `lighthouserc.json`, bundle-budget config.
- **Size:** S.

### Task 5.10: Operations runbook
**Description:** write `docs/ops-runbook.md`, the single living reference for deploy,
rollback, backups/restore, incident response, on-call, domain/DNS/Cloudflare, and the
DoIB/Press Council details. Includes the ADR-001 monitoring reminder.
- **Acceptance:**
  - [ ] Runbook covers every operational task; tested by a dry run.
  - [ ] Contact + credential references (not secrets) listed.
- **Verify:** a knowledgeable second person follows the runbook to deploy + restore.
- **Dependencies:** 5.1–5.4.
- **Files:** `docs/ops-runbook.md`.
- **Size:** M.

### Task 5.11: Bot/scraper handling
**Description:** Cloudflare bot management + rate limits to protect content from predatory
scraping (common for news); allow legitimate crawlers (Googlebot etc. via verified lists).
- **Acceptance:**
  - [ ] Aggressive scrapers throttled/blocked; legit crawlers unaffected.
  - [ ] RSS remains open for legitimate readers/apps.
- **Verify:** scripted scrape test throttled; Search Console shows Googlebot unaffected.
- **Dependencies:** 5.7.
- **Files:** Cloudflare bot mgmt config, robots/Search Console verification.
- **Size:** S., -

## Checkpoint: Phase 5 → "operating newsroom" gate
- [ ] Caching + image pipeline perform under load; perf budgets enforced in CI.
- [ ] Monitoring, alerting, backups live; restore tested.
- [ ] DoIB + Press Council compliance visible in the footer; policies published.
- [ ] Cookie consent operational; GA4/GAM respect it.
- [ ] Security headers A-grade; 2FA on privileged roles; rate limits in place.
- [ ] a11y AA across templates incl. Devanagari screen-reader review.
- [ ] Ops runbook complete and dry-run validated.

## Risks this phase surfaces
| Risk | Mitigation |
|, -|, -|
| DoIB registration denied (ADR-001 trigger) | Reopen ADR-001; follow the documented rename path; the architecture is rename-safe |
| CSP breaks ad networks | Build the CSP allowlist per provider; use report-only first; roll out gradually |
| Ad/scraper abuse under load | Cloudflare bot mgmt + rate limits; monitor; tune |
| Backup restore never tested | Make the quarterly restore test a calendar event, not an aspiration |
| Solo-dev burnout on ops | Prefer managed services (ADR-004 leans this way); automate everything repeatable |, -

## Post-launch / ongoing (not tasks, but commitments)
- Quarterly: perf + a11y re-audit; ad-density UX review; dependency + secret scan; ADR-001
  brand-name monitoring reminder; restore test.
- Monthly: editorial workflow review with the newsroom; sponsored-content labeling audit.
- Continuous: revisions/DB size monitoring; error budget; reader feedback triage.
