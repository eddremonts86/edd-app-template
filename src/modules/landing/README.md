# Landing Module

The public marketing page rendered at `/` — Hero, Features, Pricing, Services,
Comparison, Five-Day Plan, Contact form, Footer. Plus a topbar with public
navigation.

> This module is the entry point of the app and is enabled by default. It is
> read-only and unauthenticated, so it is the easiest module to copy.

## What it does

- Composes the homepage from a series of themed blocks (hero, features,
  services, comparison, plan, contact, footer).
- Provides a `LandingLayout` shell with the marketing topbar.
- Exposes a `Topbar` (with `NavLink`) and a `useWaveAnimation` hook used by
  the hero.
- The contact form posts to `/api/contact-messages` (handled by the
  `contact-messages` module) — that is the only inter-module call.

## File map

```
src/modules/landing/
├── index.ts                  # public barrel
├── manifest.ts               # AppModuleManifest (id: 'landing')
├── components/
│   ├── HomePage.tsx          # the page assembled from the blocks below
│   ├── ComparisonBlock.tsx
│   ├── ContactBlock.tsx
│   ├── ContactForm.tsx
│   ├── ContactInfoCard.tsx
│   ├── FeatureCard.tsx
│   ├── FeatureCardsBlock.tsx
│   ├── FiveDayPlanBlock.tsx
│   ├── FooterBlock.tsx
│   ├── FooterColumn.tsx
│   ├── GlowyWavesHero.tsx
│   ├── OurServicesSection.tsx
│   ├── ServiceCard.tsx
│   ├── SocialLinks.tsx
│   ├── WorkingHoursCard.tsx
│   └── index.ts              # barrel for the components folder
├── hooks/
│   └── useWaveAnimation.ts
├── types/
│   └── home.types.ts
└── ui/
    ├── LandingLayout.tsx
    └── topbar/
        ├── Topbar.tsx
        ├── NavLink.tsx
        ├── constants.ts
        ├── nav-config.ts
        └── types.ts
```

## Public API

```ts
// from '@/modules/landing'
export * from './components' // HomePage, FooterBlock, etc.
export { LandingLayout } from './ui/LandingLayout'
export { Topbar } from './ui/topbar/Topbar'
```

## Dependencies

### Other modules (declared in the manifest)

- `updates` — the landing page embeds a `StarterUpdatesSignup` block from
  the `updates` module. The manifest declares it as a dependency, so
  `getEnabledModules()` pulls it in automatically when `landing` is active.

### Cross-module imports inside `landing/`

- `@/modules/contact-messages` — `ContactForm` posts to
  `/api/contact-messages`; types in `model/types.ts` are used by the
  LandingLayout.
- `@/modules/updates` — `StarterUpdatesSignup` block in `HomePage.tsx`.
- `@/modules/settings` — `useSettings` (the landing page reads site
  settings for things like the app name in the footer).
- `@/modules/core` — only for types, indirectly.

### NPM packages used

- `@tanstack/react-router` — `Link`, `useNavigate`.
- `framer-motion` — `m.div`, scroll/parallax animations.
- `lucide-react` — `*` icons (Mail, MapPin, Phone, Twitter, etc.).
- `clsx`, `tailwind-merge` — `cn` helper from `@/shared/lib/utils`.
- `react-i18next` — `useTranslation()` for all visible strings.
- `react`, `react-dom`.

### Environment variables

- `VITE_APP_NAME` — shown in the footer and meta tags.
- `VITE_SITE_URL` — used for the canonical link and OpenGraph tags.

### Shared infrastructure required

- `@/components/ui/*` — `Button`, `Card`, `Input`, `Label`, `Textarea`,
  `Sheet`, `Dialog`, `Badge`, `Separator`.
- `@/shared/lib/utils` — `cn` helper.
- `@/shared/lib/i18n` — i18next initialization.

## How to copy this module to another project

1. **Copy `src/modules/landing/`** (this entire folder).
2. **Bring the shared pieces it touches:**
   - `@/components/ui/*` (see file map).
   - `@/shared/lib/utils` (`cn`).
   - `@/shared/lib/i18n` (i18next setup with at least an `en` and `es`
     translation file under `public/locales/`).
3. **Add a file-based route** for the homepage:

   ```tsx
   // src/routes/index.tsx
   import { createFileRoute } from '@tanstack/react-router'
   import { HomePage } from '@/modules/landing'

   export const Route = createFileRoute('/')({
     component: HomePage,
   })
   ```

4. **Register the module** in `src/modules/index.ts` and add `landingModule`
   to `core/registry.ts`.
5. **(Optional) Bring the `updates` module** if you want the "Subscribe to
   updates" block on the homepage. It is declared as a dependency in the
   manifest, so it will load automatically — but you still need to copy its
   folder over.
6. **(Optional) Bring the `contact-messages` module** if you want the
   contact form to actually deliver the message. Without it the form will
   post to a route that returns 404.
7. **Set the env vars** in `.env`:
   ```bash
   VITE_APP_NAME="My App"
   VITE_SITE_URL="https://myapp.com"
   ```
8. **Install missing deps** (most are likely already in the template):
   ```bash
   pnpm add framer-motion lucide-react react-i18next i18next
   ```

## Customization tips

- **Replace the hero** — `GlowyWavesHero.tsx` is the only hero; swap it for
  a different one and the rest of the page does not need to change.
- **Edit the navigation links** — `src/modules/landing/ui/topbar/nav-config.ts`
  is the single source of truth for what appears in the topbar.
- **Change the feature cards** — `FeatureCardsBlock.tsx` reads the list
  from a hard-coded array; edit it directly.
- **Brand colors** — all blocks use Tailwind utility classes that read from
  the design tokens in `tailwind.config.ts`; you can re-skin the page
  without touching this module.

## Anti-patterns

- Do not put authenticated UI (dashboard, settings, etc.) inside
  `landing/`. The landing layout assumes a logged-out viewer and is not
  wrapped in the dashboard's auth guard.
- Do not import from `@/modules/dashboard` — `landing` is the only module
  that should be visible to unauthenticated users, and adding a dashboard
  import creates a circular dependency.
