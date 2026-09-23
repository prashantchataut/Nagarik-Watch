import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/** Immutable high-value editorial event ledger. Article body history remains in Payload versions. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_editorial_audit_events_event_type" AS ENUM(
      'article_created',
      'workflow_transition',
      'publication_status_changed',
      'correction_changed',
      'ai_assistance_changed'
    );

    CREATE TABLE "public"."editorial_audit_events" (
      "id" serial PRIMARY KEY NOT NULL,
      "occurred_at" timestamptz NOT NULL,
      "event_type" "public"."enum_editorial_audit_events_event_type" NOT NULL,
      "resource_type" varchar NOT NULL,
      "resource_id" varchar NOT NULL,
      "resource_label" varchar NOT NULL,
      "actor_id" varchar,
      "actor_email" varchar,
      "from_value" varchar,
      "to_value" varchar,
      "metadata" jsonb
    );

    ALTER TABLE "public"."payload_locked_documents_rels"
      ADD COLUMN "editorial_audit_events_id" integer;

    ALTER TABLE "public"."payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_editorial_audit_events_fk"
      FOREIGN KEY ("editorial_audit_events_id")
      REFERENCES "public"."editorial_audit_events"("id")
      ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "editorial_audit_events_occurred_at_idx"
      ON "public"."editorial_audit_events" USING btree ("occurred_at");
    CREATE INDEX "editorial_audit_events_event_type_idx"
      ON "public"."editorial_audit_events" USING btree ("event_type");
    CREATE INDEX "editorial_audit_events_resource_type_idx"
      ON "public"."editorial_audit_events" USING btree ("resource_type");
    CREATE INDEX "editorial_audit_events_resource_id_idx"
      ON "public"."editorial_audit_events" USING btree ("resource_id");
    CREATE INDEX "payload_locked_documents_rels_editorial_audit_events_id_idx"
      ON "public"."payload_locked_documents_rels" USING btree ("editorial_audit_events_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "public"."payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_editorial_audit_events_fk";
    DROP INDEX IF EXISTS "public"."payload_locked_documents_rels_editorial_audit_events_id_idx";
    ALTER TABLE "public"."payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "editorial_audit_events_id";
    DROP TABLE IF EXISTS "public"."editorial_audit_events" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_editorial_audit_events_event_type";
  `)
}
