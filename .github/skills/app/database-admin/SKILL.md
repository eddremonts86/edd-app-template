---
name: database-admin
description: Módulo database-admin de TanStack Template. Usar cuando se trabaje con src/modules/database-admin/*, se creen o gestionen perfiles de conexión PostgreSQL, se ejecuten migraciones Drizzle, se consulte el audit log, o se depure la integración del DB resolver. Cubre: perfiles cifrados, resolver override, patrón .server.ts, instalación en ssr.tsx, y conexión a Supabase/Neon/RDS como perfil alternativo.
---

# Database Admin Skill

## What It Does

The `database-admin` module lets super-admins manage alternative PostgreSQL
connection profiles at runtime — without redeploying. The active profile
overrides `DATABASE_URL` for all `getDb()` calls via a resolver hook.

Three tabs in `/dashboard/admin/database`:

| Tab            | Purpose                                                          |
| -------------- | ---------------------------------------------------------------- |
| **Profiles**   | CRUD for named connection profiles (passwords encrypted at rest) |
| **Migrations** | Run Drizzle migrations against any saved profile                 |
| **Audit log**  | Last 500 sensitive operations, append-only, no passwords logged  |

---

## Prerequisites

### 1. `DB_CONFIG_SECRET` env var (required for write operations)

```env
# .env / .env.development
DB_CONFIG_SECRET=local-dev-secret-thirty-two-chars-min   # ≥ 16 chars dev, ≥ 32 prod
```

Without this, the "New profile" button is **disabled** and all save operations throw.
The UI shows a "Encryption unavailable" badge when the secret is missing.

### 2. Super-admin role

All server functions call `requireSuperAdmin()`. The seeded admin (`edd_admin@local.com`)
has the `super_admin` role by default.

---

## File Structure

```
src/modules/database-admin/
├── manifest.ts                          # Module registration
├── index.ts                             # Public barrel
├── model/
│   ├── profile.ts                       # DbProfile Zod schema + redactProfile()
│   ├── migration.ts                     # MigrationFile schema + parseMigrationFile()
│   └── audit.ts                         # AuditEntry schema + formatAuditEntry()
├── api/
│   ├── db-admin.fn.ts                   # Server functions (TanStack Start createServerFn)
│   ├── db-admin.queries.ts              # TanStack Query hooks (useTQuery / useTQMutation)
│   └── db-admin.server-deps.ts          # Lazy-loads server-only deps (never top-level import)
├── server/
│   ├── config-store.ts                  # Read/write db-config-store.json (atomic writes)
│   ├── audit-store.ts                   # Append-only audit log (capped 500 entries)
│   ├── crypto.ts                        # AES-256-GCM encrypt/decrypt (DB_CONFIG_SECRET key)
│   ├── data-paths.ts                    # Paths: src/modules/database-admin/data/
│   ├── connection-tester.ts             # Test a profile via a raw SQL SELECT 1
│   ├── migration-runner.ts              # Dry-run and apply Drizzle migrations
│   └── db-resolver-bridge.server.ts     # Wires resolver — MUST be .server.ts
└── ui/
    ├── DatabaseAdminPage.tsx
    ├── ProfilesTab.tsx
    ├── MigrationsTab.tsx
    └── AuditTab.tsx
```

Data files are persisted under `src/modules/database-admin/data/` (gitignored):

```
src/modules/database-admin/data/
├── db-config-store.json    # Profiles + active profile id
└── db-audit-logs.json      # Audit entries (≤ 500, FIFO eviction)
```

---

## The DB Resolver Pattern

The module hooks into the shared DB factory via a custom resolver:

```ts
// src/shared/lib/db/index.ts exposes:
setConnectionUrlResolver(fn: () => string | null): void
// When set, getDb() calls fn() before using process.env.DATABASE_URL
```

### CRITICAL: Install in `ssr.tsx`, NOT `start.ts`

`src/start.ts` is **isomorphic** — TanStack Start runs it on both client and
server via `hydrateStart`. Importing any Node.js module (fs, crypto, postgres)
from `start.ts` leaks native code into the client bundle.

**`db-resolver-bridge.server.ts` must only be imported from `src/ssr.tsx`:**

```ts
// src/ssr.tsx  ← server-only SSR entry
import { installDbAdminResolver } from '@/modules/database-admin/server/db-resolver-bridge.server'

installDbAdminResolver() // called once at server startup
```

```ts
// src/start.ts  ← DO NOT import db-resolver-bridge or any fs/crypto here
// Only middleware, Clerk, Sentry, etc. (no Node built-ins at top level)
```

If you ever see `Buffer is not defined` or `crypto is not defined` in the browser
console, the root cause is a `.server.ts` file being imported (directly or
transitively) from `start.ts`.

---

## Adding a Connection Profile

### Via UI (recommended)

1. Start the server: `pnpm dev:server`
2. Login as admin: `http://localhost:3000/auth` → `edd_admin@local.com`
3. Navigate to `/dashboard/admin/database`
4. Click **"New profile"** (button is orange when encryption is available)
5. Paste a PostgreSQL connection URL or fill fields manually

### Connection URL formats accepted

```
# Standard PostgreSQL
postgresql://user:password@host:5432/database

# Supabase direct connection (Project Settings → Database → URI)
postgresql://postgres:[YOUR-PASSWORD]@db.<project-ref>.supabase.co:5432/postgres

# Supabase connection pooler (recommended for apps with many connections)
postgresql://postgres.<project-ref>:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:6543/postgres

# Neon
postgresql://user:password@ep-<name>.us-east-2.aws.neon.tech/neondb?sslmode=require

# RDS / any standard Postgres
postgresql://admin:password@mydb.rds.amazonaws.com:5432/mydb
```

> **Supabase note**: Use the direct PostgreSQL connection URL from
> **Supabase Dashboard → Project Settings → Database → Connection string → URI**.
> The `VITE_SUPABASE_URL` / `VITE_SUPABASE_KEY` from the Supabase JS client
> setup are **not** PostgreSQL credentials and cannot be used here.

### Via server function (programmatic)

```ts
import { saveDbProfileFn } from '@/modules/database-admin/api/db-admin.fn'

await saveDbProfileFn({
  data: {
    name: 'supabase-prod',
    label: 'Supabase Production',
    driver: 'postgres',
    connectionUrl: 'postgresql://postgres:secret@db.xxx.supabase.co:5432/postgres',
  },
})
```

---

## Query Hooks Reference

```ts
import {
  useDbAdminStatus, // { encryptionAvailable, activeProfileId, profileCount }
  useListDbProfiles, // DbProfile[] (passwords redacted)
  useSaveDbProfile, // mutation: create or update a profile
  useDeleteDbProfile, // mutation: remove a profile
  useActivateDbProfile, // mutation: set activeProfileId
  useTestDbConnection, // mutation: SELECT 1 against a profile
  useListMigrations, // MigrationFile[] (applied + pending)
  useDryRunMigrations, // mutation: simulate migration run
  useApplyMigrations, // mutation: apply pending migrations
  useListAuditEntries, // AuditEntry[] (last 500, newest first)
} from '@/modules/database-admin/api/db-admin.queries'
```

---

## Encryption Details

- Algorithm: **AES-256-GCM** (authenticated encryption)
- Key derivation: `scrypt(DB_CONFIG_SECRET, salt, 32)` — salt stored alongside ciphertext
- Fields encrypted at rest: `password`, `connectionUrl`
- `redactProfile()` replaces sensitive fields with `***` before sending to client
- Passwords are **never** written to the audit log

---

## Audit Log

Each write operation (save, delete, activate, test, migrate) records an `AuditEntry`:

```ts
interface AuditEntry {
  id: string
  timestamp: string // ISO 8601
  actor: string // userId from session
  action: AuditAction // 'profile:save' | 'profile:delete' | etc.
  result: 'ok' | 'error'
  details?: string // human-readable summary (no passwords)
  before?: object // redacted snapshot before change
  after?: object // redacted snapshot after change
}
```

The store caps at 500 entries; oldest entries are evicted (FIFO).

---

## Testing

Unit tests live in `tests/unit/modules/database-admin/`:

```
server/
  crypto.test.ts          # 10 tests — AES-256-GCM round-trips
  data-paths.test.ts      # 6 tests  — path resolution
  config-store.test.ts    # 8 tests  — CRUD + atomic write
  audit-store.test.ts     # 4 tests  — append + 500-cap eviction
model/
  profile.test.ts         # 12 tests — Zod schema + redactProfile
  audit.test.ts           # 11 tests — AuditEntry schema + formatAuditEntry
  migration.test.ts       # 20 tests — MigrationFile + parseMigrationFile
ui/
  DatabaseAdminPage.test.tsx  # 6 tests — renders, tabs, badges
```

Run all:

```bash
pnpm vitest run tests/unit/modules/database-admin
```

---

## Common Issues

| Symptom                            | Cause                                         | Fix                                                    |
| ---------------------------------- | --------------------------------------------- | ------------------------------------------------------ |
| "New profile" button disabled      | `DB_CONFIG_SECRET` missing or < 16 chars      | Add to `.env`                                          |
| `Buffer is not defined` in browser | `db-resolver-bridge` imported from `start.ts` | Move to `ssr.tsx` only                                 |
| Sign-in → 500 error                | PostgreSQL not running                        | `docker compose up -d db` or start local Postgres      |
| Profiles tab shows no data         | No profiles saved yet                         | Expected — click "New profile"                         |
| `import-protection` warning        | `.server.ts` file imported client-side        | Only import from `ssr.tsx` or other `.server.ts` files |
