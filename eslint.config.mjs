// Root ESLint config (flat config, ESLint 9).
// Per-workspace overrides live in each app/package; this is the shared base.
import eslintConfigPrettier from 'eslint-config-prettier'
import js from '@eslint/js'
import globals from 'globals'

export default [
  js.configs.recommended,
  eslintConfigPrettier,
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/playwright-report/**',
      // Project-local agent skills are vendored operational assets, not app source.
      'skills/**',
      '.opencode/**',
      // Payload regenerates these from payload.config.ts; hand-edits are overwritten.
      '**/app/(payload)/admin/importMap.js',
      '**/app/(payload)/admin/importMap.js.map',
    ],
  },
  {
    // Shared language options. Each `.mjs`/`.cjs`/config file below gets the Node
    // globals it needs (process, console, __dirname, etc.) without `no-undef` noise.
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
    },
  },
  // Node scripts and tooling configs run in Node, not the browser.
  // NOTE: deliberately excludes *.json (e.g. .prettierrc.json), which is not JS and would
  // produce a parse error if ESLint tried to lint it.
  {
    files: ['**/*.mjs', '**/*.cjs', 'scripts/**/*', 'postcss.config.*'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
]
