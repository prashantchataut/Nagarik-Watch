#!/usr/bin/env bash
set -euo pipefail
. "$HOME/.nvm/nvm.sh"
nvm use 22
cd "$HOME/nagarik-watch/apps/web"
python3 - <<'PY'
import gzip, pathlib
for rel in [
  ".open-next/server-functions/default/apps/web/handler.mjs",
  ".open-next/middleware/handler.mjs",
  ".open-next/worker.js",
]:
  p=pathlib.Path(rel)
  if not p.exists():
    print(rel, "MISSING"); continue
  raw=p.read_bytes(); gz=gzip.compress(raw,9)
  print(f"{rel}: raw={len(raw)/1024:.1f}KiB gzip9={len(gz)/1024:.1f}KiB")
# find playwright references context
t=pathlib.Path(".open-next/server-functions/default/apps/web/handler.mjs").read_text(encoding="utf-8", errors="ignore")
idx=t.find("playwright")
print("first_playwright_idx", idx)
print(t[max(0,idx-80):idx+120].replace("\n"," ")[:200])
# count e2e strings
for s in ["playwright-core","@playwright","e2e/","test-results","chromium"]:
  print(s, t.count(s))
PY
# see next.config webpack aliases
sed -n '156,220p' next.config.ts