# Category Signal Map

Full keyword-to-category detection map for the orchestrator.

## Category Detection Rules

### Frontend
**Strong signals** (confidence 0.9+): UI, component, page, layout, CSS, Tailwind, React, Vue, Angular, render, responsive, animation, design, style, frontend, component library, design system, theme, dark mode, light mode, hover, transition, scroll, modal, dropdown, tooltip, popover, sidebar, navbar, footer, card, table, form, input, button, slider, carousel, accordion, tab, stepper, wizard
**Moderate signals** (0.6-0.8): HTML, DOM, browser, screen, pixel, viewport, mobile, desktop, tablet, touch, click, swipe, gesture, responsive, breakpoint, media query, SSR, CSR, hydration, lazy load, skeleton, shimmer, spinner, toast, notification, badge, avatar, chip, breadcrumb, pagination
**Weak signals** (0.3-0.5): color, font, typography, spacing, padding, margin, border, shadow, gradient, opacity, z-index, overflow, flexbox, grid, absolute, relative, fixed, sticky, transform, scale, rotate, opacity, visibility, display, position

### Backend
**Strong signals**: API, endpoint, server, database, auth, middleware, route, controller, service, repository, model, backend, CRUD, REST, GraphQL, mutation, query, resolver, schema, migration, seed, ORM, Prisma, TypeORM, Sequelize, SQLAlchemy, Django, Express, FastAPI, NestJS, Spring, Rails, Laravel
**Moderate signals**: request, response, header, body, status code, pagination, filtering, sorting, validation, serialization, deserialization, DTO, entity, aggregate, domain, use case, command, handler, event, queue, worker, job, cron, scheduled, async, queue, pub/sub, webhook, callback
**Weak signals**: data, store, persist, cache, session, token, JWT, OAuth, CORS, rate limit, throttle, timeout, retry, circuit breaker, idempotent, stateless, stateful

### Security
**Strong signals**: auth, login, password, token, JWT, OAuth, vulnerability, XSS, CSRF, SQL injection, encrypt, sanitize, OWASP, security, breach, exploit, penetration, pentest, CVE, CVE, hash, salt, bcrypt, argon2, RBAC, ABAC, permission, role, privilege, escalate, injection, SSRF, RCE, LFI, RFI, XSS, clickjacking, CSP, HSTS, CORS policy
**Moderate signals**: validate, sanitize, escape, encode, decode, HTTPS, TLS, certificate, firewall, WAF, DDoS, brute force, credential, secret, key, API key, access token, refresh token, session, cookie, SameSite, HttpOnly, Secure flag, Content-Security-Policy, Subresource Integrity, nonce
**Weak signals**: input, output, boundary, trust, untrusted, malicious, attack surface, threat model, risk, compliance, audit, SOC2, ISO27001, GDPR, HIPAA, PCI-DSS

### UI/UX
**Strong signals**: design, UX, user experience, interaction, accessibility, a11y, WCAG, animation, microinteraction, Figma, design system, component library, design token, theme, palette, typography, spacing system, layout grid, responsive breakpoint, user flow, user journey, wireframe, prototype, mockup, persona, usability, heuristic
**Moderate signals**: hover, focus, active, disabled, loading, empty state, error state, success state, onboarding, tooltip, popover, dropdown, modal, drawer, sheet, toast, snackbar, notification, badge, avatar, skeleton, shimmer, progress, stepper, carousel, slider, toggle, checkbox, radio, select, textarea
**Weak signals**: color, contrast, font size, line height, letter spacing, whitespace, padding, margin, border radius, shadow, opacity, transition, duration, easing, delay, transform, scale, rotate, translate, perspective

### AI/Agents
**Strong signals**: AI, LLM, GPT, Claude, prompt, RAG, embedding, vector, model, inference, fine-tune, agent, tool-call, chain-of-thought, few-shot, zero-shot, temperature, top-p, top-k, context window, token, completion, chat, assistant, system prompt, function calling, structured output, JSON mode, vision, multimodal, reasoning
**Moderate signals**: knowledge base, retrieval, chunking, splitting, overlap, reranking, relevance score, cosine similarity, ANN, HNSW, FAISS, Pinecone, Weaviate, ChromaDB, Qdrant, pgvector, semantic search, hybrid search, BM25, embedding model, text-embedding, sentence transformer, BGE, Cohere, OpenAI embeddings
**Weak signals**: dataset, training, evaluation, benchmark, MMLU, HumanEval, BLEU, ROUGE, perplexity, hallucination, grounding, citation, attribution, confidence score

### DevOps
**Strong signals**: deploy, CI/CD, pipeline, Docker, Kubernetes, Terraform, infrastructure, monitoring, staging, production, container, orchestration, Helm, Kustomize, ArgoCD, GitOps, canary, blue-green, rolling update, rollback, health check, readiness, liveness, ingress, service mesh, Istio, Envoy
**Moderate signals**: build, compile, bundle, artifact, registry, image, tag, version, release, environment, config map, secret, volume, persistent volume, namespace, quota, limit, request, autoscale, HPA, VPA, pod disruption budget, network policy, RBAC, service account
**Weak signals**: log, metric, trace, span, alert, dashboard, Grafana, Prometheus, Datadog, PagerDuty, incident, SLO, SLA, error budget, on-call, runbook, postmortem, blameless

