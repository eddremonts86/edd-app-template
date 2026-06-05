# Settings Module

System and application configuration surfaces under `/dashboard/settings`.
Three top-level pages:

- **`/dashboard/settings`** — `SiteSettingsPage` (theme, language, app
  identity, dev tools toggle).
- **`/dashboard/settings/system`** — `SystemSettings` (internal
  configuration that requires a super-admin role).
- **`/dashboard/settings/ia_config`** — `AiConfigForm` (configure AI
  providers, models, parameters; also exposes the `AiLogsPage`).

Plus two dashboard widgets: `QuickSettingsWidget` (theme + language) and
`AiStatusWidget` (live connection status of all configured AI providers).

## What it does

- **Theme + language switching** — `useSettings` hook, persisted to
  `localStorage` under `DEVTOOLS_STORAGE_KEY`.
- **AI provider configuration** — `AiConfigForm` reads and writes the
  AI config store (see `src/modules/ai/data/ai-config-store.json`), with
  per-provider model discovery.
- **AI logs viewer** — `AiLogsPage` shows the audit trail of every
  configuration change.
- **Dev tools toggle** — `DevtoolsToggle` shows or hides the
  TanStack dev tools panel; persisted across reloads.
- **AI status widget** — probes each provider and shows a green/red
  indicator for whether its endpoint is reachable.

## File map

```
src/modules/settings/
├── index.ts                  # public barrel
├── manifest.ts               # AppModuleManifest (id: 'settings')
├── api/
│   ├── ai-config.api.ts      # server functions for AI config CRUD
│   ├── ai-config.queries.ts  # useAiConfigStore, useAiProviderStatuses
│   ├── site-settings.fn.ts
│   └── site-settings.queries.ts
├── components/
│   ├── AiStatusWidget.tsx
│   └── QuickSettingsWidget.tsx
├── hooks/
│   ├── useDevtoolsVisibility.ts
│   └── useSettings.ts
├── model/
│   ├── index.ts
│   └── settings.types.ts
└── ui/
    ├── AiConfigForm.tsx
    ├── AiIcons.tsx
    ├── AiLanguageAudit.tsx
    ├── AiLogsPage.tsx
    ├── DevToolsPage.tsx
    ├── DevtoolsToggle.tsx
    ├── LanguageSelector.tsx
    ├── SettingsLayout.tsx
    ├── SiteSettingsPage.tsx
    ├── SystemSettings.tsx
    └── ThemeSelector.tsx
```

## Public API

```ts
// from '@/modules/settings'
export { SiteSettingsPage } from './ui/SiteSettingsPage'
export { aiConfigApi } from './api/ai-config.api'
export { useAiConfigStore, useAiProviderStatuses } from './api/ai-config.queries'
export { AiConfigForm } from './ui/AiConfigForm'
export { AiLogsPage } from './ui/AiLogsPage'
export { DevToolsPage } from './ui/DevToolsPage'
export { SettingsLayout } from './ui/SettingsLayout'
export { SystemSettings } from './ui/SystemSettings'
export { useDevtoolsVisibility } from './hooks/useDevtoolsVisibility'
export type { SettingsState, Theme } from './model'
export { DEFAULT_SETTINGS, DEVTOOLS_STORAGE_KEY } from './model'
```

## Dependencies

### Other modules (declared in the manifest)

None. But this module **calls the `ai` module** extensively — `aiConfigApi`
and `useAiProviderStatuses` proxy to the AI runtime. So practically you
also need to bring the `ai` module if you want the AI config page to work.

### Cross-module imports inside `settings/`

- `@/modules/ai` — `useAiConfigStore`, `useAiProviderStatuses`,
  `AiProviderId`, `AiConfigFormData`, `AiConfigStore`. The `ai` runtime
  exposes the store schema; `settings` is the UI for editing it.
- `@/modules/core` — for sidebar / navigation registration.
- `@/modules/users` — for the current actor's role (SystemSettings gates
  itself behind `super_admin`).

