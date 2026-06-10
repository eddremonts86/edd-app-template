'use client'

import { m } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SceneHeader } from './SceneHeader'

const ROW_IDS = ['auth', 'architecture', 'tests', 'ai', 'docker'] as const

export function FrictionScene() {
  const { t } = useTranslation()

  return (
    <section
      id="friction"
      className="relative overflow-hidden bg-muted/20 px-6 py-24 dark:bg-muted/5 md:py-32"
    >
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[2fr_3fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SceneHeader
            align="left"
            eyebrow={t('home.friction.eyebrow', 'The trade-off')}
            title={t('home.friction.title', 'The first weeks always disappear into the same work')}
            description={t(
              'home.friction.description',
              'Sign-in flows, folder structure, test runners, Docker. None of it makes your product different, and all of it can go wrong. Here is what the template takes off your plate.',
            )}
          />
        </div>

        <div className="flex flex-col gap-6">
          {ROW_IDS.map((id, index) => (
            <m.article
              key={id}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: index * 0.04, ease: 'easeOut' }}
              className="rounded-2xl border border-border/50 bg-background/60 p-6 backdrop-blur-sm"
            >
              <h3 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
                {t(`home.friction.rows.${id}.name`)}
              </h3>

              <div className="space-y-3">
                <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('home.friction.withStarter', 'With the template')}
                  </p>
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {t(`home.friction.rows.${id}.starter`)}
                  </p>
                </div>

                <div className="rounded-xl border border-border/30 bg-muted/10 p-4">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('home.friction.fromScratch', 'From scratch')}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(`home.friction.rows.${id}.scratch`)}
                  </p>
                </div>
              </div>
            </m.article>
          ))}
        </div>
      </div>
    </section>
  )
}
