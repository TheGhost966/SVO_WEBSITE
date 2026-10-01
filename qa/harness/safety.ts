/**
 * Hard guard: every database URI the QA harness hands to the app must point at the disposable
 * embedded Postgres started by this harness. Anything else (Neon, a remote host, a database not
 * named `svo_qa_*`) aborts the run before the app process is spawned.
 */
export const QA_PG_PORT = 54329
export const QA_PG_USER = 'qa'
export const QA_PG_PASSWORD = 'qa'
export const QA_DB_PREFIX = 'svo_qa_'

export function qaDatabaseUri(dbName: string): string {
  return `postgres://${QA_PG_USER}:${QA_PG_PASSWORD}@127.0.0.1:${QA_PG_PORT}/${dbName}`
}

export function assertSafeDatabaseUri(uri: string | undefined): void {
  if (!uri) throw new Error('[qa-safety] DATABASE_URI is empty')
  const u = new URL(uri)
  const db = u.pathname.replace(/^\//, '')
  const problems: string[] = []
  if (!['127.0.0.1', 'localhost'].includes(u.hostname)) problems.push(`host ${u.hostname} is not local`)
  if (Number(u.port) !== QA_PG_PORT) problems.push(`port ${u.port} is not the QA port ${QA_PG_PORT}`)
  if (!db.startsWith(QA_DB_PREFIX)) problems.push(`database "${db}" does not start with ${QA_DB_PREFIX}`)
  if (problems.length) {
    throw new Error(`[qa-safety] refusing to run against ${u.hostname}:${u.port}/${db}: ${problems.join('; ')}`)
  }
}
