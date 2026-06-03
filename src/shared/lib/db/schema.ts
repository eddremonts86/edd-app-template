import { pgTable, text, timestamp, boolean, unique, index, jsonb } from 'drizzle-orm/pg-core'

// ---------------------------------------------------------------------------
// Authentication Tables (Better Auth)
// ---------------------------------------------------------------------------

export const authUsers = pgTable('auth_users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  role: text('role').default('user').notNull(),
  banned: boolean('banned').default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const authSessions = pgTable('auth_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => authUsers.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const authAccounts = pgTable(
  'auth_accounts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    idToken: text('id_token'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    providerAccountUnique: unique('auth_accounts_provider_id_account_id_unique').on(
      t.providerId,
      t.accountId,
    ),
  }),
)

export const authVerifications = pgTable('auth_verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ---------------------------------------------------------------------------
// Users Table
// Application-level user profile linked to the auth identity.
// Extend this table with app-specific fields in your derived app.
// ---------------------------------------------------------------------------

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  avatar: text('avatar'),
  role: text('role').default('user').notNull(),
  // Auth provider this user authenticates with: 'better-auth' | 'clerk' | 'local'
  // 'local' means the user was created from the admin UI without an auth identity yet.
  provider: text('provider').default('local').notNull(),
  // External auth identity id (Better Auth user id OR Clerk user id, etc.).
  // No FK so users from any provider can be linked. Uniqueness still enforced.
  authUserId: text('auth_user_id').unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ---------------------------------------------------------------------------
// Contact Messages
// Public landing contact briefs submitted by visitors.
// ---------------------------------------------------------------------------

export const contactMessages = pgTable(
  'contact_messages',
  {
    id: text('id').primaryKey(),
    ownerUserId: text('owner_user_id').references(() => users.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
    email: text('email').notNull(),
    projectType: text('project_type').notNull(),
    message: text('message'),
    status: text('status').default('new').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('contact_messages_created_at_idx').on(t.createdAt),
    index('contact_messages_status_idx').on(t.status),
  ],
)

// ---------------------------------------------------------------------------
// Notifications
// Dashboard notifications. Can target a specific user.
// ---------------------------------------------------------------------------

export const notifications = pgTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    ownerUserId: text('owner_user_id').references(() => users.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
    recipientUserId: text('recipient_user_id').references(() => users.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
    kind: text('kind').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    entityType: text('entity_type'),
    entityId: text('entity_id'),
    link: text('link'),
    isRead: boolean('is_read').default(false).notNull(),
    readAt: timestamp('read_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('notifications_owner_idx').on(t.ownerUserId),
    index('notifications_recipient_read_idx').on(t.recipientUserId, t.isRead),
    index('notifications_created_at_idx').on(t.createdAt),
  ],
)

// ---------------------------------------------------------------------------
// RBAC
// ---------------------------------------------------------------------------

export const permissions = pgTable('permissions', {
  id: text('id').primaryKey(),
  resource: text('resource').notNull(),
  action: text('action').notNull(),
  description: text('description'),
})

export const rolePermissions = pgTable(
  'role_permissions',
  {
    role: text('role').notNull(),
    permissionId: text('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (t) => [unique('role_permissions_role_permission_id_unique').on(t.role, t.permissionId)],
)

export const resourceRoles = pgTable(
  'resource_roles',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    resourceType: text('resource_type').notNull(),
    resourceId: text('resource_id').notNull(),
    role: text('role').notNull(),
    grantedAt: timestamp('granted_at').defaultNow().notNull(),
    grantedBy: text('granted_by').references(() => users.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
  },
  (t) => [
    unique('resource_roles_user_type_id_unique').on(t.userId, t.resourceType, t.resourceId),
    index('resource_roles_resource_idx').on(t.resourceType, t.resourceId),
  ],
)

// ---------------------------------------------------------------------------
// Site Settings (key/value store for dynamic site configuration)
// ---------------------------------------------------------------------------
export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: text('updated_by'),
})
