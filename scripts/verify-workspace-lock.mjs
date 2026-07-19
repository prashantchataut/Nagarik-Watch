#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd()
const lockPath = join(root, 'pnpm-lock.yaml')
const lockText = readFileSync(lockPath, 'utf8')

function packageDirs() {
  const dirs = [root]
  for (const parent of ['apps', 'packages']) {
    const base = join(root, parent)
    for (const name of readdirSync(base)) {
      const dir = join(base, name)
      if (statSync(dir).isDirectory()) dirs.push(dir)
    }
  }
  return dirs.filter((dir) => {
    try {
      return statSync(join(dir, 'package.json')).isFile()
    } catch {
      return false
    }
  })
}

function parseImporters(text) {
  const lines = text.split(/\r?\n/)
  const importers = new Map()
  let inImporters = false
  let currentImporter = null
  let currentSection = null
  let currentPackage = null

  for (const line of lines) {
    if (line === 'importers:') {
      inImporters = true
      continue
    }
    if (!inImporters) continue
    if (/^[^\s]/.test(line) && line.trim()) break

    const importerMatch = line.match(/^ {2}([^\s][^:]*):(?:\s*\{\})?\s*$/)
    if (importerMatch) {
      currentImporter = importerMatch[1]
      importers.set(currentImporter, {})
      currentSection = null
      currentPackage = null
      continue
    }

    const sectionMatch = line.match(/^ {4}(dependencies|devDependencies|optionalDependencies):\s*$/)
    if (sectionMatch && currentImporter) {
      currentSection = sectionMatch[1]
      currentPackage = null
      continue
    }

    const packageMatch = line.match(/^ {6}('?[^']+?'?):\s*$/)
    if (packageMatch && currentImporter && currentSection) {
      currentPackage = packageMatch[1].replace(/^'|'$/g, '')
      continue
    }

    const specifierMatch = line.match(/^ {8}specifier:\s*(.+)\s*$/)
    if (specifierMatch && currentImporter && currentSection && currentPackage) {
      importers.get(currentImporter)[currentPackage] = specifierMatch[1].replace(/^['"]|['"]$/g, '')
    }
  }

  return importers
}

const importers = parseImporters(lockText)
const expectedImporterKeys = new Set()
const errors = []

for (const dir of packageDirs()) {
  const key = dir === root ? '.' : relative(root, dir).replaceAll('\\', '/')
  expectedImporterKeys.add(key)
  const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  const expected = {
    ...(manifest.dependencies ?? {}),
    ...(manifest.devDependencies ?? {}),
    ...(manifest.optionalDependencies ?? {}),
  }
  const actual = importers.get(key)
  if (!actual) {
    errors.push(`${key}: missing importer in pnpm-lock.yaml`)
    continue
  }

  for (const [name, specifier] of Object.entries(expected)) {
    if (actual[name] !== specifier) {
      errors.push(
        `${key}: ${name} expected ${specifier}, lockfile has ${actual[name] ?? 'nothing'}`,
      )
    }
  }
  for (const name of Object.keys(actual)) {
    if (!(name in expected)) errors.push(`${key}: stale lockfile specifier ${name}`)
  }
}

for (const key of importers.keys()) {
  if (!expectedImporterKeys.has(key)) errors.push(`${key}: stale importer with no package.json`)
}

if (!lockText.includes("lockfileVersion: '9.0'") && !lockText.includes('lockfileVersion: 9.0')) {
  errors.push('pnpm-lock.yaml must use lockfileVersion 9.0 for pnpm 10.x')
}

if (errors.length) {
  console.error('Workspace lockfile is out of sync:')
  for (const error of errors) console.error(`- ${error}`)
  console.error('\nRun exactly: corepack use pnpm@10.17.1 && pnpm install --lockfile-only')
  process.exit(1)
}

console.log(`Workspace lockfile verified for ${expectedImporterKeys.size} package manifests.`)
