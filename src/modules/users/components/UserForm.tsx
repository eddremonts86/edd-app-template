import { useForm } from '@tanstack/react-form'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  // Password field is shown:
  //  • On create (always — supplying it provisions a Better Auth account so
  //    the user can log in).
  //  • On edit only for users that already live in Better Auth.
  const showPasswordField = isCreate || targetProvider === 'better-auth'
  const passwordRequired = false // optional on create (creates a profile-only user when omitted)

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
      className="space-y-5"
    >
      {/* Avatar preview */}
      <div className="flex justify-center py-2">
        <Avatar className="h-20 w-20 ring-2 ring-border">
          <AvatarImage src={avatarPreview || undefined} />
          <AvatarFallback className="text-lg font-semibold">
            {getInitials(defaultValues?.name ?? form.getFieldValue('name') ?? '')}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Name */}
      <form.Field
        name="name"
        validators={{
          onBlur: ({ value }) => (value?.trim() ? undefined : t('validation.required')),
        }}
      >
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>{t('users.form.nameLabel', 'Name')}</FieldLabel>
            <Input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            <FieldError>{field.state.meta.errors[0]}</FieldError>
          </Field>
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
          <Field>
            <FieldLabel htmlFor={field.name}>{t('users.form.emailLabel', 'Email')}</FieldLabel>
            <Input
              id={field.name}
              type="email"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            <FieldError>{field.state.meta.errors[0]}</FieldError>
          </Field>
        )}
      </form.Field>

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
            <Field>
              <FieldLabel htmlFor={field.name}>
                {t('users.form.passwordLabel', 'Password')}{' '}
                {!passwordRequired && (
                  <span className="text-muted-foreground font-normal">
                    ({t('common.optional', 'optional')})
                  </span>
                )}
              </FieldLabel>
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
              />
              <FieldError>{field.state.meta.errors[0]}</FieldError>
              <p className="text-xs text-muted-foreground">
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
            </Field>
          )}
        </form.Field>
      )}

      {/* Role */}
      <form.Field name="roleKey">
        {(field) => {
          const currentValue = field.state.value ?? 'user'
          const canAssignAdmin = canAssignRole(actorRole, targetRole, 'admin')
          const canAssignUser = canAssignRole(actorRole, targetRole, 'user')
          const canAssignSuper = canAssignRole(actorRole, targetRole, 'super_admin')
          const disabled = !canEditRoles
          return (
            <Field>
              <FieldLabel htmlFor={field.name}>{t('users.form.roleLabel', 'Role')}</FieldLabel>
              <Select
                value={currentValue}
                onValueChange={(v) => field.handleChange(v as AppRoleKey)}
                disabled={disabled}
              >
                <SelectTrigger id={field.name}>
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
              <p className="text-xs text-muted-foreground">
                {disabled
                  ? t('users.form.roleLocked', 'Only administrators can change roles.')
                  : t('users.form.roleHelp')}
              </p>
            </Field>
          )
        }}
      </form.Field>

      {/* Avatar URL */}
      <form.Field name="avatar">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>
              {t('users.form.avatarLabel', 'Avatar URL')}{' '}
              <span className="text-muted-foreground font-normal">
                ({t('common.optional', 'optional')})
              </span>
            </FieldLabel>
            <Input
              id={field.name}
              placeholder="https://..."
              value={field.state.value}
              onChange={(e) => {
                field.handleChange(e.target.value)
                setAvatarPreview(e.target.value)
              }}
              onBlur={field.handleBlur}
            />
          </Field>
        )}
      </form.Field>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
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
