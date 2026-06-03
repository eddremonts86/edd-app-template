# Multi-tenancy & Row-Level Security Skill

> Load when: adding a new table, a new feature with per-user/per-org data,
> or migrating existing tables to enforce ownership in the database.

> See `docs/architecture/authorization-hardening-plan.md` for the staged rollout.

## TL;DR — the rules

1. **Every tenant-scoped row carries an owner column.** Default name: `owner_user_id`. Use `organization_id` / `workspace_id` when the entity belongs to a group, not a user.
2. **The DB enforces ownership, not the app.** Enable RLS on the table; write a policy that calls `authorize_resource(...)`. The app is only the _first_ check.
3. **App connections use `app_user`**, not the owner role. The owner role is for migrations only.
4. **`SET LOCAL app.current_user_id` per transaction** — never per connection. Use the `withRls()` helper.
5. **Site-wide tables (e.g. `site_settings`) skip RLS** but require an explicit `super_admin` permission to mutate. Document this at the top of the table definition.

## Schema pattern

```ts
// src/shared/lib/db/schema.ts
export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ownerUserId: text('owner_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

## Migration template

```sql
-- 00NN_add-projects.sql
create table projects (
  id text primary key,
  name text not null,
  owner_user_id text not null references users(id) on delete cascade,
  created_at timestamp default now() not null
);

alter table projects enable row level security;

create policy projects_select on projects for select
  using (
    owner_user_id = current_setting('app.current_user_id', true)
    or authorize(current_setting('app.current_user_id', true), 'projects.read_all')
  );

create policy projects_modify on projects for all
  using (
    owner_user_id = current_setting('app.current_user_id', true)
    or authorize(current_setting('app.current_user_id', true), 'projects.update_all')
  )
  with check (
    owner_user_id = current_setting('app.current_user_id', true)
    or authorize(current_setting('app.current_user_id', true), 'projects.update_all')
  );
```

## Query pattern (app side)

```ts
import { withRls } from '@/shared/lib/db/with-rls'

export const listMyProjects = createServerFn().handler(async ({ context }) => {
  const userId = context.user!.userId
  return withRls(userId, (tx) => tx.select().from(projects))
  // RLS naturally returns only rows where owner_user_id = userId
  // OR where the user has the `projects.read_all` permission.
})
```

## Common mistakes

| Mistake                                                     | Why it bites                                                            | Fix                                                                                 |
| ----------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Connecting as the owner role in prod                        | RLS is bypassed silently. Audits will flag this.                        | Two connection strings: `DATABASE_URL` (migrations) + `DATABASE_URL_APP` (runtime). |
| `SET app.current_user_id` (no LOCAL)                        | Leaks across connection-pool checkouts.                                 | Always `SET LOCAL` inside a transaction.                                            |
| Hard-coding `where ownerUserId = userId` in addition to RLS | OK as defense-in-depth, but if you forget RLS, you've still got a leak. | Do both. The query filter is fast-path; RLS is the safety net.                      |
| Adding RLS without seeding `permissions`                    | App breaks the moment you flip the switch.                              | Roll out per-table. Seed permissions in `scripts/db/seed-rbac.ts` first.            |
| Forgetting `with check` on `update`/`insert` policies       | Users can move rows out of their tenant.                                | Always include `with check`.                                                        |

## Per-tenant patterns

| Tenant model  | Owner column      | RLS predicate                                                                                                                |
| ------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Personal data | `owner_user_id`   | `owner_user_id = current_user_id`                                                                                            |
| Org-wide      | `organization_id` | `organization_id in (select org_id from memberships where user_id = current_user_id)`                                        |
| Project       | `project_id`      | `exists (select 1 from resource_roles where resource_type='project' and resource_id=project_id and user_id=current_user_id)` |

## Verifying RLS in tests

```sql
-- in a psql session connected as app_user
set local app.current_user_id = 'user_a';
select count(*) from projects;   -- only user_a's rows

set local app.current_user_id = 'user_b';
select count(*) from projects;   -- only user_b's rows
```

Automate this in `tests/integration/rls.test.ts`.
