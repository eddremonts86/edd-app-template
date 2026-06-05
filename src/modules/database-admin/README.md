# Database Admin Module

Super-admin tools for managing database **connection profiles** (multiple
DB targets you can switch between), running **migrations** on demand, and
inspecting an **audit trail** of every profile/migration change.

> Restricted to `super_admin` role. Reads and writes encrypted profile
> secrets to `src/modules/database-admin/data/db-config-store.json`.

## What it does

- **Profiles tab** — create / edit / delete named database profiles.
  Each profile stores `name`, `host`, `port`, `database`, `username`,
  `password` (encrypted with AES-GCM via `node:crypto`), and an
  optional `ssl` flag.
- **Migrations tab** — run Drizzle migrations on the active profile
  without going through the CLI. Shows the migration history.
- **Audit tab** — every read/write of the profile store and every
  migration run is logged to `data/db-audit-logs.json` with actor,
  action, and timestamp.
- **Connection test** — the profile form has a "Test connection"
  button that opens a socket and reports back.
- **Active profile** — the active profile is written to a runtime
  config file (`data/db-active-profile.json`) that the Drizzle client
  reads via `db-resolver-bridge.server.ts`.

## File map

```
src/modules/database-admin/
├── index.ts                  # public barrel
├── manifest.ts               # AppModuleManifest (id: 'database-admin')
├── api/
│   ├── db-admin.fn.ts                # server functions (profile CRUD, migrations, audit)
│   ├── db-admin.queries.ts           # TanStack Query hooks
│   └── db-admin.server-deps.ts       # server-only deps (crypto, db client)
├── data/                             # on-disk config + audit (committed for dev)
│   ├── db-audit-logs.json
│   └── db-config-store.json
├── model/
│   ├── audit.ts
│   ├── migration.ts
│   └── profile.ts                    # DbProfile, DbProfileStatus
├── server/
│   ├── audit-store.ts
│   ├── config-store.ts               # read/write db-config-store.json
│   ├── connection-tester.ts
│   ├── crypto.ts                     # AES-GCM encrypt/decrypt of secrets
│   ├── data-paths.ts
│   ├── db-resolver-bridge.server.ts  # writes the active profile for Drizzle
│   └── migration-runner.ts           # runs drizzle migrations against a profile
└── ui/
    ├── AuditTab.tsx
    ├── DatabaseAdminPage.tsx
    ├── MigrationsTab.tsx
    ├── ProfileFormSheet.tsx
    └── ProfilesTab.tsx
```

## Public API

```ts
// from '@/modules/database-admin'
export { databaseAdminModule } from './manifest'
export { DatabaseAdminPage } from './ui/DatabaseAdminPage'
```

The page is the only thing you should import from the outside. The
rest is internal.

## Dependencies

### Other modules (declared in the manifest)

None.

### Cross-module imports inside `database-admin/`

- `@/modules/core` — for the manifest type.
- `@/modules/users` — `AppRoleKey` is used to gate the sidebar entry
  to `super_admin`.

### NPM packages used

- `@tanstack/react-router` — `Link`.
- `@tanstack/react-query` — query hooks.
- `lucide-react` — icons.
- `react-i18next` — translations.
- `node:crypto` — AES-GCM, built into Node.
- `postgres` (the `postgres` driver) — used by `connection-tester.ts`
  and `migration-runner.ts`. Already in the template's
  `package.json`.
- `drizzle-orm` — used by `migration-runner.ts`. Already in the
  template.
- `react`, `react-dom`.

### Environment variables

| Variable         | Effect                                                              |
| ---------------- | ------------------------------------------------------------------- |
| `ENCRYPTION_KEY` | 32-byte base64 key used to encrypt profile passwords. **Required.** |
| `DATABASE_URL`   | Fallback when no profile is selected.                               |

The encryption key is read from `process.env.ENCRYPTION_KEY`. If it is
missing, the module refuses to start.

### Shared infrastructure required

- `@/components/ui/*` — full shadcn/ui set.
- `@/shared/lib/utils` — `cn`.
- `@/shared/lib/auth/app-auth` — to know the current actor (for audit
  logging).
- `@/shared/lib/db` — Drizzle client (the bridge writes the active
  profile so the Drizzle client picks it up).

### Database tables required

None of its own. It **reads from** the migrations table that
`drizzle-kit` creates automatically (`__drizzle_migrations`).

## How to copy this module to another project

1. **Copy `src/modules/database-admin/`** (this entire folder, ~17
   files).
2. **Bring the shared pieces** — see list above.
3. **Generate an encryption key** and add it to `.env`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   # → paste into .env as ENCRYPTION_KEY=...
   ```
4. **Add a file-based route**:

   ```tsx
   // src/routes/dashboard/admin/database.tsx
   import { createFileRoute, redirect } from '@tanstack/react-router'
   import { DatabaseAdminPage } from '@/modules/database-admin'
   import { useCurrentUser } from '@/modules/users'

   export const Route = createFileRoute('/dashboard/admin/database')({
     beforeLoad: () => {
       // gate at the route level — the manifest only hides the sidebar entry
       if (/* current user is not super_admin */) throw redirect({ to: '/dashboard' })
     },
     component: DatabaseAdminPage,
   })
   ```

5. **Register the module** in `src/modules/index.ts` and add
   `databaseAdminModule` to `core/registry.ts`. (The template already
   has the import.)
6. **Wire the Drizzle bridge** in your server entry:
   ```ts
   // src/server.ts
   import { syncActiveProfile } from '@/modules/database-admin/server/db-resolver-bridge.server'
   await syncActiveProfile() // picks up the active profile and updates the env
   ```
7. **Install missing deps** (most are in the template):
   ```bash
   pnpm add postgres drizzle-orm
   ```

## Configuration knobs

- **Change the cipher** — `server/crypto.ts` is the only file that
  uses `node:crypto`; swap AES-GCM for whatever you need. Keep
  `ENCRYPTION_KEY` the right length for the new cipher.
- **Add a new field to a profile** — edit `model/profile.ts` and the
  form in `ui/ProfileFormSheet.tsx`. The store schema in
  `server/config-store.ts` is permissive by default; tighten it
  with Zod if you need strict validation.
- **Disable the audit log** — pass `{ writeAudit: false }` to the
  server functions in `api/db-admin.fn.ts`. (Or just delete the
  audit-store writes; they are isolated to one file.)

## Anti-patterns

- Do not commit `data/db-config-store.json` to a public repo — it
  contains encrypted credentials. Add it to `.gitignore`.
- Do not lower the role gate to `admin` or `user`. Profile management
  is destructive; the manifest's `requiredRole: 'super_admin'` should
  be the strictest role check in the app.
- Do not call `crypto.ts` from a client component — it imports
  `node:crypto` and will fail in the browser.
- Do not roll your own audit log; reuse `audit-store.ts`. It is the
  only place that knows the schema and the rotation rules.
