import { sql } from '@payloadcms/db-postgres'

/**
 * Hand-edited after generation — DO NOT regenerate this file from a fresh diff.
 *
 * `payload.db.createMigration()` produced `ADD COLUMN "slug" varchar NOT NULL` for
 * service_pillars/guide_topics directly (which fails on Postgres against their existing 1-row
 * tables with no default), and left the new column NULL forever for guide_articles/roadmaps/
 * services (violating this project's `required: true` on those fields) — in both cases because
 * schema-diffing doesn't know "slug moved from a per-locale side table to the base table" is a
 * single semantic change; it just sees an independent ADD and DROP. This version adds each new
 * column nullable, backfills it from the existing German (`de`) locale row — the only locale this
 * project's content has ever had filled in — then sets NOT NULL only where the field actually requires it.
 *
 * NOT NULL only applies to `service_pillars`/`guide_topics` — confirmed against this migration's
 * own generated .json snapshot (the source of truth for the target schema, derived straight from
 * `generateDrizzleJson(config)`): `services`/`guide_articles`/`roadmaps` all have `versions.drafts`
 * enabled, and Payload deliberately keeps `required: true` fields nullable at the base-table level
 * for draft-capable collections (a draft can be incomplete) — required-ness is enforced at the
 * application layer on publish, not as a DB constraint, for those three.
 */
export async function up({ db, payload, req }) {
  await db.execute(sql`
    ALTER TABLE "services" ADD COLUMN "slug" varchar;
    ALTER TABLE "_services_v" ADD COLUMN "version_slug" varchar;
    ALTER TABLE "service_pillars" ADD COLUMN "slug" varchar;
    ALTER TABLE "guide_topics" ADD COLUMN "slug" varchar;
    ALTER TABLE "guide_articles" ADD COLUMN "slug" varchar;
    ALTER TABLE "_guide_articles_v" ADD COLUMN "version_slug" varchar;
    ALTER TABLE "roadmaps" ADD COLUMN "slug" varchar;
    ALTER TABLE "_roadmaps_v" ADD COLUMN "version_slug" varchar;

    UPDATE "services" b SET "slug" = l."slug"
      FROM "services_locales" l WHERE l."_parent_id" = b."id" AND l."_locale" = 'de';
    UPDATE "_services_v" b SET "version_slug" = l."version_slug"
      FROM "_services_v_locales" l WHERE l."_parent_id" = b."id" AND l."_locale" = 'de';
    UPDATE "service_pillars" b SET "slug" = l."slug"
      FROM "service_pillars_locales" l WHERE l."_parent_id" = b."id" AND l."_locale" = 'de';
    UPDATE "guide_topics" b SET "slug" = l."slug"
      FROM "guide_topics_locales" l WHERE l."_parent_id" = b."id" AND l."_locale" = 'de';
    UPDATE "guide_articles" b SET "slug" = l."slug"
      FROM "guide_articles_locales" l WHERE l."_parent_id" = b."id" AND l."_locale" = 'de';
    UPDATE "_guide_articles_v" b SET "version_slug" = l."version_slug"
      FROM "_guide_articles_v_locales" l WHERE l."_parent_id" = b."id" AND l."_locale" = 'de';
    UPDATE "roadmaps" b SET "slug" = l."slug"
      FROM "roadmaps_locales" l WHERE l."_parent_id" = b."id" AND l."_locale" = 'de';
    UPDATE "_roadmaps_v" b SET "version_slug" = l."version_slug"
      FROM "_roadmaps_v_locales" l WHERE l."_parent_id" = b."id" AND l."_locale" = 'de';

    ALTER TABLE "service_pillars" ALTER COLUMN "slug" SET NOT NULL;
    ALTER TABLE "guide_topics" ALTER COLUMN "slug" SET NOT NULL;

    CREATE UNIQUE INDEX "services_slug_idx" ON "services" USING btree ("slug");
    CREATE INDEX "_services_v_version_version_slug_idx" ON "_services_v" USING btree ("version_slug");
    CREATE UNIQUE INDEX "service_pillars_slug_idx" ON "service_pillars" USING btree ("slug");
    CREATE UNIQUE INDEX "guide_topics_slug_idx" ON "guide_topics" USING btree ("slug");
    CREATE UNIQUE INDEX "guide_articles_slug_idx" ON "guide_articles" USING btree ("slug");
    CREATE INDEX "_guide_articles_v_version_version_slug_idx" ON "_guide_articles_v" USING btree ("version_slug");
    CREATE UNIQUE INDEX "roadmaps_slug_idx" ON "roadmaps" USING btree ("slug");
    CREATE INDEX "_roadmaps_v_version_version_slug_idx" ON "_roadmaps_v" USING btree ("version_slug");

    ALTER TABLE "services_locales" DROP COLUMN "slug";
    ALTER TABLE "_services_v_locales" DROP COLUMN "version_slug";
    ALTER TABLE "service_pillars_locales" DROP COLUMN "slug";
    ALTER TABLE "guide_topics_locales" DROP COLUMN "slug";
    ALTER TABLE "guide_articles_locales" DROP COLUMN "slug";
    ALTER TABLE "_guide_articles_v_locales" DROP COLUMN "version_slug";
    ALTER TABLE "roadmaps_locales" DROP COLUMN "slug";
    ALTER TABLE "_roadmaps_v_locales" DROP COLUMN "version_slug";
  `)
}

