ALTER TABLE "auth_users" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'user' NOT NULL;
--> statement-breakpoint
ALTER TABLE "auth_users" ADD COLUMN IF NOT EXISTS "banned" boolean DEFAULT false;
--> statement-breakpoint
ALTER TABLE "auth_users" ADD COLUMN IF NOT EXISTS "ban_reason" text;
--> statement-breakpoint
ALTER TABLE "auth_users" ADD COLUMN IF NOT EXISTS "ban_expires" timestamp;
