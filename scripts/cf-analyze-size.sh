#!/usr/bin/env bash
set -euo pipefail
. "$HOME/.nvm/nvm.sh"
nvm use 22
cd "$HOME/nagarik-watch/apps/web"
HANDLER=".open-next/server-functions/default/apps/web/handler.mjs"
# gzip size of handler alone
python3 - <<PY
import gzip, pathlib
p=pathlib.Path("$HANDLER")
raw=p.read_bytes()
gz=gzip.compress(raw, compresslevel=9)
print(f"handler_raw_kib={len(raw)/1024:.2f}")
print(f"handler_gzip9_kib={len(gz)/1024:.2f}")
PY
# look for large string patterns / modules
python3 - <<'PY'
from pathlib import Path
import re
t=Path(".open-next/server-functions/default/apps/web/handler.mjs").read_text(encoding="utf-8", errors="ignore")
# find big require/import names mentioned near chunk boundaries
for pat in ["better-auth","@electric-sql","stripe","web-push","kysely","postgres","pglite","sharp","playwright","aws-sdk","@opentelemetry","next/dist"]:
    print(pat, t.count(pat))
print("len_chars", len(t))
# approximate largest contiguous non-ws? skip
PY
# check open-next config
ls open-next.config.* 2>/dev/null || true
cat open-next.config.ts 2>/dev/null | head -80 || cat open-next.config.mjs 2>/dev/null | head -80 || true
# pages project
pnpm exec wrangler pages project list 2>&1 | head -40 || true