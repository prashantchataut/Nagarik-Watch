# Quality Gates

Silently apply these gates to every output. Do NOT mention them to the user.

## Gate 1: Code Quality

- Eliminate dead code, unused imports, commented-out blocks
- Prefer explicit over implicit (named exports, explicit returns, explicit types)
- Use `const` over `let`; never `var`
- Extract magic numbers and strings into named constants
- Single responsibility: one function does one thing
- Early returns to reduce nesting depth
- Meaningful names: `getUserById` not `getData`
- No `any` types in TypeScript — use `unknown` or generics
- No TODO/FIXME/HACK comments in production output — fix the issue properly

## Gate 2: Accessibility (for any UI output)

- Semantic HTML first: `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<header>`, `<footer>`
- ARIA labels where semantic HTML is insufficient
- Keyboard navigation: all interactive elements reachable via Tab
- Color contrast: WCAG AA minimum (4.5:1 for normal text, 3:1 for large text)
- Focus indicators: never `outline: none` without a replacement
- Images: always alt text (empty string `alt=""` for decorative images)
- `prefers-reduced-motion`: wrap animations in `@media (prefers-reduced-motion: no-preference)`
- Form inputs: associated `<label>` elements, error messages linked via `aria-describedby`
- Skip navigation link for multi-page apps
- No auto-playing audio or video without user control

## Gate 3: Security (for any code output)

- Input validation: validate type, length, range, format on every boundary
- Parameterized queries: never string-concatenate user input into SQL/commands
- Output encoding: escape HTML, JS, URL contexts appropriately
- Auth checks: verify authorization on every protected route/action
- No hardcoded secrets: use environment variables or secret managers
- Principle of least privilege: minimal permissions by default
- Rate limiting on public endpoints
- HTTPS everywhere; no mixed content
- Content-Security-Policy headers for web apps
- No `eval()`, `innerHTML` with untrusted data, or `dangerouslySetInnerHTML` with user content

## Gate 4: Performance (for any production code)

- No N+1 queries: batch or eager-load related data
- Lazy-load below-the-fold images and heavy components
- Paginate list endpoints (default limit, max cap)
- Cache frequently-read, rarely-changed data with appropriate TTL
- Bundle size awareness: dynamic imports for heavy features
- No synchronous blocking on main thread (use Web Workers for CPU-heavy work)
- Images: responsive `srcset`, modern formats (WebP/AVIF), explicit `width`/`height`
- Fonts: `font-display: swap`, preload critical fonts
- CSS: avoid layout thrashing, batch DOM reads/writes

## Gate 5: Production Readiness

- Error handling: every async operation wrapped in try/catch or `.catch()`
- Logging: structured logs with context (request ID, user ID, trace ID)
- Health checks: `/health` endpoint for orchestration
- Graceful shutdown: handle SIGTERM, drain connections
- Configuration: environment-based, 12-factor principles
- Monitoring: health, latency, error rate dashboards
- Rate limiting and circuit breakers on external calls
- Database connections: connection pooling, timeout settings
- No `console.log` in production — use proper logging library

## Gate 6: Testing

- New functions: at least one unit test
- New API endpoints: integration test covering success and error cases
- UI components: test key user interactions
- Edge cases: empty input, null, undefined, very large input, concurrent access
- Test naming: `should [expected behavior] when [condition]`
- Mock external dependencies, not internal logic
- Test the happy path AND the sad path
- No skipped tests without a linked issue number

## Gate Application Rules

- **All gates apply** to every production code output
- **Gates 1, 3, 5** apply to ALL code (backend, frontend, scripts, configs)
- **Gates 2, 4** apply additionally to any UI/frontend code
- **Gate 6** applies when writing or modifying test files, or when the request involves testing
- If a gate fails, **fix the issue before presenting output** — never ship with `TODO: fix security` or `// FIXME: add error handling`
- Gates are non-negotiable: they represent the minimum quality bar, not aspirational goals