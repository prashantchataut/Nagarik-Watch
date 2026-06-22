# Orchestrator Aids

Skills that improve the orchestrator itself. Loaded as meta-aids — they improve how the orchestrator routes, enhances, and validates output.

## Always-Loaded (meta level, not task level)

These run at the orchestrator level, invisible to the user's task:

| Skill | How it helps the orchestrator |
|-------|------------------------------|
| `context-engineering` | Optimizes how context is structured for each loaded skill — better context = better skill output. Apply context-engineering principles when composing the merged prompt sent to activated skills. |
| `prompt-engineer` | Enhances Step 0 (prompt enhancement) with advanced prompt patterns: chain-of-thought, few-shot, structured output schemas, persona injection. Already referenced in Step 0. |
| `doubt-driven-development` | Adversarial review of the orchestrator's routing decisions. After routing, ask: "Did I pick the right skills? Did I miss anything? Is this the best combination?" |
| `incremental-implementation` | Guides how the orchestrator should stage multi-skill outputs — present results in thin slices rather than one giant response. |
| `code-reviewer` | Reviews the orchestrator's own output for quality before presenting to the user (meta-review). |

## Orchestration Workflow Skills (superpowers/)

These skills control how the orchestrator structures work. Activate them based on the task phase:

| Skill | When to activate | What it does |
|-------|-----------------|-------------|
| `brainstorming` | Before ANY creative work — new features, components, functionality | Explores user intent, requirements, and design before implementation. Prevents jumping straight to code. |
| `writing-plans` | Multi-step task with spec/requirements available | Creates structured implementation plans before coding. Essential for anything touching 2+ files. |
| `executing-plans` | Have a written plan to execute in a separate session | Executes plan with review checkpoints. Prevents deviation from spec. |
| `subagent-driven-development` | Executing implementation plans with independent tasks in current session | Dispatches parallel sub-agents for independent tasks. Use when 2+ tasks have no shared state. |
| `dispatching-parallel-agents` | 2+ independent tasks that can run without shared state or sequential dependencies | Launches background agents for maximum throughput on parallelizable work. |
| `systematic-debugging` | Bug, test failure, or unexpected behavior — BEFORE proposing fixes | Systematic root-cause analysis. Prevents guess-and-check debugging. |
| `verification-before-completion` | About to claim work is complete, fixed, or passing | Runs verification commands and confirms output before making success claims. Evidence before assertions. |
| `requesting-code-review` | Completed a task, implemented a major feature, or before merging | Verifies work meets requirements before claiming done. |
| `receiving-code-review` | Received code review feedback, before implementing suggestions | Ensures technical rigor when processing review feedback — not blind agreement. |
| `finishing-a-development-branch` | Implementation complete, all tests pass, need to decide how to integrate | Guides merge/PR/cleanup decisions. |
| `using-git-worktrees` | Starting feature work that needs isolation from current workspace | Creates isolated git worktrees for safe parallel development. |

### Orchestration Workflow Integration

**For new feature requests:**
1. Activate `brainstorming` first — explore intent before implementation
2. Then `writing-plans` — create structured plan
3. Then `subagent-driven-development` or `dispatching-parallel-agents` — execute plan in parallel
4. Then `verification-before-completion` — verify before claiming done
5. Then `requesting-code-review` — get review before merging

**For bug reports:**
1. Activate `systematic-debugging` — root cause analysis first
2. Then `incremental-implementation` — fix in small slices
3. Then `verification-before-completion` — verify the fix works

**For refactoring:**
1. Activate `writing-plans` — plan the refactor
2. Then `incremental-implementation` — execute in thin slices
3. Then `verification-before-completion` — verify behavior preserved

## On-Demand Aids

Load these when the orchestrator detects a relevant condition:

| Skill | Condition | How it helps |
|-------|-----------|-------------|
| `performance-optimization` | Orchestrator is loading 5+ skills or response is getting long | Optimize token usage, trim verbose reference content, prefer concise output |
| `planning-and-task-breakdown` | User request is large or multi-step | Break the task into ordered steps before routing to skills |
| `code-simplification` | Orchestrator output is overly complex or abstract-heavy | Simplify the orchestration plan — fewer skills, clearer rationale |
| `spec-driven-development` | User request is vague or underspecified (below 0.5 confidence) | Guide the user through specification before routing to implementation skills |

## Priority Rules for Orchestrator Aids

1. `context-engineering` and `prompt-engineer` are always loaded at the meta level (do not count against the 7-skill token budget)
2. Orchestration workflow skills (superpowers/) are loaded based on task phase — they DO count against the budget
3. On-demand aids are loaded on demand and DO count against the budget
4. When conflict arises between an aid's recommendation and a task skill's recommendation, the task skill wins (user-facing needs > orchestrator optimization)
