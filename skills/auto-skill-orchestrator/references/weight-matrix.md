# Weight Matrix

Dynamic weight assignment for skill influence based on request type.

## Weight Scale

| Weight | Influence | Application |
|--------|-----------|-------------|
| 5 | **Lead** | Drives primary approach, patterns, and constraints |
| 4 | **Strong** | Important constraints and best practices |
| 3 | **Moderate** | Supplementary guidance, applied if no conflict |
| 2 | **Light** | Background awareness, applied only when relevant |
| 1 | **Peripheral** | Mentioned only if specifically relevant to subtask |

## Request Type Weight Tables

### UI-Heavy (pages, components, layouts, forms)

| Skill | Weight | Role |
|-------|--------|------|
| frontend-design | 5 | Lead: visual design, component architecture |
| ui-ux-pro-max | 5 | Lead: UX patterns, interaction design |
| design-system-builder | 4 | Strong: consistent tokens and components |
| accessibility-audit | 4 | Strong: WCAG compliance, keyboard nav |
| responsive-design | 4 | Strong: mobile-first, breakpoints |
| tailwind-css | 3 | Moderate: utility-first styling |
| performance-optimization | 3 | Moderate: lazy loading, bundle size |
| security-and-hardening | 2 | Light: XSS prevention, form validation |
| code-review-and-quality | 2 | Light: clean code patterns |
| architecture-designer | 1 | Peripheral: component boundary decisions |

### Security-Sensitive (auth, payments, user data, APIs)

| Skill | Weight | Role |
|-------|--------|------|
| security-reviewer | 5 | Lead: vulnerability scanning, audit |
| secure-code-guardian | 5 | Lead: secure coding patterns |
| pentesting | 5 | Lead: attack surface analysis |
| vulnerability-scanning | 4 | Strong: dependency auditing |
| security-and-hardening | 4 | Strong: defense in depth |
| code-review-and-quality | 3 | Moderate: review for security issues |
| test-driven-development | 3 | Moderate: security test cases |
| api-designer | 3 | Moderate: secure API patterns |
| architecture-designer | 2 | Light: security boundaries |
| frontend-design | 1 | Peripheral: minimal visual concern |

### AI/ML Task (chatbots, RAG, embeddings, agents)

| Skill | Weight | Role |
|-------|--------|------|
| prompt-engineer | 5 | Lead: prompt design, system instructions |
| rag-implementation | 5 | Lead: retrieval architecture |
| vector-databases | 4 | Strong: embedding storage and search |
| embedding-expert | 4 | Strong: model selection, optimization |
| tool-calling-expert | 4 | Strong: function definitions, dispatch |
| api-designer | 3 | Moderate: API boundaries for AI services |
| performance-optimization | 3 | Moderate: latency, throughput |
| architecture-designer | 3 | Moderate: system boundaries |
| security-and-hardening | 2 | Light: prompt injection, data leakage |
| code-review-and-quality | 2 | Light: clean AI pipeline code |

### Backend API (endpoints, services, databases)

| Skill | Weight | Role |
|-------|--------|------|
| api-designer | 5 | Lead: REST/GraphQL patterns |
| architecture-designer | 5 | Lead: system boundaries, layers |
| security-and-hardening | 4 | Strong: auth, validation, OWASP |
| database-design | 4 | Strong: schema, indexing, queries |
| test-driven-development | 3 | Moderate: API test cases |
| documentation-and-adrs | 3 | Moderate: API docs, OpenAPI |
| performance-optimization | 3 | Moderate: query optimization, caching |
| code-review-and-quality | 2 | Light: clean service code |
| frontend-design | 1 | Peripheral: response format only |

### DevOps (deployment, CI/CD, infrastructure)

