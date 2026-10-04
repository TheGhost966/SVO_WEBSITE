/**
 * C1 — the data migration that removes orphaned versions
 * (migrations/20261004_142000_delete_orphaned_versions.js).
 *
 * It deletes rows, and it will run against the real database the next time migrations are applied,
 * so it is tested the way it will run: a database where that migration is still pending is booted
 * once with PAYLOAD_MIGRATE_ON_BOOT=1. Before the boot every versions table holds one orphan
 * (`parent_id IS NULL`, as left behind by a direct `DELETE` of the document) and one version that
 * still has its document. After it, exactly the orphans — and the rows hanging off them — are gone.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startApp } from '../harness/app'
import { cloneTemplate, queryQaDb } from '../harness/db'
import { qaDatabaseUri } from '../harness/safety'
import { REVIEWED_COLLECTIONS } from '../harness/seed'
import { writeEvidence } from '../harness/evidence'
import { S3_PORT } from '../harness/globalSetupS3'

const DB = 'svo_qa_test_c1_migration'
const MIGRATION = '20261004_142000_delete_orphaned_versions'
const table = (c: string) => c.replace(/-/g, '_')

type Rows = { orphan: number; orphanLocale: number; kept: number; keptLocale: number; parent: number }
const rows = {} as Record<string, Rows>
const evidence: Record<string, unknown> = {}

const one = async (sql: string, params: unknown[] = []) => (await queryQaDb(DB, sql, params)).rows[0].id as number
const exists = async (t: string, id: number) => ((await queryQaDb(DB, `SELECT 1 FROM "${t}" WHERE id = $1`, [id])).rowCount ?? 0) > 0
const applied = async () => ((await queryQaDb(DB, 'SELECT 1 FROM payload_migrations WHERE name = $1', [MIGRATION])).rowCount ?? 0) > 0

describe('C1 — delete_orphaned_versions migration', () => {
  beforeAll(async () => {
    await cloneTemplate(DB)
    for (const collection of REVIEWED_COLLECTIONS) {
      const t = table(collection)
      const parent = await one(`INSERT INTO "${t}" DEFAULT VALUES RETURNING id`)
      const kept = await one(`INSERT INTO "_${t}_v" (parent_id, latest) VALUES ($1, true) RETURNING id`, [parent])
      const keptLocale = await one(`INSERT INTO "_${t}_v_locales" (_locale, _parent_id) VALUES ('de', $1) RETURNING id`, [kept])
      // The orphan is made the way it happens for real: a version of a document that is then
      // deleted directly in the database (the foreign key is ON DELETE SET NULL).
      const doomed = await one(`INSERT INTO "${t}" DEFAULT VALUES RETURNING id`)
      const orphan = await one(`INSERT INTO "_${t}_v" (parent_id, latest) VALUES ($1, true) RETURNING id`, [doomed])
      const orphanLocale = await one(`INSERT INTO "_${t}_v_locales" (_locale, _parent_id) VALUES ('de', $1) RETURNING id`, [orphan])
      await queryQaDb(DB, `DELETE FROM "${t}" WHERE id = $1`, [doomed])
      rows[collection] = { orphan, orphanLocale, kept, keptLocale, parent }
    }
    // The template has every migration applied; make this one pending again.
    await queryQaDb(DB, 'DELETE FROM payload_migrations WHERE name = $1', [MIGRATION])
  })

  afterAll(() => {
    writeEvidence('c1-orphan-versions-migration', evidence)
  })

  it('precondition: the migration is pending and every versions table holds an orphan with parent_id NULL', async () => {
    expect(await applied()).toBe(false)
    for (const collection of REVIEWED_COLLECTIONS) {
      const t = table(collection)
      const orphan = await queryQaDb(DB, `SELECT parent_id FROM "_${t}_v" WHERE id = $1`, [rows[collection].orphan])
      expect(orphan.rows[0], `${collection}: orphan row`).toEqual({ parent_id: null })
      expect(await exists(`_${t}_v_locales`, rows[collection].orphanLocale), `${collection}: orphan's locale row`).toBe(true)
    }
  })

  it('applying it on boot deletes the orphans and what hangs off them — and nothing else', async () => {
    const app = await startApp({
      name: 'c1-migration',
      port: S3_PORT,
      env: { DATABASE_URI: qaDatabaseUri(DB), PAYLOAD_MIGRATE_ON_BOOT: '1' },
      waitForLog: /\[migrate\] applied pending migrations/,
      failOnLog: /\[migrate\] failed/,
    })
    evidence.migrateLines = app.output().split('\n').filter((l) => /\[migrate\]|Migrat/.test(l))
    await app.stop()

    expect(await applied(), 'recorded in payload_migrations').toBe(true)
    for (const collection of REVIEWED_COLLECTIONS) {
      const t = table(collection)
      const r = rows[collection]
      const state = {
        orphan: await exists(`_${t}_v`, r.orphan),
        orphanLocale: await exists(`_${t}_v_locales`, r.orphanLocale),
        kept: await exists(`_${t}_v`, r.kept),
        keptLocale: await exists(`_${t}_v_locales`, r.keptLocale),
        parent: await exists(t, r.parent),
        orphansLeft: (await queryQaDb(DB, `SELECT count(*)::int AS n FROM "_${t}_v" WHERE parent_id IS NULL`)).rows[0].n as number,
      }
      evidence[collection] = state
      expect(state, collection).toEqual({ orphan: false, orphanLocale: false, kept: true, keptLocale: true, parent: true, orphansLeft: 0 })
    }
  })
})
