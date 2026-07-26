#!/usr/bin/env bash
set -euo pipefail
. "$HOME/.nvm/nvm.sh"
nvm use 22
cd "$HOME/nagarik-watch/apps/web"
ESBUILD=$(find "$HOME/nagarik-watch/node_modules/.pnpm" -path '*@esbuild+linux-x64@0.25.4*/bin/esbuild' | head -1)
echo "ESBUILD=$ESBUILD"
HANDLER=".open-next/server-functions/default/apps/web/handler.mjs"
ls -lh "$HANDLER"
"$ESBUILD" "$HANDLER" --minify --outfile="${HANDLER}.min" --allow-overwrite --log-level=error
mv -f "${HANDLER}.min" "$HANDLER"
ls -lh "$HANDLER"
MW=".open-next/middleware/handler.mjs"
"$ESBUILD" "$MW" --minify --outfile="${MW}.min" --allow-overwrite --log-level=error
mv -f "${MW}.min" "$MW"
ls -lh "$MW"
echo "=== dry-run ==="
pnpm exec wrangler deploy --minify --config wrangler.admin.jsonc --dry-run 2>&1 | tee /tmp/nw-cf-dry2.txt | grep -E "Total Upload|gzip|ERROR|10027|KiB" || true
echo "=== deploy ==="
set +e
pnpm exec wrangler deploy --minify --config wrangler.admin.jsonc 2>&1 | tee /tmp/nw-cf-deploy2.txt
RC=${PIPESTATUS[0]}
echo EXIT=$RC
grep -E "Deployed|workers.dev|Total Upload|gzip|Version ID|10027|ERROR|Current Version" /tmp/nw-cf-deploy2.txt || true
# copy key lines to windows log
cp /tmp/nw-cf-deploy2.txt "/mnt/c/Users/MMT/Documents/side quests/Nagarik Watch/apps/web/.cf-redeploy.log"
exit $RC