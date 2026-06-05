# Help Module

The smallest business module in the catalog. Provides a single help page at
`/dashboard/help` and a `QuickLinksWidget` that appears on the dashboard grid.

> This module is the easiest one to copy. It has no server functions, no
> database tables, and no cross-module imports beyond `core`.

## What it does

- Renders a help page at `/dashboard/help` — a curated list of links to
  docs, support channels, and shortcuts.
- Adds a "Help" item to the sidebar's secondary section
  (`IconHelp` from `@tabler/icons-react`).
- Contributes a `QuickLinksWidget` to the dashboard — appears by default
  at the bottom of the grid, lets the user jump to common sections of
  the workspace.

## File map

```
src/modules/help/
├── manifest.ts               # AppModuleManifest (id: 'help')
└── components/
    └── QuickLinksWidget.tsx
```

That's it. The whole module is two files. The `Help` page itself is
served by the file-based route at `src/routes/dashboard/help.tsx` — see
"How to copy this module" below.

## Public API

This module has no public barrel (`index.ts`). The components and pages
are imported directly from their path:

```ts
// routes
import { createFileRoute } from '@tanstack/react-router'
import { QuickLinksWidget } from '@/modules/help/components/QuickLinksWidget'
```

If you want a barrel, add one yourself:

```ts
// src/modules/help/index.ts
export { QuickLinksWidget } from './components/QuickLinksWidget'
```

## Dependencies

### Other modules (declared in the manifest)

None.

### Cross-module imports inside `help/`

- `@/modules/core` — for `AppModuleManifest` type and registry wiring.

### NPM packages used

- `react`, `react-dom`.
- `@tabler/icons-react` — `IconHelp` for the sidebar entry.

### Environment variables

None.

### Shared infrastructure required

- `@/components/ui/*` — at minimum `Card`, `Button`, `Separator`.
- `@/shared/lib/utils` — `cn`.

## How to copy this module to another project

1. **Copy `src/modules/help/`** (this entire folder, 2 files).
2. **Bring the shared pieces** — `Card`, `Button`, `Separator` from
   `@/components/ui`, plus the `cn` helper from `@/shared/lib/utils`.
3. **Add a file-based route** for the help page:

   ```tsx
   // src/routes/dashboard/help.tsx
   import { createFileRoute } from '@tanstack/react-router'

   export const Route = createFileRoute('/dashboard/help')({
     component: HelpPage,
   })

   function HelpPage() {
     return (
       <div className="space-y-4 p-6">
         <h1 className="text-2xl font-bold">Help</h1>
         <p className="text-muted-foreground">
           Need a hand? Email{' '}
           <a className="underline" href="mailto:support@myapp.com">
             support@myapp.com
           </a>
           .
         </p>
       </div>
     )
   }
   ```

   The original help page in the template is rendered inside the
   dashboard layout and is a placeholder; replace the JSX with your own
   content (FAQ, contact info, embedded docs, etc.).

4. **Register the module** in `src/modules/index.ts` and add
   `helpModule` to `core/registry.ts`. (The template already has the
   entry.)
5. **Customize the widget** — edit `components/QuickLinksWidget.tsx` to
   list whatever links you want surfaced on the dashboard. The default
   version is hard-coded; you can replace it with i18n-driven copy or
   pull the links from your CMS.

## Configuration knobs

- **Hide the help sidebar entry** — set `VITE_DISABLED_MODULES=help` in
  your `.env` and the sidebar entry will not render. The route still
  works if you visit it directly.
- **Hide the dashboard widget** — set `defaultVisible: false` on the
  `quick-links` widget in `manifest.ts`.

## Anti-patterns

- Do not put real support logic (ticketing, email integration, etc.) in
  this module. Keep it a thin shell; if you grow a support module,
  create a new one (e.g. `modules/support/`) and disable `help`.
- Do not put translated strings in this module — it is meant to be
  language-agnostic; if you need i18n keys, use the same keys the
  rest of the app uses (`sidebar.secondary.help`,
  `dashboard.widgets.quickLinks`).
