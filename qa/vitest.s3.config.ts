import { defineConfig } from 'vitest/config'

/**
 * Boot-variant suites — S3 (PAYLOAD_SECRET), S14 (first admin) and data migrations
 * (`*-migration.test.ts`). They boot app variants with different secrets / boot flags, including one
 * shared production build, so they run on their own.
 */
export default defineConfig({
  test: {
    include: ['security/s3-*.test.ts', 'security/s14-*.test.ts', 'security/prod-*.test.ts', 'security/*-migration.test.ts'],
    globalSetup: ['harness/globalSetupS3.ts'],
    fileParallelism: false,
    testTimeout: 600_000,
    hookTimeout: 600_000,
    reporters: ['verbose'],
  },
})
