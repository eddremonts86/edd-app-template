---
name: module-architecture
description: Arquitectura modular de TanStack Template. Usar cuando se creen, muevan o refactoricen módulos en src/modules/*, se modifiquen manifests, registry, barrels, o se deban respetar las reglas de propiedad de módulos (module ownership). También aplica cuando se trabaja con src/routes como adaptadores delgados o con src/modules/core como kernel.
---

# Module Architecture Skill

## Core Mental Model

Every business capability lives in `src/modules/<name>/`. Routes are thin adapters.
**Never** add business logic to `src/routes/`, `src/shared/`, or `src/modules/core/`.

## Module Anatomy

```
src/modules/<name>/
├── manifest.ts        ← source of truth: id, routes, navigation, dependencies
├── index.ts           ← public barrel (only export public API)
├── model/             ← types.ts, schema.ts (Zod), index.ts
├── api/               ← *.fn.ts (server fns / axios calls) + *.queries.ts (TQ hooks)
├── components/ | ui/  ← React components owned by this module
├── server/            ← server-only helpers (never imported client-side)
└── config/            ← module config, env resolution
```

## Manifest Contract

Every module **must** export a typed `AppModuleManifest` from `manifest.ts`:

```ts
import type { AppModuleManifest } from '@/modules/core/types'

export const myModule: AppModuleManifest = {
  id: 'my-module', // unique slug, kebab-case
  title: 'My Module',
  description: 'One line description.',
  enabledByDefault: true, // omit = true
  dependencies: ['core', 'dashboard'], // IDs of required modules
  routes: [{ path: '/dashboard/my-module', kind: 'page' }],
  navigation: [
    {
      id: 'workspace',
      title: 'Workspace',
      kind: 'main',
      order: 50,
      items: [
        {
          id: 'my-module',
          titleKey: 'sidebar.main.myModule',
          fallbackTitle: 'My Module',
          to: '/dashboard/my-module',
          icon: IconBuildingStore,
          order: 60,
        },
      ],
    },
  ],
}
```

After creating the manifest, register it in `src/modules/core/registry.ts`.

## Ownership Rules (CRITICAL)

| Location              | Allowed                                                                |
| --------------------- | ---------------------------------------------------------------------- |
| `src/modules/<name>/` | All business logic, UI, server helpers                                 |
| `src/modules/core/`   | Only: `types.ts`, `registry.ts`, `config.ts`, `navigation.ts`          |
| `src/modules/shared/` | Business-domain code reused by 2+ modules                              |
| `src/shared/`         | Cross-cutting infra: api client, query wrappers, auth lib, i18n, utils |
| `src/routes/`         | Thin adapters only — import pages from owning module                   |
| `src/components/ui/`  | Generic Shadcn/Radix primitives only                                   |

**Never** import from another module's internal paths. Only consume through the public `index.ts` barrel.

## Barrel Pattern

```ts
// src/modules/projects/index.ts — only public API
export { ProjectsPage } from './components/ProjectsPage'
export { ProjectForm } from './components/ProjectForm'
export * from './api/projects.fn'
export * from './api/projects.queries'
export { PROJECT_MEMBER_ROLES } from './model/types'
// ❌ NEVER export internal helpers or private components
```

## Route Adapter Pattern

```tsx
// src/routes/_dashboard/projects.tsx — thin adapter
import { createFileRoute } from '@tanstack/react-router'
import { ProjectsPage } from '@/modules/projects'

export const Route = createFileRoute('/_dashboard/projects')({
  component: ProjectsPage,
})
```

## Registry Registration

After creating `manifest.ts`, add to `src/modules/core/registry.ts`:

```ts
import { myModule } from '@/modules/my-module/manifest'
// Add to moduleRegistry array in the correct order (UI render order)
export const moduleRegistry: AppModuleManifest[] = [
  // ...existing,
  myModule,
]
```

## Module Activation & Dependencies

- `enabledByDefault: false` → module is off unless explicitly enabled via env
- `dependencies: ['auth']` → module is auto-activated when 'auth' is active
- `VITE_ENABLED_MODULES=projects,tasks` env overrides defaults

## Navigation Integration

Navigation sections have `kind: 'main' | 'secondary'` and `order` for sorting.
Items inside have `order` for relative position within the section.
Sidebar reads sections dynamically via `getEnabledModules()` → navigation runtime.

## Checklist (New Module)

- [ ] `manifest.ts` with correct `id`, `routes`, `navigation`
- [ ] Registered in `src/modules/core/registry.ts`
- [ ] `index.ts` barrel with only public exports
- [ ] `model/` with TypeScript types + Zod schemas
- [ ] `api/` with `*.fn.ts` (server/axios) + `*.queries.ts` (TQ hooks)
- [ ] Route file in `src/routes/` is a thin adapter
- [ ] No cross-module internal imports
- [ ] i18n keys added to all 3 locale files (en/es/dk)

---

## Server-Only Code: `.server.ts` Convention

### `src/start.ts` is ISOMORPHIC — runs on client AND server

TanStack Start's `hydrateStart.js` imports `start.ts` on the browser client.
**Any top-level import of a Node.js module (`fs`, `crypto`, `postgres`, etc.)
from `start.ts` will crash the client** with errors like:

- `Buffer is not defined`
- `crypto is not defined`
- `Module "fs" has been externalized for browser compatibility`

### Use `src/ssr.tsx` for server-only initialization

`src/ssr.tsx` is the SSR handler — it only runs on the server:

```ts
// ✅ src/ssr.tsx — safe place for Node.js initialization
import { installDbAdminResolver } from '@/modules/database-admin/server/db-resolver-bridge.server'
installDbAdminResolver()
```

```ts
// ❌ src/start.ts — DO NOT import Node.js code here
// Only middleware, Clerk, Sentry, observability (no fs/crypto/postgres at top level)
```

### `.server.ts` file suffix

Files ending in `.server.ts` are **stubbed** by TanStack Start's Vite plugin on
the client — their exports become no-ops. However:

- If a stubbed function is **called** client-side, TanStack Start throws an
  `import-protection` runtime error in dev
- The stub prevents the Node.js code from reaching the bundle, but does not
  prevent call-time errors if you invoke the function from client code

**Rule**: Server-only modules must only be imported from:

1. Other `.server.ts` files
2. `.fn.ts` server functions (run server-side via createServerFn)
3. `src/ssr.tsx`

### Checklist for new server-only module helpers

- [ ] File named `*.server.ts`
- [ ] NOT imported from `src/start.ts`
- [ ] Side-effect initialization called from `src/ssr.tsx`
- [ ] No top-level dynamic `import()` of Node.js modules from non-server files

---

## References

Load these files for real implementation patterns from the codebase:

- `references/module-patterns.md` — manifest shape, registry registration, barrel pattern, route adapter, owned-files inventory, anti-pattern examples
- `src/modules/projects/` — canonical reference implementation (most complete module)
- `src/modules/database-admin/` — example of server-only resolver pattern + `.server.ts` usage
