# Design System — edd-app-template

## Theme

**Mode:** Light + Dark (system-preference, manual toggle via `useSettings`).  
**Framework:** Tailwind CSS v4 with OKLCH CSS custom properties. All color tokens map from `--color-*` Tailwind aliases to CSS vars.  
**Component library:** Shadcn UI (Radix UI primitives). Source of truth for all interactive components — do NOT edit files under `src/components/ui/`.  
**Border radius base:** `1.25rem` (`--radius`). Derived: sm `calc(var(--radius) - 4px)`, md `calc(var(--radius) - 2px)`, xl `calc(var(--radius) + 4px)`, 2xl `calc(var(--radius) + 8px)`.

---

## Color Palette

All values in OKLCH. Neutrals are tinted toward hue ~240 (cool slate) in light mode and hue ~30 (warm charcoal) in dark mode.

### Light Mode

| Token                  | OKLCH                    | Use                                                |
| ---------------------- | ------------------------ | -------------------------------------------------- |
| `--background`         | `oklch(0.96 0.005 240)`  | Page canvas — very light cool white                |
| `--foreground`         | `oklch(0.15 0.01 240)`   | Primary text                                       |
| `--card`               | `oklch(1 0 0)`           | Card surfaces                                      |
| `--card-foreground`    | `oklch(0.15 0.01 240)`   | Card text                                          |
| `--primary`            | `oklch(0.60 0.20 35)`    | **Coppery orange** — buttons, active states, rings |
| `--primary-foreground` | `#ffffff`                | Text on primary                                    |
| `--secondary`          | `oklch(0.93 0.01 240)`   | Secondary surfaces                                 |
| `--muted`              | `oklch(0.93 0.01 240)`   | Muted backgrounds                                  |
| `--muted-foreground`   | `oklch(0.5 0.01 240)`    | Subdued text                                       |
| `--accent`             | `oklch(0.97 0.015 35)`   | Hover tints on primary                             |
| `--accent-foreground`  | `oklch(0.25 0.04 35)`    | Text on accent                                     |
| `--destructive`        | `oklch(0.58 0.24 28.48)` | Errors, delete actions                             |
| `--border`             | `oklch(0.92 0.008 240)`  | Default borders                                    |
| `--ring`               | `oklch(0.60 0.20 35)`    | Focus rings — matches primary                      |
| `--sidebar`            | `oklch(1 0 0)`           | Sidebar background                                 |
| `--sidebar-primary`    | `oklch(0.60 0.20 35)`    | Sidebar active item                                |
| `--sidebar-accent`     | `oklch(0.97 0.015 35)`   | Sidebar hover                                      |

### Dark Mode — "Obsidian Aurora"

Cool indigo-tinted neutrals (hue 250) replace the previous warm charcoal (hue 30). Five-tier elevation system, luminous borders, brand orange dialed down in chroma.

| Token                  | OKLCH                    | Use                                                 |
| ---------------------- | ------------------------ | --------------------------------------------------- |
| `--background`         | `oklch(0.145 0.012 250)` | Obsidian canvas — black with whisper of indigo      |
| `--foreground`         | `oklch(0.96 0.005 250)`  | Off-white, cool-tinted                              |
| `--card`               | `oklch(0.205 0.015 250)` | Elevated surface 1                                  |
| `--popover`            | `oklch(0.245 0.014 250)` | Elevated surface 2 (above card)                     |
| `--sidebar`            | `oklch(0.175 0.013 250)` | Sidebar (distinct from bg, slightly cooler)         |
| `--muted`              | `oklch(0.235 0.012 250)` | Muted surfaces (chips, badges, secondary buttons)   |
| `--muted-foreground`   | `oklch(0.68 0.012 250)`  | Subdued text on dark                                |
| `--primary`            | `oklch(0.72 0.18 38)`    | Coppery orange — chroma dialed down from 0.22→0.18  |
| `--primary-foreground` | `oklch(0.14 0.01 250)`   | Dark text on primary (better contrast on orange)    |
| `--accent`             | `oklch(0.28 0.04 38)`    | Hover tints — warm and clearly distinct             |
| `--border`             | `oklch(0.32 0.012 250)`  | **Luminous** — lighter than the surface (edge glow) |
| `--input`              | `oklch(0.28 0.012 250)`  | Form inputs                                         |
| `--ring`               | `oklch(0.72 0.18 38)`    | Focus ring (matches primary)                        |

**Elevation rules:**

1. `background` < `sidebar` < `card` < `muted`/`accent` < `popover`
2. Borders are intentionally _lighter_ than the surface they sit on, simulating edge-light.
3. Shadows are true black with high opacity (0.3–0.7) so elevated surfaces cast a believable drop on the dark canvas.

### Semantic Colors (Status)

Derived from Badge variants — not CSS vars, use Tailwind classes:

