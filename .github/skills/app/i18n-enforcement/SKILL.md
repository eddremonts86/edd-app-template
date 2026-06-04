# i18n Enforcement Skill

## Purpose

Ensure ALL human-readable text in UI components (labels, buttons, placeholders, headings, descriptions, aria-labels, error messages, toast messages, empty states, tooltips) is translated via `react-i18next`'s `useTranslation()` hook — NEVER hardcoded as plain text strings.

This applies to every component under `src/` — routes, modules, shared UI, widgets, etc.

---

## Core Rule

> **Every visible text string in a JSX/TSX component MUST be wrapped in a translation function call (`t('key')`). Zero exceptions for user-facing content.**

### What MUST be translated

| Type                             | Examples                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Button labels                    | `<Button>Sign in</Button>` → `<Button>{t('auth.signIn')}</Button>`                                                        |
| Headings / subheadings           | `<h3>Settings</h3>` → `<h3>{t('settings.title')}</h3>`                                                                    |
| Labels / captions                | `<Label>Email address</Label>` → `<Label>{t('auth.labels.email')}</Label>`                                                |
| Placeholder text                 | `placeholder="you@company.com"` → `placeholder={t('auth.placeholders.email')}`                                            |
| Error / success messages         | `'Operation failed'` → `t('common.errors.operationFailed')`                                                               |
| Toast notifications              | `toast('Saved!')` → `toast(t('settings.messages.saved'))`                                                                 |
| ARIA labels                      | `aria-label="Close"` → `aria-label={t('common.actions.close')}`                                                           |
| Descriptive body text            | `<p>Credentials database is off.</p>` → `<p>{t('auth.localAuthDisabled.body')}</p>`                                       |
| Alert dialog titles/descriptions | `<AlertDialogTitle>Are you sure?</AlertDialogTitle>` → `<AlertDialogTitle>{t('common.confirm.title')}</AlertDialogTitle>` |
| Empty states                     | `<p>No results found</p>` → `<p>{t('common.empty.noResults')}</p>`                                                        |
| Tab labels / nav items           | Text inside tabs, sidebar items, breadcrumbs                                                                              |
| Badge / chip text                | `<Badge>Active</Badge>` → `<Badge>{t('common.status.active')}</Badge>`                                                    |

### What does NOT need translation

- Technical strings: CSS class names, file paths, URL fragments, numeric IDs
- Code identifiers: variable names, function names, type references
- Keyboard shortcuts: `⌘K`, `Ctrl+Shift+S` (internationalized separately if needed)
- Brand/product names: `Better Auth`, `TanStack`, `Clerk` (leave in English)
- Strings inside comments (`{/* ... */}`)
- Dynamic values from props/state (e.g., `{user.name}` rendered as-is)

---

## Workflow — When Generating or Modifying Components

### Step 1: Import useTranslation

At the top of every component file that contains user-facing text:

```tsx
import { useTranslation } from 'react-i18next'
```

### Step 2: Destructure the `t` function

```tsx
export function MyComponent(): React.JSX.Element {
  const { t } = useTranslation()
  // ...
}
```

### Step 3: Wrap all text in `t('key')`

**Before:**

```tsx
<Button>Save changes</Button>
<Label>Email address</Label>
<span>No items found</span>
```

**After:**

```tsx
<Button>{t('common.actions.save')}</Button>
<Label>{t('auth.labels.email')}</Label>
<span>{t('common.empty.noItems')}</span>
```

### Step 4: Add translation keys

If the key does not exist in the locale files yet:

1. **Add to all three locale files**: `src/shared/lib/i18n/locales/en/common.json`, `es/common.json`, `dk/common.json`
2. Keys follow the pattern: `{module}.{component}.{element}` e.g., `auth.signIn`, `settings.messages.saved`, `common.empty.noResults`
3. When in doubt about the key name, use the `i18n-deep` skill for conventions

### Step 5: Placeholder values in translations

For dynamic values, use i18n interpolation:

```tsx
// In the component:
<span>{t('users.count', { count: totalUsers })}</span>

// In the locale file:
"users.count": "{{count}} user(s) found"
```

---

## Known Problem Areas — Always Check These Files

When editing these files, verify every string:

| File                                                              | Issue                                             |
| ----------------------------------------------------------------- | ------------------------------------------------- |
| `src/modules/auth/ui/AuthPage.tsx`                                | 20+ hardcoded labels, placeholders, button text   |
| `src/modules/users/components/UserForm.tsx`                       | Section headings and descriptions                 |
| `src/modules/settings/ui/DevToolsPage.tsx`                        | Alert dialog title/description/buttons            |
| `src/modules/settings/ui/SystemSettings.tsx`                      | Same alert dialog strings as DevToolsPage         |
| `src/modules/settings/ui/AiConfigForm.tsx`                        | Contains Spanish literal strings                  |
| `src/shared/ui/tables/DataTable.tsx`                              | Contains Spanish hardcoded aria-labels and labels |
| `src/modules/ai/components/HelpChatPage.tsx`                      | Aria labels and placeholder text                  |
| `src/modules/contact-messages/components/ContactMessagesPage.tsx` | Spanish link text `Volver al Dashboard`           |
| `src/modules/dashboard/ui/shell/NotificationBell.tsx`             | sr-only label and visible heading                 |
| `src/shared/ui/selectores/InfiniteSelect.tsx`                     | Empty state text                                  |

---

## Translation Key Naming Conventions

```
{module}.{page?}.{component}.{element}

Examples:
  auth.labels.email          → "Email address"
  auth.placeholders.email    → "you@company.com"
  auth.buttons.signIn        → "Sign in"
  auth.errors.emailTaken     → "This email is already in use."
  auth.localAuthDisabled.title   → "Local Auth Disabled"
  auth.localAuthDisabled.body   → "Credentials database is currently off. Please use dynamic identity logins."
  common.confirm.title       → "Are you sure?"
  common.confirm.description → "This action cannot be undone."
  common.buttons.cancel      → "Cancel"
  common.buttons.confirm     → "Confirm"
  common.empty.noResults    → "No results found"
  settings.messages.saved    → "Settings saved successfully."
  dashboard.notifications.title  → "Notifications"
  dashboard.notifications.toggle → "Toggle notifications"
```

---

## Verification

After any component change, run the i18n check to confirm no regressions:

```bash
pnpm i18n:check
```

If this fails, the change introduces missing translation keys — add them before committing.

---

## Related Skills

- **`i18n-deep`**: Full i18n setup, key conventions, locale file structure
- **`shadcn-first`**: UI component patterns (AlertDialog, Button, Label, etc.)
- **`impeccable`**: UI audit, text quality, accessibility (aria-labels)
