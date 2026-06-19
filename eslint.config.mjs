// Root ESLint config (flat config, ESLint 9).
// Per-workspace overrides live in each app/package; this is the shared base.
import eslintConfigPrettier from 'eslint-config-prettier'
import js from '@eslint/js'

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
    ],
  },
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
    },
  },
]
