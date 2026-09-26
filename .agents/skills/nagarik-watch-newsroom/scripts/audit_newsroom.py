#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    failures: list[str] = []
    warnings: list[str] = []

    required = [
        root / "apps/web/app/[locale]/page.tsx",
        root / "apps/web/components/Masthead.tsx",
        root / "apps/admin/src/collections/Articles.ts",
        root / "packages/db/src/recommend.ts",
        root / "vercel.json",
    ]
    for path in required:
        if not path.exists():
            failures.append(f"missing required file: {path.relative_to(root)}")

    for page in (root / "apps/web/app").rglob("page.tsx"):
        lines = page.read_text(encoding="utf-8").count("\n") + 1
        if lines <= 5:
            warnings.append(f"route is effectively an alias/stub ({lines} lines): {page.relative_to(root)}")

    banned_copy = re.compile(
        r"(lorem ipsum|coming soon|mock feed|fake published|registration pending|final newsroom address pending)",
        re.IGNORECASE,
    )
    for base in [root / "apps/web/app", root / "apps/web/components"]:
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if path.suffix not in {".ts", ".tsx", ".mdx"}:
                continue
            match = banned_copy.search(path.read_text(encoding="utf-8"))
            if match:
                failures.append(f"public placeholder phrase '{match.group(0)}': {path.relative_to(root)}")

    store = root / "apps/web/data/articles.json"
    if store.exists():
        try:
            payload = json.loads(store.read_text(encoding="utf-8"))
            articles = payload.get("articles", []) if isinstance(payload, dict) else payload
            if not articles:
                warnings.append("local article store is empty")
        except Exception as exc:  # noqa: BLE001
            failures.append(f"invalid article store JSON: {exc}")

    seed_dir = root / "apps/web/lib/content/seed"
    if seed_dir.exists():
        article_files = list(seed_dir.glob("articles-*.ts"))
        seed_text = "\n".join(p.read_text(encoding="utf-8") for p in article_files)
        if article_files and "sourceUrl:" not in seed_text and "sourceType:" not in seed_text:
            warnings.append("seed news has no visible provenance fields")
        if article_files and re.search(r"[\"“][^\n]{8,}[\"”].*(भन्नुभयो|भने)", seed_text):
            warnings.append("seed news appears to contain direct quotes; verify they are sourced")

    rec = root / "packages/db/src/recommend.ts"
    if rec.exists():
        text = rec.read_text(encoding="utf-8")
        for token in ["doNotRecommend", "maxPerCategory", "freshnessScore"]:
            if token not in text:
                failures.append(f"recommendation guardrail missing: {token}")

    print("Nagarik Watch newsroom audit")
    for item in failures:
        print(f"FAIL: {item}")
    for item in warnings:
        print(f"WARN: {item}")
    print(f"summary: {len(failures)} failures, {len(warnings)} warnings")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
