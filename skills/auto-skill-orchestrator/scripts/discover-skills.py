#!/usr/bin/env python3
"""Auto-discover installed OpenCode skills and rebuild the routing table.

Scans top-level directories AND subdirectories (superpowers/, .agents/skills/)
for SKILL.md files. Classifies each skill into categories based on keyword
matching against name, description, and metadata.

Usage:
    python3 scripts/discover-skills.py
    SKILL_DIR=~/.config/opencode/skill OUTPUT=references/routing-table.md python3 scripts/discover-skills.py
"""

import os
import re
import sys
from pathlib import Path

SKILL_DIR = Path(os.environ.get("SKILL_DIR", os.path.expanduser("~/.config/opencode/skill")))
OUTPUT_FILE = os.environ.get("OUTPUT", "") or ""

SKIP_DIRS = {".agents", "__pycache__", "node_modules", ".git"}

CATEGORY_KEYWORDS = {
    "frontend": ["ui", "component", "page", "layout", "css", "tailwind", "react", "vue", "angular",
                  "render", "responsive", "animation", "design", "style", "frontend", "dom", "browser",
                  "html", "nextjs", "next.js", "nuxt", "svelte", "flutter", "swift", "kotlin",
                  "mobile", "app shell", "component library", "design token"],
    "backend": ["api", "endpoint", "server", "database", "auth", "middleware", "route", "controller",
                "service", "repository", "model", "backend", "crud", "rest", "graphql", "orm", "migration",
                "fastapi", "django", "flask", "express", "nestjs", "spring", "rails", "laravel", "sql",
                "postgres", "mysql", "mongodb", "redis", "microservice", "websocket", "socket",
                "embedded", "firmware", "rtos", "hardware", "stm32", "esp32"],
    "security": ["security", "auth", "login", "password", "token", "jwt", "oauth", "vulnerability",
                 "xss", "csrf", "injection", "encrypt", "sanitize", "owasp", "pentest", "penetration",
                 "cve", "breach", "exploit", "secure", "vulnerability", "threat", "hardening",
                 "guardian", "csp", "cors", "rate limit"],
    "ui-ux": ["ux", "user experience", "interaction", "accessibility", "a11y", "wcag", "microinteraction",
              "figma", "design system", "design token", "theme", "palette", "usability", "user flow",
              "wireframe", "prototype", "motion", "animation", "responsive", "dark mode",
              "form", "wizard", "validation", "autosave", "dirty detection", "error display"],
    "ai-agents": ["ai", "llm", "gpt", "claude", "prompt", "rag", "embedding", "vector", "model",
                  "inference", "fine-tune", "agent", "tool-call", "mcp", "orchestrat", "ml pipeline",
                  "machine learning", "neural", "transformer", "tokeniz", "knowledge graph",
                  "chunking", "reranking", "similarity search"],
    "devops": ["deploy", "ci/cd", "pipeline", "docker", "kubernetes", "terraform", "infrastructure",
               "monitoring", "staging", "production", "container", "helm", "gitops", "devops",
               "github actions", "gitlab ci", "jenkins", "sre", "incident", "on-call",
               "shipping", "launch", "rollback"],
    "performance": ["performance", "optimize", "bundle", "lazy", "cache", "load time", "lcp", "cls",
                    "inp", "memory", "cpu", "profiling", "benchmark", "latency", "throughput",
                    "speed", "slow", "fast", "bottleneck", "caching", "cdn", "invalidation",
                    "stale-while-revalidate"],
    "testing": ["test", "spec", "unit", "integration", "e2e", "coverage", "mock", "fixture", "assertion",
                "tdd", "bdd", "playwright", "jest", "vitest", "cypress", "selenium", "quality",
                "scout", "exploratory", "bug", "verification", "verify"],
    "architecture": ["architecture", "design pattern", "refactor", "restructure", "microservice",
                     "monolith", "module", "dependency", "clean architecture", "ddd", "cqrs",
                     "event sourcing", "solid", "dry", "system design", "decision record",
                     "api design", "interface design", "bounded context", "saga"],
    "documentation": ["docs", "readme", "jsdoc", "comment", "api spec", "openapi", "guide", "tutorial",
                      "changelog", "adr", "documentation", "swagger", "spec", "requirement",
                      "user story", "acceptance criteria", "specification"],
    "accessibility": ["a11y", "wcag", "screen reader", "aria", "keyboard", "contrast", "focus",
                      "semantic", "accessible", "inclusive", "disability", "audit", "compliance",
                      "assistive technology", "alt text", "tab order", "focus trap"],
    "refactoring": ["refactor", "clean", "simplify", "extract", "rename", "restructure", "tech debt",
                    "improve", "dry", "solid", "code smell", "legacy", "moderniz", "deprecat",
                    "migration", "sunset", "strangler fig", "dead code", "orphan"],
    "marketing": ["marketing", "cro", "conversion", "copywriting", "seo", "analytics", "landing page",
                   "signup", "onboarding", "paywall", "pricing", "launch", "churn", "retention",
                   "referral", "email", "cold outreach", "growth", "ab testing", "ads", "ad creative",
                   "popup", "lead magnet", "social media", "content strategy", "schema markup",
                   "programmatic seo", "customer research", "competitor", "sales enablement",
                   "revops", "directory submission", "aso", "free tool", "community"],
    "planning": ["brainstorm", "idea", "refine", "plan", "task breakdown", "feature specification",
                 "requirement", "interview", "spec-driven", "doubt-driven", "incremental"],
}

