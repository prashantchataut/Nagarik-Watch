# Prompt Enhancer

Transform vague user requests into sharp, output-driven prompts before routing to skills.

## When to Use

- The user's request lacks specificity ("make it better", "fix this", "build something")
- No output format is specified
- No constraints or quality bar is mentioned
- The request could mean 3+ different things

## Enhancement Strategy

### 1. Add Production Constraints

| Vague | Enhanced |
|-------|---------|
| "Build a login page" | "Build a login page with form validation, loading/error/success states, WCAG AA accessibility, remember-me, CSRF protection, and rate-limited submissions" |
| "Create an API" | "Create a REST API with consistent error responses, input validation on every endpoint, pagination on list endpoints, authentication via JWT, request logging, and OpenAPI documentation" |
| "Add dark mode" | "Add a dark mode theme system with CSS custom properties, `prefers-color-scheme` detection, localStorage persistence, smooth transitions, and WCAG-compliant contrast ratios" |

### 2. Add Output Expectations

| Vague | Enhanced |
|-------|---------|
| "Optimize the database" | "Profile the 5 slowest queries with EXPLAIN ANALYZE, add indexes where missing, identify N+1 patterns, and provide before/after timing measurements" |
| "Review this code" | "Review this code for: security vulnerabilities (OWASP Top 10), performance bottlenecks (N+1, bundle size), accessibility issues (WCAG AA), and maintainability (DRY, SRP). Prioritize findings by severity." |
| "Set up CI/CD" | "Set up a CI pipeline with: lint → typecheck → unit tests → build → integration tests → security audit. Each gate must block the pipeline on failure." |

### 3. Add Specificity via Questions

If still too vague, silently answer these questions yourself before routing:

- **Who is the user?** (end-user, developer, admin, API consumer)
- **What is the quality bar?** (MVP, production, enterprise)
- **What are the constraints?** (time, budget, tech stack, team size)
- **What are the non-negotiables?** (security, accessibility, performance)
- **What defines success?** (conversion rate, response time, test coverage)

### 4. Add Format Specification

| Domain | Expected Output Format |
|--------|----------------------|
| Code | Working, tested, typed, with error handling |
| API | Endpoint definitions, request/response schemas, error codes, auth |
| UI | Component with all states (loading, empty, error, success), responsive, accessible |
| Architecture | Decision rationale, trade-offs, diagram-ready, migration path |
| DevOps | Pipeline configs, IaC, runbooks, rollback plan |

## Enhancement Templates

### For Feature Requests

```
Build a production-grade [feature] with:
- [core functionality]
- [error handling]
- [edge cases]
- [accessibility]
- [security]
- [test coverage]
- [performance target]
```

### For Bug Fixes

```
Root-cause and fix [bug description]:
1. Identify the exact failure point
2. Fix without introducing regressions
3. Add a regression test
4. Audit adjacent code for the same pattern
```

### For Refactoring

```
Refactor [module/file] for:
- [improvement goal: readability / performance / testability]
- Maintain identical external behavior
- Add/update tests covering all existing paths
```

## Enhancement DOs and DON'Ts

**DO:**
- Keep the original intent intact — enhancement sharpens, doesn't redirect
- Add implicit requirements that any senior engineer would assume
- Consider the full lifecycle: dev → test → deploy → monitor
- Add failure modes: what happens when the DB is down, the API returns 500, the user types emoji

**DON'T:**
- Change what the user asked for
- Add scope that fundamentally changes the task
- Make assumptions about tech stack without evidence
- Exceed what's reasonable for a single task