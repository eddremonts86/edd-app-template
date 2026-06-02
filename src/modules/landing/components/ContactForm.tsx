'use client'

import { Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@/components/ui'

interface ContactFormProps {
  onSubmit?: (data: Record<string, unknown>) => void
}

export function ContactForm({ onSubmit }: ContactFormProps) {
  const { t } = useTranslation()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Implementation for form submission would go here
    onSubmit?.({})
  }

  return (
    <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          {t('home.contact.form.email.label')}
        </Label>
        <Input
          id="email"
          type="email"
          placeholder={t('home.contact.form.email.placeholder')}
          className="bg-background/50 transition-colors focus:bg-background"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="projectType" className="text-sm font-medium">
          {t('home.contact.form.projectType.label', 'Project type')}
        </Label>
        <Select>
          <SelectTrigger id="projectType" className="bg-background/50 transition-colors focus:bg-background">
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
          id="message"
          placeholder={t('home.contact.form.message.placeholder')}
          className="min-h-[120px] bg-background/50 transition-colors focus:bg-background"
        />
      </div>

      <Button className="group w-full gap-2 py-6 text-base font-semibold transition-all hover:shadow-lg hover:shadow-primary/20">
        {t('home.contact.form.submit')}
        <Send className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
      </Button>
    </form>
  )
}
