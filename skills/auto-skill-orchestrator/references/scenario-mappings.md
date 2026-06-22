# Scenario Mappings

Maps common task archetypes to concrete skill combinations. Used by the orchestrator to load the right skills for the job, not just by category keywords.

## Scenario Archetype → Skill Loadout

### Building a Website / Web App (frontend-heavy)

| Role | Skills | Why |
|------|--------|-----|
| Lead | `frontend-design`, `impeccable` | Design system, component architecture, UX decisions |
| Support | `web-design-reviewer`, `ui-ux-pro-max`, `design-expert` | Visual QA, UX patterns, design guidance |
| Support | `responsive-design`, `dark-mode-specialist`, `motion-ui-designer` | Layout, theming, animation |
| Background | `tailwind-css`, `react-patterns`, `typescript-pro` | Stack-specific patterns |
| Review | `accessibility-audit`, `browser-testing-with-devtools` | a11y compliance, browser testing |

**Sub-commands of `impeccable` to invoke directly:**
- `critique [target]` — UX design review with heuristic scoring
- `audit [target]` — Technical quality (a11y, perf, responsive)
- `polish [target]` — Final quality pass before shipping
- `bolder [target]` / `quieter [target]` — Amplify or tone down design
- `distill [target]` — Strip to essence
- `harden [target]` — Production-ready: errors, i18n, edge cases

### Building an API / Backend Service

| Role | Skills | Why |
|------|--------|-----|
| Lead | `api-designer`, `api-and-interface-design` | Endpoint design, contracts, versioning |
| Support | `security-and-hardening`, `api-security` | Auth, rate limiting, input validation |
| Support | `database-optimizer`, `sql-pro` | Query design, indexing, schema |
| Background | `fastapi-expert` / `nestjs-expert` / `django-expert` / `spring-boot-engineer` | Stack-specific patterns |
| Review | `code-reviewer`, `security-reviewer` | Security audit, code review |

### Debugging / Incident Response

| Role | Skills | Why |
|------|--------|-----|
| Lead | `debugging-wizard`, `debugging-and-error-recovery` | Root cause analysis, systematic debugging |
| Support | `incident-commander` | Multi-turn incident triage |
| Support | `code-reviewer` | Code audit during debugging |
| Background | `doubt-driven-development` | Adversarial review of findings |
| Support | `monitoring-expert`, `sre-engineer` | Logs, metrics, tracing |

### Performance Optimization

| Role | Skills | Why |
|------|--------|-----|
| Lead | `performance-optimization` | Profiling, measurement, fixes |
| Support | `database-optimizer`, `sql-pro` | Query performance |
| Support | `landing-page-optimizer` | Core Web Vitals, load time |
| Background | `monitoring-expert` | Performance monitoring setup |
| Review | `code-reviewer` | Performance regression review |

### Adding Auth / Security

| Role | Skills | Why |
|------|--------|-----|
| Lead | `secure-code-guardian`, `api-security` | Auth flows, encryption, input validation |
| Support | `security-and-hardening` | General hardening |
| Review | `security-reviewer`, `pentesting` | Security audit, penetration testing |
| Background | `threat-modeling` | STRIDE, attack tree analysis |

### Data Science / ML / AI

| Role | Skills | Why |
|------|--------|-----|
| Lead | `ml-pipeline`, `ml-engineering` | Training pipelines, model serving |
| Support | `prompt-engineer`, `fine-tuning-expert` | LLM prompts, fine-tuning |
| Support | `rag-architect`, `vector-databases` | Retrieval-augmented generation |
| Background | `data-pipelines` | Data processing pipelines |
| Support | `embedding-expert` | Embedding generation and optimization |

### Testing / Quality Assurance

| Role | Skills | Why |
|------|--------|-----|
| Lead | `test-driven-development`, `test-master` | Test strategy, TDD workflow |
| Support | `playwright-expert`, `e2e-testing` | E2E browser tests |
| Support | `scoutqa-test` | Automated QA testing |
| Support | `webapp-testing` | Local web app testing |
| Background | `screen-reader-testing` | Accessibility testing |

### DevOps / CI-CD / Deployment

| Role | Skills | Why |
|------|--------|-----|
| Lead | `devops-engineer`, `ci-cd-and-automation` | Pipeline setup, deployment |
| Support | `docker-containerization`, `kubernetes-specialist` | Containerization, orchestration |
| Support | `terraform-engineer` | Infrastructure as code |
| Support | `github-actions` | CI workflow automation |
| Review | `shipping-and-launch` | Pre-launch checklist, rollback plan |
| Background | `sre-engineer`, `monitoring-expert` | SLOs, incident response, monitoring |

### Architecture / Refactoring

| Role | Skills | Why |
|------|--------|-----|
| Lead | `architecture-designer`, `clean-architecture` | System design, ADRs, patterns |
| Support | `code-simplification` | Reduce complexity |
| Support | `legacy-modernizer`, `deprecation-and-migration` | Migration strategy |
| Support | `spec-miner` | Reverse-engineer undocumented code |
| Review | `code-reviewer`, `codebase-auditor` | Architecture review, tech debt audit |
| Background | `ddd-strategic-design`, `ddd-context-mapping`, `ddd-database-patterns` | DDD patterns |
| Background | `microservices-architect`, `microservices-patterns` | Microservices decomposition |
| Background | `event-sourcing` | Event-driven architecture |

### Documentation

| Role | Skills | Why |
|------|--------|-----|
| Lead | `code-documenter`, `documentation-and-adrs` | Docs generation, ADR authoring |
| Support | `spec-driven-development` | Spec-first development |
| Support | `changelog-generator` | Release notes from git history |
| Support | `source-driven-development` | Source-cited documentation |

### Mobile App Development

| Role | Skills | Why |
|------|--------|-----|
| Lead | `react-native-expert` or `flutter-expert` or `swift-expert` or `kotlin-specialist` | Platform-specific |
| Support | `ui-ux-pro-max`, `design-expert` | Mobile UI/UX patterns |
| Review | `accessibility-audit` | Mobile accessibility |

## Skills That Span Multiple Scenarios

Some skills are useful across many scenarios without dominating any single one:

| Skill | Scenarios it supports | Role |
|-------|----------------------|------|
| `prompt-engineer` | AI/ML, Debugging, Documentation, Testing | Support or Background |
| `context-engineering` | ALL scenarios — improves agent context quality | Background (always useful) |
| `performance-optimization` | Building Website, Building API, DevOps, Mobile | Support |
| `code-reviewer` | ALL scenarios — security/perf/correctness review | Review |
| `doubt-driven-development` | Debugging, Architecture, Security — any high-stakes decision | Background |
| `incremental-implementation` | ALL scenarios — how to ship changes safely | Background |
| `planning-and-task-breakdown` | ALL scenarios — decompose work before coding | Background |

## Selecting the Right Scenario

1. Scan the enhanced prompt for scenario signals (e.g., "build a dashboard" → Building Website; "deploy this" → DevOps)
2. If the prompt matches multiple scenarios, load ALL matched scenarios and merge the skill sets (deduplicate)
3. The most specific scenario wins for lead role; broader scenarios contribute support/background skills
4. If no scenario matches, fall back to category-based routing (default)
