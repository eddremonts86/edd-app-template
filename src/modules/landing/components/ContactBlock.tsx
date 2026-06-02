'use client'

import { m } from 'framer-motion'
import { Clock3, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui'
import { ContactForm } from './ContactForm'

export function ContactBlock() {
  const { t } = useTranslation()

  return (
    <section className="relative w-full overflow-hidden bg-background px-4 py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <div className="mx-auto w-full max-w-6xl">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 sm:mb-16 md:mb-20 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {t('home.contact.title')}
          </h2>
          <p className="mx-auto max-w-2xl px-4 text-base text-muted-foreground sm:text-lg">
            {t('home.contact.description')}
          </p>
          <p className="mx-auto mt-4 max-w-xl text-sm font-medium text-foreground/75">
            {t('home.contact.responseTime', 'Typical response: within 24-48 hours.')}
          </p>
        </m.div>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <m.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="relative overflow-hidden rounded-xl border border-border/40 bg-background/60 p-6 backdrop-blur-sm sm:p-8">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
              <ContactForm />
            </Card>
          </m.div>

          <div className="space-y-4 lg:space-y-6">
            <Card className="border border-border/40 bg-background/55 p-5 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {t('home.contact.support.channels', 'Asynchronous support')}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(
                      'home.contact.support.channelsDesc',
                      'Communicate directly through our developer sandbox ticket panel. No meetings required.',
                    )}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border border-border/40 bg-background/55 p-5 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-primary shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {t('home.contact.support.sla', 'Response target: 24-48h')}
                    </p>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      Included
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(
                      'home.contact.support.slaDesc',
                      'We answer architectural queries and template questions typically within 24-48 hours.',
                    )}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border border-border/40 bg-background/55 p-5 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {t('home.contact.support.access', 'Shared channels')}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(
                      'home.contact.support.accessDesc',
                      'Private Slack or Discord keys are generated during project onboarding to keep developer feedback loop fast.',
                    )}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
