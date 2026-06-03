CREATE TABLE IF NOT EXISTS "permissions" (
  "id" text PRIMARY KEY NOT NULL,
  "resource" text NOT NULL,
  "action" text NOT NULL,
  "description" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "role_permissions" (
  "role" text NOT NULL,
  "permission_id" text NOT NULL,
  CONSTRAINT "role_permissions_role_permission_id_unique" UNIQUE("role", "permission_id")
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "role_permissions"
    ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk"
    FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id")
    ON DELETE cascade ON UPDATE cascade;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resource_roles" (
  "user_id" text NOT NULL,
  "resource_type" text NOT NULL,
  "resource_id" text NOT NULL,
  "role" text NOT NULL,
  "granted_at" timestamp DEFAULT now() NOT NULL,
  "granted_by" text,
  CONSTRAINT "resource_roles_user_type_id_unique" UNIQUE("user_id", "resource_type", "resource_id")
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "resource_roles"
    ADD CONSTRAINT "resource_roles_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
    ON DELETE cascade ON UPDATE cascade;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "resource_roles"
    ADD CONSTRAINT "resource_roles_granted_by_users_id_fk"
    FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id")
    ON DELETE set null ON UPDATE cascade;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "resource_roles_resource_idx" ON "resource_roles" ("resource_type", "resource_id");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION authorize(p_user_id text, p_permission text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users u
    JOIN role_permissions rp ON rp.role = u.role
    WHERE u.id = p_user_id AND rp.permission_id = p_permission
  );
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION authorize_resource(
  p_user_id text,
  p_permission text,
  p_resource_type text,
  p_resource_id text
)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN authorize(p_user_id, p_permission) THEN true
    ELSE EXISTS (
      SELECT 1
      FROM resource_roles rr
      JOIN role_permissions rp ON rp.role = rr.role
      WHERE rr.user_id = p_user_id
        AND rr.resource_type = p_resource_type
        AND rr.resource_id = p_resource_id
        AND rp.permission_id = p_permission
    )
  END;
$$;