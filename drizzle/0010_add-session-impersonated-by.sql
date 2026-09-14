-- Better Auth >= 1.7 validates the Drizzle schema against its admin plugin and
-- requires the impersonation column on the session table.
ALTER TABLE "auth_sessions" ADD COLUMN IF NOT EXISTS "impersonated_by" text;
