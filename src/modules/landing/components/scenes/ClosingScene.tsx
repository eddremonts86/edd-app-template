'use client'

import { IconBrandGithub } from '@tabler/icons-react'
import { m } from 'framer-motion'
import { ArrowUpRight, Clock3, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui'
import { ContactForm } from '../ContactForm'
import { SceneHeader } from './SceneHeader'

const REPO_URL = 'https://github.com/eddremonts86/edd-app-template'

export function ClosingScene() {
  const { t } = useTranslation()

  return (
    <section
      id="contact"
      className="relative w-full overflow-hidden bg-background px-6 py-24 md:py-32"
    >
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] dark:bg-black"></div>

      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-14 flex flex-col items-center gap-3 md:mb-16">
          <SceneHeader
            title={t('home.contact.title', 'Questions before you clone?')}
            description={t(
              'home.contact.description',
              'Write to us about the template — a setup problem, a missing feature, an architectural doubt. Your message lands in the same contact-messages module that ships with the starter.',
            )}
          />
          <m.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm font-medium text-foreground/75"
          >
            {t('home.contact.responseNote', 'We usually answer within a couple of days.')}
          </m.p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <m.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <Card className="relative overflow-hidden rounded-xl border border-border/40 bg-background/60 p-6 backdrop-blur-sm sm:p-8">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
              <ContactForm />
            </Card>
          </m.div>

          <m.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="space-y-4 lg:space-y-6"
          >
            <Card className="border border-border/40 bg-background/55 p-5 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <IconBrandGithub
                  className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {t('home.contact.aside.github.title', 'Open repository')}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(
                      'home.contact.aside.github.description',
                      'Bugs and feature requests live as GitHub issues. The roadmap is public.',
                    )}
                  </p>
                  <a
                    href={REPO_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    {t('home.contact.aside.github.cta', 'Open GitHub')}
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </Card>

            <Card className="border border-border/40 bg-background/55 p-5 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {t('home.contact.aside.async.title', 'Async by default')}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(
                      'home.contact.aside.async.description',
                      'No calls, no meetings. Write when it suits you; we answer the same way.',
                    )}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border border-border/40 bg-background/55 p-5 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {t('home.contact.aside.updates.title', 'Low-volume updates')}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(
                      'home.contact.aside.updates.description',
                      'Release notes land in your inbox at most once a month.',
                    )}
                  </p>
                </div>
              </div>
            </Card>
          </m.div>
        </div>
      </div>
    </section>
  )
}
