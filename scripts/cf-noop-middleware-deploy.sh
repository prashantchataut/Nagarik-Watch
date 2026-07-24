#!/usr/bin/env bash
set -euo pipefail
export PATH="/usr/bin:/bin:$HOME/.local/bin:$PATH"
if [ -d "$HOME/.local/node-v22.16.0-linux-x64/bin" ]; then
  export PATH="$HOME/.local/node-v22.16.0-linux-x64/bin:$PATH"
fi
. "$HOME/.nvm/nvm.sh" 2>/dev/null || true
nvm use 22 2>/dev/null || true

cd "$HOME/nagarik-watch/apps/web"
echo "node=$(command -v node) $(node -v)"
echo "pnpm=$(command -v pnpm) $(pnpm -v)"

# Tiny middleware stub — full edge middleware pushes Free tier over 3 MiB.
mkdir -p .open-next/middleware
cat > .open-next/middleware/handler.mjs <<'EOF'
export async function handler(request, _env, _ctx) {
  return request
}
export default { fetch: handler }
EOF

ls -lh .open-next/middleware/handler.mjs .open-next/server-functions/default/apps/web/handler.mjs

echo "=== dry-run ==="
pnpm exec wrangler deploy --minify --config wrangler.admin.jsonc --dry-run 2>&1 | tee /tmp/nw-noop2-dry.txt | grep -E "Total Upload|gzip|ERROR|10027" || true

echo "=== deploy ==="
set +e
pnpm exec wrangler deploy --minify --config wrangler.admin.jsonc 2>&1 | tee /tmp/nw-noop2-deploy.txt
RC=${PIPESTATUS[0]}
set -e
grep -E "Deployed|workers.dev|Total Upload|gzip|Version ID|10027|ERROR|Current Version" /tmp/nw-noop2-deploy.txt || true
exit "$RC"
