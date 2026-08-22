import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, rmSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

const archive = resolve(process.argv[2] ?? '')

if (!archive || !existsSync(archive)) {
  console.error('Usage: node scripts/validate-zip-artifact.mjs <archive.zip>')
  process.exit(1)
}

const bytes = statSync(archive).size
if (bytes < 1024) {
  throw new Error('Archive is suspiciously small')
}

execFileSync('unzip', ['-t', archive], { stdio: 'inherit' })

const hash = createHash('sha256').update(readFileSync(archive)).digest('hex')
const extraction = join(tmpdir(), `nagarik-watch-zip-check-${Date.now()}`)
mkdirSync(extraction, { recursive: true })

try {
  execFileSync('unzip', ['-q', archive, '-d', extraction])
  const listing = execFileSync('find', [extraction, '-type', 'f']).toString().trim()
  if (!listing) throw new Error('Extraction produced no files')

  console.log(
    JSON.stringify(
      {
        archive,
        bytes,
        sha256: hash,
        extractionVerified: true,
        files: listing.split('\n').length,
      },
      null,
      2,
    ),
  )
} finally {
  rmSync(extraction, { recursive: true, force: true })
}
