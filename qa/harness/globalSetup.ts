import path from 'node:path'
import { readdirSync, rmSync } from 'node:fs'
import type { TestProject } from 'vitest/node'
import type EmbeddedPostgres from 'embedded-postgres'
import { startPostgres, stopPostgres, createDatabase } from './postgres'
import { buildTemplateDatabase, verifyTemplateMigrations, TEMPLATE_DB } from './migrate'
import { startApp, type RunningApp } from './app'
import { qaDatabaseUri } from './safety'
import { Api } from './api'
import { seed, type Fixtures } from './seed'
import { writeEvidence } from './evidence'
import { APP_ROOT } from './paths'
import { snapshotRepoFiles } from './repoFiles'
import { startSmtpSink, SMTP_SINK_PORT } from './smtpSink'
import type { Server } from 'node:net'

declare module 'vitest' {
  export interface ProvidedContext {
    fixtures: Fixtures
  }
}

export const P0_PORT = 3100
const P0_DB = 'svo_qa_test_p0'

/** Removes only files this harness uploaded (name prefix `qa-test-media`) from public/media. */
export function cleanupQaMedia() {
  const dir = path.join(APP_ROOT, 'public', 'media')
  try {
    for (const f of readdirSync(dir)) if (f.startsWith('qa-test-media')) rmSync(path.join(dir, f), { force: true })
  } catch {
    // directory absent — nothing uploaded
  }
}

export default async function setup(project: TestProject) {
  let pg: EmbeddedPostgres | undefined
  let app: RunningApp | undefined
  let smtp: Server | undefined
  const restoreRepoFiles = snapshotRepoFiles()
  const teardown = async () => {
    await app?.stop()
    await new Promise((r) => (smtp ? smtp.close(r) : r(undefined)))
    await stopPostgres(pg)
    cleanupQaMedia()
    restoreRepoFiles()
  }
  try {
    pg = await startPostgres()
    const migrateLog = await buildTemplateDatabase(pg, P0_PORT)
    const migrations = await verifyTemplateMigrations(pg)
    writeEvidence('migrate-template', {
      migrateLines: migrateLog.split('\n').filter((l) => l.includes('[migrate]')),
      ...migrations,
    })
    await createDatabase(pg, P0_DB, TEMPLATE_DB)
    // Local SMTP sink (127.0.0.1 only) so tests can assert notification recipients; nothing is delivered.
    smtp = await startSmtpSink()
    app = await startApp({
      name: 'p0-app',
      port: P0_PORT,
      env: { DATABASE_URI: qaDatabaseUri(P0_DB), SMTP_HOST: '127.0.0.1', SMTP_PORT: String(SMTP_SINK_PORT) },
    })
    const fixtures = await seed(new Api(app.baseUrl))
    writeEvidence('p0-fixtures', { ...fixtures, tokens: '<redacted>' })
    project.provide('fixtures', fixtures)
  } catch (err) {
    await teardown()
    throw err
  }
  return teardown
}
