import { defineConfig } from 'vitest/config'

/**
 * P0 security suite: one disposable Postgres + one `next dev` (NODE_ENV=test) on :3100, seeded over
 * REST in globalSetup. Files run sequentially against that shared server. S3 boots servers with
 * different secrets, so it lives in vitest.s3.config.ts and runs in its own invocation.
 */
export default defineConfig({
  test: {
    include: ['security/**/*.test.ts'],
    exclude: ['security/s3-*.test.ts', 'security/s14-*.test.ts', 'security/prod-*.test.ts', 'security/*-migration.test.ts'],
    globalSetup: ['harness/globalSetup.ts'],
    fileParallelism: false,
    testTimeout: 180_000,
    hookTimeout: 600_000,
    reporters: ['verbose'],
  },
})
