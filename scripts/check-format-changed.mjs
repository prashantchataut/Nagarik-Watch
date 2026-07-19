import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { check, getFileInfo, resolveConfig } from 'prettier'

function git(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' })
      .split(/\r?\n/)
      .map((value) => value.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

function candidateFiles() {
  const local = new Set([
    ...git(['diff', '--name-only', '--diff-filter=ACMR', 'HEAD']),
    ...git(['diff', '--cached', '--name-only', '--diff-filter=ACMR']),
    ...git(['ls-files', '--others', '--exclude-standard']),
  ])
  if (local.size > 0) return [...local]

  const base = process.env.GITHUB_BASE_REF
    ? `origin/${process.env.GITHUB_BASE_REF}...HEAD`
    : 'HEAD^...HEAD'
  return git(['diff', '--name-only', '--diff-filter=ACMR', base])
}

const unformatted = []
for (const file of candidateFiles()) {
  const info = await getFileInfo(file, { ignorePath: '.prettierignore' })
  if (info.ignored || !info.inferredParser) continue
  const [source, config] = await Promise.all([readFile(file, 'utf8'), resolveConfig(file)])
  if (!(await check(source, { ...config, filepath: file }))) unformatted.push(file)
}

if (unformatted.length > 0) {
  console.error('Changed files need Prettier formatting:')
  for (const file of unformatted) console.error(`- ${file}`)
  process.exit(1)
}

console.log('Changed-file format check passed.')
