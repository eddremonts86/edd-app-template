# Authorization Hardening Plan — Multi-tenancy, RLS & RBAC

> Source brief: `dbUpdates.txt` (15 principles, video summary).
> Goal: evolve every page, server function and table so that **JWT drives UX, RBAC models permissions, and the DB is the last barrier**.

---

## Where we are today

| Layer             | State                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Multi-tenancy     | ❌ No `owner_user_id`, `organization_id`, `workspace_id` columns on resource tables (`contact_messages`, `notifications`, `site_settings`). |
| RLS               | ❌ Drizzle migrations create tables without `ENABLE ROW LEVEL SECURITY`. App connects with a single superuser-equivalent role.              |
| RBAC              | ⚠️ Coarse: `users.role` is a single string (`user`/`admin`/`super_admin`) checked in code via `isAdminRole()`. No per-resource roles.       |
| Permission table  | ❌ No `permissions` table. Role→action mapping is hard-coded in TS.                                                                         |
| Auth fns / claims | ⚠️ Better Auth + Clerk hybrid. No custom JWT claims for per-resource roles.                                                                 |
| Frontend gating   | ⚠️ Ad-hoc `roleKey === 'admin'` checks in components. No shared `<Can permission="…">` primitive.                                           |
| API gating        | ⚠️ Each server fn re-implements `requireAdmin()` checks. No middleware enforcement.                                                         |

The crash on `/dashboard/{users,settings,contact-messages}` highlighted by the user is a _separate_ bug, but it surfaces a broader truth: **without observability we can't even see who is denied what**. That's why this plan starts at phase 0 with logging.

---

## Phase 0 — Observability (DONE in this PR)

- `src/shared/lib/observability/logger.ts` — isomorphic logger
- `src/shared/lib/observability/request-logger.ts` — middleware around every server fn / route
- Wired into `src/start.ts` `requestMiddleware`

This lets us see, **before** changing the model, which paths are slow, which throw, and where 401/403 come from.

**Next observability work** (later phases):

- Sentry `captureException` inside `requestLoggerMiddleware` when status ≥ 500
- Add `user.id` / `organization_id` as Sentry tags after auth resolves
- Add `X-Request-Id` header + propagate in logs

---

## Phase 1 — Multi-tenancy columns (foundation, NO behavior change)

Adds the _capability_ to filter by owner without yet enforcing it.

### Migrations to add

```sql
-- 0008_add-ownership-columns.sql
alter table contact_messages add column owner_user_id text references users(id);
alter table notifications    add column owner_user_id text references users(id);
-- site_settings stays global (system-wide); document the rationale in schema.ts
```

### Drizzle schema updates (`src/shared/lib/db/schema.ts`)

```ts
ownerUserId: text('owner_user_id').references(() => users.id, { onDelete: 'cascade' }),
```

### Backfill strategy

- `contact_messages`: leave null (these are inbound from public landing — no owner yet). The eventual model is "assigned admin".
- `notifications`: same as `recipientUserId` — backfill `update notifications set owner_user_id = recipient_user_id`.

### Query helpers (`src/shared/lib/db/scoping.ts` — NEW)

```ts
export function scopeByOwner<T>(qb: T, userId: string, col = 'owner_user_id'): T { … }
export function requireOwnerOrAdmin(row: { ownerUserId: string | null }, ctx): void { … }
```

✅ **Done in phase 1 = nothing breaks; future code can opt in.**

---

## Phase 2 — RBAC tables

New tables in a single migration `0009_add-rbac.sql`:

```sql
-- generic permission strings: "contact_messages.read", "users.delete", etc.
create table permissions (
  id text primary key,                -- "contact_messages.read"
  resource text not null,             -- "contact_messages"
  action text not null,               -- "read" | "create" | "update" | "delete" | custom
  description text
);

-- maps an app-wide role to permissions
create table role_permissions (
  role text not null,                 -- "user" | "admin" | "super_admin" | future custom roles
  permission_id text not null references permissions(id) on delete cascade,
  primary key (role, permission_id)
);

-- per-resource role grants (RBAC). Each row says: user U has role R on resource (RT, RID).
create table resource_roles (
  user_id text not null references users(id) on delete cascade,
  resource_type text not null,        -- "project" | "workspace" | "organization" | "contact_message" …
  resource_id text not null,
  role text not null,                 -- "owner" | "editor" | "viewer" | custom
  granted_at timestamp default now() not null,
  granted_by text references users(id),
  primary key (user_id, resource_type, resource_id)
);
create index resource_roles_resource_idx on resource_roles(resource_type, resource_id);
```

Seed data in `scripts/db/seed-rbac.ts`:

```ts
const perms = [
  'contact_messages.read',
  'contact_messages.update',
  'contact_messages.delete',
  'users.read',
  'users.create',
  'users.update',
  'users.delete',
  'site_settings.read',
  'site_settings.update',
]
const rolePerms = {
  super_admin: perms, // everything
  admin: perms.filter((p) => !p.startsWith('users.delete')),
  user: ['contact_messages.read'], // example — tune per feature
}
```

---

## Phase 3 — Authorization helpers (DB + app)

### DB-side function (run in migration)

```sql
create or replace function authorize(p_user_id text, p_permission text)
returns boolean language sql stable as $$
  select exists (
    select 1
    from users u
    join role_permissions rp on rp.role = u.role
    where u.id = p_user_id and rp.permission_id = p_permission
  );
$$;
```

