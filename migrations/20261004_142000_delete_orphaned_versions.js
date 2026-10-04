import { sql } from '@payloadcms/db-postgres'

/**
 * Hand-written data migration (QA C1) — no schema change, so there is no .json snapshot next to it.
 *
 * A row in a versions table whose `parent_id` is NULL belongs to a document that no longer exists.
 * Payload deletes a document's versions together with the document, so these rows only appear when
 * a document was deleted directly in the database: the foreign key is ON DELETE SET NULL, which
 * keeps the version and blanks its parent. Nothing can reach them through a document any more, but
 * the draft view still lists them — as rows without an id in the admin lists, and, before the C1
 * fix, to anonymous callers through `?draft=true`.
 *
 * The child tables (_locales, _rels, array and block tables) reference the version row ON DELETE
 * CASCADE, so one DELETE per versions table removes everything that hangs off it.
 *
 * Not reversible: `down` cannot bring the rows back.
 */
export async function up({ db, payload, req }) {
  await db.execute(sql`
   DELETE FROM "_news_v" WHERE "parent_id" IS NULL;
  DELETE FROM "_events_v" WHERE "parent_id" IS NULL;
  DELETE FROM "_services_v" WHERE "parent_id" IS NULL;
  DELETE FROM "_guide_articles_v" WHERE "parent_id" IS NULL;
  DELETE FROM "_roadmaps_v" WHERE "parent_id" IS NULL;
  DELETE FROM "_experts_v" WHERE "parent_id" IS NULL;
  DELETE FROM "_jobs_v" WHERE "parent_id" IS NULL;
  DELETE FROM "_pages_v" WHERE "parent_id" IS NULL;`)
}

export async function down({ db, payload, req }) {
  // Nothing to undo: the deleted rows had no parent document and cannot be restored.
}
