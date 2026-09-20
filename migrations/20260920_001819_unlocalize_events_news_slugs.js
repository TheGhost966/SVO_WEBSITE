import { sql } from '@payloadcms/db-postgres'

/**
 * Hand-edited after generation — DO NOT regenerate from a fresh diff.
 *
 * Same situation as 20260915_104651_unlocalize_reference_slugs: schema-diffing sees an independent
 * ADD (base-table column) and DROP (per-locale column) and emits no data copy, so the generated
 * version silently discarded every existing slug. This version backfills each new column from the
 * German (`de`) locale row — the project's source locale — before the old column is dropped.
 * The base columns stay nullable: `news` and `events` have `versions.drafts`, so Payload keeps
 * required fields nullable at the DB level (required-ness is enforced at the application layer).
 * The unique indexes are created after the backfill, and a `de`-less row would simply keep NULL
 * (Postgres allows many NULLs in a unique index).
 */
export async function up({ db, payload, req }) {
  await db.execute(sql`
   ALTER TABLE "news" ADD COLUMN "slug" varchar;
  ALTER TABLE "_news_v" ADD COLUMN "version_slug" varchar;
  ALTER TABLE "events" ADD COLUMN "slug" varchar;
  ALTER TABLE "_events_v" ADD COLUMN "version_slug" varchar;

  UPDATE "news" b SET "slug" = l."slug"
    FROM "news_locales" l WHERE l."_parent_id" = b."id" AND l."_locale" = 'de';
  UPDATE "_news_v" b SET "version_slug" = l."version_slug"
    FROM "_news_v_locales" l WHERE l."_parent_id" = b."id" AND l."_locale" = 'de';
  UPDATE "events" b SET "slug" = l."slug"
    FROM "events_locales" l WHERE l."_parent_id" = b."id" AND l."_locale" = 'de';
  UPDATE "_events_v" b SET "version_slug" = l."version_slug"
    FROM "_events_v_locales" l WHERE l."_parent_id" = b."id" AND l."_locale" = 'de';

  CREATE UNIQUE INDEX "news_slug_idx" ON "news" USING btree ("slug");
  CREATE INDEX "_news_v_version_version_slug_idx" ON "_news_v" USING btree ("version_slug");
  CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");
  CREATE INDEX "_events_v_version_version_slug_idx" ON "_events_v" USING btree ("version_slug");
  ALTER TABLE "news_locales" DROP COLUMN "slug";
  ALTER TABLE "_news_v_locales" DROP COLUMN "version_slug";
  ALTER TABLE "events_locales" DROP COLUMN "slug";
  ALTER TABLE "_events_v_locales" DROP COLUMN "version_slug";`)
}

export async function down({ db, payload, req }) {
  await db.execute(sql`
   DROP INDEX "news_slug_idx";
  DROP INDEX "_news_v_version_version_slug_idx";
  DROP INDEX "events_slug_idx";
  DROP INDEX "_events_v_version_version_slug_idx";
  ALTER TABLE "news_locales" ADD COLUMN "slug" varchar;
  ALTER TABLE "_news_v_locales" ADD COLUMN "version_slug" varchar;
  ALTER TABLE "events_locales" ADD COLUMN "slug" varchar;
  ALTER TABLE "_events_v_locales" ADD COLUMN "version_slug" varchar;
  ALTER TABLE "news" DROP COLUMN "slug";
  ALTER TABLE "_news_v" DROP COLUMN "version_slug";
  ALTER TABLE "events" DROP COLUMN "slug";
  ALTER TABLE "_events_v" DROP COLUMN "version_slug";`)
}
