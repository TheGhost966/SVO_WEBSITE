import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }) {
  await db.execute(sql`
   CREATE TYPE "public"."enum_site_settings_home_group_section_order_section" AS ENUM('hero', 'stats', 'news', 'events', 'helpCards', 'roadmaps', 'guide', 'experts', 'jobs', 'ctaBand');
  CREATE TABLE "site_settings_home_group_section_order" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"section" "enum_site_settings_home_group_section_order_section" NOT NULL,
  	"enabled" boolean DEFAULT true
  );
  
  ALTER TABLE "site_settings_home_group_section_order" ADD CONSTRAINT "site_settings_home_group_section_order_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_home_group_section_order_order_idx" ON "site_settings_home_group_section_order" USING btree ("_order");
  CREATE INDEX "site_settings_home_group_section_order_parent_id_idx" ON "site_settings_home_group_section_order" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }) {
  await db.execute(sql`
   DROP TABLE "site_settings_home_group_section_order" CASCADE;
  DROP TYPE "public"."enum_site_settings_home_group_section_order_section";`)
}
