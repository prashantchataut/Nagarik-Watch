#!/usr/bin/env bash
set -euo pipefail
. "$HOME/.nvm/nvm.sh"
nvm use 22
cd "$HOME/nagarik-watch/apps/web"
echo "=== top files in .open-next ==="
find .open-next -type f -printf "%s\t%p\n" | sort -nr | head -25
echo "=== worker.js ==="
cat .open-next/worker.js
echo "=== server fn package.json ==="
cat .open-next/server-functions/default/package.json 2>/dev/null | head -40
echo "=== try terser compress ==="
TERSER=$(find "$HOME/nagarik-watch/node_modules/.pnpm" -path '*/terser/bin/terser' | head -1 || true)
echo TERSER=$TERSER
HANDLER=".open-next/server-functions/default/apps/web/handler.mjs"
# duplicate then terser
cp -f "$HANDLER" /tmp/handler.before.mjs
if [ -n "$TERSER" ]; then
  node "$TERSER" "$HANDLER" -c passes=3,drop_console=true,pure_getters=true,unsafe=true -m --module -o /tmp/handler.terser.mjs 2>/tmp/terser.err || true
  if [ -f /tmp/handler.terser.mjs ]; then
    python3 - <<'PY'
import gzip, pathlib
a=pathlib.Path("/tmp/handler.before.mjs").read_bytes()
b=pathlib.Path("/tmp/handler.terser.mjs").read_bytes()
print(f"before gzip9={len(gzip.compress(a,9))/1024:.2f}")
print(f"terser gzip9={len(gzip.compress(b,9))/1024:.2f}")
print(f"before raw={len(a)/1024:.1f} terser raw={len(b)/1024:.1f}")
PY
  else
    echo terser_failed
    cat /tmp/terser.err | tail -20
  fi
fi