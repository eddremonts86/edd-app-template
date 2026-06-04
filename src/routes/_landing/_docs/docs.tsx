import { createFileRoute, Link } from '@tanstack/react-router'
import { Layers, Rocket, HelpCircle, Shield, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DocPage } from './-_DocPage'

export const Route = createFileRoute('/_landing/_docs/docs')({
  component: DocsIndexPage,
})

function DocsIndexPage() {
  const { t } = useTranslation()
  const categories = [
    {
      title: t('docs.category.starter', 'Starter'),
      description: t(
        'docs.category.starterDesc',
        'Understand the architecture, module map, design system tokens, and development conventions.',
      ),
      icon: Layers,
      links: [
        {
          label: t('docs.links.architecture', 'Architecture & Layers'),
          to: '/starter/architecture',
        },
        { label: t('docs.links.moduleMap', 'Module Map & Blocks'), to: '/starter/module-map' },
        {
          label: t('docs.links.designTokens', 'Design Tokens Customization'),
          to: '/starter/design-tokens',
        },
        { label: t('docs.links.conventions', 'Codebase Conventions'), to: '/starter/conventions' },
      ],
    },
    {
      title: t('docs.category.product', 'Product'),
      description: t(
        'docs.category.productDesc',
        'Follow the feature roadmap, view updates in the changelog, learn about integrations, and browse release notes.',
      ),
      icon: Rocket,
      links: [
        { label: t('docs.links.roadmap', 'Roadmap & Future Modules'), to: '/product/roadmap' },
        { label: t('docs.links.changelog', 'Changelog of Versions'), to: '/product/changelog' },
        { label: t('docs.links.integrations', 'Integrations Matrix'), to: '/product/integrations' },
        {
          label: t('docs.links.releaseNotes', 'Release Notes Narrative'),
          to: '/product/release-notes',
        },
      ],
    },
    {
      title: t('docs.category.support', 'Support'),
      description: t(
        'docs.category.supportDesc',
        'Find guides, templates, real examples, and quick answers to frequently asked questions.',
      ),
      icon: HelpCircle,
      links: [
        {
          label: t('docs.links.documentation', 'Documentation Index'),
          to: '/support/documentation',
        },
        { label: t('docs.links.guides', 'Step-by-step Guides'), to: '/support/guides' },
        { label: t('docs.links.examples', 'Reference Examples'), to: '/support/examples' },
        { label: t('docs.links.faq', 'Frequently Asked Questions'), to: '/support/faq' },
      ],
    },
    {
      title: t('docs.category.legal', 'Legal'),
      description: t(
        'docs.category.legalDesc',
        'Review our open-source privacy policy, service terms, cookies statement, and package licenses.',
      ),
      icon: Shield,
      links: [
        { label: t('docs.links.privacy', 'Privacy Policy'), to: '/legal/privacy' },
        { label: t('docs.links.terms', 'Terms of Use'), to: '/legal/terms' },
        { label: t('docs.links.cookies', 'Cookies Usage'), to: '/legal/cookies' },
        { label: t('docs.links.licenses', 'Open Source Licenses'), to: '/legal/licenses' },
      ],
    },
  ]

  return (
    <DocPage
      title={t('docs.title', 'Documentation')}
      summary={t(
        'docs.summary',
        'Welcome to the edd Starter documentation. Find architecture overviews, integration matrices, implementation guides, and legal templates to ship your SaaS safely and quickly.',
      )}
    >
      <div className="space-y-8">
        <section className="not-prose grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {categories.map((cat) => {
            const Icon = cat.icon
            return (
              <div
                key={cat.title}
                className="p-6 rounded-2xl border border-border/40 bg-card/45 shadow-xs backdrop-blur-xs flex flex-col justify-between"
              >
                <div>
                  <div className="inline-flex p-3 rounded-xl bg-primary/10 text-primary mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{cat.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {cat.description}
                  </p>
                </div>
                <div className="border-t border-border/30 pt-4 flex flex-col gap-2">
                  {cat.links.map((link) => (
                    <Link
                      key={link.to}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      to={link.to as any}
                      className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center justify-between group"
                    >
                      <span>{link.label}</span>
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary translate-x-0 group-hover:translate-x-0.5" />
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </section>

        <section className="mt-8 border-t border-border/40 pt-8">
          <h2 className="text-xl font-bold tracking-tight text-foreground mb-4">
            {t('docs.gettingStarted.title', 'Getting Started Instantly')}
          </h2>
          <p>
            {t(
              'docs.gettingStarted.description',
              'To begin developing your SaaS application, we recommend walking through the core components in order. Clone the template repository, set up your credentials, configure your database, and run the developer server.',
            )}
          </p>
          <pre className="p-4 rounded-xl bg-muted/80 border border-border/40 overflow-x-auto text-xs md:text-sm font-mono mt-4">
            <code>
              git clone https://github.com/eddremonts86/edd-app-template.git your-saas-app
              <br />
              cd your-saas-app
              <br />
              pnpm install
              <br />
              pnpm db:up
              <br />
              pnpm dev
            </code>
          </pre>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              to={'/starter/architecture' as any}
              className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
            >
              {t('docs.cta.startLearning', 'Start Learning')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              to={'/product/roadmap' as any}
              className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold border border-border bg-background hover:bg-muted/50 transition-colors"
            >
              {t('docs.cta.viewRoadmap', 'View Roadmap')}
            </Link>
          </div>
        </section>
      </div>
    </DocPage>
  )
}
