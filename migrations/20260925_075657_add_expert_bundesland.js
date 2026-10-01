import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }) {
  await db.execute(sql`
   CREATE TYPE "public"."enum_experts_bundesland" AS ENUM('W', 'NOE', 'OOE', 'SBG', 'T', 'VBG', 'STMK', 'KTN', 'BGLD');
  CREATE TYPE "public"."enum__experts_v_version_bundesland" AS ENUM('W', 'NOE', 'OOE', 'SBG', 'T', 'VBG', 'STMK', 'KTN', 'BGLD');
  ALTER TABLE "experts" ADD COLUMN "bundesland" "enum_experts_bundesland";
  ALTER TABLE "_experts_v" ADD COLUMN "version_bundesland" "enum__experts_v_version_bundesland";`)
}

export async function down({ db, payload, req }) {
  await db.execute(sql`
   ALTER TABLE "experts" DROP COLUMN "bundesland";
  ALTER TABLE "_experts_v" DROP COLUMN "version_bundesland";
  DROP TYPE "public"."enum_experts_bundesland";
  DROP TYPE "public"."enum__experts_v_version_bundesland";`)
}
