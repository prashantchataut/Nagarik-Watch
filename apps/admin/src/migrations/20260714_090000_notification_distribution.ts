import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/** Persist newsroom alert recommendations in the canonical article and its draft versions. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_articles_notification_mode" AS ENUM('none', 'followers', 'breaking');
    CREATE TYPE "public"."enum__articles_v_version_notification_mode" AS ENUM('none', 'followers', 'breaking');

    ALTER TABLE "public"."articles"
      ADD COLUMN "notification_mode" "enum_articles_notification_mode" DEFAULT 'none',
      ADD COLUMN "notification_tag_slugs" jsonb DEFAULT '[]'::jsonb;

    ALTER TABLE "public"."_articles_v"
      ADD COLUMN "version_notification_mode" "enum__articles_v_version_notification_mode" DEFAULT 'none',
      ADD COLUMN "version_notification_tag_slugs" jsonb DEFAULT '[]'::jsonb;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "public"."_articles_v"
      DROP COLUMN IF EXISTS "version_notification_tag_slugs",
      DROP COLUMN IF EXISTS "version_notification_mode";
    ALTER TABLE "public"."articles"
      DROP COLUMN IF EXISTS "notification_tag_slugs",
      DROP COLUMN IF EXISTS "notification_mode";
    DROP TYPE IF EXISTS "public"."enum__articles_v_version_notification_mode";
    DROP TYPE IF EXISTS "public"."enum_articles_notification_mode";
  `)
}
