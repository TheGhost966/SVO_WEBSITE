import path from 'node:path'
import { defineConfig } from 'vitest/config'

/**
 * Checks that need no server and no database — they import the collection configs directly.
 * `npm run test:unit` (a few seconds).
 */
export default defineConfig({
  resolve: {
    alias: {
      '@payload-config': path.resolve(__dirname, '../src/payload.config.ts'),
      '@': path.resolve(__dirname, '../src'),
    },
  },
  test: {
    include: ['unit/**/*.test.ts'],
    reporters: ['verbose'],
  },
})
