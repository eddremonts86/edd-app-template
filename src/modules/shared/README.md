# Shared Module

`src/modules/shared` is the home for **business capabilities that are
reused by multiple business modules**. It is not a dumping ground for
shared UI, shared utilities, or shared infrastructure — those belong in
`@/components/ui/` and `@/shared/lib/`.

> This module is empty by design. Its only file today is a placeholder
> `index.ts`. Use it when you find yourself importing the same business
> code from two different modules.

## What it does

- **Nothing yet.** The barrel is intentionally empty:
  ```ts
  // src/modules/shared/index.ts
  // Shared module exports
  // Add shared cross-module exports here as your app grows
  ```

## When to use it

Use `src/modules/shared/` when **two or more business modules** need
the same business code. Concretely, that means any of the following:

- A **data-access layer** that more than one module queries (e.g. a
  shared `getTenantById()` that both `billing` and `settings` use).
- A **shared business type** (e.g. a `Money` value object used by
  `billing` and `reporting`).
- A **shared workflow** (e.g. an approval state machine that both
  `expenses` and `time-off` walk through).
- A **shared widget that is not specific to a single module** (e.g.
  a generic "Activity feed" widget that aggregates events from
  several modules).

## When NOT to use it

- **Reusable UI primitives** — `Button`, `Card`, `Dialog`, `Sheet`,
  `Dropdown`, `Popover`, `Tooltip`, etc. belong in
  `@/components/ui/` (shadcn/ui).
- **Cross-cutting infrastructure** — auth, db, query, i18n, Sentry,
  env handling, toasts, etc. belong in `@/shared/lib/`.
- **Layout primitives** — `DashboardLayout`, `LandingLayout`, etc.
  live with the module that owns them (`dashboard`, `landing`).
- **A single business module's shared code** — if only one module
  needs it, put it inside that module's folder.

## File map

```
src/modules/shared/
└── index.ts                  # empty placeholder
```

## Public API

```ts
// from '@/modules/shared'
// (nothing exported yet)
```

## Dependencies

This module is a leaf — nothing depends on it yet, and it depends on
nothing yet. When you add code here, it will naturally import from
`@/shared/lib/`, `@/components/ui/`, and other modules' manifests.

## How to grow this module

1. **Identify the duplication.** If two business modules import from
   the same path and you're tempted to keep them in sync, the
   duplicated piece is a candidate for `shared/`.
2. **Move the code** into a new folder under `src/modules/shared/`,
   grouped by capability:
   ```
   src/modules/shared/
   ├── tenant/
   │   ├── api/tenant.fn.ts
   │   ├── model/types.ts
   │   └── ui/TenantSwitcher.tsx
   ├── activity-feed/
   │   ├── api/activity.fn.ts
   │   ├── model/types.ts
   │   └── ui/ActivityFeed.tsx
   └── index.ts
   ```
3. **Re-export from `index.ts`**:
   ```ts
   export * from './tenant'
   export * from './activity-feed'
   ```
4. **Update the importing modules** to point at `@/modules/shared`
   instead of the duplicated path.
5. **(Optional) Register a manifest entry** for each capability if
   it needs to appear in the sidebar or on the dashboard grid:

   ```ts
   // src/modules/shared/activity-feed/manifest.ts
   import { IconActivity } from '@tabler/icons-react'
   import type { AppModuleManifest } from '@/modules/core/types'

   export const activityFeedModule: AppModuleManifest = {
     id: 'activity-feed',
     title: 'Activity Feed',
     description: 'Aggregated events across the workspace.',
     routes: [],
     navigation: [
       {
         id: 'core',
         title: 'Core',
         kind: 'main',
         order: 15,
         items: [
           {
             id: 'activity',
             titleKey: 'sidebar.main.activity',
             fallbackTitle: 'Activity',
             to: '/dashboard/activity',
             icon: IconActivity,
             order: 5,
           },
         ],
       },
     ],
   }
   ```

   Then add `activityFeedModule` to the `moduleRegistry` array in
   `core/registry.ts`.

6. **(Optional) Add a widget** that aggregates data from the
   capability — see the `core/widget/` docs for the `WidgetDefinition`
   shape.

## Anti-patterns

- Do not put a "utils" file in `shared/`. Helpers like `formatDate`
  belong in `@/shared/lib/`.
- Do not put anything in `shared/` that is only used by one
  business module. It will be tempted to drift; keep it local.
- Do not import from a specific business module (`@/modules/landing`,
  `@/modules/auth`, etc.) into `shared/`. `shared/` is **below**
  business modules in the dependency graph — it can depend on
  `@/shared/lib/` and `@/components/ui/`, but not on individual
  business modules.
- Do not put `core` itself into `shared/`. The kernel is its own
  thing and lives at `@/modules/core/`.
