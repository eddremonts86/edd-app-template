ALTER TABLE "contact_messages" ADD COLUMN IF NOT EXISTS "owner_user_id" text;
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "owner_user_id" text;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "contact_messages"
    ADD CONSTRAINT "contact_messages_owner_user_id_users_id_fk"
    FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id")
    ON DELETE cascade ON UPDATE cascade;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_owner_user_id_users_id_fk"
    FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id")
    ON DELETE cascade ON UPDATE cascade;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_messages_owner_idx" ON "contact_messages" ("owner_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_owner_idx" ON "notifications" ("owner_user_id");
--> statement-breakpoint
UPDATE "notifications"
SET "owner_user_id" = "recipient_user_id"
WHERE "owner_user_id" IS NULL
  AND "recipient_user_id" IS NOT NULL;