import path from 'node:path'
import { rmSync } from 'node:fs'
import type EmbeddedPostgres from 'embedded-postgres'
import { APP_ROOT } from './paths'
import { startPostgres, stopPostgres } from './postgres'
import { buildTemplateDatabase, verifyTemplateMigrations } from './migrate'
import { snapshotRepoFiles } from './repoFiles'

export const S3_PORT = 3101

/** S3 only needs Postgres + the migrated template; the test file boots its own app variants. */
export default async function setup() {
  let pg: EmbeddedPostgres | undefined
  const restoreRepoFiles = snapshotRepoFiles()
  const teardown = async () => {
    await stopPostgres(pg)
    restoreRepoFiles()
    // Production build made by the S3 production tests (NEXT_DIST_DIR) — never the developer's .next.
    rmSync(path.join(APP_ROOT, '.next', 'qa-prod'), { recursive: true, force: true })
  }
  try {
    pg = await startPostgres()
    await buildTemplateDatabase(pg, S3_PORT)
    await verifyTemplateMigrations(pg)
  } catch (err) {
    await teardown()
    throw err
  }
  return teardown
}