| Skill | Weight | Role |
|-------|--------|------|
| devops-engineer | 5 | Lead: deployment strategy |
| ci-cd-and-automation | 5 | Lead: pipeline design |
| docker-containerization | 4 | Strong: container optimization |
| kubernetes-specialist | 4 | Strong: orchestration patterns |
| terraform-iac | 4 | Strong: infrastructure as code |
| security-and-hardening | 3 | Moderate: secrets, scanning |
| monitoring-observability | 3 | Moderate: logs, metrics, alerts |
| architecture-designer | 2 | Light: system topology |
| code-review-and-quality | 1 | Peripheral: IaC code quality |

### Refactoring (cleanup, simplification, debt)

| Skill | Weight | Role |
|-------|--------|------|
| code-simplification | 5 | Lead: remove complexity |
| architecture-designer | 5 | Lead: improve structure |
| test-driven-development | 4 | Strong: regression safety net |
| tech-debt-assessment | 4 | Strong: prioritize what to fix |
| security-and-hardening | 3 | Moderate: don't introduce vulnerabilities |
| documentation-and-adrs | 3 | Moderate: document changes |
| performance-optimization | 2 | Light: don't regress perf |
| frontend-design | 1 | Peripheral: only if UI code |

### Full-Stack (end-to-end features)

| Skill | Weight | Role |
|-------|--------|------|
| architecture-designer | 5 | Lead: system design, boundaries |
| frontend-design | 5 | Lead: UI implementation |
| api-designer | 5 | Lead: API contract |
| security-and-hardening | 4 | Strong: auth, validation |
| test-driven-development | 3 | Moderate: full-stack tests |
| performance-optimization | 3 | Moderate: end-to-end perf |
| devops-engineer | 3 | Moderate: deployment consideration |
| code-review-and-quality | 2 | Light: review across stack |
| documentation-and-adrs | 2 | Light: document decisions |

### "Build from Scratch"

| Skill | Weight | Role |
|-------|--------|------|
| architecture-designer | 5 | Lead: system design |
| frontend-design OR backend skill | 5 | Lead: domain-specific implementation |
| test-driven-development | 3 | Moderate: test from day one |
| security-and-hardening | 3 | Moderate: secure by default |
| ci-cd-and-automation | 3 | Moderate: pipeline from start |
| documentation-and-adrs | 1 | Peripheral: document as you go |

### "Fix this Bug"

| Skill | Weight | Role |
|-------|--------|------|
| debugging-wizard | 5 | Lead: systematic debugging |
| debugging-and-error-recovery | 5 | Lead: error analysis |
| code-review-and-quality | 3 | Moderate: review the fix |
| security-and-hardening | 3 | Moderate: if auth/data related |
| test-driven-development | 3 | Moderate: regression test |
| performance-optimization | 1 | Peripheral: only if perf bug |

### "Review this Code"

| Skill | Weight | Role |
|-------|--------|------|
| code-review-and-quality | 5 | Lead: review patterns |
| security-and-hardening | 3 | Moderate: security review |
| performance-optimization | 3 | Moderate: perf review |
| accessibility-audit | 3 | Moderate: if UI code |
| architecture-designer | 2 | Light: structural review |
| documentation-and-adrs | 1 | Peripheral: doc review |

### "Make it Faster"

| Skill | Weight | Role |
|-------|--------|------|
| performance-optimization | 5 | Lead: measure, identify, fix |
| performance-testing | 5 | Lead: benchmark, verify |
| database-optimizer | 3 | Moderate: if DB-related |
| code-simplification | 3 | Moderate: remove unnecessary complexity |
| architecture-designer | 2 | Light: structural perf |
| frontend-design | 1 | Peripheral: only if rendering perf |

### "Is this Secure?"

| Skill | Weight | Role |
|-------|--------|------|
| security-reviewer | 5 | Lead: comprehensive audit |
| pentesting | 5 | Lead: attack simulation |
| vulnerability-scanning | 4 | Strong: dependency audit |
| secure-coding | 4 | Strong: code-level security |
| security-and-hardening | 4 | Strong: defense in depth |
| code-review-and-quality | 3 | Moderate: review for security issues |