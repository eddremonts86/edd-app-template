'use client'

import { Send } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateContactMessage } from '@/modules/contact-messages'
import { toast } from '@/shared/lib/toast'
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/components/ui'

type ContactProjectType = 'saas' | 'landing' | 'webapp'

interface ContactFormProps {
  onSubmit?: (data: { email: string; projectType: ContactProjectType; message?: string }) => void
}

export function ContactForm({ onSubmit }: ContactFormProps) {
  const { t } = useTranslation()
  const createContactMessage = useCreateContactMessage()
  const [email, setEmail] = React.useState('')
  const [projectType, setProjectType] = React.useState<ContactProjectType>('saas')
  const [message, setMessage] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createContactMessage.mutateAsync({
        email,
        projectType,
        message: message.trim() || undefined,
      })

      onSubmit?.({
        email,
        projectType,
        message: message.trim() || undefined,
      })

      setEmail('')
      setProjectType('saas')
      setMessage('')

      toast.success(t('home.contact.form.messages.successTitle'), {
        description: t('home.contact.form.messages.successDescription'),
      })
    } catch (error) {
      toast.error(t('home.contact.form.messages.errorTitle'), {
        description:
          error instanceof Error ? error.message : t('home.contact.form.messages.errorDescription'),
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative z-10 space-y-6" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          {t('home.contact.form.email.label')}
        </Label>
        <Input
          name="email"
          id="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          enterKeyHint="next"
          placeholder={t('home.contact.form.email.placeholder')}
          className="bg-background/50 transition-colors focus:bg-background"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="projectType" className="text-sm font-medium">
          {t('home.contact.form.projectType.label', 'Project type')}
        </Label>
        <Select
          value={projectType}
          onValueChange={(value: ContactProjectType) => setProjectType(value)}
        >
          <SelectTrigger
            id="projectType"
            name="projectType"
            className="bg-background/50 transition-colors focus:bg-background"
          >
            <SelectValue
              placeholder={t('home.contact.form.projectType.placeholder', 'Select project type')}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="saas">
              {t('home.contact.form.projectType.options.saas', 'SaaS product')}
            </SelectItem>
            <SelectItem value="landing">
              {t('home.contact.form.projectType.options.landing', 'Marketing landing page')}
            </SelectItem>
            <SelectItem value="webapp">
              {t('home.contact.form.projectType.options.webapp', 'Internal web application')}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message" className="text-sm font-medium text-muted-foreground">
          {t('home.contact.form.message.label')}
        </Label>
        <Textarea
          name="message"
          id="message"
          maxLength={3000}
          enterKeyHint="send"
          placeholder={t('home.contact.form.message.placeholder')}
          className="min-h-30 bg-background/50 transition-colors focus:bg-background"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </div>

      <Button
        type="submit"
        disabled={createContactMessage.isPending}
        className="group w-full gap-2 py-6 text-base font-semibold transition-all hover:shadow-lg hover:shadow-primary/20"
      >
        {t('home.contact.form.submit')}
        <Send className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
      </Button>
    </form>
  )
}
