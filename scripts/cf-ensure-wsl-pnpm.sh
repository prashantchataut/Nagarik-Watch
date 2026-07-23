#!/usr/bin/env bash
set -euo pipefail
export PATH="/usr/bin:/bin:$HOME/.local/bin"
mkdir -p "$HOME/.local/bin"
if [ ! -x "$HOME/.local/bin/pnpm" ]; then
  echo "Downloading pnpm..."
  curl -fsSL --retry 5 -o "$HOME/.local/bin/pnpm" \
    "https://github.com/pnpm/pnpm/releases/download/v10.17.1/pnpm-linuxstatic-x64"
  chmod +x "$HOME/.local/bin/pnpm"
fi
"$HOME/.local/bin/pnpm" -v
echo "pnpm ready at $HOME/.local/bin/pnpm"
