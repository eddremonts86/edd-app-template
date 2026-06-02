'use client'

import { Zap, Shield, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { FeatureCard } from './FeatureCard'

export function FeatureCardsBlock() {
  const { t } = useTranslation()
  const features = [
    {
      icon: Zap,
      title: t('home.features.items.efficiency.title'),
      description: t('home.features.items.efficiency.description'),
      example: t(
        'home.features.items.efficiency.example',
        'Example: domain modules stay independent, so new features do not break existing flows.',
      ),
    },
    {
      icon: Shield,
      title: t('home.features.items.ethics.title'),
      description: t('home.features.items.ethics.description'),
      example: t(
        'home.features.items.ethics.example',
        'Example: auth and config defaults are ready before business logic is added.',
      ),
    },
    {
      icon: Sparkles,
      title: t('home.features.items.closeness.title'),
      description: t('home.features.items.closeness.description'),
      example: t(
        'home.features.items.closeness.example',
        'Example: customize landing copy and product modules while preserving shared foundations.',
      ),
    },
  ]

  return (
    <section className="px-6 py-36">
      <div className="mx-auto max-w-7xl">
        <div className="mb-20 space-y-5 text-center">
          <h2 className="text-5xl font-bold tracking-tight md:text-6xl">
            {t('home.features.title')}
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            {t('home.features.description')}
          </p>
        </div>

        <div className="grid gap-10 md:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              example={feature.example}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
