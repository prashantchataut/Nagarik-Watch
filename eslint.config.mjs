// Root ESLint config (flat config, ESLint 9).
//
// Scope: everything except `apps/web` and `apps/admin`, which have their own
// flat configs and their own `lint` scripts (`turbo run lint`, chained from the
// root `lint` script, runs those). Until now this file only ever linted plain
// JavaScript, so the TypeScript in `packages/*` was never checked by anything —
// `eslint .` silently skipped it and `pnpm lint` still exited 0.
import eslintConfigPrettier from 'eslint-config-prettier'
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/** Workspaces that own their ESLint setup; linted through `turbo run lint`. */
const DELEGATED_WORKSPACES = ['apps/web/**', 'apps/admin/**']

export default [
  js.configs.recommended,
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/out/**',
      '**/dist/**',
      '**/build/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/.open-next/**',
      '.tmp-*/**',
      '**/playwright-report/**',
      'skills/**',
      '.cursor/**',
      '.agents/**',
      '**/.agents/**',
      // Payload regenerates these from payload.config.ts; hand-edits are overwritten.
      '**/app/(payload)/admin/importMap.js',
      '**/app/(payload)/admin/importMap.js.map',
      ...DELEGATED_WORKSPACES,
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
  // `scripts/audit-live-ux.mjs` is a Node driver whose `PROBE` function is
  // serialised into the page and evaluated in the browser, so the file legitimately
  // touches both global sets. Scoped here rather than loosening the rule above.
  {
    files: ['scripts/audit-live-ux.mjs'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
  // TypeScript in the shared packages: syntax-aware linting without type
  // information, so it stays fast and needs no build step.
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
  })),
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      // `_name` marks a parameter kept for signature compatibility.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      // Payload and Kysely generics surface plenty of unavoidable `any`s at the
      // boundaries; the rest of the rules still apply.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  // Must stay last: turns off the stylistic rules Prettier owns.
  eslintConfigPrettier,
]
