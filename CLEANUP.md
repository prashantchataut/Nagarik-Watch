# Repo Declutter — what was removed & what you should delete locally

The repo was carrying a parallel legacy application (old `apps/web/app/`,
Payload CMS `apps/admin`, five workspace packages, ~15 deployment scripts and
99 vendored skill folders). That is what bloated it and what broke the Vercel
install (lockfile drift). The consolidation already removed them **in this
package**. If your local clone still has them, delete with:

```bash
git rm -r apps/admin packages .agents .belt .cursor .opencode \
  .tmp-assessment-b .tmp-chrome e2e skills prompts design-system \
  mini-services docs .github scripts 2>/dev/null

# root files no longer referenced:
git rm turbo.json playwright.config.ts playwright.newsroom.config.ts \
  docker-compose.yml wrangler.jsonc eslint.config.mjs skills-lock.json \
  AGENT.md AGENTS.md MANUAL.md PRODUCT.md SPEC.md ROADMAP.md 2>/dev/null

# legacy leftovers inside apps/web (if present):
git rm -r apps/web/app apps/web/components apps/web/lib apps/web/hooks \
  apps/web/test apps/web/migrations apps/web/scripts/e2e_*.{png,json,txt} \
  apps/web/middleware.ts apps/web/middleware.admin-slim.ts \
  apps/web/next.config.mjs apps/web/sentry.*.ts apps/web/instrumentation*.ts \
  apps/web/open-next.config.ts apps/web/wrangler*.jsonc apps/web/tsconfig.zip \
  apps/web/vitest.config.ts apps/web/bun.lock 2>/dev/null

git add -A && git commit -m "consolidate to single Next.js app; regenerate lockfile"
```

**Safe because:** everything removed lives in git history (`git log --follow`
recovers any file), and the new build does not reference any of it
(`pnpm --filter ./apps/web build` passes from a clean checkout — verified).

Keep: `apps/web`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `vercel.json`,
`package.json`, `README.md`, `LAUNCH-GUIDE.md`, `CLEANUP.md`, `DESIGN.md`,
`CHANGES.md`, `.env.example`, `.gitignore`, `.editorconfig`, `.prettierrc.json`.
