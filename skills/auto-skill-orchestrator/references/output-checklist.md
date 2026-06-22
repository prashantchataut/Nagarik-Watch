# Output Validation Checklist

Run this checklist before presenting any response. All applicable items must pass.

## How to Use This Checklist

- **All code output**: Apply sections 1, 2, 3, 5, 6
- **UI/frontend code**: Additionally apply section 4
- **Any output**: Apply section 7 (universal)

If any item fails, fix it before presenting. Never ship with `TODO` or `FIXME` comments for quality issues.

---

## 1. Correctness

- [ ] Code compiles/runs without errors
- [ ] Logic is correct for the stated requirements
- [ ] Edge cases handled (null, undefined, empty, very large input)
- [ ] No off-by-one errors
- [ ] Return types match function signatures
- [ ] Async operations properly awaited/handled
- [ ] Error paths return meaningful errors, not silent failures

## 2. Security

- [ ] All user input validated (type, length, range, format)
- [ ] No SQL injection — parameterized queries only
- [ ] No XSS — output encoded for context (HTML, JS, URL)
- [ ] No CSRF — tokens on state-changing requests
- [ ] Auth checks on every protected route/action
- [ ] No hardcoded secrets — env vars or secret managers
- [ ] Least privilege — minimal permissions by default
- [ ] Rate limiting on public endpoints
- [ ] HTTPS enforced, no mixed content
- [ ] Content-Security-Policy header for web apps
- [ ] No `eval()`, `innerHTML` with untrusted data, or `dangerouslySetInnerHTML` with user content

## 3. Performance

- [ ] No N+1 queries (batched or eager-loaded)
- [ ] Below-fold images/components lazy-loaded
- [ ] List endpoints paginated (default limit, max cap)
- [ ] Frequently-read, rarely-changed data cached
- [ ] Heavy features dynamically imported
- [ ] No synchronous blocking on main thread
- [ ] Images: responsive `srcset`, modern formats, explicit dimensions
- [ ] Fonts: `font-display: swap`, preload critical fonts
- [ ] No layout shifts (explicit dimensions on images/containers)

## 4. Accessibility (UI code only)

- [ ] Semantic HTML elements used (`<nav>`, `<main>`, `<article>`, etc.)
- [ ] ARIA labels where semantic HTML insufficient
- [ ] All interactive elements keyboard-reachable via Tab
- [ ] Color contrast meets WCAG AA (4.5:1 text, 3:1 large text)
- [ ] Focus indicators visible (never `outline: none` without replacement)
- [ ] Images have alt text (empty string for decorative)
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Form inputs have associated `<label>` elements
- [ ] Error messages linked via `aria-describedby`
- [ ] Skip navigation link for multi-page apps

## 5. Production Readiness

- [ ] Every async operation wrapped in try/catch or `.catch()`
- [ ] Structured logging with context (request ID, user ID, trace ID)
- [ ] Health check endpoint (`/health`)
- [ ] Graceful shutdown (SIGTERM handler, drain connections)
- [ ] Configuration via environment variables (12-factor)
- [ ] Monitoring dashboards (health, latency, error rate)
- [ ] Rate limiting and circuit breakers on external calls
- [ ] Database connection pooling with timeouts
- [ ] No `console.log` in production — proper logging library

## 6. Testing

- [ ] New functions have at least one unit test
- [ ] New API endpoints have integration test (success + error)
- [ ] UI components test key user interactions
- [ ] Edge cases covered (empty, null, undefined, large input)
- [ ] Test names follow `should [behavior] when [condition]`
- [ ] External dependencies mocked, not internal logic
- [ ] Happy path AND sad path tested
- [ ] No skipped tests without linked issue

## 7. Universal (every output)

- [ ] No dead code, unused imports, commented-out blocks
- [ ] No `any` types in TypeScript (use `unknown` or generics)
- [ ] Meaningful variable/function names
- [ ] Single responsibility per function
- [ ] Early returns to reduce nesting
- [ ] `const` over `let`; no `var`
- [ ] Magic numbers/strings extracted to named constants
- [ ] No TODO/FIXME/HACK comments — issues are fixed, not deferred

## Failure Protocol

If an item fails:
1. **Fix the issue** in the output before presenting it
2. **Do not** add `// TODO: fix security` or similar comments
3. **Do** resolve the conflict using the priority hierarchy:
   - Security > Accessibility > Maintainability > Stability > Readability > Performance > DX
4. If fixing would require significant refactoring beyond scope, **note it explicitly** to the user with a concrete action item (not a vague TODO)

## Confidence-Based Enforcement

| Confidence Score | Enforcement Level |
|----------------|-------------------|
| 0.9–1.0 | Full checklist — every applicable item must pass |
| 0.6–0.8 | Critical items only (security, correctness, production readiness) |
| 0.3–0.5 | Security and correctness only |
| 0.0–0.2 | No enforcement — skill is background influence only |