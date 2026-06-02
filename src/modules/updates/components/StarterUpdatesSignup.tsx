'use client'

import type { FormEvent} from 'react';
import { useCallback, useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/shared/lib/toast'
import { useStarterUpdatesSubscriptionMutation } from '../api/updates.queries'
import { starterUpdatesSubscriptionSchema } from '../model'

export function StarterUpdatesSignup() {
  const { t } = useTranslation()
  const subscription = useStarterUpdatesSubscriptionMutation()

  const inputId = useId()
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`

  const [email, setEmail] = useState('')
  const [wasBlurred, setWasBlurred] = useState(false)
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)

  const showValidation = wasBlurred || attemptedSubmit

  const getValidationMessage = useCallback((value: string, shouldValidate: boolean) => {
    const trimmed = value.trim()
    if (!shouldValidate) return ''
    if (trimmed.length === 0) {
      return t('updates.subscribe.errors.required')
    }
    const parsed = starterUpdatesSubscriptionSchema.safeParse({ email: trimmed })
    if (!parsed.success) {
      return t('updates.subscribe.errors.invalidEmail')
    }
    return ''
  }, [t])

  const validationMessage = useMemo(() => {
    return getValidationMessage(email, showValidation)
  }, [email, showValidation, getValidationMessage])

  const hasError = validationMessage.length > 0

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const submissionValidationMessage = getValidationMessage(email, true)
    setAttemptedSubmit(true)
    setWasBlurred(true)

    if (submissionValidationMessage) return

    const result = await subscription.mutateAsync({ email: email.trim() })

    if (result.status === 'already-subscribed') {
      toast.info(t('updates.subscribe.messages.alreadyTitle'), {
        description: t('updates.subscribe.messages.alreadyDescription'),
      })
      return
    }

    toast.success(t('updates.subscribe.messages.subscribedTitle'), {
      description: t('updates.subscribe.messages.subscribedDescription'),
    })

    setEmail('')
    setWasBlurred(false)
    setAttemptedSubmit(false)
  }

  return (
    <form className="space-y-2" onSubmit={handleSubmit} noValidate>
      <label htmlFor={inputId} className="sr-only">
        {t('updates.subscribe.emailLabel')}
      </label>

      <div className="flex gap-2">
        <Input
          id={inputId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          enterKeyHint="send"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onBlur={() => setWasBlurred(true)}
          aria-invalid={hasError || undefined}
          aria-describedby={`${hintId} ${hasError ? errorId : ''}`.trim()}
          placeholder={t('home.footer.subscribe.placeholder')}
          className="max-w-60"
          disabled={subscription.isPending}
        />
        <Button type="submit" disabled={subscription.isPending}>
          {subscription.isPending
            ? t('updates.subscribe.actions.subscribing')
            : t('home.footer.subscribe.button')}
        </Button>
      </div>

      <p id={hintId} className="max-w-sm text-xs text-muted-foreground">
        {t('home.footer.subscribe.note')}
      </p>

      {hasError && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {validationMessage}
        </p>
      )}
    </form>
  )
}
