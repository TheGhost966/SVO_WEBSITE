import path from 'node:path'
import { readdirSync } from 'node:fs'
import type EmbeddedPostgres from 'embedded-postgres'
import { APP_ROOT } from './paths'
import { startApp } from './app'
import { createDatabase } from './postgres'
import { qaDatabaseUri } from './safety'

export const TEMPLATE_DB = 'svo_qa_template'

/**
 * Builds the schema the only way this project supports: booting the app once with
 * PAYLOAD_MIGRATE_ON_BOOT=1 (src/instrumentation.node.ts — the payload CLI can't load the config).
 * The result is a template database every suite clones from, so
 * each suite starts from a freshly migrated, empty schema. This doubles as a check that all
 * committed + untracked migrations apply cleanly to an empty database.
 */
export async function buildTemplateDatabase(pg: EmbeddedPostgres, port: number): Promise<string> {
  await createDatabase(pg, TEMPLATE_DB)
  const app = await startApp({
    name: 'migrate-template',
    port,
    env: { DATABASE_URI: qaDatabaseUri(TEMPLATE_DB), PAYLOAD_MIGRATE_ON_BOOT: '1' },
    waitForLog: /\[migrate\] applied pending migrations/,
    failOnLog: /\[migrate\] failed/,
  })
  const output = app.output()
  await app.stop()
  return output
}

/** Applied migrations (from payload_migrations) vs. migration files on disk. Throws on mismatch. */
export async function verifyTemplateMigrations(pg: EmbeddedPostgres) {
  const onDisk = readdirSync(path.join(APP_ROOT, 'migrations'))
    .filter((f) => f.endsWith('.js'))
    .map((f) => f.replace(/\.js$/, ''))
    .sort()
  const client = pg.getPgClient(TEMPLATE_DB)
  await client.connect()
  try {
    const { rows } = await client.query<{ name: string; batch: number }>('SELECT name, batch FROM payload_migrations ORDER BY name')
    const applied = rows.filter((r) => r.batch > 0).map((r) => r.name).sort()
    const missing = onDisk.filter((m) => !applied.includes(m))
    if (missing.length) throw new Error(`[qa] migrations not applied to template: ${missing.join(', ')}`)
    return { onDisk, applied: rows }
  } finally {
    await client.end()
  }
}
