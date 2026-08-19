import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/**
 * Reader revalidation observability on articles + media provenance field.
 * Credit remains validated in hooks; existing null credits are backfilled.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "public"."articles"
      ADD COLUMN IF NOT EXISTS "reader_revalidate_status" varchar DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS "reader_revalidate_at" timestamptz,
      ADD COLUMN IF NOT EXISTS "reader_revalidate_error" text;

    ALTER TABLE "public"."_articles_v"
      ADD COLUMN IF NOT EXISTS "version_reader_revalidate_status" varchar DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS "version_reader_revalidate_at" timestamptz,
      ADD COLUMN IF NOT EXISTS "version_reader_revalidate_error" text;

    ALTER TABLE "public"."media"
      ADD COLUMN IF NOT EXISTS "source_url" text;

    UPDATE "public"."media"
      SET "credit" = COALESCE(NULLIF(TRIM("credit"), ''), 'Legacy media')
      WHERE "credit" IS NULL OR TRIM("credit") = '';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "public"."media"
      DROP COLUMN IF EXISTS "source_url";

    ALTER TABLE "public"."_articles_v"
      DROP COLUMN IF EXISTS "version_reader_revalidate_error",
      DROP COLUMN IF EXISTS "version_reader_revalidate_at",
      DROP COLUMN IF EXISTS "version_reader_revalidate_status";

    ALTER TABLE "public"."articles"
      DROP COLUMN IF EXISTS "reader_revalidate_error",
      DROP COLUMN IF EXISTS "reader_revalidate_at",
      DROP COLUMN IF EXISTS "reader_revalidate_status";
  `)
}
