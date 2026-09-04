import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      // See test/server-only-shim.ts for why this alias exists.
      'server-only': path.resolve(__dirname, 'test/server-only-shim.ts'),
      '@': path.resolve(__dirname, '.'),
    },
  },
  /*
   * An inline (empty) PostCSS config stops Vite from discovering
   * `postcss.config.mjs`, whose Tailwind v4 string plugin (`"@tailwindcss/postcss"`)
   * Vite's own PostCSS loader rejects with "Invalid PostCSS Plugin found at:
   * plugins[0]" before a single test runs. These are node-environment unit tests
   * over lib/ modules; none of them import or assert on CSS.
   */
  css: {
    postcss: { plugins: [] },
  },
  test: {
    environment: 'node',
  },
})
