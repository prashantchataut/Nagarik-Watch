#!/usr/bin/env bash
# Rebuild OpenNext WITHOUT Next middleware (saves ~edge bundle) for Workers Free.
set -euo pipefail
export PATH="/usr/bin:/bin:$HOME/.local/bin:$PATH"
[ -d "$HOME/.local/node-v22.16.0-linux-x64/bin" ] && export PATH="$HOME/.local/node-v22.16.0-linux-x64/bin:$PATH"
. "$HOME/.nvm/nvm.sh" 2>/dev/null || true
nvm use 22 2>/dev/null || true

WIN="/mnt/c/Users/MMT/Documents/side quests/Nagarik Watch"
DEST="${HOME}/nagarik-watch"

mkdir -p "${HOME}/.config/.wrangler"
WIN_CFG="/mnt/c/Users/MMT/AppData/Roaming/xdg.config/.wrangler"
[ -d "${WIN_CFG}" ] && cp -a "${WIN_CFG}/." "${HOME}/.config/.wrangler/" 2>/dev/null || true

rsync -a --delete \
  --exclude node_modules --exclude .next --exclude .open-next --exclude .wrangler \
  --exclude out --exclude test-results --exclude .git/objects --exclude '.pages-build-bak' \
  "${WIN}/" "${DEST}/"

[ -f "${WIN}/apps/web/.dev.vars" ] && cp -f "${WIN}/apps/web/.dev.vars" "${DEST}/apps/web/.dev.vars"
cp -f "${WIN}/apps/web/wrangler.admin.jsonc" "${DEST}/apps/web/wrangler.admin.jsonc"

if [ -f "${DEST}/apps/web/.env.local" ]; then
  sed -i '/^NEXT_PUBLIC_SITE_URL=/d;/^BETTER_AUTH_URL=/d' "${DEST}/apps/web/.env.local" || true
fi

# Use slim admin-only middleware (public locale rewrites stay on Pages).
if [ -f "${DEST}/apps/web/middleware.admin-slim.ts" ]; then
  cp -f "${DEST}/apps/web/middleware.admin-slim.ts" "${DEST}/apps/web/middleware.ts"
  echo "installed middleware.admin-slim.ts"
fi

cd "${DEST}"
pnpm install --frozen-lockfile

cd "${DEST}/apps/web"
export CF_WORKERS=1
export NEXT_PUBLIC_SITE_URL="https://nagarik-watch-app.prashantchataut8.workers.dev"
export BETTER_AUTH_URL="$NEXT_PUBLIC_SITE_URL"
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}"

pnpm exec opennextjs-cloudflare build

HANDLER=".open-next/server-functions/default/apps/web/handler.mjs"
[ -f "$HANDLER" ] || HANDLER=".open-next/server-functions/default/handler.mjs"
ESBUILD=$(find "$HOME/nagarik-watch/node_modules/.pnpm" -path '*@esbuild+linux-x64*/bin/esbuild' | head -1 || true)
if [ -n "$ESBUILD" ] && [ -f "$HANDLER" ]; then
  "$ESBUILD" "$HANDLER" --minify --legal-comments=none --outfile="${HANDLER}.min" --allow-overwrite --log-level=error
  mv -f "${HANDLER}.min" "$HANDLER"
fi
MW=".open-next/middleware/handler.mjs"
if [ -n "$ESBUILD" ] && [ -f "$MW" ]; then
  "$ESBUILD" "$MW" --minify --legal-comments=none --outfile="${MW}.min" --allow-overwrite --log-level=error
  mv -f "${MW}.min" "$MW"
fi

echo "=== dry-run ==="
pnpm exec wrangler deploy --minify --config wrangler.admin.jsonc --dry-run 2>&1 | tee /tmp/nw-nomw-dry.txt | grep -E "Total Upload|gzip|ERROR|10027|KiB" || true

echo "=== deploy ==="
set +e
pnpm exec wrangler deploy --minify --config wrangler.admin.jsonc 2>&1 | tee /tmp/nw-nomw-deploy.txt
RC=${PIPESTATUS[0]}
set -e
grep -E "Deployed|workers.dev|Total Upload|gzip|Version ID|10027|ERROR|Current Version" /tmp/nw-nomw-deploy.txt || true
exit "$RC"
