import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/**
 * Align the reviewed newsroom RBAC model and public article routing invariant.
 * PostgreSQL enum values are intentionally retained on rollback because removing
 * enum labels safely requires a destructive table/type rewrite.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_users_roles" ADD VALUE IF NOT EXISTS 'viewer' AFTER 'reader';
    ALTER TYPE "public"."enum_users_roles" ADD VALUE IF NOT EXISTS 'reviewer' AFTER 'journalist';

    DROP INDEX IF EXISTS "public"."articles_slug_idx";
    CREATE UNIQUE INDEX IF NOT EXISTS "articles_slug_idx" ON "public"."articles" USING btree ("slug");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "public"."articles_slug_idx";
    CREATE INDEX IF NOT EXISTS "articles_slug_idx" ON "public"."articles" USING btree ("slug");
  `)
}
