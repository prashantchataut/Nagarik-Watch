#!/usr/bin/env bash
set -euo pipefail
export PATH="/usr/bin:/bin:$HOME/.local/bin"

NODE_VERSION="22.16.0"
NODE_DIR="$HOME/.local/node-v${NODE_VERSION}-linux-x64"
NODE_TGZ="/tmp/node-v${NODE_VERSION}-linux-x64.tar.xz"

if [ ! -x "$NODE_DIR/bin/node" ]; then
  echo "Downloading Node ${NODE_VERSION} linux-x64..."
  curl -fsSL --retry 5 -o "$NODE_TGZ" \
    "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz"
  mkdir -p "$HOME/.local"
  tar -xJf "$NODE_TGZ" -C "$HOME/.local"
fi

ln -sfn "$NODE_DIR/bin/node" "$HOME/.local/bin/node"
ln -sfn "$NODE_DIR/bin/npm" "$HOME/.local/bin/npm"
ln -sfn "$NODE_DIR/bin/npx" "$HOME/.local/bin/npx"
export PATH="$NODE_DIR/bin:$HOME/.local/bin:/usr/bin:/bin"

echo "node=$(command -v node) $(node -v)"
file "$(command -v node)"

# Install pnpm via corepack from real Linux node
corepack enable
corepack prepare pnpm@10.17.1 --activate
echo "pnpm=$(command -v pnpm) $(pnpm -v)"
