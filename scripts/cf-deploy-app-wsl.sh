#!/usr/bin/env bash
# Deploy Nagarik Watch OpenNext Worker from WSL using Windows-hosted pnpm.cjs
set -euo pipefail

export PATH="/usr/bin:/bin:$HOME/.local/bin"
# Prefer real Linux Node (not the Windows node.exe symlink)
if [ -d "$HOME/.local/node-v22.16.0-linux-x64/bin" ]; then
  export PATH="$HOME/.local/node-v22.16.0-linux-x64/bin:$PATH"
fi

WIN="/mnt/c/Users/MMT/Documents/side quests/Nagarik Watch"
DEST="${HOME}/nagarik-watch"

echo "node=$(command -v node) $(node -v)"
file "$(command -v node)" || true
command -v pnpm >/dev/null || { echo "pnpm missing — run scripts/cf-ensure-wsl-node.sh first"; exit 1; }
pnpm -v

# Copy wrangler OAuth from Windows
mkdir -p "${HOME}/.config/.wrangler"
WIN_CFG="/mnt/c/Users/MMT/AppData/Roaming/xdg.config/.wrangler"
if [ -d "${WIN_CFG}" ]; then
  cp -a "${WIN_CFG}/." "${HOME}/.config/.wrangler/" 2>/dev/null || true
fi

echo "Syncing repo to ${DEST}..."
mkdir -p "${DEST}"
rsync -a --delete \
  --exclude node_modules --exclude .next --exclude .open-next --exclude .wrangler \
  --exclude out --exclude test-results --exclude .git/objects --exclude '.pages-build-bak' \
  "${WIN}/" "${DEST}/"

if [ -f "${WIN}/apps/web/.dev.vars" ]; then
  cp -f "${WIN}/apps/web/.dev.vars" "${DEST}/apps/web/.dev.vars"
fi
cp -f "${WIN}/apps/web/wrangler.admin.jsonc" "${DEST}/apps/web/wrangler.admin.jsonc"

cd "${DEST}"
pnpm install --frozen-lockfile

cd "${DEST}/apps/web"
export CF_WORKERS=1
export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://nagarik-watch.prashantchataut8s-projects.workers.dev}"
export BETTER_AUTH_URL="${BETTER_AUTH_URL:-$NEXT_PUBLIC_SITE_URL}"

echo "Building OpenNext (CF_WORKERS=1)..."
pnpm exec opennextjs-cloudflare build

HANDLER=".open-next/server-functions/default/handler.mjs"
if [ -f "${HANDLER}" ]; then
  echo "Minifying handler.mjs with esbuild..."
  pnpm exec esbuild "${HANDLER}" --minify --outfile="${HANDLER}.min" --allow-overwrite --log-level=error || true
  if [ -f "${HANDLER}.min" ]; then
    mv -f "${HANDLER}.min" "${HANDLER}"
  fi
fi

echo "Dry-run size check..."
pnpm exec wrangler deploy --minify --config wrangler.admin.jsonc --dry-run 2>&1 | tee /tmp/nw-cf-dry.txt || true
grep -E "Total Upload|gzip|ERROR|error 10027|Worker Startup" /tmp/nw-cf-dry.txt || true

echo "Deploying Worker..."
pnpm exec wrangler deploy --minify --config wrangler.admin.jsonc

echo "DONE"