def parse_frontmatter(content):
    """Extract YAML frontmatter from SKILL.md."""
    match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return {}
    fm = match.group(1)
    result = {}
    for line in fm.split('\n'):
        line = line.strip()
        if ':' in line and not line.startswith(' '):
            key, _, val = line.partition(':')
            result[key.strip()] = val.strip().strip('"').strip("'")
    return result

def classify_skill(name, description, metadata_str=""):
    """Classify a skill into categories based on keywords."""
    text = f"{name} {description} {metadata_str}".lower()
    categories = []
    for cat, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                if cat not in categories:
                    categories.append(cat)
                break
    if not categories:
        categories.append("general")
    return categories

def discover_skills(skill_dir):
    """Recursively discover SKILL.md files, scanning top-level and one level of subdirectories."""
    skills = {}
    for entry in sorted(skill_dir.iterdir()):
        if entry.name.startswith('.') and entry.name != '.agents':
            continue
        if entry.name in SKIP_DIRS:
            continue
        if entry.is_dir():
            for sub in [entry] + sorted(d for d in entry.iterdir() if d.is_dir() and d.name not in SKIP_DIRS):
                skill_md = sub / "SKILL.md"
                if skill_md.exists():
                    try:
                        content = skill_md.read_text(encoding="utf-8", errors="ignore")
                    except Exception:
                        continue
                    fm = parse_frontmatter(content)
                    name = fm.get("name", sub.name)
                    desc = fm.get("description", "")
                    metadata = fm.get("metadata", "")
                    categories = classify_skill(name, desc, metadata)
                    if name not in skills:
                        skills[name] = {
                            "description": desc[:200],
                            "categories": categories,
                            "path": str(sub),
                        }
    return skills

def main():
    if not SKILL_DIR.exists():
        print(f"Skill directory not found: {SKILL_DIR}", file=sys.stderr)
        sys.exit(1)

    skills = discover_skills(SKILL_DIR)

    output_path = Path(OUTPUT_FILE) if OUTPUT_FILE else Path(SKILL_DIR / "auto-skill-orchestrator" / "references" / "routing-table.md")

    lines = [
        "# Auto-Generated Skill Routing Table",
        "",
        f"Generated from {len(skills)} installed skills.",
        "Do not edit manually — regenerated by `scripts/discover-skills.py`.",
        "",
    ]

    cat_skills = {}
    for name, info in skills.items():
        for cat in info["categories"]:
            cat_skills.setdefault(cat, []).append(name)

    for cat in sorted(cat_skills.keys()):
        lines.append(f"### {cat.title()}")
        lines.append(f"- {', '.join(sorted(cat_skills[cat]))}")
        lines.append("")

    lines.append("## Unclassified")
    unclassified = [n for n, i in skills.items() if i["categories"] == ["general"]]
    if unclassified:
        lines.append(f"- {', '.join(sorted(unclassified))}")
    lines.append("")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote routing table with {len(skills)} skills to {output_path}")

if __name__ == "__main__":
    main()