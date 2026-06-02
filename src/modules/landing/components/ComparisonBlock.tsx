'use client'

import { m } from 'framer-motion'
import { Check, X, ShieldAlert, BadgeCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ComparisonRow {
  feature: string
  starter: string
  scratch: string
  included: boolean
}

export function ComparisonBlock() {
  const { t } = useTranslation()

  const rows: ComparisonRow[] = [
    {
      feature: t('home.comparison.rows.auth.name', 'Pre-wired Hybrid Auth'),
      starter: t('home.comparison.rows.auth.starter', 'Better Auth + Clerk providers pre-configured. Database sessions ready in 5 minutes.'),
      scratch: t('home.comparison.rows.auth.scratch', '1-2 days configuring endpoints, JWTs, cookie security, middleware, and user db schemas.'),
      included: true,
    },
    {
      feature: t('home.comparison.rows.routes.name', 'Modular Architecture'),
      starter: t('home.comparison.rows.routes.starter', 'Strict directory separation (Landing, App Shell, Domain Modules) to prevent domain coupling.'),
      scratch: t('home.comparison.rows.routes.scratch', 'Spaghetti folder structure that leads to tight coupling and refactoring roadblocks later.'),
      included: true,
    },
    {
      feature: t('home.comparison.rows.test.name', 'E2E & Unit Test Harnesses'),
      starter: t('home.comparison.rows.test.starter', 'Playwright and Vitest fully configured with realistic smoke tests and routing coverage.'),
      scratch: t('home.comparison.rows.test.scratch', 'Hours adjusting config files, test runners, database seeding, and CI settings.'),
      included: true,
    },
    {
      feature: t('home.comparison.rows.ai.name', 'Streaming AI Integrations'),
      starter: t('home.comparison.rows.ai.starter', 'SSE (Server-Sent Events) backend chat handlers and customizable AI chat UI already built.'),
      scratch: t('home.comparison.rows.ai.scratch', 'Writing custom chunk-parsing server endpoints and state handlers for AI chat.'),
      included: true,
    },
    {
      feature: t('home.comparison.rows.docker.name', 'Production Docker Compose'),
      starter: t('home.comparison.rows.docker.starter', 'Multi-profile docker setup for database, ChromaDB, and app compilation ready for cloud/VPS.'),
      scratch: t('home.comparison.rows.docker.scratch', 'Creating Dockerfiles and docker-compose configurations manually for production.'),
      included: true,
    },
  ]

  return (
    <section className="px-6 py-20 bg-muted/20 dark:bg-muted/5 relative overflow-hidden">
      <div className="mx-auto max-w-5xl">
        <m.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl mb-4">
            {t('home.comparison.title', 'Stop reinventing boilerplate')}
          </h2>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg">
            {t('home.comparison.description', 'See how starting with the edd template compares to configuring your application foundation from scratch.')}
          </p>
        </m.div>

        {/* Desktop Comparison Table */}
        <div className="hidden md:block overflow-hidden rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border/50 bg-muted/40">
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-foreground/75 w-1/4">Feature / Primitive</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 w-1/2">
                  <BadgeCheck className="h-4 w-4" />
                  edd Starter
                </th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground w-1/4">
                  From Scratch
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {rows.map((row) => (
                <tr key={row.feature} className="hover:bg-muted/10 transition-colors">
                  <td className="p-4 text-sm font-bold text-foreground align-top">{row.feature}</td>
                  <td className="p-4 text-sm text-foreground/90 align-top pr-8">
                    <div className="flex gap-2 items-start">
                      <span className="rounded-full bg-green-500/10 p-0.5 text-green-500 mt-0.5 shrink-0">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span>{row.starter}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground align-top">
                    <div className="flex gap-2 items-start">
                      <span className="rounded-full bg-destructive/10 p-0.5 text-destructive mt-0.5 shrink-0">
                        <X className="h-3.5 w-3.5" />
                      </span>
                      <span>{row.scratch}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Comparison List */}
        <div className="md:hidden space-y-6">
          {rows.map((row) => (
            <div key={row.feature} className="rounded-xl border border-border/50 bg-background/50 p-5 space-y-4">
              <h3 className="text-base font-bold text-foreground border-b border-border/20 pb-2">{row.feature}</h3>
              
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  edd Starter
                </div>
                <p className="text-sm text-foreground/90 bg-primary/5 p-3 rounded-lg border border-primary/10">
                  {row.starter}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase">
                  <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground/60" />
                  From Scratch
                </div>
                <p className="text-sm text-muted-foreground p-3 rounded-lg border border-border/20 bg-muted/5">
                  {row.scratch}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
