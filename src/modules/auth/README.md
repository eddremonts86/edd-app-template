# Auth Module

Sign-in / sign-up / password recovery UI for the workspace, plus a runtime that
plugs into either **Better Auth** (local) or **Clerk** (hosted) depending on
which one is configured.

> Cannot be copied alone — the auth flow has hard dependencies on
> `@/shared/lib/auth/*` and on three file-based routes in `src/routes/auth/`
>
> - `src/routes/api/auth/$.ts`.

## What it does

- Renders a single `AuthPage` with three tabs: **Sign in**, **Create account**,
  **Forgot password**. It auto-detects which auth backend is configured and
  hides the password form when neither local auth nor Clerk is enabled.
- Surfaces Clerk SSO when `VITE_CLERK_PUBLISHABLE_KEY` is set.
- Wires the form submits to server-side actions
  (`/auth/sign-in`, `/auth/sign-up`) handled by Better Auth.
- Mounts an `InsightCard` primitive used to compose marketing copy next to
  the form.

## File map

```
src/modules/auth/
├── index.ts                  # public barrel — exports AuthPage
├── manifest.ts               # AppModuleManifest (no widgets, no nav)
└── ui/
    ├── AuthPage.tsx          # the actual page
    └── components/
        ├── AuthField.tsx     # labeled input wrapper
        └── InsightCard.tsx   # icon + text callout
```

## Public API

```ts
// from '@/modules/auth'
export { AuthPage } from './ui/AuthPage'
```

The route file (`src/routes/auth/route.tsx`) imports `AuthPage` and mounts it
at `/auth`.

## Dependencies

### Other modules (manifest)

None. `auth` is a leaf in the manifest dependency graph.

### Cross-module imports inside `auth/ui/AuthPage.tsx`

- `@/modules/core/types` — none directly, but the module is wired into
  `core/registry` for the `/auth` route.
- `@/shared/lib/auth/app-auth` — `useAppAuth()` hook (returns
  `{ isAuthenticated, ... }`).
- `@/shared/lib/auth/config` — `isBetterAuthEnabled()`,
  `isClerkEnabled()`, `getClerkPublishableKey()`.
- `@/shared/lib/auth/sign-up-validation` — `AUTH_SIGN_UP_NAME_HTML_PATTERN`,
  `AUTH_SIGN_UP_PASSWORD_HTML_PATTERN`, `AUTH_SIGN_UP_MIN_PASSWORD_LENGTH`,
  `SignUpValidationErrorCode`.
- `@/components/ui` — `Badge`, `Button`, `Card`, `Input`, `Label`.

### NPM packages used

- `@clerk/tanstack-react-start` — `SignInButton` for the Clerk SSO path.
- `@tanstack/react-router` — `Link`, `useLocation`.
- `framer-motion` — `LazyMotion`, `m.div` for the card animation.
- `lucide-react` — icons (`ArrowLeft`, `KeyRound`, `LayoutDashboard`,
  `LogIn`, `ShieldCheck`, `Sparkles`, `UserPlus`, `MailCheck`).
- `react-i18next` — `useTranslation()`.
- `react`, `react-dom`.

### Better Auth / Clerk (server-side, brought in via `src/shared/lib/auth/`)

- `better-auth` + `@better-auth/drizzle-adapter`
- `@clerk/tanstack-react-start` (already listed)

### Environment variables consumed (via `@/shared/lib/auth/config`)

| Variable                     | Effect                                          |
| ---------------------------- | ----------------------------------------------- |
| `VITE_BETTER_AUTH_ENABLED`   | `"true"` enables the local email/password form. |
| `VITE_CLERK_PUBLISHABLE_KEY` | When set, the Clerk SSO button appears.         |
| `VITE_CLERK_SECRET_KEY`      | Server-side only.                               |
| `BETTER_AUTH_SECRET`         | Server-side. Required by Better Auth.           |
| `DATABASE_URL`               | Required by Better Auth's Drizzle adapter.      |

### Drizzle schema

Auth needs the `user`, `session`, `account`, and `verification` tables that
Better Auth expects. They are defined in `drizzle/0001_add-better-auth-core.sql`
and must be migrated before this module can store a session.

## How to copy this module to another project

1. **Copy `src/modules/auth/`** (this entire folder).
2. **Bring the shared auth runtime** at `src/shared/lib/auth/`:
   - `app-auth.tsx`, `app-auth.functions.ts` — the React auth context.
   - `config.ts` — the `isBetterAuthEnabled()` / `isClerkEnabled()` helpers
     that the page reads.
   - `sign-up-validation.ts` — regex + length constants.
   - `better-auth.server.ts`, `better-auth-client.ts`,
     `form-actions.server.ts`, `authorize.ts`, `permission-map.ts` —
     required by the server-side sign-in / sign-up actions.
3. **Bring the file-based routes** (TanStack Start requires these — there is
   no way to mount auth without them):
   - `src/routes/auth/route.tsx`
   - `src/routes/auth/sign-in.tsx`
   - `src/routes/auth/sign-up.tsx`
   - `src/routes/api/auth/$.ts` — Better Auth catch-all route handler.
4. **Wire Better Auth** in your server entry (`src/server.ts` or similar)
   using `better-auth` and `@better-auth/drizzle-adapter` against your
   `DATABASE_URL`. See `src/shared/lib/auth/better-auth.server.ts` for the
   exact configuration.
5. **Run the auth migration**:
   ```bash
   pnpm db:push
   ```
   This creates the `user`, `session`, `account`, and `verification` tables.
6. **Set the env vars** in `.env`:
   ```bash
   DATABASE_URL=postgres://user:pass@localhost:5432/yourdb
   BETTER_AUTH_SECRET=$(openssl rand -base64 32)
   VITE_BETTER_AUTH_ENABLED=true
   # Optional Clerk:
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   VITE_CLERK_SECRET_KEY=sk_test_...
   ```
7. **Install the missing dependencies** if you have not already:
   ```bash
   pnpm add better-auth @better-auth/drizzle-adapter \
              @clerk/tanstack-react-start \
              framer-motion lucide-react \
              react-i18next i18next
   ```
8. **Register the module** in `src/modules/index.ts`:
   ```ts
   export { authModule } from './auth/manifest'
   ```
   and add `authModule` to the `moduleRegistry` array in
   `src/modules/core/registry.ts` (the import is already there in the
   template).

## Configuration knobs

- **Disable local auth entirely** — leave `VITE_BETTER_AUTH_ENABLED` unset or
  set to `"false"`. The page will show a notice and only the Clerk SSO
  button (if configured) will appear.
- **Switch to Clerk-only** — set `VITE_CLERK_PUBLISHABLE_KEY` and do not
  set `VITE_BETTER_AUTH_ENABLED`. The email/password form disappears.
- **Adjust password rules** — edit `AUTH_SIGN_UP_MIN_PASSWORD_LENGTH` and
  the `*_HTML_PATTERN` constants in
  `@/shared/lib/auth/sign-up-validation.ts`.

## Anti-patterns

- Do not use `<ClerkSignIn />` outside this module — go through
  `useAppAuth()` from `@/shared/lib/auth/app-auth` so switching providers
  stays a one-line config change.
- Do not import `better-auth` directly from a page or component — keep it
  server-side in `@/shared/lib/auth/`.
