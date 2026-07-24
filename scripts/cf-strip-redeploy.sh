#!/usr/bin/env bash
# Strip known free-tier bloat from an existing OpenNext build, then redeploy.
set -euo pipefail
. "$HOME/.nvm/nvm.sh" 2>/dev/null || true
nvm use 22 2>/dev/null || true
cd "$HOME/nagarik-watch/apps/web"

ROOT=".open-next/server-functions/default"
echo "Before strip:"
du -sh "$ROOT" .open-next/server-functions/default/apps/web/handler.mjs 2>/dev/null || true

# Remove traced junk that must never ship on Workers Free.
find "$ROOT" -type d \( -name sass -o -name 'sass-embedded' -o -name playwright -o -name playwright-core -o -name '@playwright' -o -name next-devtools \) -prune -exec rm -rf {} + 2>/dev/null || true
find "$ROOT" -type f \( \
  -name 'capsize-font-metrics.json' -o \
  -name 'sass.dart.js' -o \
  -name 'react-dom*.development.js' -o \
  -name 'react.development.js' -o \
  -name '*.map' -o \
  -name 'handler.mjs.meta.json' \
\) -delete 2>/dev/null || true
# Drop OpenNext ISR cache from the upload tree (assets binding / KV handle cache).
rm -rf .open-next/cache .open-next/dynamodb-provider 2>/dev/null || true

HANDLER=".open-next/server-functions/default/apps/web/handler.mjs"
ESBUILD=$(find "$HOME/nagarik-watch/node_modules/.pnpm" -path '*@esbuild+linux-x64*/bin/esbuild' | head -1 || true)
if [ -n "$ESBUILD" ] && [ -f "$HANDLER" ]; then
  echo "Minifying $HANDLER"
  "$ESBUILD" "$HANDLER" --minify --legal-comments=none --outfile="${HANDLER}.min" --allow-overwrite --log-level=error
  mv -f "${HANDLER}.min" "$HANDLER"
fi
MW=".open-next/middleware/handler.mjs"
if [ -n "$ESBUILD" ] && [ -f "$MW" ]; then
  "$ESBUILD" "$MW" --minify --legal-comments=none --outfile="${MW}.min" --allow-overwrite --log-level=error
  mv -f "${MW}.min" "$MW"
fi

echo "After strip:"
du -sh "$ROOT" "$HANDLER" 2>/dev/null || true
ls -lh "$HANDLER" "$MW" 2>/dev/null || true

echo "=== dry-run ==="
pnpm exec wrangler deploy --minify --config wrangler.admin.jsonc --dry-run 2>&1 | tee /tmp/nw-strip-dry.txt | grep -E "Total Upload|gzip|ERROR|10027|KiB" || true

echo "=== deploy ==="
set +e
pnpm exec wrangler deploy --minify --config wrangler.admin.jsonc 2>&1 | tee /tmp/nw-strip-deploy.txt
RC=${PIPESTATUS[0]}
set -e
grep -E "Deployed|workers.dev|Total Upload|gzip|Version ID|10027|ERROR|Current Version" /tmp/nw-strip-deploy.txt || true
exit "$RC"