For per-resource checks:

```sql
create or replace function authorize_resource(
  p_user_id text, p_permission text, p_resource_type text, p_resource_id text
) returns boolean language sql stable as $$
  -- app-wide role wins
  select case when authorize(p_user_id, p_permission) then true
              else exists (
                select 1 from resource_roles rr
                join role_permissions rp on rp.role = rr.role
                where rr.user_id = p_user_id
                  and rr.resource_type = p_resource_type
                  and rr.resource_id = p_resource_id
                  and rp.permission_id = p_permission
              )
         end;
$$;
```

### TS helper (`src/shared/lib/auth/authorize.ts` — NEW)

```ts
export async function can(userId: string, permission: string): Promise<boolean>
export async function canOnResource(userId, permission, resourceType, resourceId): Promise<boolean>
export async function requirePermission(ctx, permission): Promise<void> // throws 403
```

Used inside every server fn:

```ts
export const deleteContactMessageFn = createServerFn()
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    await requirePermission(context, 'contact_messages.delete')
    …
  })
```

---

## Phase 4 — Row-Level Security in Postgres

> **Prerequisite:** the app must connect using a non-superuser role that respects RLS. Today the connection string uses an owner role that bypasses RLS. We add a second role `app_user` and SET the session variable `app.current_user_id` from middleware.

### Steps

1. New role + connection
   ```sql
   create role app_user nologin;
   grant connect on database <db> to app_user;
   grant usage on schema public to app_user;
   grant select, insert, update, delete on all tables in schema public to app_user;
   ```
2. Migration: enable RLS per table

   ```sql
   alter table contact_messages enable row level security;
   alter table notifications    enable row level security;

   create policy contact_messages_select on contact_messages for select
     using (authorize(current_setting('app.current_user_id', true), 'contact_messages.read'));
   create policy contact_messages_update on contact_messages for update
     using (authorize(current_setting('app.current_user_id', true), 'contact_messages.update'));
   -- repeat for insert/delete and for notifications (scoped by owner_user_id)
   ```

3. DB middleware sets the user id per transaction
   ```ts
   // src/shared/lib/db/with-rls.ts
   export async function withRls<T>(userId: string | null, run: (tx) => Promise<T>) {
     return db.transaction(async (tx) => {
       await tx.execute(sql`set local app.current_user_id = ${userId ?? ''}`)
       return run(tx)
     })
   }
   ```
4. Server fns adopt `withRls(ctx.user.userId, async (tx) => …)`.

### Rollout

- Phase 4a: enable RLS on **one** table (`notifications`) and watch logs. Roll back if anything explodes.
- Phase 4b: extend to `contact_messages`.
- Phase 4c: extend to future tenant-scoped tables.

---

## Phase 5 — JWT claims for UX

- After login, an auth hook computes the user's permission _set_ from `role_permissions` and (optionally) per-resource roles.
- Better Auth & Clerk both let us inject custom claims. For Better Auth, extend the session callback; for Clerk, use a session token template.
- Client picks them up via `useAppAuth().permissions: Set<string>`.

### `<Can>` primitive (`src/shared/ui/auth/Can.tsx` — NEW)

```tsx
<Can permission="contact_messages.delete">
  <Button onClick={…}>Delete</Button>
</Can>
```

Replaces all ad-hoc `roleKey === 'admin'` checks in JSX.

⚠️ **JWT claims are UX only.** Servers and RLS still re-check the DB.

---

## Phase 6 — Tests + audit

- E2E: 1 admin + 1 regular user fixture. Hit every protected route and assert 403.
- Unit: `authorize()` table-driven tests.
- Postgres test: `set app.current_user_id` to user A; `select count(*) from notifications` returns only A's rows.
- Add row to `/memories/repo/security-audit.md` per phase.

---

## Sequencing

| Phase                       | Risk           | Estimated breadth                     | Order               |
| --------------------------- | -------------- | ------------------------------------- | ------------------- |
| 0 — Observability           | low            | done                                  | **NOW**             |
| 1 — Ownership columns       | low (additive) | 1 migration + schema                  | next PR             |
| 2 — RBAC tables + seed      | low            | 1 migration + seed script             | next PR             |
| 3 — `authorize()` + `<Can>` | medium         | wide refactor across server fns + JSX | iterative           |
| 4 — RLS                     | high           | needs new DB role; staged per-table   | per-table PR        |
| 5 — JWT claims              | medium         | touches auth providers                | once phase 3 stable |
| 6 — Tests/audit             | continuous     | —                                     | every phase         |

---

## Decision log

- **Single `role` column on `users` stays** as the global app-wide role. `resource_roles` adds the per-resource layer on top — we do not replace the global role.
- **Permission strings use `resource.action`** (e.g. `contact_messages.delete`) — predictable for grepping and for UI gating.
- **`authorize()` lives in the DB** so RLS policies can reuse it without round-trips.
- **`withRls()` is a transaction** so `SET LOCAL` only affects the current connection, never leaks.

---

## Related skills (created in this PR)

- `.github/skills/app/observability/SKILL.md`
- `.github/skills/app/multi-tenancy-rls/SKILL.md`
- `.github/skills/app/rbac-permissions/SKILL.md`
