# Updates Module

A starter "subscribe to product updates" capability used by the landing
page. The visitor enters an email; the module persists it and (optionally)
sends a confirmation message via the contact-messages module.

> This module is `enabledByDefault: false`. The landing page declares it
> as a dependency, but it will not load unless you explicitly enable it
> with `VITE_ENABLED_MODULES=updates` or by setting
> `enabledByDefault: true` in the manifest.

## What it does

- **`<StarterUpdatesSignup />` block** — email input + submit button,
  used in the landing page's `HomePage.tsx`.
- **Server function** — `/api/updates` accepts the email, validates it
  with Zod, and stores it in the `starter_updates` table.
- **TanStack Query hooks** — `useSubscribeToUpdates`,
  `useStarterUpdatesList` (for the admin-side listing page if you add
  one).
- **Drizzle schema** — `starter_updates` table with `id`, `email`,
  `created_at`, `confirmed_at`.

## File map

```
src/modules/updates/
├── index.ts                  # public barrel
├── manifest.ts               # AppModuleManifest (id: 'updates')
├── api/
│   ├── updates.fn.ts         # server functions
│   └── updates.queries.ts    # TanStack Query hooks
├── components/
│   ├── StarterUpdatesSignup.tsx
│   └── index.ts
└── model/
    ├── index.ts
    └── schema.ts             # Zod + Drizzle table definition
```

## Public API

```ts
// from '@/modules/updates'
export { updatesModule } from './manifest'
export * from './components' // StarterUpdatesSignup
export * from './api/updates.fn' // server functions
export * from './api/updates.queries' // query hooks
export * from './model' // types + schema
```

## Dependencies

### Other modules (declared in the manifest)

None. But it is **declared as a dependency by `landing`** — the
landing manifest lists `dependencies: ['updates']`, so when `landing`
is active, the registry pulls `updates` in automatically.

### Cross-module imports inside `updates/`

- `@/modules/core` — for the manifest type.

### NPM packages used

- `@tanstack/react-query` — `useMutation`.
- `react-hook-form` + `zod` — form state + validation.
- `lucide-react` — icons.
- `clsx`, `tailwind-merge` — `cn`.
- `react-i18next` — translations.
- `react`, `react-dom`.

### Environment variables

None.

### Shared infrastructure required

- `@/components/ui/*` — at minimum `Input`, `Button`, `Label`.
- `@/shared/lib/utils` — `cn`.
- `@/shared/lib/query` — TanStack Query client.
- `@/shared/lib/db` — Drizzle client + `starter_updates` table.

### Database tables required

| Table             | Required columns (at minimum)               |
| ----------------- | ------------------------------------------- |
| `starter_updates` | `id`, `email`, `created_at`, `confirmed_at` |

There is no migration file checked in for this table — it is created
the first time the dev server starts (or you can run
`pnpm db:push` after adding the schema to your project).

## How to copy this module to another project

1. **Copy `src/modules/updates/`** (this entire folder, ~6 files).
2. **Bring the shared pieces** — see list above.
3. **Add the `starter_updates` Drizzle table**:
   ```ts
   // schema.ts
   export const starterUpdates = pgTable('starter_updates', {
     id: uuid('id').primaryKey().defaultRandom(),
     email: text('email').notNull().unique(),
     createdAt: timestamp('created_at').notNull().defaultNow(),
     confirmedAt: timestamp('confirmed_at'),
   })
   ```
   Then run `pnpm db:push`.
4. **Add a file-based route** for the server function:

   ```tsx
   // src/routes/api/updates.ts
   import { createAPIFileRoute } from '@tanstack/react-start/api'
   import { updatesHandler } from '@/modules/updates/api/updates.fn'

   export const Route = createAPIFileRoute('/api/updates')({
     POST: updatesHandler,
   })
   ```

5. **Mount the signup block** wherever you want it in the landing
   page. If you brought the `landing` module too, the block is
   already included in `HomePage.tsx` (gated behind
   `enabledByDefault: true`).
6. **Enable the module** in one of two ways:
   - **Set `enabledByDefault: true` in `manifest.ts`** — the simplest.
   - **Or opt-in per environment**: add `updates` to
     `VITE_ENABLED_MODULES` in `.env`:
     ```bash
     VITE_ENABLED_MODULES=landing,updates,auth,dashboard
     ```
7. **Register the module** in `src/modules/index.ts` and add
   `updatesModule` to `core/registry.ts`. (The template already has
   the import.)
8. **Install missing deps**:
   ```bash
   pnpm add react-hook-form zod lucide-react
   ```

## Configuration knobs

- **Skip the confirmation email** — the default behavior just stores
  the email. To send a confirmation, edit the server function in
  `api/updates.fn.ts` to call your transactional email provider.
- **Add a "manage subscription" page** — there is no admin-side UI
  in this module; create one under
  `/dashboard/admin/updates` and reuse `useStarterUpdatesList` from
  `api/updates.queries.ts`.
- **Throttle signups** — the server function does not rate-limit.
  Add a rate-limiter (e.g. `upstash/ratelimit`) before exposing it
  publicly.

## Anti-patterns

- Do not put other types of "subscriptions" (newsletter, marketing
  email, push notifications) in this module. The schema is locked to
  "starter updates"; reuse the table only for the same purpose.
- Do not skip the Zod validation in the server function. Without it,
  a malicious client can submit anything into the `email` column.
- Do not commit the `starter_updates` table's contents to the repo
  in production — it contains PII.