- **Success**: `text-green-500`, `bg-green-50/50`, `border-green-200` (dark: `dark:bg-green-950/20`)
- **Warning**: `text-amber-500`, `bg-amber-50`
- **Error**: `text-red-500`, `bg-red-50`
- **Info**: `text-blue-500`, `bg-blue-50`

---

## Typography

| Role      | Family           | Notes                                                                  |
| --------- | ---------------- | ---------------------------------------------------------------------- |
| Body / UI | **Geist** (sans) | Loaded via `next/font` equivalent; fallback `ui-sans-serif, system-ui` |
| Monospace | **Geist Mono**   | Used in code blocks, API endpoints, model IDs                          |
| Serif     | Geist (serif)    | Rarely used; available as fallback                                     |

**Scale (Tailwind defaults, fluid via `clamp` where needed):**

- `text-xs` — 12px — table meta, badges, timestamps
- `text-sm` — 14px — body, form labels, card descriptions
- `text-base` — 16px — default body
- `text-lg` — 18px — card titles
- `text-xl` — 20px — section headings
- `text-2xl` — 24px — page headings
- `text-3xl`+ — Hero / marketing

**Tracking:** `tracking-tight` on headings. Default tracking on body.  
**Font weight:** `font-normal` body, `font-medium` labels/nav, `font-semibold` card titles, `font-bold` page headings.

---

## Layout & Spacing

**Dashboard shell:**

- Sidebar: fixed-width collapsible left rail
- Main content: full remaining width, `p-6` internal padding
- Settings: 2-column layout — collapsible nav (left) + content area (right), `w-full` no artificial max-width cap

**Card anatomy:**

- `CardHeader`: icon + title + description stacked, `pb-4`
- `CardContent`: `pt-0` when following header
- No nested cards. Cards do not have shadows by default in light mode; `shadow-sm` for elevated surfaces

**Widget grid:** 12-column masonry system at `lg` breakpoint. Widget col-span set via `--col-span` CSS var.

**Section spacing:** `space-y-6` between cards in a column, `gap-6` in grids.

---

## Components

All from Shadcn UI at `src/components/ui/`. Key patterns:

- **Sheet** — Right-side panel for create/edit forms. Used via `EditSheet` convention.
- **Tabs** (`variant="line"`) — Underline tabs, `TabsList` with `grid` for equal widths.
- **Badge** — `variant` options: `default`, `secondary`, `destructive`, `outline`, `success`, `warning`.
- **Button** — Sizes: `sm`, `default`, `lg`, `icon`. Variants: `default`, `secondary`, `outline`, `ghost`, `destructive`, `link`.
- **Select / Combobox** — Always pair with `Field` + `FieldLabel` from form helpers.
- **Toast** — Used for all success/error feedback. No `window.confirm()` — confirmations use `toast.error` + action button pattern.
- **Collapsible** — From `radix-ui` directly: `import { Collapsible as CollapsiblePrimitive } from 'radix-ui'`.
- **Switch** — Toggles for boolean settings. Always labeled.

---

## Motion

Tailwind animate plugin (`tailwindcss-animate`) + custom keyframes:

- `animate-fade-in` / `animate-fade-out` — `0.2s ease-out`
- `animate-slide-in` / `animate-slide-out` — `translateY(-10px)` to `0`, `0.2s ease-out`
- `animate-accordion-down/up` — height collapse via `--radix-accordion-content-height`

**Conventions:**

- Entry animations on new sheet panels: `animate-in slide-in-from-right`
- Toast: handled by Sonner
- No bounce/elastic easing — only `ease-out` or `ease-in-out`
- Always include `prefers-reduced-motion` consideration: Tailwind's `motion-reduce:` variant

---

## Icons

**Library:** `@tabler/icons-react` — all icons prefixed `Icon*`.  
**Size convention:** `size-4` (16px) inline in text/buttons, `size-5` in card headers, `size-8` for feature icons, `size-12` for illustration-scale.  
**Known valid icons used in this project:** `IconSettings`, `IconCode`, `IconLanguage`, `IconRobot`, `IconActivity`, `IconTool`, `IconAdjustmentsHorizontal`, `IconLoader2`, `IconBrain`, `IconWorldCheck`, `IconPlugConnected`, `IconFileText`, `IconPlayerPlay`, `IconChevronUp`, `IconChevronDown`, `IconRefresh`, `IconKey`, `IconCircleCheck`, `IconCircleX`.

> Note: `IconWrench` does NOT exist in this package. Use `IconTool` instead.

---

## i18n

All UI strings go through `useTranslation()`. No hardcoded text in components.  
Key namespaces: `common`, `settings`, `dashboard`, `auth`.  
Locales: `en` (primary), `es`, `dk`. Always update all three when adding keys.

---

## Dark Mode

Toggle via `useSettings().theme`. Applied as `.dark` class on `<html>`.  
All colors use CSS vars — dark mode is automatic. Don't hardcode `bg-white` or `text-black` — use `bg-background`, `text-foreground`.  
Dark mode shadows are heavier (`oklch(0 0 0 / 0.15–0.4)` vs `0.02–0.1` in light).