export async function down({ db, payload, req }) {
  await db.execute(sql`
    ALTER TABLE "services_locales" ADD COLUMN "slug" varchar;
    ALTER TABLE "_services_v_locales" ADD COLUMN "version_slug" varchar;
    ALTER TABLE "service_pillars_locales" ADD COLUMN "slug" varchar;
    ALTER TABLE "guide_topics_locales" ADD COLUMN "slug" varchar;
    ALTER TABLE "guide_articles_locales" ADD COLUMN "slug" varchar;
    ALTER TABLE "_guide_articles_v_locales" ADD COLUMN "version_slug" varchar;
    ALTER TABLE "roadmaps_locales" ADD COLUMN "slug" varchar;
    ALTER TABLE "_roadmaps_v_locales" ADD COLUMN "version_slug" varchar;

    UPDATE "services_locales" l SET "slug" = b."slug"
      FROM "services" b WHERE l."_parent_id" = b."id" AND l."_locale" = 'de';
    UPDATE "_services_v_locales" l SET "version_slug" = b."version_slug"
      FROM "_services_v" b WHERE l."_parent_id" = b."id" AND l."_locale" = 'de';
    UPDATE "service_pillars_locales" l SET "slug" = b."slug"
      FROM "service_pillars" b WHERE l."_parent_id" = b."id" AND l."_locale" = 'de';
    UPDATE "guide_topics_locales" l SET "slug" = b."slug"
      FROM "guide_topics" b WHERE l."_parent_id" = b."id" AND l."_locale" = 'de';
    UPDATE "guide_articles_locales" l SET "slug" = b."slug"
      FROM "guide_articles" b WHERE l."_parent_id" = b."id" AND l."_locale" = 'de';
    UPDATE "_guide_articles_v_locales" l SET "version_slug" = b."version_slug"
      FROM "_guide_articles_v" b WHERE l."_parent_id" = b."id" AND l."_locale" = 'de';
    UPDATE "roadmaps_locales" l SET "slug" = b."slug"
      FROM "roadmaps" b WHERE l."_parent_id" = b."id" AND l."_locale" = 'de';
    UPDATE "_roadmaps_v_locales" l SET "version_slug" = b."version_slug"
      FROM "_roadmaps_v" b WHERE l."_parent_id" = b."id" AND l."_locale" = 'de';

    ALTER TABLE "service_pillars_locales" ALTER COLUMN "slug" SET NOT NULL;
    ALTER TABLE "guide_topics_locales" ALTER COLUMN "slug" SET NOT NULL;

    DROP INDEX "services_slug_idx";
    DROP INDEX "_services_v_version_version_slug_idx";
    DROP INDEX "service_pillars_slug_idx";
    DROP INDEX "guide_topics_slug_idx";
    DROP INDEX "guide_articles_slug_idx";
    DROP INDEX "_guide_articles_v_version_version_slug_idx";
    DROP INDEX "roadmaps_slug_idx";
    DROP INDEX "_roadmaps_v_version_version_slug_idx";

    ALTER TABLE "services" DROP COLUMN "slug";
    ALTER TABLE "_services_v" DROP COLUMN "version_slug";
    ALTER TABLE "service_pillars" DROP COLUMN "slug";
    ALTER TABLE "guide_topics" DROP COLUMN "slug";
    ALTER TABLE "guide_articles" DROP COLUMN "slug";
    ALTER TABLE "_guide_articles_v" DROP COLUMN "version_slug";
    ALTER TABLE "roadmaps" DROP COLUMN "slug";
    ALTER TABLE "_roadmaps_v" DROP COLUMN "version_slug";
  `)
}
