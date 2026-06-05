# Dashboard Module

The protected, authenticated shell of the app. Owns the `/dashboard` layout,
the sidebar, the user menu, the notification bell, and the default dashboard
page (with its stat-card widgets).

> This module is the heart of the authenticated experience. Most other
> modules in this catalog assume the dashboard shell is present.

## What it does

- Provides `DashboardLayout` — the sidebar + main content layout used by
  every `/dashboard/*` route. It calls `getSidebarNavigation()` from
  `@/modules/core` to render the sidebar from the registry of enabled
  modules.
- Provides `DashboardPage` — the default page rendered at `/dashboard`,
  composed of stat cards (users, contact by type, recent signups, quick
  links, etc.).
- Owns the navigation chrome: `AppSidebar`, `NavMain`, `NavSecondary`,
  `NavUser`, and the `NotificationBell`.
- Declares one widget (`stats-cards`) that is always visible on the
  dashboard grid by default.

## File map

```
src/modules/dashboard/
├── index.ts                  # public barrel
├── manifest.ts               # AppModuleManifest (id: 'dashboard')
├── api/
│   ├── dashboard.fn.ts       # server function for dashboard data
│   ├── dashboard.queries.ts  # TanStack Query hooks
│   └── index.ts
├── components/
│   ├── DashboardPage.tsx
│   ├── index.ts
│   └── widgets/
│       ├── BreakdownBars.tsx
│       ├── ContactByTypeWidget.tsx
│       ├── QuickLinksWidget.tsx
│       ├── RecentSignupsWidget.tsx
│       ├── StatCard.tsx
│       ├── UsersOverviewWidget.tsx
│       └── WelcomeHero.tsx
├── model/
│   ├── index.ts
│   └── types.ts
└── ui/
    ├── navigation/
    │   ├── AppSidebar.tsx
    │   ├── NavMain.tsx
    │   ├── NavSecondary.tsx
    │   └── NavUser.tsx
    └── shell/
        ├── DashboardLayout.tsx
        └── NotificationBell.tsx
```

## Public API

```ts
// from '@/modules/dashboard'
export * from './api' // dashboard data hooks
export * from './components/DashboardPage' // the page component
export * from './model' // types
export { DashboardLayout } from './ui/shell/DashboardLayout'
```

## Dependencies

### Other modules (declared in the manifest)

None — `dashboard` is a layout shell, not a business module. However, **most
business modules in this catalog will be useless without it** because they
expect their pages to be rendered inside `DashboardLayout`.

### Cross-module imports inside `dashboard/`

- `@/modules/core` — `getSidebarNavigation` to build the sidebar.
- `@/modules/users` — for `UserProvider` (current user, role).
- `@/modules/contact-messages` — the `ContactByTypeWidget` reads the
  contact-messages dataset.
- `@/modules/ai` — the `NotificationBell` calls the AI status endpoint.

### NPM packages used

- `@tanstack/react-router` — `Link`, `Outlet`, `useLocation`.
- `@tanstack/react-query` — `useQuery` for dashboard data.
- `@tabler/icons-react` — sidebar icons (`IconDashboard`, `IconUsers`,
  `IconSettings`, `IconBell`, `IconLogout`, etc.).
- `lucide-react` — additional icons inside the widgets.
- `framer-motion` — `LazyMotion`, `m.div` for the page transitions.
- `react-i18next` — translation keys for the sidebar.
- `react`, `react-dom`.
- `recharts` — used by `BreakdownBars.tsx` for the bar chart.

### Environment variables

- `VITE_APP_NAME` — shown in the sidebar header.
- `VITE_DEFAULT_THEME` — `"light"`, `"dark"`, or `"system"`.
- `VITE_DEFAULT_LOCALE` — `"en"` or `"es"`.

### Shared infrastructure required

- `@/components/ui/*` — full shadcn/ui set (button, card, dropdown-menu,
  sheet, sidebar, avatar, badge, separator, scroll-area, skeleton, tooltip,
  popover, switch, tabs, etc.).
- `@/shared/lib/utils` — `cn`.
- `@/shared/lib/auth/app-auth` — for the user menu (sign out, role display).
- `@/shared/lib/query` — the configured TanStack Query client.
- `@/shared/lib/i18n` — i18next setup.

## How to copy this module to another project

1. **Copy `src/modules/dashboard/`** (this entire folder).
2. **Bring the shared infrastructure** — the module expects the full
   template stack:
   - `@/components/ui/*` (the entire shadcn/ui set; `Sidebar` is
     shadcn's `sidebar.tsx`).
   - `@/shared/lib/utils`, `@/shared/lib/query`, `@/shared/lib/auth/*`,
     `@/shared/lib/i18n`.
3. **Add file-based routes** for the dashboard:

   ```tsx
   // src/routes/dashboard/route.tsx
   import { createFileRoute, Outlet } from '@tanstack/react-router'
   import { DashboardLayout } from '@/modules/dashboard'

   export const Route = createFileRoute('/dashboard')({
     component: () => (
       <DashboardLayout>
         <Outlet />
       </DashboardLayout>
     ),
   })

   // src/routes/dashboard/index.tsx
   import { createFileRoute } from '@tanstack/react-router'
   import { DashboardPage } from '@/modules/dashboard'

   export const Route = createFileRoute('/dashboard/')({
     component: DashboardPage,
   })
   ```

4. **Bring the data the widgets read**:
   - `dashboard.fn.ts` calls a server function that reads aggregated
     counts from the database (users, contacts, etc.). You need either to
     copy the function as-is or replace it with your own data source.
   - The widgets in `components/widgets/` are presentational and only
     need data shaped like the types in `model/types.ts`.
5. **Register the module** in `src/modules/index.ts` and add
   `dashboardModule` to `core/registry.ts`.
6. **Set the env vars**:
   ```bash
   VITE_APP_NAME="My App"
   VITE_DEFAULT_THEME=system
   VITE_DEFAULT_LOCALE=en
   ```
7. **Install missing dependencies** (most are in the template already):
   ```bash
   pnpm add @tabler/icons-react framer-motion recharts \
              react-i18next
   ```

## Configuration knobs

- **Hide a sidebar section** — set `VITE_DISABLED_MODULES=users,settings` and
  the corresponding nav items will not render.
- **Customize the widgets shown** — the widget grid is user-configurable at
  runtime via the `WidgetConfigurator`. The default set is declared in
  `manifest.ts` and in each module's `widgets[]` field.
- **Replace the default dashboard page** — provide your own page at
  `/dashboard` and the widgets will still be available via
  `getRegisteredWidgets()`.

## Anti-patterns

- Do not put business logic in the `dashboard/ui/navigation/*` files — those
  are pure presentation. If a sidebar item needs data (e.g. a badge
  count), expose it as a `ModuleBadgeId` from your module's manifest and
  pass it through `getSidebarNavigation({ badges })`.
- Do not create routes under `/dashboard/*` outside this layout — they
  will not have the sidebar or auth guard.
