# Modular Architecture

This folder is the application catalog for the template.

`src/modules/core` is the required kernel of that catalog, not a business module and not a home for shared infrastructure.

Each module owns:

- a manifest with metadata, routes, dependencies, and navigation
- the business boundary for a capability such as auth, AI, tasks, or projects
- the public API that other modules and routes should consume through the module barrel
- the future migration target for colocating UI, model, server, and integration code

Shared business capabilities that are reused by multiple modules belong under `src/modules/shared`, not in `src/features`.

Cross-cutting technical infrastructure belongs in `src/shared`, not in `src/modules/core`.

## Current state

- route files still live in `src/routes` because TanStack Start relies on file-based routing
- feature implementations now live in their owning folders under `src/modules/*`
- `src/features` is now a legacy compatibility facade and should not receive new business logic
- the module manifests now act as the source of truth for activation, navigation, and migration planning
- `src/modules/core` should stay small: types, registry, activation, and navigation runtime only

## Module index

Every module has its own README with copy-paste instructions, dependencies, and configuration knobs. Click into the one you want to reuse:

### Kernel — required

| Module                     | What it is                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------- |
| [`core`](./core/README.md) | Module registry, manifest types, navigation helpers, widget system. **Required** by every other module. |

### Business modules

| Module                                             | Routes                        | Role gate            | What it is                                                         |
| -------------------------------------------------- | ----------------------------- | -------------------- | ------------------------------------------------------------------ |
| [`landing`](./landing/README.md)                   | `/`                           | public               | Public marketing page (hero, features, services, contact, footer). |
| [`auth`](./auth/README.md)                         | `/auth`, `/api/auth/$`        | public               | Sign-in / sign-up / password recovery UI.                          |
| [`dashboard`](./dashboard/README.md)               | `/dashboard`                  | authenticated        | Protected app shell, sidebar, default dashboard page.              |
| [`users`](./users/README.md)                       | `/dashboard/users`            | admin+               | User directory, role helpers, current-user context.                |
| [`settings`](./settings/README.md)                 | `/dashboard/settings/*`       | user (system: super) | Theme, language, AI config, dev tools, system settings.            |
| [`help`](./help/README.md)                         | `/dashboard/help`             | authenticated        | Help page + Quick Links widget. (Smallest module.)                 |
| [`ai`](./ai/README.md)                             | `/api/ai/*`                   | authenticated        | Multi-provider AI, RAG, streaming chat, action cards, audit log.   |
| [`contact-messages`](./contact-messages/README.md) | `/dashboard/contact-messages` | admin+               | Landing contact form inbox + dashboard unread widget.              |
| [`database-admin`](./database-admin/README.md)     | `/dashboard/admin/database`   | super_admin          | DB connection profiles, migration runner, audit trail.             |
| [`updates`](./updates/README.md)                   | (no UI page; data only)       | public (form only)   | Starter "subscribe to updates" block. `enabledByDefault: false`.   |

### Cross-module bucket

| Module                         | What it is                                                                                                            |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| [`shared`](./shared/README.md) | Home for **business** code reused by ≥ 2 modules. **Not** for shared UI or infrastructure. (Empty placeholder today.) |

## Dependency graph (high level)

```
                           ┌──────────┐
                           │  core    │ ← every module imports from this
                           └────┬─────┘
                                │
        ┌───────────┬───────────┼───────────┬───────────┬────────────┐
        ▼           ▼           ▼           ▼           ▼            ▼
     landing     updates      auth      dashboard     users        shared
        │           │                       │           │
        │           │                       │           │
        │           └────► contact ◄────────┼──── settings
        │                       messages    │
        │                                   └──── ai
        │
        └──── (all of these are pulled in automatically
              when the manifest declares them as `dependencies`)

   database-admin  ← standalone, gated to super_admin
   help            ← standalone, tiny
```

Concretely (from each manifest):

- `landing` depends on `updates`.
- `core` transitively pulls in everyone via `registry.ts`.
- `dashboard` and `users` are referenced by `core/types.ts` and
  `core/navigation.ts` for the role hierarchy — so the kernel
  cannot exist without `users/model/permissions.ts`.
- `ai`, `settings`, `contact-messages` are leaf-to-leaf imports
  (settings → ai, dashboard → contact-messages, etc.) but no
  manifest declares a `dependencies` field for them. The dependency
  graph is implicit through the code, not enforced.

## How to copy a module to another project

1. Open the module's README (table above) — every one has a
   **"How to copy this module to another project"** section.
2. Copy the module folder.
3. Copy the shared pieces it lists (`@/components/ui/*`,
   `@/shared/lib/*`, etc.).
4. Add the file-based routes it lists (TanStack Start requires
   routes to live in `src/routes/`).
5. Add any required Drizzle tables / migrations.
6. Set the env vars it lists in `.env`.
7. Register the module in `src/modules/index.ts` and add it to
   `core/registry.ts`.

If you are copying **more than one module**, copy `core` first —
nothing else works without it.

## Target state per module

```text
src/modules/<module>/
├── manifest.ts
├── index.ts
├── ui/
├── model/
├── api/
├── server/
├── config/
└── index.ts
```

Route files should become thin adapters that import screens or handlers from these modules.
