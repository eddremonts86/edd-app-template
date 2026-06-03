-- Decouple app users from auth_users so users from any provider (Clerk, Better
-- Auth, or admin-created) can live in the same table.
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_auth_user_id_auth_users_id_fk";

-- Track which auth provider owns the linked identity.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "provider" text DEFAULT 'local' NOT NULL;

-- Clerk-issued user ids are prefixed with "user_" — set those first.
UPDATE "users"
SET "provider" = 'clerk'
WHERE "auth_user_id" LIKE 'user_%' AND "provider" = 'local';

-- Anything else that has a linked auth identity came from Better Auth.
UPDATE "users"
SET "provider" = 'better-auth'
WHERE "auth_user_id" IS NOT NULL AND "provider" = 'local';
