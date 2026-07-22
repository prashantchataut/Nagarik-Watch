#!/usr/bin/env bash
# Build + deploy full Nagarik Watch (admin+API+reader) to Cloudflare Workers.
# Requires Workers script size ≤3 MiB gzip on Free, or Workers Paid.
set -euo pipefail

WIN="/mnt/c/Users/MMT/Documents/side quests/Nagarik Watch"
DEST="${HOME}/nagarik-watch"
export NVM_DIR="${HOME}/.nvm"
[ -s "${NVM_DIR}/nvm.sh" ] && . "${NVM_DIR}/nvm.sh"
nvm use 22 2>/dev/null || true

# Copy wrangler OAuth from Windows if needed
mkdir -p "${HOME}/.config/.wrangler"
WIN_CFG="/mnt/c/Users/MMT/AppData/Roaming/xdg.config/.wrangler"
if [ -d "${WIN_CFG}" ]; then
  cp -a "${WIN_CFG}/." "${HOME}/.config/.wrangler/" 2>/dev/null || true
fi

rsync -a --delete \
  --exclude node_modules --exclude .next --exclude .open-next --exclude .wrangler \
  --exclude out --exclude test-results --exclude .git/objects --exclude '.pages-build-bak' \
  "${WIN}/" "${DEST}/"

# Prefer Windows .dev.vars (secrets) if present
if [ -f "${WIN}/apps/web/.dev.vars" ]; then
  cp -f "${WIN}/apps/web/.dev.vars" "${DEST}/apps/web/.dev.vars"
fi
cp -f "${WIN}/apps/web/wrangler.admin.jsonc" "${DEST}/apps/web/wrangler.admin.jsonc"

cd "${DEST}/apps/web"
pnpm install --frozen-lockfile
export CF_WORKERS=1
pnpm exec opennextjs-cloudflare build

# Extra minify pass on handler if present (helps Free 3 MiB limit)
HANDLER=".open-next/server-functions/default/handler.mjs"
if [ -f "${HANDLER}" ] && command -v npx >/dev/null; then
  echo "Running esbuild minify on handler.mjs..."
  npx --yes esbuild "${HANDLER}" --minify --outfile="${HANDLER}.min" --allow-overwrite --log-level=error || true
  if [ -f "${HANDLER}.min" ]; then
    mv -f "${HANDLER}.min" "${HANDLER}"
  fi
fi

echo "Dry-run size check:"
pnpm exec wrangler deploy --minify --config wrangler.admin.jsonc --dry-run 2>&1 | tee /tmp/nw-cf-dry.txt || true
grep -E "Total Upload|gzip|ERROR|error 10027" /tmp/nw-cf-dry.txt || true

echo "Deploying..."
pnpm exec wrangler deploy --minify --config wrangler.admin.jsonc

echo "DONE — attach custom domain in Dashboard → Workers → nagarik-watch → Custom Domains"
