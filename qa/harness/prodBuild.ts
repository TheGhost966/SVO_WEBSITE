import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import { APP_ROOT } from './paths'
import { buildApp, distDirFor, removeDistDir, type AppEnv } from './app'
import { cloneTemplate } from './db'
import { qaDatabaseUri } from './safety'

/** Where the production-startup suites build to (NEXT_DIST_DIR): qa/.tmp/next-prod, never the developer's .next. */
export const PROD_DIST_DIR = distDirFor('prod')
export const PROD_PORT = 3102
const BUILD_DB = 'svo_qa_test_prod_build'

/**
 * Environment for a production process (`next build` / `next start`). `__NEXT_PROCESSED_ENV=true`
 * makes Next skip every .env* file, so "missing" really means missing — .env.local can't fill it in.
 */
export function prodEnv(db: string, secret: string | undefined, extra: AppEnv = {}): AppEnv {
  return {
    NODE_ENV: 'production',
    __NEXT_PROCESSED_ENV: 'true',
    NEXT_DIST_DIR: PROD_DIST_DIR,
    DATABASE_URI: qaDatabaseUri(db),
    PAYLOAD_SECRET: secret,
    ...extra,
  }
}

export function removeProdBuild() {
  removeDistDir(PROD_DIST_DIR)
}

/**
 * One real `next build` per vitest invocation, shared by every file that starts `next start`
 * (globalSetupS3 removes the directory before and after the run, so a build found here was made by
 * this run). The secret used at build time is random and discarded: PAYLOAD_SECRET is read at
 * runtime, which is exactly what the S3 start-up tests rely on.
 */
export async function ensureProdBuild(): Promise<{ reused: boolean; exitCode: number | null }> {
  if (existsSync(path.join(APP_ROOT, PROD_DIST_DIR, 'BUILD_ID'))) return { reused: true, exitCode: 0 }
  await cloneTemplate(BUILD_DB)
  const buildSecret = randomBytes(32).toString('hex')
  const build = await buildApp('prod-build', PROD_PORT, prodEnv(BUILD_DB, buildSecret))
  if (build.code !== 0) {
    throw new Error(`next build failed (${build.code}):\n${build.output.split(buildSecret).join('<build-secret>').slice(-3000)}`)
  }
  if (build.output.includes(buildSecret)) throw new Error('next build printed PAYLOAD_SECRET')
  return { reused: false, exitCode: build.code }
}
