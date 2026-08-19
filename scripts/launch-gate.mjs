import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const cli = path.join(root, 'apps/web/lib/launch-gate-cli.ts')
const tsxPath = [
  path.join(root, 'node_modules/tsx/dist/cli.mjs'),
  path.join(root, 'apps/web/node_modules/tsx/dist/cli.mjs'),
].find((candidate) => existsSync(candidate))

if (!tsxPath) {
  console.error('tsx is required to run launch:gate. Run pnpm install from the repo root.')
  process.exit(1)
}

const result = spawnSync(process.execPath, [tsxPath, cli], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
})

if (result.error) {
  console.error(result.error)
  process.exit(1)
}

process.exit(result.status ?? 1)
