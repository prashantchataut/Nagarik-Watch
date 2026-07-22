#!/usr/bin/env bash
# Wrapper: avoid SSG fetch timeouts to unreachable custom domain during build.
set -euo pipefail
WIN="/mnt/c/Users/MMT/Documents/side quests/Nagarik Watch"
DEST="${HOME}/nagarik-watch"
export NVM_DIR="${HOME}/.nvm"
[ -s "${NVM_DIR}/nvm.sh" ] && . "${NVM_DIR}/nvm.sh"
nvm use 22 2>/dev/null || true

mkdir -p "${HOME}/.config/.wrangler"
WIN_CFG="/mnt/c/Users/MMT/AppData/Roaming/xdg.config/.wrangler"
if [ -d "${WIN_CFG}" ]; then
  cp -a "${WIN_CFG}/." "${HOME}/.config/.wrangler/" 2>/dev/null || true
fi

rsync -a --delete \
  --exclude node_modules --exclude .next --exclude .open-next --exclude .wrangler \
  --exclude out --exclude test-results --exclude .git/objects --exclude '.pages-build-bak' \
  "${WIN}/" "${DEST}/"

if [ -f "${WIN}/apps/web/.dev.vars" ]; then
  cp -f "${WIN}/apps/web/.dev.vars" "${DEST}/apps/web/.dev.vars"
fi
cp -f "${WIN}/apps/web/wrangler.admin.jsonc" "${DEST}/apps/web/wrangler.admin.jsonc"

# Unreachable custom domain in .env.local causes SSG ETIMEDOUT — neutralize for build.
if [ -f "${DEST}/apps/web/.env.local" ]; then
  sed -i '/^NEXT_PUBLIC_SITE_URL=/d;/^BETTER_AUTH_URL=/d' "${DEST}/apps/web/.env.local" || true
fi
export NEXT_PUBLIC_SITE_URL="http://127.0.0.1:3000"
export BETTER_AUTH_URL="http://127.0.0.1:3000"

# Raise static generation timeout in the WSL tree only
python3 - <<'PY'
from pathlib import Path
p = Path.home() / "nagarik-watch/apps/web/next.config.ts"
t = p.read_text(encoding="utf-8")
needle = "const nextConfig: NextConfig = {"
insert = "const nextConfig: NextConfig = {\n  staticPageGenerationTimeout: 300,\n"
if "staticPageGenerationTimeout" not in t and needle in t:
    p.write_text(t.replace(needle, insert, 1), encoding="utf-8")
    print("patched_staticPageGenerationTimeout=yes")
else:
    print("patched_staticPageGenerationTimeout=no")
PY

cd "${DEST}/apps/web"
pnpm install --frozen-lockfile
export CF_WORKERS=1
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}"
pnpm exec opennextjs-cloudflare build

HANDLER=".open-next/server-functions/default/handler.mjs"
if [ -f "${HANDLER}" ] && command -v npx >/dev/null; then
  echo "Running esbuild minify on handler.mjs..."
  npx --yes esbuild "${HANDLER}" --minify --outfile="${HANDLER}.min" --allow-overwrite --log-level=error || true
  if [ -f "${HANDLER}.min" ]; then
    mv -f "${HANDLER}.min" "${HANDLER}"
  fi
fi

LOG="/mnt/c/Users/MMT/Documents/side quests/Nagarik Watch/apps/web/.cf-deploy.log"
{
  echo "Dry-run size check:"
  pnpm exec wrangler deploy --minify --config wrangler.admin.jsonc --dry-run 2>&1 || true
} | tee /tmp/nw-cf-dry.txt | tee -a "$LOG"
grep -E "Total Upload|gzip|ERROR|error 10027" /tmp/nw-cf-dry.txt || true

echo "Deploying..."
set +e
pnpm exec wrangler deploy --minify --config wrangler.admin.jsonc 2>&1 | tee /tmp/nw-cf-deploy-out.txt
RC=${PIPESTATUS[0]}
set -e
if [ "$RC" -ne 0 ] && grep -q "10027" /tmp/nw-cf-deploy-out.txt; then
  echo "Size error 10027 — retrying esbuild minify once..."
  if [ -f "${HANDLER}" ]; then
    npx --yes esbuild "${HANDLER}" --minify --outfile="${HANDLER}.min" --allow-overwrite --log-level=error || true
    [ -f "${HANDLER}.min" ] && mv -f "${HANDLER}.min" "${HANDLER}"
  fi
  pnpm exec wrangler deploy --minify --config wrangler.admin.jsonc 2>&1 | tee /tmp/nw-cf-deploy-out.txt
  RC=${PIPESTATUS[0]}
fi
cat /tmp/nw-cf-deploy-out.txt >> "$LOG" || true
grep -E "Deployed|workers.dev|Total Upload|gzip|Version ID|error" /tmp/nw-cf-deploy-out.txt || true
exit "$RC"
