#!/usr/bin/env node
/**
 * Script-reference audit.
 *
 * The Cloudflare deployment failed for hours with a misleading error
 * (`assets.directory ... does not exist`) because a cleanup pass deleted
 * `apps/web`'s npm scripts while every caller — the root `package.json`,
 * `scripts/cf-pages-build.mjs`, `.github/workflows/*` — kept calling them. The
 * call did not fail: `pnpm --filter <pkg> <missing-script>` prints "None of the
 * selected packages has a ... script" and **exits 0**, so CI reported success.
 *
 * This audit walks every script reference we control and asserts the target
 * exists:
 *   - `pnpm --filter <pkg|path> <script>`  → the package must define `<script>`
 *   - `pnpm run <script>`                  → the root package must define it
 *   - `node <path>` / `tsx <path>`         → the file must exist, relative to the
 *                                            package or script that calls it
 *
 * It reads workflows but never writes them, so it also protects the deploy
 * paths an agent cannot edit.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, normalize, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** pnpm verbs that are not workspace script names. */
const PNPM_VERBS = new Set([
  'exec',
  'run',
  'add',
  'install',
  'i',
  'dlx',
  'why',
  'outdated',
  'licenses',
  'list',
  'ls',
  'publish',
  'pack',
  'rebuild',
  'approve-builds',
  'config',
  'root',
  'bin',
  'env',
  'store',
  'patch',
  'patch-commit',
  'patch-remove',
  'dedupe',
  'prune',
  'update',
  'up',
  'remove',
  'rm',
  'unlink',
  'link',
  'import',
  'fetch',
  'deploy',
  'init',
  'create',
  'audit',
])

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

/** Every pnpm workspace package: root + apps/* + packages/*. */
function collectPackages() {
  const dirs = ['.']
  for (const parent of ['apps', 'packages']) {
    const base = join(root, parent)
    if (!existsSync(base)) continue
    for (const name of readdirSync(base)) {
      const dir = join(base, name)
      if (statSync(dir).isDirectory() && existsSync(join(dir, 'package.json'))) {
        dirs.push(`${parent}/${name}`)
      }
    }
  }

  const byName = new Map()
  const byDir = new Map()
  for (const dir of dirs) {
    const manifest = readJson(join(root, dir, 'package.json'))
    const info = { dir, name: manifest.name, scripts: manifest.scripts ?? {} }
    byName.set(info.name, info)
    byDir.set(normalize(dir), info)
    byDir.set(normalize(join(root, dir)), info)
  }
  return { byName, byDir }
}

/** Files whose contents may reference a script or a script file. */
function scanTargets() {
  const files = ['package.json', 'vercel.json']
  for (const dir of ['scripts', 'apps/web/scripts', 'apps/admin/scripts']) {
    const base = join(root, dir)
    if (!existsSync(base)) continue
    for (const name of readdirSync(base)) {
      if (/\.(mjs|cjs|js|ts|sh)$/.test(name)) files.push(`${dir}/${name}`)
    }
  }
  const workflows = join(root, '.github/workflows')
  if (existsSync(workflows)) {
    for (const name of readdirSync(workflows)) {
      if (/\.ya?ml$/.test(name)) files.push(`.github/workflows/${name}`)
    }
  }
  return files.map((p) => join(root, p)).filter(existsSync)
}

function packageScriptValues({ byDir }) {
  const out = []
  for (const info of new Set(byDir.values())) {
    for (const [name, value] of Object.entries(info.scripts)) {
      out.push({
        file: join(root, info.dir, 'package.json'),
        baseDir: join(root, info.dir),
        text: value,
        script: name,
      })
    }
  }
  return out
}

const { byName, byDir } = collectPackages()
const problems = []
let checked = 0

function resolveTarget(target, baseDir) {
  const clean = target.replace(/\.\.\.$/, '')
  if (byName.has(clean)) return byName.get(clean)
  const asPath = clean.startsWith('.') || clean.includes('/')
  if (!asPath) return null
  const absolute = resolve(baseDir, clean)
  return byDir.get(normalize(absolute)) ?? byDir.get(normalize(relative(root, absolute))) ?? null
}

function checkText(text, baseDir, source, label) {
  // A script-file reference (node/tsx + path) is written relative to different
  // bases depending on who writes it: a package script (its own dir), a file
  // under apps/<pkg>/scripts (the package dir), or a workflow / root script (the
  // repo root). Accept any of those rather than guessing one — the audit is a
  // reference check, not a shell-semantics check.
  const packageDir = baseDir.replace(/[\\/]scripts$/, '')
  const bases = [...new Set([baseDir, packageDir, root])]

  // pnpm --filter <target> <script>
  for (const match of text.matchAll(/pnpm\s+--filter\s+(?:--\w+\s+)*(\S+)\s+([\w:.-]+)/g)) {
    const [, target, script] = match
    if (PNPM_VERBS.has(script)) continue
    checked += 1
    const pkg = bases.map((base) => resolveTarget(target, base)).find(Boolean) ?? null
    if (!pkg) {
      problems.push(
        `${source} (${label}): --filter target "${target}" is not a workspace package or path`,
      )
      continue
    }
    if (!(script in pkg.scripts)) {
      problems.push(
        `${source} (${label}): calls \`pnpm --filter ${target} ${script}\` but ${pkg.name} has no "${script}" script`,
      )
    }
  }

  // pnpm run <script> (root-level scripts)
  for (const match of text.matchAll(/pnpm\s+run\s+([\w:.-]+)/g)) {
    const script = match[1]
    checked += 1
    const owner = byDir.get(normalize(baseDir)) ?? byName.get('nagarik-watch')
    if (owner && !(script in owner.scripts)) {
      problems.push(
        `${source} (${label}): calls \`pnpm run ${script}\` but ${owner.name} has no such script`,
      )
    }
  }

  // node <path> / tsx <path> — the script file itself must exist
  for (const match of text.matchAll(
    /\b(?:node|tsx)\s+(\.?\/?[\w@][\w./@-]*\.(?:mjs|cjs|js|ts))\b/g,
  )) {
    const target = match[1]
    if (target.includes('node_modules')) continue
    checked += 1
    if (!bases.some((base) => existsSync(resolve(base, target)))) {
      problems.push(
        `${source} (${label}): runs \`node ${target}\` but no such file under ${relative(root, baseDir) || '.'}, ${relative(root, packageDir) || '.'} or the repo root`,
      )
    }
  }
}

for (const entry of packageScriptValues({ byDir })) {
  checkText(entry.text, entry.baseDir, relative(root, entry.file), `scripts.${entry.script}`)
}

for (const file of scanTargets()) {
  checkText(readFileSync(file, 'utf8'), dirname(file), relative(root, file), 'body')
}

if (problems.length > 0) {
  console.error(
    'Script reference audit failed — these callers point at things that do not exist:\n',
  )
  for (const problem of [...new Set(problems)]) console.error(`  - ${problem}`)
  console.error(
    '\nEither restore the script/file (preferred when a caller still needs it) or delete the caller too.',
  )
  process.exit(1)
}

console.log(
  `Script reference audit passed (${checked} references across ${scanTargets().length} files).`,
)