### NPM packages used

- `@tanstack/react-router` — `Link`, `Outlet`.
- `@tanstack/react-query` — query hooks.
- `lucide-react` — icons.
- `framer-motion` — page transitions.
- `react-i18next` — translations.
- `react-hook-form` + `zod` — form state + validation in `AiConfigForm`.
- `clsx`, `tailwind-merge` — `cn`.
- `react`, `react-dom`.

### Environment variables

- `VITE_DEFAULT_THEME` — initial theme.
- `VITE_DEFAULT_LOCALE` — initial locale.
- `VITE_APP_NAME` — shown in the site settings page.
- All AI provider env vars (see `ai` module README).

### Shared infrastructure required

- `@/components/ui/*` — full shadcn/ui set.
- `@/shared/lib/utils`, `@/shared/lib/i18n`, `@/shared/lib/auth/app-auth`.
- `@/shared/lib/storage` — `localStorage` helpers used by `useSettings`.

## How to copy this module to another project

1. **Copy `src/modules/settings/`** (this entire folder).
2. **Bring the shared pieces** — see list above.
3. **Add file-based routes**:

   ```tsx
   // src/routes/dashboard/settings/route.tsx
   import { createFileRoute, Outlet } from '@tanstack/react-router'
   import { SettingsLayout } from '@/modules/settings'

   export const Route = createFileRoute('/dashboard/settings')({
     component: () => (
       <SettingsLayout>
         <Outlet />
       </SettingsLayout>
     ),
   })

   // src/routes/dashboard/settings/index.tsx
   import { createFileRoute } from '@tanstack/react-router'
   import { SiteSettingsPage } from '@/modules/settings'
   export const Route = createFileRoute('/dashboard/settings/')({
     component: SiteSettingsPage,
   })

   // src/routes/dashboard/settings/system.tsx
   import { createFileRoute } from '@tanstack/react-router'
   import { SystemSettings } from '@/modules/settings'
   export const Route = createFileRoute('/dashboard/settings/system')({
     component: SystemSettings,
   })

   // src/routes/dashboard/settings/ia_config.tsx
   import { createFileRoute } from '@tanstack/react-router'
   import { AiConfigForm, AiLogsPage } from '@/modules/settings'
   // you can either render the form or the logs page; the manifest declares both
   ```

4. **(Recommended) Bring the `ai` module** — without it, the AI config page
   and the `AiStatusWidget` will fail to load. The `ai` module provides the
   server functions and the `ai-config-store.json` file that
   `AiConfigForm` reads and writes.
5. **Register the module** in `src/modules/index.ts` and add
   `settingsModule` to `core/registry.ts`.
6. **Set env vars**:
   ```bash
   VITE_DEFAULT_THEME=system
   VITE_DEFAULT_LOCALE=en
   VITE_APP_NAME="My App"
   ```
7. **Install missing deps**:
   ```bash
   pnpm add framer-motion lucide-react react-hook-form zod
   ```

## Configuration knobs

- **Hide the dev tools toggle** — call
  `useDevtoolsVisibility(false)` somewhere early in the app, or omit the
  `<DevtoolsToggle />` mount point.
- **Restrict SystemSettings** — the page already requires `super_admin`
  via the role check; tighten further by editing `SystemSettings.tsx`.
- **Add a new settings page** — create a new file under `ui/`, declare a
  route, and add the corresponding entry in `manifest.ts` so the sidebar
  picks it up.

## Anti-patterns

- Do not store the user's theme/language directly in your own code; use
  `useSettings` and `DEFAULT_SETTINGS` from this module. They are the only
  place that knows the persistence key.
- Do not import `ai-config-store.json` from a different module — the `ai`
  module is the source of truth; this module only edits the file.
- Do not put authenticated user-specific settings here (e.g. notification
  preferences) — those belong in a "profile" module under
  `/dashboard/profile`, not in the workspace-wide `settings` module.
