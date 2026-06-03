import { useForm } from '@tanstack/react-form'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useCurrentUser } from '../hooks/useCurrentUser'
import type { AppRoleKey } from '../model/permissions'
import { canAssignRole, isAdminRole } from '../model/permissions'
import type { User } from '../model/types'

export type UserFormValues = {
  name: string
  email: string
  avatar: string | null
  roleKey: AppRoleKey
  password?: string
}

type UserFormProps = {
  defaultValues?: Partial<User>
  onSubmit: (values: UserFormValues) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function UserForm({ defaultValues, onSubmit, onCancel, isLoading }: UserFormProps) {
  const { t } = useTranslation()
  const currentUser = useCurrentUser()
  const actorRole: AppRoleKey = currentUser.roleKey
  const canEditRoles = isAdminRole(actorRole)
  const targetRole: AppRoleKey = defaultValues?.roleKey ?? 'user'
  const [avatarPreview, setAvatarPreview] = React.useState(defaultValues?.avatar ?? '')

  const isCreate = !defaultValues?.id
  const targetProvider = defaultValues?.provider
  const showPasswordField = isCreate || targetProvider === 'better-auth'
  const passwordRequired = false

  const form = useForm({
    defaultValues: {
      name: defaultValues?.name ?? '',
      email: defaultValues?.email ?? '',
      avatar: defaultValues?.avatar ?? '',
      roleKey: defaultValues?.roleKey ?? 'user',
      password: '',
    },
    onSubmit: async ({ value }) => {
      const trimmedPwd = value.password?.trim() || ''
      await onSubmit({
        name: value.name.trim(),
        email: value.email.trim(),
        avatar: value.avatar?.trim() || null,
        roleKey: value.roleKey ?? 'user',
        password: trimmedPwd || undefined,
      })
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="flex flex-col h-full justify-between"
    >
      <div className="space-y-6">
        {/* Avatar preview */}
        <div className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-muted/10 border border-dashed border-border/60">
          <Avatar className="h-20 w-20 ring-4 ring-background shadow-lg">
            <AvatarImage src={avatarPreview || undefined} />
            <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
              {getInitials(defaultValues?.name ?? form.getFieldValue('name') ?? 'U')}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">Avatar Preview</span>
        </div>

        {/* Section 1: Profile Details */}
        <div className="space-y-4">
          <div className="flex flex-col gap-0.5">
            <h4 className="text-sm font-semibold text-foreground">Profile Information</h4>
            <p className="text-[11px] text-muted-foreground">Set the member's public details</p>
          </div>
          
          <Separator className="opacity-50" />

          {/* Name */}
          <form.Field
            name="name"
            validators={{
              onBlur: ({ value }) => (value?.trim() ? undefined : t('validation.required')),
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <label htmlFor={field.name} className="text-sm font-medium leading-none text-foreground">
                  {t('users.form.nameLabel', 'Name')}
                </label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className="bg-muted/10"
                />
                {field.state.meta.errors[0] && (
                  <p className="text-[11px] font-medium text-destructive">{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>

          {/* Email */}
          <form.Field
            name="email"
            validators={{
              onBlur: ({ value }) => {
                if (!value?.trim()) return t('validation.required')
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t('validation.invalidEmail')
                return undefined
              },
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <label htmlFor={field.name} className="text-sm font-medium leading-none text-foreground">
                  {t('users.form.emailLabel', 'Email')}
                </label>
                <Input
                  id={field.name}
                  type="email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className="bg-muted/10"
                />
                {field.state.meta.errors[0] && (
                  <p className="text-[11px] font-medium text-destructive">{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>
        </div>

        {/* Section 2: Permissions */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col gap-0.5">
            <h4 className="text-sm font-semibold text-foreground">Access Permissions</h4>
            <p className="text-[11px] text-muted-foreground">Define role rank inside the workspace</p>
          </div>

          <Separator className="opacity-50" />

          {/* Role */}
          <form.Field name="roleKey">
            {(field) => {
              const currentValue = field.state.value ?? 'user'
              const canAssignAdmin = canAssignRole(actorRole, targetRole, 'admin')
              const canAssignUser = canAssignRole(actorRole, targetRole, 'user')
              const canAssignSuper = canAssignRole(actorRole, targetRole, 'super_admin')
              const disabled = !canEditRoles
              return (
                <div className="grid gap-2">
                  <label htmlFor={field.name} className="text-sm font-medium leading-none text-foreground">
                    {t('users.form.roleLabel', 'Role')}
                  </label>
                  <Select
                    value={currentValue}
                    onValueChange={(v) => field.handleChange(v as AppRoleKey)}
                    disabled={disabled}
                  >
                    <SelectTrigger id={field.name} className="bg-muted/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user" disabled={!canAssignUser && currentValue !== 'user'}>
                        {t('users.form.roleUser', 'User')}
                      </SelectItem>
                      <SelectItem value="admin" disabled={!canAssignAdmin && currentValue !== 'admin'}>
                        {t('users.form.roleAdmin', 'Admin')}
                      </SelectItem>
                      {(canAssignSuper || currentValue === 'super_admin') && (
                        <SelectItem
                          value="super_admin"
                          disabled={!canAssignSuper && currentValue !== 'super_admin'}
                        >
                          {t('users.form.roleSuperAdmin', 'Super Admin')}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    {disabled
                      ? t('users.form.roleLocked', 'Only administrators can change roles.')
                      : t('users.form.roleHelp')}
                  </p>
                </div>
              )
            }}
          </form.Field>
        </div>

        {/* Section 3: Credentials & Media */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col gap-0.5">
            <h4 className="text-sm font-semibold text-foreground">Visuals & Credentials</h4>
            <p className="text-[11px] text-muted-foreground">Set login security and custom avatar links</p>
          </div>

          <Separator className="opacity-50" />

          {/* Password (Better Auth credential) */}
          {showPasswordField && (
            <form.Field
              name="password"
              validators={{
                onBlur: ({ value }) => {
                  const v = value?.trim() ?? ''
                  if (!v) return passwordRequired ? t('validation.required') : undefined
                  if (v.length < 8)
                    return t(
                      'users.form.passwordTooShort',
                      'Password must be at least 8 characters long.',
                    )
                  return undefined
                },
              }}
            >
              {(field) => (
                <div className="grid gap-2">
                  <label htmlFor={field.name} className="text-sm font-medium leading-none text-foreground">
                    {t('users.form.passwordLabel', 'Password')}{' '}
                    {!passwordRequired && (
                      <span className="text-muted-foreground font-normal">
                        ({t('common.optional', 'optional')})
                      </span>
                    )}
                  </label>
                  <Input
                    id={field.name}
                    type="password"
                    autoComplete="new-password"
                    placeholder={
                      isCreate
                        ? t(
                            'users.form.passwordPlaceholderCreate',
                            'Leave empty for a profile-only user',
                          )
                        : t(
                            'users.form.passwordPlaceholderEdit',
                            'Leave empty to keep current password',
                          )
                    }
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className="bg-muted/10"
                  />
                  {field.state.meta.errors[0] && (
                    <p className="text-[11px] font-medium text-destructive">{field.state.meta.errors[0]}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {isCreate
                      ? t(
                          'users.form.passwordHelpCreate',
                          'Provide a password to provision a login account (Better Auth). Leave empty to create a profile-only entry.',
                        )
                      : t(
                          'users.form.passwordHelpEdit',
                          'Optional. Setting a value replaces the current password.',
                        )}
                  </p>
                </div>
              )}
            </form.Field>
          )}

          {/* Avatar URL */}
          <form.Field name="avatar">
            {(field) => (
              <div className="grid gap-2">
                <label htmlFor={field.name} className="text-sm font-medium leading-none text-foreground">
                  {t('users.form.avatarLabel', 'Avatar URL')}{' '}
                  <span className="text-muted-foreground font-normal">
                    ({t('common.optional', 'optional')})
                  </span>
                </label>
                <div className="flex gap-2">
                  <Input
                    id={field.name}
                    placeholder="https://..."
                    value={field.state.value}
                    onChange={(e) => {
                      field.handleChange(e.target.value)
                    }}
                    onBlur={field.handleBlur}
                    className="flex-1 bg-muted/10"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setAvatarPreview(field.state.value)}
                    className="shrink-0"
                  >
                    Preview
                  </Button>
                </div>
              </div>
            )}
          </form.Field>
        </div>
      </div>

      {/* Sticky Form Footer */}
      <div className="sticky bottom-0 bg-background border-t pt-4 pb-2 mt-8 flex justify-end gap-2 shrink-0">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </form>
  )
}
