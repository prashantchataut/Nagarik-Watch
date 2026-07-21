#!/usr/bin/env bash
# Canonical WSL/Linux OpenNext build for Nagarik Watch (apps/web → Cloudflare Workers).
# Windows native builds fail on symlink EPERM; run this from WSL:
#   bash scripts/cf-build-wsl.sh
set -euo pipefail

WIN_ROOT="/mnt/c/Users/MMT/Documents/side quests/Nagarik Watch"
WSL_ROOT="${HOME}/nagarik-watch"
NODE_VERSION="22"

install_nvm_and_node() {
  export NVM_DIR="${HOME}/.nvm"
  if [[ ! -s "${NVM_DIR}/nvm.sh" ]]; then
    echo "Installing nvm..."
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  fi
  # shellcheck source=/dev/null
  . "${NVM_DIR}/nvm.sh"
  if ! nvm ls "${NODE_VERSION}" >/dev/null 2>&1; then
    echo "Installing Node ${NODE_VERSION}..."
    nvm install "${NODE_VERSION}"
  fi
  nvm use "${NODE_VERSION}"
}

ensure_pnpm() {
  export PATH="${HOME}/.local/share/pnpm:${PATH}"
  if command -v pnpm >/dev/null 2>&1; then
    pnpm -v
    return
  fi
  if command -v corepack >/dev/null 2>&1; then
    corepack enable
    corepack prepare pnpm@9.15.4 --activate
  else
    npm install -g pnpm@9.15.4
  fi
  pnpm -v
}

install_nvm_and_node
ensure_pnpm

echo "node=$(node -v) pnpm=$(pnpm -v)"

mkdir -p "${WSL_ROOT}"
echo "Syncing sources → ${WSL_ROOT} (excluding node_modules, .open-next, .git, caches)..."
rsync -a --delete \
  --exclude 'node_modules' \
  --exclude '.open-next' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude 'dist' \
  --exclude '.turbo' \
  --exclude '*.log' \
  "${WIN_ROOT}/" "${WSL_ROOT}/"

# Keep wrangler config in sync for deploy from WSL tree
cp -f "${WIN_ROOT}/apps/web/wrangler.jsonc" "${WSL_ROOT}/apps/web/wrangler.jsonc"

cd "${WSL_ROOT}"
pnpm install --frozen-lockfile

cd "${WSL_ROOT}/apps/web"
export CF_WORKERS=1
pnpm exec opennextjs-cloudflare build

echo ""
echo "Build finished under ${WSL_ROOT}/apps/web/.open-next"
echo "Deploy (Workers Free, minified): cd ~/nagarik-watch/apps/web && pnpm deploy:free"
echo "Or: cd ~/nagarik-watch/apps/web && CF_WORKERS=1 pnpm exec wrangler deploy --minify"
