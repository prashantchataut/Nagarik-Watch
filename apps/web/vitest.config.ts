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
  test: {
    environment: 'node',
  },
})
