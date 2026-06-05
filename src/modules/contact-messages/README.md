# Contact Messages Module

Capture contact briefs from the landing page, store them, list them on
`/dashboard/contact-messages`, and surface the unread count on the
dashboard.

> Small but DB-bound. Requires a `contact_messages` table and is gated
> to the `admin` role for the dashboard view.

## What it does

- **`/api/contact-messages` (server function)** — accepts a POST from
  the landing contact form. Validates with Zod, stores in the
  `contact_messages` table, returns the saved record.
- **`/dashboard/contact-messages`** — admin-only inbox: list, mark
  as read, mark as resolved, delete.
- **Dashboard widget** — `UnreadContactMessagesWidget` shows the
  unread count and links to the inbox.
- **Sidebar entry** — appears in the "Administration" section, only
  for users with `admin` or `super_admin` role.

## File map

```
src/modules/contact-messages/
├── index.ts                  # public barrel
├── manifest.ts               # AppModuleManifest (id: 'contact-messages')
├── api/
│   ├── contact-messages.fn.ts       # server function bindings
│   └── contact-messages.queries.ts  # TanStack Query hooks
├── components/
│   ├── ContactMessagesPage.tsx
│   └── UnreadContactMessagesWidget.tsx
└── model/
    └── types.ts              # ContactMessage, ContactMessageStatus
```

## Public API

```ts
// from '@/modules/contact-messages'
export * from './api/contact-messages.fn'
export * from './api/contact-messages.queries'
export { ContactMessagesPage } from './components/ContactMessagesPage'
export { UnreadContactMessagesWidget } from './components/UnreadContactMessagesWidget'
export { contactMessagesModule } from './manifest'
export * from './model/types'
```

## Dependencies

### Other modules (declared in the manifest)

None. But it is imported by:

- `landing` — the `ContactForm` on the homepage posts to
  `/api/contact-messages`.

### Cross-module imports inside `contact-messages/`

- `@/modules/core` — for the manifest type and registry wiring.
- `@/modules/users` — for `AppRoleKey` (the sidebar entry is gated to
  `admin`).

### NPM packages used

- `@tanstack/react-router` — `Link`, `useNavigate`.
- `@tanstack/react-query` — `useQuery`, `useMutation`, `useInfiniteQuery`.
- `lucide-react` — icons.
- `react-hook-form` + `zod` — form state + validation.
- `date-fns` — relative date formatting ("2h ago").
- `clsx`, `tailwind-merge` — `cn`.
- `react-i18next` — translations.
- `react`, `react-dom`.

### Environment variables

None.

### Shared infrastructure required

- `@/components/ui/*` — `Card`, `Badge`, `Button`, `Sheet`, `Dialog`,
  `Input`, `Textarea`, `Label`, `DropdownMenu`, `Skeleton`.
- `@/shared/lib/utils` — `cn`.
- `@/shared/lib/query` — TanStack Query client.
- `@/shared/lib/auth/app-auth` — to check the actor's role.
- `@/shared/lib/db` — Drizzle client + `contact_messages` table.

### Database tables required

| Table              | Required columns (at minimum)                                                      |
| ------------------ | ---------------------------------------------------------------------------------- |
| `contact_messages` | `id`, `name`, `email`, `message`, `status` (`new`/`read`/`resolved`), `created_at` |

The schema migration is in `drizzle/0004_contact_messages_notifications.sql`.

## How to copy this module to another project

1. **Copy `src/modules/contact-messages/`** (this entire folder).
2. **Bring the shared pieces** — see list above.
3. **Add the `contact_messages` Drizzle table**:
   ```ts
   // schema.ts
   export const contactMessages = pgTable('contact_messages', {
     id: uuid('id').primaryKey().defaultRandom(),
     name: text('name').notNull(),
     email: text('email').notNull(),
     message: text('message').notNull(),
     status: text('status').notNull().default('new'), // 'new' | 'read' | 'resolved'
     createdAt: timestamp('created_at').notNull().defaultNow(),
   })
   ```
   Then run `pnpm db:push` to create it.
4. **Add a file-based route** for the inbox:

   ```tsx
   // src/routes/dashboard/contact-messages.tsx
   import { createFileRoute } from '@tanstack/react-router'
   import { ContactMessagesPage } from '@/modules/contact-messages'

   export const Route = createFileRoute('/dashboard/contact-messages')({
     component: ContactMessagesPage,
   })
   ```

5. **(Recommended) Bring the `landing` module** if you want the contact
   form on the homepage to work. The form's `onSubmit` posts to
   `/api/contact-messages` — the server function in
   `api/contact-messages.fn.ts` is the receiver.
6. **Register the module** in `src/modules/index.ts` and add
   `contactMessagesModule` to `core/registry.ts`.
7. **Install missing deps**:
   ```bash
   pnpm add react-hook-form zod date-fns lucide-react
   ```

## Configuration knobs

- **Change the form fields** — edit `model/types.ts`, the Zod schema in
  `api/contact-messages.fn.ts`, and `ContactForm.tsx` in the landing
  module.
- **Change the role gate** — edit `manifest.ts`:
  `requiredRole: 'admin'` controls who sees the sidebar entry.
- **Send a notification on new message** — the widget already polls;
  add a webhook to the server function if you want to email/Slack the
  admins.

## Anti-patterns

- Do not expose `ContactMessagesPage` to non-admins. The `requiredRole`
  field in the manifest is the only thing hiding the sidebar entry;
  the route itself is **not** server-gated. If you need real auth,
  add a `beforeLoad` guard in the file-based route.
- Do not store the raw message body in logs — the message may contain
  PII. Redact at the server-function boundary.
- Do not put other types of "messages" (chat, comments, notifications)
  in this module. Create a new one.
