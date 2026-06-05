# Users Module

User directory, profile state, and role-based administration. Provides the
`/dashboard/users` page with a virtualized table, an inline edit form, an
`UserProvider` context for the current user, and a `UserDirectoryStatsWidget`
for the dashboard.

> Two things to know before you copy it: the module is **the source of truth
> for roles and the `AppRoleKey` type** (it is imported by `core/types` and
> `core/navigation`), and it assumes a `users` table in the database with at
> minimum `id`, `name`, `email`, `avatar`, `role_key`, and `created_at`.

## What it does

- **User directory page** (`/dashboard/users`) — virtualized table with
  infinite scroll, sortable columns, inline create/edit form, role-based
  row actions, search.
- **`UserProvider` context** — exposes the current user (`useCurrentUser`)
  to the rest of the app. Other modules (e.g. the dashboard sidebar) read
  the role from here to decide what to render.
- **Role helpers** — `AppRoleKey` type, `normalizeRoleKey`, `canManageUsers`,
  `canAssignRole`, `canDeleteUser`, `isAdminRole`, `isSuperAdminRole`,
  `roleRank`. The role hierarchy is `user < admin < super_admin`.
- **Dashboard widget** — `UserDirectoryStatsWidget` shows headcount and
  top departments, fed by the same server function the directory uses.

## File map

```
src/modules/users/
├── index.ts                  # public barrel
├── manifest.ts               # AppModuleManifest (id: 'users')
├── api/
│   ├── current-user.server.ts
│   ├── users.fn.ts           # server functions (list, get, create, update, delete)
│   └── users.queries.ts      # TanStack Query hooks
├── components/
│   ├── UserDirectoryStatsWidget.tsx
│   ├── UserForm.tsx
│   ├── UserTable.tsx
│   └── UsersPage.tsx
├── context/
│   ├── UserContext.tsx
│   └── UserProvider.tsx
├── hooks/
│   ├── useCurrentUser.ts
│   └── useUserColumns.tsx
└── model/
    ├── permissions.ts        # role hierarchy + helpers
    └── types.ts              # User type
```

## Public API

```ts
// from '@/modules/users'
export * from './api/users.fn' // server function bindings
export * from './api/users.queries' // useUsers, useUpdateUser, etc.
export { UserForm, type UserFormValues } from './components/UserForm'
export { UsersPage } from './components/UsersPage'
export { UserProvider } from './context/UserProvider'
export { useCurrentUser } from './hooks/useCurrentUser'
export * from './model/types' // User, AppRoleKey (re-exported via permissions)
```

## Dependencies

### Other modules (declared in the manifest)

None. But **`core` imports `AppRoleKey` from here**, so you cannot copy
`core` to another project without also copying `users/model/permissions.ts`
(at minimum, the type and the `ROLE_RANK` constant).

### Cross-module imports inside `users/`

- `@/modules/core` — for the `WidgetDefinition` type used in the manifest.

### NPM packages used

- `@tanstack/react-router` — `Link`, `useNavigate`, file-based routes.
- `@tanstack/react-query` — `useQuery`, `useMutation`, `useInfiniteQuery`.
- `@tanstack/react-table` — headless table logic.
- `@tanstack/react-virtual` — row virtualization.
- `lucide-react` — icons.
- `react-hook-form` + `@hookform/resolvers` + `zod` — form state + validation.
- `react-intersection-observer` — infinite-scroll trigger.
- `clsx`, `tailwind-merge` — `cn` helper.
- `date-fns` — date formatting.
- `react-i18next` — translation hooks.
- `react`, `react-dom`.

### Environment variables

- `DATABASE_URL` — required to query the `users` table.

### Shared infrastructure required

- `@/components/ui/*` — full shadcn/ui set (`table`, `dropdown-menu`,
  `sheet`, `dialog`, `button`, `card`, `input`, `select`, `avatar`,
  `badge`, `skeleton`, `tooltip`, `popover`, `form`, `checkbox`).
- `@/shared/lib/utils` — `cn`.
- `@/shared/lib/query` — TanStack Query client.
- `@/shared/lib/auth/app-auth` — to know the current actor's role for
  row-action visibility.
- `@/shared/lib/db` — Drizzle client + `users` table schema.

### Database tables required

| Table     | Required columns (at minimum)                             |
| --------- | --------------------------------------------------------- |
| `users`   | `id`, `name`, `email`, `avatar`, `role_key`, `created_at` |
| `session` | `id`, `user_id`, `expires_at` (Better Auth)               |

In the template these are defined across `drizzle/0000_*.sql`,
`drizzle/0003_add-auth-admin-role.sql`, and `drizzle/0005_add-users-role.sql`.

## How to copy this module to another project

1. **Copy `src/modules/users/`** (this entire folder).
2. **Bring the shared pieces:**
   - `@/components/ui/*` (see list above).
   - `@/shared/lib/utils`, `@/shared/lib/query`, `@/shared/lib/db`,
     `@/shared/lib/auth/app-auth`.
3. **Add the `users` Drizzle table** to your schema. Minimum columns:
   ```ts
   // schema.ts
   export const users = pgTable('users', {
     id: text('id').primaryKey(),
     name: text('name').notNull(),
     email: text('email').notNull().unique(),
     avatar: text('avatar'),
     roleKey: text('role_key').notNull().default('user'), // 'user' | 'admin' | 'super_admin'
     createdAt: timestamp('created_at').notNull().defaultNow(),
   })
   ```
   Then run `pnpm db:push` to create the table.
4. **Add a file-based route** for the directory:

   ```tsx
   // src/routes/dashboard/users.tsx
   import { createFileRoute } from '@tanstack/react-router'
   import { UsersPage } from '@/modules/users'

   export const Route = createFileRoute('/dashboard/users')({
     component: UsersPage,
   })
   ```

5. **Wrap the dashboard** with `UserProvider` so `useCurrentUser` works:
   ```tsx
   // src/routes/dashboard/route.tsx
   import { UserProvider } from '@/modules/users'
   ;<UserProvider>
     <DashboardLayout>
       <Outlet />
     </DashboardLayout>
   </UserProvider>
   ```
6. **Register the module** in `src/modules/index.ts` and add `usersModule`
   to `core/registry.ts`. (The template already has the import and the
   entry in the registry array.)
7. **Install missing dependencies**:
   ```bash
   pnpm add @tanstack/react-table @tanstack/react-virtual \
              react-hook-form @hookform/resolvers zod \
              react-intersection-observer lucide-react date-fns
   ```

## Configuration knobs

- **Change the role hierarchy** — edit `model/permissions.ts`. The
  `ROLE_RANK` map is the single source of truth; update
  `canAssignRole` / `canDeleteUser` if the rules change.
- **Default role for new users** — change the `default('user')` in your
  Drizzle schema (and the form's default value in `UserForm.tsx`).
- **Add a custom column** — extend the `User` type, the Drizzle schema, the
  table columns in `useUserColumns.tsx`, and the form fields in
  `UserForm.tsx`.
- **Disable the dashboard widget** — set `defaultVisible: false` on the
  `directory-stats` widget in `manifest.ts`.

## Anti-patterns

- Do not import the `User` type from anywhere other than
  `@/modules/users`. It is the canonical type for the app.
- Do not bypass `canAssignRole` / `canDeleteUser` when wiring new
  administrative actions — the role hierarchy is the only place that
  encodes who-can-do-what, and skipping it is a security bug.
- Do not put a "list users" page in any other module — use
  `UsersPage` from here.
