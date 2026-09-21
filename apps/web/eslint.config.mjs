// ESLint (flat config) for the web app.
//
// This file previously switched off almost every rule it inherited — including
// `no-unused-vars`, `prefer-const`, `no-unreachable`, `no-fallthrough`,
// `no-explicit-any` and `exhaustive-deps` — which made `pnpm lint` green by
// construction rather than by the code being clean. The suppressions are gone;
// the codebase passes all of them. What stays off is listed with the reason it
// does not fit this project, so the next person can tell a decision from a
// leftover.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // `_name` marks a parameter kept for signature compatibility (stub
      // clients, Kysely callbacks, deliberately-ignored route arguments).
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

      // Server code logs to stdout by design: cron handlers, migration
      // scripts and the build pipeline all report progress that way.
      'no-console': 'off',

      // The codebase leans on `!` after explicit guards (`data.preferences!`
      // right after checking it). Banning it would only trade it for casts.
      '@typescript-eslint/no-non-null-assertion': 'off',

      // House ads and CMS thumbnails come from arbitrary remote hosts that
      // are not in `next.config.ts`'s image allow-list, so `<img>` is correct
      // for those few call sites; everything else already uses `next/image`.
      '@next/next/no-img-element': 'off',

      // Devanagari copy is full of typographic quotes and apostrophes that
      // this rule flags as unescaped entities.
      'react/no-unescaped-entities': 'off',
    },
  },
  {
    // Tests exercise error paths with deliberately malformed values.
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts', '.data/**'],
  },
]

export default eslintConfig
