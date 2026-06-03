# RBAC & Permissions Skill

> Load when: adding a feature that needs role checks, building admin pages,
> wiring per-resource permissions, or replacing `roleKey === 'admin'` checks.

> See `docs/architecture/authorization-hardening-plan.md` phases 2–5.

## TL;DR — the contract

1. **Permissions are strings shaped `resource.action`** — e.g. `contact_messages.delete`, `users.read`, `projects.update`.
2. **Three layers, never one:**
   - **DB (truth):** RLS policies + `authorize()` SQL function
   - **Server:** `requirePermission(ctx, 'contact_messages.delete')` at the top of every server fn
   - **Client (UX only):** `<Can permission="…">` to hide buttons/menus
3. **Never trust the client.** UI gating is for _not showing useless buttons_. Authorization happens server-side, every time.
4. **Roles compose.** A user gets permissions from `role_permissions` (app-wide) **plus** any `resource_roles` (per-resource).
5. **Adding a new action = adding a row to `permissions` + a row per role to `role_permissions`** — not a new TypeScript constant.

## File map (target state after phase 3)

| File                               | Role                                                       |
| ---------------------------------- | ---------------------------------------------------------- |
| `src/shared/lib/db/schema.ts`      | `permissions`, `role_permissions`, `resource_roles` tables |
| `src/shared/lib/auth/authorize.ts` | `can()`, `canOnResource()`, `requirePermission()`          |
| `src/shared/ui/auth/Can.tsx`       | `<Can permission="…">` component                           |
| `src/modules/*/api/*.fn.ts`        | call `requirePermission()` at top of each handler          |
| `scripts/db/seed-rbac.ts`          | seeds permissions + role mappings                          |

## Server-side check (template)

```ts
import { createServerFn } from '@tanstack/react-start'
import { requirePermission } from '@/shared/lib/auth/authorize'
import { logger } from '@/shared/lib/observability'

export const deleteContactMessageFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    await requirePermission(context, 'contact_messages.delete') // throws 403

    logger.info('delete contact message', { id: data.id, by: context.user.userId })
    await db.delete(contactMessages).where(eq(contactMessages.id, data.id))
    return { ok: true }
  })
```

## Client-side gating (template)

```tsx
import { Can } from '@/shared/ui/auth/Can'

;<Can permission="contact_messages.delete">
  <Button variant="destructive" onClick={onDelete}>
    Delete
  </Button>
</Can>
```

Multiple permissions:

```tsx
<Can anyOf={['users.update', 'users.delete']}>…</Can>
<Can allOf={['projects.read', 'projects.update']}>…</Can>
```

## Adding a new permission

1. Add the string to `scripts/db/seed-rbac.ts`:
   ```ts
   const perms = [..., 'invoices.export']
   ```
2. Map it to roles:
   ```ts
   admin:       [..., 'invoices.export'],
   super_admin: [..., 'invoices.export'],
   ```
3. Run `pnpm db:seed:rbac`.
4. Use it on the server: `await requirePermission(ctx, 'invoices.export')`.
5. Use it in the UI: `<Can permission="invoices.export">…</Can>`.

That's it. No TypeScript enums to update.

## Per-resource roles

Use `resource_roles` for project/workspace-scoped grants (e.g. _Alice is editor on project X_):

```ts
await db.insert(resourceRoles).values({
  userId: aliceId,
  resourceType: 'project',
  resourceId: projectId,
  role: 'editor',
  grantedBy: ctx.user.userId,
})
```

Then check on the server with `canOnResource(userId, 'projects.update', 'project', projectId)`.

## JWT claims (after phase 5)

After a user logs in, the auth hook computes `permissions: string[]` from the DB and embeds them as a JWT claim. The client reads them via `useAppAuth()`:

```ts
const { permissions } = useAppAuth()
const canDelete = permissions.has('contact_messages.delete')
```

⚠️ JWT claims can be **stale** (the user was an admin when the token was issued; you demoted them; their token still says admin until refresh). That's why the server **always** re-checks against the DB.

## Anti-patterns

| Don't                                       | Do                                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------------- |
| `if (user.role === 'admin')` in JSX         | `<Can permission="…">`                                                                |
| Re-implement role checks in every server fn | `requirePermission(ctx, 'x')` at the top                                              |
| Hard-code permission lists in TypeScript    | Store in `permissions` table; seed via script                                         |
| Use JWT claims as authorization             | Use them only as UI hints; re-check server-side                                       |
| Grant `super_admin` to “make it work”       | Grant the _specific_ permission. If a role doesn't have it, that's a bug in the seed. |

## Migration order

1. ✅ Observability (phase 0)
2. ⏳ Ownership columns (phase 1)
3. ⏳ RBAC tables + seed (phase 2)
4. ⏳ `authorize.ts` + `<Can>` (phase 3) — refactor server fns iteratively
5. ⏳ RLS per-table (phase 4)
6. ⏳ JWT claims (phase 5)
7. ⏳ Tests + audit (phase 6)

Each step is independently shippable.
