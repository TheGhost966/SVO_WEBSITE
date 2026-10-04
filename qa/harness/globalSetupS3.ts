import type EmbeddedPostgres from 'embedded-postgres'
import { startPostgres, stopPostgres } from './postgres'
import { buildTemplateDatabase, verifyTemplateMigrations } from './migrate'
import { snapshotRepoFiles } from './repoFiles'
import { removeHarnessDistDirs } from './app'

export const S3_PORT = 3101

/**
 * Boot-variant suites (S3 PAYLOAD_SECRET, S14 first admin): they only need Postgres + the migrated
 * template; each test file boots its own app variants.
 */
export default async function setup() {
  let pg: EmbeddedPostgres | undefined
  const restoreRepoFiles = snapshotRepoFiles()
  const teardown = async () => {
    await stopPostgres(pg)
    restoreRepoFiles()
    // Includes the production build shared by the production tests (harness/prodBuild.ts).
    removeHarnessDistDirs()
  }
  try {
    // A build left behind by a killed run must not be mistaken for this run's build.
    removeHarnessDistDirs()
    pg = await startPostgres()
    await buildTemplateDatabase(pg, S3_PORT)
    await verifyTemplateMigrations(pg)
  } catch (err) {
    await teardown()
    throw err
  }
  return teardown
}
