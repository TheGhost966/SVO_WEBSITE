import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }) {
  await db.execute(sql`
   CREATE TYPE "public"."enum_roadmaps_quiz_matches" AS ENUM('newly_arrived', 'job_seeking', 'learning_german', 'housing', 'qualification_recognition', 'family', 'health', 'residence_permit', 'studying');
  CREATE TYPE "public"."enum__roadmaps_v_version_quiz_matches" AS ENUM('newly_arrived', 'job_seeking', 'learning_german', 'housing', 'qualification_recognition', 'family', 'health', 'residence_permit', 'studying');
  CREATE TYPE "public"."enum_jobs_bundesland" AS ENUM('W', 'NOE', 'OOE', 'SBG', 'T', 'VBG', 'STMK', 'KTN', 'BGLD');
  CREATE TYPE "public"."enum_jobs_employment_type" AS ENUM('full_time', 'part_time', 'apprenticeship', 'internship', 'volunteer');
  CREATE TYPE "public"."enum_jobs_review_status" AS ENUM('draft', 'in_review', 'published', 'archived');
  CREATE TABLE "roadmaps_quiz_matches" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_roadmaps_quiz_matches",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_roadmaps_v_version_quiz_matches" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__roadmaps_v_version_quiz_matches",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"organisation" varchar NOT NULL,
  	"city" varchar,
  	"bundesland" "enum_jobs_bundesland",
  	"employment_type" "enum_jobs_employment_type" DEFAULT 'full_time' NOT NULL,
  	"apply_url" varchar NOT NULL,
  	"published_at" timestamp(3) with time zone,
  	"expiry_date" timestamp(3) with time zone NOT NULL,
  	"review_status" "enum_jobs_review_status" DEFAULT 'draft' NOT NULL,
  	"seo_og_image_id" integer,
  	"seo_no_index" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "jobs_locales" (
  	"title" varchar NOT NULL,
  	"description" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "site_settings_home_group_section_order" ALTER COLUMN "section" SET DATA TYPE text;
  DROP TYPE "public"."enum_site_settings_home_group_section_order_section";
  CREATE TYPE "public"."enum_site_settings_home_group_section_order_section" AS ENUM('hero', 'stats', 'helpCards', 'roadmaps', 'guide', 'experts', 'jobs', 'events', 'ctaBand', 'news', 'appBand');
  ALTER TABLE "site_settings_home_group_section_order" ALTER COLUMN "section" SET DATA TYPE "public"."enum_site_settings_home_group_section_order_section" USING "section"::"public"."enum_site_settings_home_group_section_order_section";
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "jobs_id" integer;
  ALTER TABLE "roadmaps_quiz_matches" ADD CONSTRAINT "roadmaps_quiz_matches_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."roadmaps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_roadmaps_v_version_quiz_matches" ADD CONSTRAINT "_roadmaps_v_version_quiz_matches_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_roadmaps_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jobs" ADD CONSTRAINT "jobs_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jobs_locales" ADD CONSTRAINT "jobs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "roadmaps_quiz_matches_order_idx" ON "roadmaps_quiz_matches" USING btree ("order");
  CREATE INDEX "roadmaps_quiz_matches_parent_idx" ON "roadmaps_quiz_matches" USING btree ("parent_id");
  CREATE INDEX "_roadmaps_v_version_quiz_matches_order_idx" ON "_roadmaps_v_version_quiz_matches" USING btree ("order");
  CREATE INDEX "_roadmaps_v_version_quiz_matches_parent_idx" ON "_roadmaps_v_version_quiz_matches" USING btree ("parent_id");
  CREATE UNIQUE INDEX "jobs_slug_idx" ON "jobs" USING btree ("slug");
  CREATE INDEX "jobs_seo_seo_og_image_idx" ON "jobs" USING btree ("seo_og_image_id");
  CREATE INDEX "jobs_updated_at_idx" ON "jobs" USING btree ("updated_at");
  CREATE INDEX "jobs_created_at_idx" ON "jobs" USING btree ("created_at");
  CREATE UNIQUE INDEX "jobs_locales_locale_parent_id_unique" ON "jobs_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_jobs_fk" FOREIGN KEY ("jobs_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_jobs_id_idx" ON "payload_locked_documents_rels" USING btree ("jobs_id");`)
}

export async function down({ db, payload, req }) {
  await db.execute(sql`
   ALTER TABLE "roadmaps_quiz_matches" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_roadmaps_v_version_quiz_matches" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "jobs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "jobs_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "roadmaps_quiz_matches" CASCADE;
  DROP TABLE "_roadmaps_v_version_quiz_matches" CASCADE;
  DROP TABLE "jobs" CASCADE;
  DROP TABLE "jobs_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_jobs_fk";
  
  ALTER TABLE "site_settings_home_group_section_order" ALTER COLUMN "section" SET DATA TYPE text;
  DROP TYPE "public"."enum_site_settings_home_group_section_order_section";
  CREATE TYPE "public"."enum_site_settings_home_group_section_order_section" AS ENUM('hero', 'stats', 'news', 'events', 'helpCards', 'roadmaps', 'guide', 'experts', 'jobs', 'ctaBand');
  ALTER TABLE "site_settings_home_group_section_order" ALTER COLUMN "section" SET DATA TYPE "public"."enum_site_settings_home_group_section_order_section" USING "section"::"public"."enum_site_settings_home_group_section_order_section";
  DROP INDEX "payload_locked_documents_rels_jobs_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "jobs_id";
  DROP TYPE "public"."enum_roadmaps_quiz_matches";
  DROP TYPE "public"."enum__roadmaps_v_version_quiz_matches";
  DROP TYPE "public"."enum_jobs_bundesland";
  DROP TYPE "public"."enum_jobs_employment_type";
  DROP TYPE "public"."enum_jobs_review_status";`)
}
