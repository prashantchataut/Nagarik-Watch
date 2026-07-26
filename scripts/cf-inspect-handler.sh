#!/usr/bin/env bash
set -euo pipefail
cd "$HOME/nagarik-watch/apps/web"
ls -lh .open-next/server-functions/default/apps/web/handler.mjs
echo "=== sass paths ==="
find .open-next/server-functions/default -iname '*sass*' 2>/dev/null | head -20 || true
echo "=== catalog paths ==="
find .open-next/server-functions/default -iname '*catalog*' 2>/dev/null | head -20 || true
python3 <<'PY'
from pathlib import Path
p = Path('.open-next/server-functions/default/apps/web/handler.mjs')
t = p.read_text(encoding='utf-8', errors='ignore')
for s in ['sass.dart', 'ASM_CONSTS', 'ALGORITHM_CATALOG', 'capsize-font-metrics', 'playwright', 'next-devtools']:
    print(s, t.count(s))
PY
