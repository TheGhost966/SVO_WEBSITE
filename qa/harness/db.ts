import pg from 'pg'
import { QA_DB_PREFIX, QA_PG_PASSWORD, QA_PG_PORT, QA_PG_USER } from './safety'
import { TEMPLATE_DB } from './migrate'

/** Run one statement against a QA database (refuses non-QA names). */
export async function queryQaDb(dbName: string, sql: string, params: unknown[] = []) {
  if (!dbName.startsWith(QA_DB_PREFIX)) throw new Error(`[qa-safety] db name must start with ${QA_DB_PREFIX}`)
  const client = new pg.Client({ host: '127.0.0.1', port: QA_PG_PORT, user: QA_PG_USER, password: QA_PG_PASSWORD, database: dbName })
  await client.connect()
  try {
    return await client.query(sql, params)
  } finally {
    await client.end()
  }
}

/** Clone the migrated template from inside a test worker (the EmbeddedPostgres handle lives in globalSetup). */
export async function cloneTemplate(name: string): Promise<void> {
  if (!name.startsWith(QA_DB_PREFIX)) throw new Error(`[qa-safety] db name must start with ${QA_DB_PREFIX}`)
  const client = new pg.Client({ host: '127.0.0.1', port: QA_PG_PORT, user: QA_PG_USER, password: QA_PG_PASSWORD, database: 'postgres' })
  await client.connect()
  try {
    await client.query(`DROP DATABASE IF EXISTS "${name}"`)
    await client.query(`CREATE DATABASE "${name}" TEMPLATE "${TEMPLATE_DB}"`)
  } finally {
    await client.end()
  }
}
