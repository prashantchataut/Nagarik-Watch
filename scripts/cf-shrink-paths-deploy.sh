#!/usr/bin/env bash
# Shrink repeated pnpm path strings inside the OpenNext handler, then deploy.
set -euo pipefail
. "$HOME/.nvm/nvm.sh" 2>/dev/null || true
nvm use 22 2>/dev/null || true
cd "$HOME/nagarik-watch/apps/web"

HANDLER=".open-next/server-functions/default/apps/web/handler.mjs"
MW=".open-next/middleware/handler.mjs"

python3 <<'PY'
import gzip, pathlib, re
handler = pathlib.Path('.open-next/server-functions/default/apps/web/handler.mjs')
mw = pathlib.Path('.open-next/middleware/handler.mjs')

def shrink(path: pathlib.Path):
    if not path.exists():
        print(path, 'missing')
        return
    raw = path.read_text(encoding='utf-8', errors='surrogateescape')
    before = len(gzip.compress(raw.encode('utf-8', errors='surrogateescape'), 9))
    # Collapse long pnpm next path prefixes to a short stable token.
    pat = re.compile(
        r"\.open-next/server-functions/default/node_modules/\.pnpm/next@[^/\"']+/node_modules/next"
    )
    # Find the most common full match and replace globally.
    counts = {}
    for m in pat.finditer(raw):
        counts[m.group(0)] = counts.get(m.group(0), 0) + 1
    if not counts:
        print(path, 'no pnpm-next paths')
        return
    old = max(counts, key=counts.get)
    print(path.name, 'replacing', counts[old], 'x', old[:80], '...')
    # Use a short absolute-looking id that won't collide.
    new = '.open-next/n'
    out = raw.replace(old, new)
    # Also shorten middleware-relative pnpm paths if present
    pat2 = re.compile(
        r"\.open-next/middleware/node_modules/\.pnpm/next@[^/\"']+/node_modules/next"
    )
    out = pat2.sub('.open-next/n', out)
    after = len(gzip.compress(out.encode('utf-8', errors='surrogateescape'), 9))
    path.write_text(out, encoding='utf-8', errors='surrogateescape')
    print(f'  gzip9 before={before/1024:.1f}KiB after={after/1024:.1f}KiB delta={(before-after)/1024:.1f}KiB')

shrink(handler)
shrink(mw)
PY

ESBUILD=$(find "$HOME/nagarik-watch/node_modules/.pnpm" -path '*@esbuild+linux-x64*/bin/esbuild' | head -1 || true)
if [ -n "$ESBUILD" ]; then
  "$ESBUILD" "$HANDLER" --minify --legal-comments=none --outfile="${HANDLER}.min" --allow-overwrite --log-level=error
  mv -f "${HANDLER}.min" "$HANDLER"
  if [ -f "$MW" ]; then
    "$ESBUILD" "$MW" --minify --legal-comments=none --outfile="${MW}.min" --allow-overwrite --log-level=error
    mv -f "${MW}.min" "$MW"
  fi
fi

echo "=== dry-run ==="
pnpm exec wrangler deploy --minify --config wrangler.admin.jsonc --dry-run 2>&1 | tee /tmp/nw-shrink-dry.txt | grep -E "Total Upload|gzip|ERROR|10027" || true

echo "=== deploy ==="
set +e
pnpm exec wrangler deploy --minify --config wrangler.admin.jsonc 2>&1 | tee /tmp/nw-shrink-deploy.txt
RC=${PIPESTATUS[0]}
set -e
grep -E "Deployed|workers.dev|Total Upload|gzip|Version ID|10027|ERROR|Current Version" /tmp/nw-shrink-deploy.txt || true
exit "$RC"
