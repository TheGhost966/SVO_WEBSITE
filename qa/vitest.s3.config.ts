import { defineConfig } from 'vitest/config'

/** S3 (PAYLOAD_SECRET) suite — boots app variants with different secrets, so it runs on its own. */
export default defineConfig({
  test: {
    include: ['security/s3-*.test.ts'],
    globalSetup: ['harness/globalSetupS3.ts'],
    fileParallelism: false,
    testTimeout: 600_000,
    hookTimeout: 600_000,
    reporters: ['verbose'],
  },
})
