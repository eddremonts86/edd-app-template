-- Add role column to users (app profile table). The role lives here so that
-- users created from the admin UI (without an auth_users row) can still be
-- assigned a role. When the user is linked to an auth_users row, the role
-- is mirrored to auth_users.role as well so the Better Auth admin plugin
-- can see it.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'user' NOT NULL;

-- Backfill from auth_users.role if already linked.
UPDATE "users"
SET "role" = a."role"
FROM "auth_users" a
WHERE "users"."auth_user_id" = a."id"
  AND a."role" IS NOT NULL;
