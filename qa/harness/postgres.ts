import path from 'node:path'
import { rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import EmbeddedPostgres from 'embedded-postgres'
import { QA_DB_PREFIX, QA_PG_PASSWORD, QA_PG_PORT, QA_PG_USER } from './safety'
import { TMP_DIR } from './paths'

// embedded-postgres registers `async-exit-hook`, whose `beforeExit` handler calls process.exit(0).
// Vitest signals failure by setting process.exitCode = 1 and letting the process end, so that
// handler silently turned every failing run into exit code 0. Its `exit` handler can't run the
// async shutdown either ("done is not a function"). Remove both; the SIGINT/SIGTERM cleanup hooks
// stay, and globalSetup teardown stops Postgres explicitly. Same CJS instance embedded-postgres uses.
const asyncExitHook = createRequire(import.meta.url)('async-exit-hook') as { unhookEvent(event: string): void }
asyncExitHook.unhookEvent('beforeExit')
asyncExitHook.unhookEvent('exit')

/** Disposable Postgres: data lives in qa/.tmp/pg and is deleted on stop. */
export async function startPostgres(): Promise<EmbeddedPostgres> {
  const databaseDir = path.join(TMP_DIR, 'pg')
  rmSync(databaseDir, { recursive: true, force: true })
  const pg = new EmbeddedPostgres({
    databaseDir,
    user: QA_PG_USER,
    password: QA_PG_PASSWORD,
    port: QA_PG_PORT,
    persistent: false,
    onLog: () => {},
  })
  await pg.initialise()
  await pg.start()
  return pg
}

export async function createDatabase(pg: EmbeddedPostgres, name: string, template?: string): Promise<void> {
  if (!name.startsWith(QA_DB_PREFIX)) throw new Error(`[qa-safety] db name must start with ${QA_DB_PREFIX}`)
  const client = pg.getPgClient('postgres')
  await client.connect()
  try {
    await client.query(`DROP DATABASE IF EXISTS "${name}"`)
    await client.query(`CREATE DATABASE "${name}"${template ? ` TEMPLATE "${template}"` : ''}`)
  } finally {
    await client.end()
  }
}

export async function stopPostgres(pg: EmbeddedPostgres | undefined): Promise<void> {
  if (!pg) return
  await pg.stop()
  rmSync(path.join(TMP_DIR, 'pg'), { recursive: true, force: true })
}
