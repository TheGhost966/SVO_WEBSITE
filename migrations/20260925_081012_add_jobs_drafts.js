import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }) {
  await db.execute(sql`
   CREATE TYPE "public"."enum_jobs_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__jobs_v_version_bundesland" AS ENUM('W', 'NOE', 'OOE', 'SBG', 'T', 'VBG', 'STMK', 'KTN', 'BGLD');
  CREATE TYPE "public"."enum__jobs_v_version_employment_type" AS ENUM('full_time', 'part_time', 'apprenticeship', 'internship', 'volunteer');
  CREATE TYPE "public"."enum__jobs_v_version_review_status" AS ENUM('draft', 'in_review', 'published', 'archived');
  CREATE TYPE "public"."enum__jobs_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__jobs_v_published_locale" AS ENUM('de', 'ar', 'en');
  CREATE TABLE "_jobs_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_organisation" varchar,
  	"version_city" varchar,
  	"version_bundesland" "enum__jobs_v_version_bundesland",
  	"version_employment_type" "enum__jobs_v_version_employment_type" DEFAULT 'full_time',
  	"version_apply_url" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_expiry_date" timestamp(3) with time zone,
  	"version_review_status" "enum__jobs_v_version_review_status" DEFAULT 'draft',
  	"version_seo_og_image_id" integer,
  	"version_seo_no_index" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__jobs_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__jobs_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_jobs_v_locales" (
  	"version_title" varchar,
  	"version_description" jsonb,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "jobs" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "jobs" ALTER COLUMN "organisation" DROP NOT NULL;
  ALTER TABLE "jobs" ALTER COLUMN "employment_type" DROP NOT NULL;
  ALTER TABLE "jobs" ALTER COLUMN "apply_url" DROP NOT NULL;
  ALTER TABLE "jobs" ALTER COLUMN "expiry_date" DROP NOT NULL;
  ALTER TABLE "jobs" ALTER COLUMN "review_status" DROP NOT NULL;
  ALTER TABLE "jobs_locales" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "jobs" ADD COLUMN "_status" "enum_jobs_status" DEFAULT 'draft';
  ALTER TABLE "_jobs_v" ADD CONSTRAINT "_jobs_v_parent_id_jobs_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_jobs_v" ADD CONSTRAINT "_jobs_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_jobs_v_locales" ADD CONSTRAINT "_jobs_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_jobs_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "_jobs_v_parent_idx" ON "_jobs_v" USING btree ("parent_id");
  CREATE INDEX "_jobs_v_version_version_slug_idx" ON "_jobs_v" USING btree ("version_slug");
  CREATE INDEX "_jobs_v_version_seo_version_seo_og_image_idx" ON "_jobs_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_jobs_v_version_version_updated_at_idx" ON "_jobs_v" USING btree ("version_updated_at");
  CREATE INDEX "_jobs_v_version_version_created_at_idx" ON "_jobs_v" USING btree ("version_created_at");
  CREATE INDEX "_jobs_v_version_version__status_idx" ON "_jobs_v" USING btree ("version__status");
  CREATE INDEX "_jobs_v_created_at_idx" ON "_jobs_v" USING btree ("created_at");
  CREATE INDEX "_jobs_v_updated_at_idx" ON "_jobs_v" USING btree ("updated_at");
  CREATE INDEX "_jobs_v_snapshot_idx" ON "_jobs_v" USING btree ("snapshot");
  CREATE INDEX "_jobs_v_published_locale_idx" ON "_jobs_v" USING btree ("published_locale");
  CREATE INDEX "_jobs_v_latest_idx" ON "_jobs_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_jobs_v_locales_locale_parent_id_unique" ON "_jobs_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "jobs__status_idx" ON "jobs" USING btree ("_status");`)
}

export async function down({ db, payload, req }) {
  await db.execute(sql`
   ALTER TABLE "_jobs_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_jobs_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_jobs_v" CASCADE;
  DROP TABLE "_jobs_v_locales" CASCADE;
  DROP INDEX "jobs__status_idx";
  ALTER TABLE "jobs" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "jobs" ALTER COLUMN "organisation" SET NOT NULL;
  ALTER TABLE "jobs" ALTER COLUMN "employment_type" SET NOT NULL;
  ALTER TABLE "jobs" ALTER COLUMN "apply_url" SET NOT NULL;
  ALTER TABLE "jobs" ALTER COLUMN "expiry_date" SET NOT NULL;
  ALTER TABLE "jobs" ALTER COLUMN "review_status" SET NOT NULL;
  ALTER TABLE "jobs_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "jobs" DROP COLUMN "_status";
  DROP TYPE "public"."enum_jobs_status";
  DROP TYPE "public"."enum__jobs_v_version_bundesland";
  DROP TYPE "public"."enum__jobs_v_version_employment_type";
  DROP TYPE "public"."enum__jobs_v_version_review_status";
  DROP TYPE "public"."enum__jobs_v_version_status";
  DROP TYPE "public"."enum__jobs_v_published_locale";`)
}