### Performance
**Strong signals**: slow, fast, optimize, bundle, lazy, cache, load time, LCP, CLS, INP, memory, CPU, profiling, benchmark, latency, throughput, p95, p99, TTFB, FCP, TTI, TBT, INP, speed, render, paint, composite, layout, reflow, repaint, jank, freeze, hang, timeout, bottleneck
**Moderate signals**: pagination, virtualization, memoization, debouncing, throttling, code splitting, tree shaking, compression, minification, CDN, edge, cache-control, ETag, stale-while-revalidate, SWR, ISR, prefetch, preload, preconnect, dns-prefetch, service worker, web worker, offscreen, intersection observer
**Weak signals**: size, bytes, kilobytes, megabytes, milliseconds, seconds, concurrent, parallel, sequential, batch, stream, chunk, buffer, queue, pool, connection, socket, thread, process, worker

### Testing
**Strong signals**: test, spec, unit, integration, E2E, coverage, mock, fixture, assertion, TDD, BDD, Playwright, Jest, Vitest, Cypress, Mocha, Chai, Sinon, Testing Library, Puppeteer, Selenium, WebDriver, Appium, XCTest, JUnit, pytest, coverage, branch coverage, statement coverage, mutation testing, snapshot test
**Moderate signals**: describe, it, expect, should, assert, given-when-then, arrange-act-assert, factory, builder, faker, seed, deterministic, flaky, skip, only, todo, before, after, setup, teardown, stub, spy, fake, double, verify, mock, verify, when, return, throw, reject, timeout
**Weak signals**: debug, console.log, breakpoint, inspector, devtools, network tab, performance tab, memory tab, audit, lighthouse, axe, pa11y, wcag, validator, linter, formatter, pre-commit, husky, lint-staged

### Architecture
**Strong signals**: architecture, design pattern, refactor, restructure, microservice, monolith, module, dependency, clean architecture, hexagonal, DDD, CQRS, event sourcing, saga, repository pattern, unit of work, factory, strategy, observer, mediator, adapter, decorator, facade, proxy, SOLID, DRY, KISS, YAGNI
**Moderate signals**: layer, tier, boundary, context, bounded context, aggregate, value object, entity, domain event, command, query, handler, service, repository, gateway, adapter, port, use case, interactor, presenter, view model, DTO, mapper, assembler, converter
**Weak signals**: coupling, cohesion, dependency injection, inversion of control, composition, inheritance, interface, abstract, concrete, implementation, contract, protocol, facade, proxy, bridge, composite, visitor, state, template method, chain of responsibility

### Documentation
**Strong signals**: docs, README, JSDoc, comment, API spec, OpenAPI, guide, tutorial, changelog, ADR, RFC, decision record, documentation, Swagger, Redoc, Storybook, mdx, markdown, wiki, knowledge base, FAQ, troubleshooting, getting started, quickstart, migration guide
**Moderate signals**: example, snippet, code block, annotation, decorator, type hint, docstring, comment, inline, block, section, chapter, paragraph, heading, table, list, diagram, flowchart, sequence, architecture diagram, component diagram, ERD, wireframe
**Weak signals**: explain, describe, clarify, note, warning, caution, tip, important, deprecated, since, version, author, date, see also, reference, link, URL, anchor, cross-reference, index, glossary, abbreviation

### Accessibility
**Strong signals**: a11y, WCAG, screen reader, ARIA, keyboard, contrast, focus, semantic, label, aria-, accessible, inclusive, disability, assistive technology, JAWS, NVDA, VoiceOver, TalkBack, braille, caption, transcript, audio description, sign language, cognitive, motor, visual, hearing, seizure, epilepsy
**Moderate signals**: tab order, focus trap, focus ring, skip link, landmark, role, live region, alert, status, log, marquee, timer, aria-live, aria-expanded, aria-selected, aria-checked, aria-disabled, aria-hidden, aria-label, aria-labelledby, aria-describedby, aria-owns, aria-controls, aria-haspopup
**Weak signals**: color, size, spacing, touch target, 44px, 24px, pointer, cursor, hover, active, visited, link, button, form, input, select, textarea, checkbox, radio, range, file, date, time, search, pattern, required, min, max, step, maxlength, placeholder

### Refactoring
**Strong signals**: refactor, clean, simplify, extract, rename, restructure, tech debt, improve, DRY, SOLID, KISS, YAGNI, code smell, dead code, duplication, coupling, cohesion, dependency, cyclomatic complexity, cognitive complexity, nesting depth, function length, file length, parameter count
**Moderate signals**: move, inline, replace, delegate, introduce, encapsulate, hide, expose, generalize, specialize, parameterize, replace conditional with polymorphism, replace type code with strategy, introduce null object, introduce assertion, decompose conditional, consolidate conditional expression, consolidate duplicate conditional fragments
**Weak signals**: organize, sort, group, align, format, indent, whitespace, naming, convention, style, lint, format, prettier, eslint, biome, standard, strict, loose, relaxed