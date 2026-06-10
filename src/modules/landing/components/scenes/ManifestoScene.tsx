'use client'

import { m } from 'framer-motion'
import { useTranslation } from 'react-i18next'

const ITEMS = ['structure', 'security', 'longevity'] as const

export function ManifestoScene() {
  const { t } = useTranslation()

  return (
    <section className="px-6 py-28 md:py-40">
      <div className="mx-auto max-w-5xl">
        <m.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.25em] text-primary"
        >
          {t('home.manifesto.eyebrow', 'Why it holds up')}
        </m.p>

        <div className="divide-y divide-border/40">
          {ITEMS.map((id, index) => (
            <m.div
              key={id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="py-12 md:py-16"
            >
              <p className="mb-4 flex items-baseline gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                <span className="tabular-nums text-muted-foreground/60">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {t(`home.manifesto.items.${id}.title`)}
              </p>
              <p className="mb-4 max-w-4xl text-balance text-3xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">
                {t(`home.manifesto.items.${id}.statement`)}
              </p>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                {t(`home.manifesto.items.${id}.proof`)}
              </p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  )
}
