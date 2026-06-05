# Core Kernel

`src/modules/core` is the required kernel of the modular system. It is **not** a
business module and it must not be used as a catch-all for shared UI or
infrastructure.

> If you want to use any other module from this catalog, you must also copy
> this one — they all import from it.

## What it does

- Defines the **shape of a module manifest** (`AppModuleManifest`) — id,
  routes, navigation, widgets, dependencies.
- Maintains the **module registry**: a single array that lists every module
  in the app (`moduleRegistry` in `registry.ts`).
- Resolves which modules are **active** at runtime, reading
  `VITE_ENABLED_MODULES` / `VITE_DISABLED_MODULES` from the environment and
  walking the dependency graph.
- Provides **navigation helpers** that the sidebar uses to merge every
  module's `navigation[]` into one ordered list, filtered by user role.
- Provides the **widget system**: a registry of dashboard widgets contributed
  by individual modules, a configurator UI, a draggable grid, and an
  edit-mode context.

## File map

```
src/modules/core/
├── README.md                  # you are here
├── config.ts                  # env-driven enable/disable logic
├── navigation.ts              # sidebar + dashboard title builders
├── registry.ts                # the canonical module list
├── types.ts                   # AppModuleManifest, WidgetDefinition, etc.
└── widget/
    ├── index.ts               # barrel — what the rest of the app imports
    ├── components/
    │   ├── SortableWidgetItem.tsx
    │   ├── WidgetConfigurator.tsx
    │   ├── WidgetControls.tsx
    │   ├── WidgetGrid.tsx
    │   └── WidgetRenderer.tsx
    ├── config/
    │   ├── widget-config.ts          # useWidgetConfig hook + types
    │   └── widget-edit-mode.tsx      # WidgetEditModeProvider / useWidgetEditMode
    └── registry/
        └── widget-registry.ts        # collects widgets from all enabled modules
```

## Public API (what the rest of the app imports)

From `@/modules/core/types`:

- `AppModuleManifest`, `AppModuleRouteDefinition`, `AppModuleNavigationSection`,
  `AppModuleNavigationItem`, `WidgetDefinition`, `WidgetSize`

From `@/modules/core/registry`:

- `moduleRegistry`, `getEnabledModules`, `getModuleById`, `getModuleByRoute`

From `@/modules/core/navigation`:

- `getSidebarNavigation`, `getDashboardPageTitle`

From `@/modules/core/widget`:

- `WidgetGrid`, `WidgetRenderer`, `WidgetConfigurator`,
  `WidgetEditModeProvider`, `useWidgetEditMode`, `useWidgetConfig`,
  `getRegisteredWidgets`, `getWidgetById`,
  `SortableWidgetItem`, `WidgetRefreshButton`, `WidgetRefreshingIndicator`

## Dependencies

### Cross-module

This module is the kernel — every other module imports from it. **It must be
present**, otherwise `registry.ts` of every other module fails to type-check.

### Cross-module imports inside `core/`

`core/types.ts` and `core/navigation.ts` import role types from
`@/modules/users/model/permissions`. To copy `core` to another project you
must also bring along the `AppRoleKey` type (or replace it with your own role
hierarchy).

### NPM packages used (directly or transitively)

- `@tabler/icons-react` — `Icon` type
- `react`, `react-dom`
- `i18next` — `TFunction` for navigation labels
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers`,
  `@dnd-kit/utilities` — drag-and-drop widget grid
- `@radix-ui/react-scroll-area` and other Radix primitives the widgets use
- `framer-motion` (transitively, via the widget items)
- `clsx`, `tailwind-merge` (via `@/components/ui`)

### Shared infrastructure required

The widget components import from:

- `@/components/ui/*` — shadcn/ui primitives (button, card, dialog, etc.)
- `@/shared/lib/*` — utilities (storage helpers, toast, i18n, etc.)

You cannot drop `core` into a project that does not have these.

## Environment variables

| Variable                | Effect                                                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_ENABLED_MODULES`  | Comma-separated list. When set, only these modules (and their transitive deps) load. Takes precedence over the default registry. |
| `ENABLED_MODULES`       | Same as above, server-side alias.                                                                                                |
| `VITE_DISABLED_MODULES` | Comma-separated list, removes modules from the resolved set.                                                                     |
| `DISABLED_MODULES`      | Same as above, server-side alias.                                                                                                |

Example:

```bash
# only auth + dashboard + users, nothing else
VITE_ENABLED_MODULES=auth,dashboard,users
```

## How to copy this module to another project

1. **Copy the entire `src/modules/core/` folder** (including `widget/`).
2. **Copy `@/modules/users/model/permissions.ts`** — `core` types and
   navigation both import `AppRoleKey` from there. If your project already
   has its own role type, change the two `import { AppRoleKey }` lines in
   `core/types.ts` and `core/navigation.ts` to point at your type.
3. **Bring the shared UI** — at minimum you need `@/components/ui/`
   (button, card, dialog, sheet, switch, dropdown, popover, scroll-area,
   skeleton, tabs, tooltip). See `src/components/ui/index.ts` for the full
   barrel.
4. **Bring the shared lib utilities** the widget components touch:
   - `@/shared/lib/utils` — `cn` helper
   - `@/shared/lib/storage` — localStorage helpers used by widget config
   - `@/shared/lib/i18n` — i18next setup
   - `@/shared/lib/toast` — toast notifications
5. **Register the kernel** by adding `moduleRegistry` from `core/registry.ts`
   to your `src/modules/index.ts` and re-export the public API listed above.
6. **Declare the env vars** in your `.env.example` (see table above).
7. **Wire the sidebar and dashboard grid** to call `getSidebarNavigation`
   and `getRegisteredWidgets()` — this is what makes the modules actually
   appear in the UI.

### Minimal `src/modules/index.ts` after the copy

```ts
export { moduleRegistry, getEnabledModules, getModuleById } from './core/registry'
export { getSidebarNavigation, getDashboardPageTitle } from './core/navigation'
export type { AppModuleManifest } from './core/types'
export { WidgetGrid, WidgetRenderer, WidgetConfigurator } from './core/widget'
```

## Anti-patterns (do not do this)

- Do not put reusable UI primitives in `core/`. Use `@/components/ui/`.
- Do not put auth, db, query, i18n, Sentry, or provider infrastructure in
  `core/`. Use `@/shared/lib/`.
- Do not put feature code shared by multiple business modules in `core/`.
  Use `@/modules/shared/`.

## Related

- `src/modules/README.md` — top-level modular architecture contract.
- `src/shared/lib/` — cross-cutting infrastructure.
- `src/components/ui/` — generic UI primitives.
