import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/** Persist journalist evidence and distribution copy without misusing AI metadata fields. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "public"."articles"
      ADD COLUMN "homepage_teaser_ne" text,
      ADD COLUMN "social_copy_ne" text,
      ADD COLUMN "reporting_location" text,
      ADD COLUMN "source_note" text,
      ADD COLUMN "editor_pitch" text,
      ADD COLUMN "media_reference_url" text;

    ALTER TABLE "public"."_articles_v"
      ADD COLUMN "version_homepage_teaser_ne" text,
      ADD COLUMN "version_social_copy_ne" text,
      ADD COLUMN "version_reporting_location" text,
      ADD COLUMN "version_source_note" text,
      ADD COLUMN "version_editor_pitch" text,
      ADD COLUMN "version_media_reference_url" text;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "public"."_articles_v"
      DROP COLUMN IF EXISTS "version_media_reference_url",
      DROP COLUMN IF EXISTS "version_editor_pitch",
      DROP COLUMN IF EXISTS "version_source_note",
      DROP COLUMN IF EXISTS "version_reporting_location",
      DROP COLUMN IF EXISTS "version_social_copy_ne",
      DROP COLUMN IF EXISTS "version_homepage_teaser_ne";
    ALTER TABLE "public"."articles"
      DROP COLUMN IF EXISTS "media_reference_url",
      DROP COLUMN IF EXISTS "editor_pitch",
      DROP COLUMN IF EXISTS "source_note",
      DROP COLUMN IF EXISTS "reporting_location",
      DROP COLUMN IF EXISTS "social_copy_ne",
      DROP COLUMN IF EXISTS "homepage_teaser_ne";
  `)
}
