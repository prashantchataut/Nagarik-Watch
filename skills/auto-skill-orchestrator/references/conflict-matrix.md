# Conflict Resolution Matrix

When activated skills produce contradictory guidance, resolve using this matrix.

## Priority Hierarchy (highest to lowest)

1. **Security** — Never compromise on security for convenience
2. **Accessibility** — Never compromise on accessibility for visual effects
3. **Maintainability** — Never compromise on maintainability for cleverness
4. **Production Stability** — Never compromise on stability for experimental patterns
5. **Readability** — Prefer readability over performance (unless perf budget is violated)
6. **Performance** — Optimize only when measurements prove it matters
7. **Developer Experience** — Convenience is lowest priority

## Conflict Resolution Table

| Skill A Guidance | Skill B Guidance | Resolution | Rationale |
|-----------------|-----------------|------------|-----------|
| **code-simplification**: "Remove this abstraction layer" | **architecture-designer**: "Add a layer for extensibility" | Keep abstraction if it serves >1 current use case; remove if only theoretical | YAGNI vs extensibility: concrete needs beat hypothetical ones |
| **code-simplification**: "Inline this function" | **clean-architecture**: "Extract to interface for testability" | Extract to interface; profile before inlining | Testability is maintainability (priority 3); inlining is performance (priority 6) |
| **security-and-hardening**: "Validate all inputs strictly" | **frontend-design**: "Make the form minimal and frictionless" | Validate strictly on server; progressive validation on client | Security (priority 1) always wins; UX gets progressive enhancement |
| **security-and-hardening**: "Add CSRF token to every form" | **performance-optimization**: "Reduce request overhead" | Add CSRF token; it's negligible overhead | Security (priority 1) wins; the perf cost is trivial |
| **performance-optimization**: "Cache aggressively" | **security-and-hardening**: "Don't cache sensitive data" | Cache non-sensitive data; never cache auth tokens or PII | Security (priority 1) > Performance (priority 6) |
| **test-driven-development**: "Write tests first, then code" | **shipping-and-launch**: "Ship MVP fast, add tests later" | Write critical-path tests first (auth, data integrity, money); defer edge-case tests | Critical tests are security/maintainability; edge cases can be deferred |
| **accessibility-audit**: "Add ARIA labels to everything" | **frontend-design**: "Keep the DOM clean and minimal" | Add ARIA labels where semantic HTML is insufficient; prefer semantic HTML over ARIA | Accessibility (priority 2) > DX (priority 7); semantic HTML satisfies both |
| **accessibility-audit**: "Ensure 4.5:1 contrast ratio" | **frontend-design**: "Use muted colors for secondary text" | Use muted colors that meet 4.5:1; adjust shade, not importance | Accessibility (priority 2) > Visual preference (priority 7) |
| **performance-optimization**: "Lazy load below-fold content" | **accessibility-audit**: "Screen readers need all content available" | Lazy load visually but keep content in DOM (hidden with CSS, not removed) | Accessibility (priority 2) > Performance (priority 6) |
| **architecture-designer**: "Use microservices for scalability" | **code-simplification**: "Keep it simple with a monolith" | Start monolith; extract microservices only when scaling demands it | Maintainability (priority 3) + Stability (priority 4) > premature architecture |
| **performance-optimization**: "Use `any` for faster prototyping" | **typescript-pro**: "Never use `any`" | Use `unknown` instead of `any`; it's type-safe and nearly zero cost | Maintainability (priority 3) > DX (priority 7) |
| **frontend-design**: "Add this animation" | **performance-optimization**: "Animation hurts LCP" | Use CSS transforms/opacity only (GPU-accelerated); respect prefers-reduced-motion | Performance (priority 6) only wins when measurements prove impact |
| **performance-optimization**: "Denormalize for read speed" | **architecture-designer**: "Normalize for data integrity" | Normalize by default; denormalize only with measured proof that reads are too slow | Maintainability (priority 3) > Performance (priority 6) |
| **devops-engineer**: "Lock dependency versions exactly" | **ci-cd-and-automation**: "Use ranges for automatic updates" | Lock exact versions in production; use ranges in dev with Dependabot/Renovate | Stability (priority 4) in prod; DX (priority 7) in dev |
| **security-and-hardening**: "Add rate limiting" | **performance-optimization**: "Rate limiting adds latency" | Add rate limiting; the latency is negligible vs the protection | Security (priority 1) > Performance (priority 6) |

## Resolution Algorithm

When a conflict arises between two skills:

1. Check the priority hierarchy — higher priority wins
2. If same priority level, prefer the more specific guidance (e.g., "add CSRF token" beats "reduce overhead")
3. If still tied, prefer the safer option (security > convenience, explicit > implicit)
4. Document the resolution in a code comment if non-obvious

## Soft Conflicts (Both Can Apply)

Some skills don't conflict but provide overlapping guidance. In these cases, merge:

| Skill A | Skill B | Merge Strategy |
|---------|---------|---------------|
| code-review-and-quality | security-and-hardening | Apply both: quality checks + security checks |
| test-driven-development | e2e-testing | TDD for units; E2E for critical paths |
| performance-optimization | accessibility-audit | Optimize perf without breaking a11y |
| frontend-design | responsive-design | Design beautifully at every breakpoint |
| documentation-and-adrs | architecture-designer | Document architectural decisions as ADRs |
| git-workflow-and-versioning | ci-cd-and-automation | Git workflow feeds into CI pipeline |
| planning-and-task-breakdown | shipping-and-launch | Plan first, then ship incrementally |