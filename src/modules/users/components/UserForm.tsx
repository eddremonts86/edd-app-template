import { useForm } from '@tanstack/react-form'
import { User as UserIcon } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { User } from '../model/types'

const createUserSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t('validation.required')),
    email: z.string().email(t('validation.invalidEmail')).min(1, t('validation.required')),
    avatar: z
      .string()
      .url(t('validation.invalidUrl'))
      .optional()
      .or(z.literal(''))
      .transform((v) => v || null),
  })

export type UserFormValues = {
  name: string
  email: string
  avatar: string | null
}

type UserFormProps = {
  defaultValues?: Partial<User>
  onSubmit: (values: UserFormValues) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function UserForm({ defaultValues, onSubmit, onCancel, isLoading }: UserFormProps) {
  const { t } = useTranslation()
  const userSchema = React.useMemo(() => createUserSchema(t), [t])
  const [avatarPreview, setAvatarPreview] = React.useState(defaultValues?.avatar ?? '')

  const form = useForm({
    defaultValues: {
      name: defaultValues?.name ?? '',
      email: defaultValues?.email ?? '',
      avatar: defaultValues?.avatar ?? '',
    },
    onSubmit: async ({ value }) => {
      const parsed = userSchema.safeParse(value)
      if (!parsed.success) return
      await onSubmit(parsed.data as UserFormValues)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      <div className="flex justify-center">
        <Avatar className="h-20 w-20">
          <AvatarImage src={avatarPreview || undefined} />
          <AvatarFallback>
            <UserIcon className="w-8 h-8 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
      </div>

      <form.Field
        name="name"
        validators={{ onChange: ({ value }) => (!value ? t('validation.required') : undefined) }}
      >
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>{t('users.form.name', 'Name')}</FieldLabel>
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

      <form.Field
        name="email"
        validators={{
          onChange: ({ value }) =>
            !value
              ? t('validation.required')
              : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                ? t('validation.invalidEmail')
                : undefined,
        }}
      >
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>{t('users.form.email', 'Email')}</FieldLabel>
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

      <form.Field name="avatar">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>{t('users.form.avatar', 'Avatar URL')}</FieldLabel>
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
            <FieldError>{field.state.meta.errors[0]}</FieldError>
          </Field>
        )}
      </form.Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </form>
  )
}
