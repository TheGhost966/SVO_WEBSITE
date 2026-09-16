import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }) {
  await db.execute(sql`
   CREATE TYPE "public"."enum_site_settings_home_group_stat_labels_source" AS ENUM('experts', 'guideArticles', 'roadmaps', 'events');
  CREATE TABLE "site_settings_home_group_stat_labels" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"source" "enum_site_settings_home_group_stat_labels_source" NOT NULL
  );
  
  CREATE TABLE "site_settings_home_group_stat_labels_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_home_group_help_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_home_group_help_cards_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "site_settings" ADD COLUMN "home_group_hero_cta_href" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "home_group_cta_band_cta_href" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "home_group_hero_headline" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "home_group_hero_subline" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "home_group_hero_cta_label" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "home_group_cta_band_heading" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "home_group_cta_band_body" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "home_group_cta_band_cta_label" varchar;
  ALTER TABLE "site_settings_home_group_stat_labels" ADD CONSTRAINT "site_settings_home_group_stat_labels_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_home_group_stat_labels_locales" ADD CONSTRAINT "site_settings_home_group_stat_labels_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_home_group_stat_labels"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_home_group_help_cards" ADD CONSTRAINT "site_settings_home_group_help_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_home_group_help_cards_locales" ADD CONSTRAINT "site_settings_home_group_help_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_home_group_help_cards"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_home_group_stat_labels_order_idx" ON "site_settings_home_group_stat_labels" USING btree ("_order");
  CREATE INDEX "site_settings_home_group_stat_labels_parent_id_idx" ON "site_settings_home_group_stat_labels" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_home_group_stat_labels_locales_locale_parent_i" ON "site_settings_home_group_stat_labels_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_home_group_help_cards_order_idx" ON "site_settings_home_group_help_cards" USING btree ("_order");
  CREATE INDEX "site_settings_home_group_help_cards_parent_id_idx" ON "site_settings_home_group_help_cards" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_home_group_help_cards_locales_locale_parent_id" ON "site_settings_home_group_help_cards_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }) {
  await db.execute(sql`
   DROP TABLE "site_settings_home_group_stat_labels" CASCADE;
  DROP TABLE "site_settings_home_group_stat_labels_locales" CASCADE;
  DROP TABLE "site_settings_home_group_help_cards" CASCADE;
  DROP TABLE "site_settings_home_group_help_cards_locales" CASCADE;
  ALTER TABLE "site_settings" DROP COLUMN "home_group_hero_cta_href";
  ALTER TABLE "site_settings" DROP COLUMN "home_group_cta_band_cta_href";
  ALTER TABLE "site_settings_locales" DROP COLUMN "home_group_hero_headline";
  ALTER TABLE "site_settings_locales" DROP COLUMN "home_group_hero_subline";
  ALTER TABLE "site_settings_locales" DROP COLUMN "home_group_hero_cta_label";
  ALTER TABLE "site_settings_locales" DROP COLUMN "home_group_cta_band_heading";
  ALTER TABLE "site_settings_locales" DROP COLUMN "home_group_cta_band_body";
  ALTER TABLE "site_settings_locales" DROP COLUMN "home_group_cta_band_cta_label";
  DROP TYPE "public"."enum_site_settings_home_group_stat_labels_source";`)
}
