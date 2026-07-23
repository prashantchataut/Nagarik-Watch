#!/usr/bin/env bash
# Build + deploy Cloudflare Pages static export from WSL (avoids Windows EPERM rename).
set -euo pipefail

export PATH="/usr/bin:/bin:$HOME/.local/bin"
if [ -d "$HOME/.local/node-v22.16.0-linux-x64/bin" ]; then
  export PATH="$HOME/.local/node-v22.16.0-linux-x64/bin:$PATH"
fi

WIN="/mnt/c/Users/MMT/Documents/side quests/Nagarik Watch"
DEST="${HOME}/nagarik-watch"

echo "node=$(command -v node) $(node -v)"
command -v pnpm >/dev/null || { echo "pnpm missing — run scripts/cf-ensure-wsl-node.sh first"; exit 1; }
pnpm -v

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

cd "${DEST}"
pnpm install --frozen-lockfile

export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://nagarik-watch.pages.dev}"
export BETTER_AUTH_URL="${BETTER_AUTH_URL:-$NEXT_PUBLIC_SITE_URL}"
export CONTENT_SOURCE="${CONTENT_SOURCE:-json}"
export NEXT_PUBLIC_LAUNCH_STATUS="${NEXT_PUBLIC_LAUNCH_STATUS:-preview}"

echo "Deploying Pages static (pnpm deploy:web:static)..."
pnpm deploy:web:static

echo "DONE — https://nagarik-watch.pages.dev"
