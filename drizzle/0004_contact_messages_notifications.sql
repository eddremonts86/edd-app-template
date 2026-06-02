CREATE TABLE IF NOT EXISTS "contact_messages" (
  "id" text PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "project_type" text NOT NULL,
  "message" text,
  "status" text DEFAULT 'new' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_messages_created_at_idx" ON "contact_messages" ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_messages_status_idx" ON "contact_messages" ("status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" text PRIMARY KEY NOT NULL,
  "recipient_user_id" text,
  "kind" text NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "entity_type" text,
  "entity_id" text,
  "link" text,
  "is_read" boolean DEFAULT false NOT NULL,
  "read_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_recipient_user_id_users_id_fk"
    FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id")
    ON DELETE cascade ON UPDATE cascade;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_recipient_read_idx"
  ON "notifications" ("recipient_user_id", "is_read");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications" ("created_at");
