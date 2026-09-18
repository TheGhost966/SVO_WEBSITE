import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }) {
  await db.execute(sql`
   ALTER TABLE "experts" ADD COLUMN "show_email" boolean DEFAULT false;
  ALTER TABLE "experts" ADD COLUMN "show_phone" boolean DEFAULT false;
  ALTER TABLE "_experts_v" ADD COLUMN "version_show_email" boolean DEFAULT false;
  ALTER TABLE "_experts_v" ADD COLUMN "version_show_phone" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }) {
  await db.execute(sql`
   ALTER TABLE "experts" DROP COLUMN "show_email";
  ALTER TABLE "experts" DROP COLUMN "show_phone";
  ALTER TABLE "_experts_v" DROP COLUMN "version_show_email";
  ALTER TABLE "_experts_v" DROP COLUMN "version_show_phone";`)
}
