'use client'

import { Link } from '@tanstack/react-router'
import { m } from 'framer-motion'
import { LogIn } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge, Card, Input, Button } from '@/components/ui'
import { useAppAuth } from '@/shared/lib/auth/app-auth'
import { FooterColumn } from './FooterColumn'
import { SocialLinks } from './SocialLinks'

export function FooterBlock() {
  const { t } = useTranslation()
  const auth = useAppAuth()
  const essenceRoutes = [
    '/starter/architecture',
    '/starter/module-map',
    '/starter/design-tokens',
    '/starter/conventions',
  ]
  const companyRoutes = [
    '/product/roadmap',
    '/product/changelog',
    '/product/integrations',
    '/product/release-notes',
  ]
  const communityRoutes = [
    '/support/documentation',
    '/support/guides',
    '/support/examples',
    '/support/faq',
  ]
  const legalRoutes = ['/legal/privacy', '/legal/terms', '/legal/cookies', '/legal/licenses']

  const getItems = (labels: string[] | undefined, routes: string[]) => {
    const list = Array.isArray(labels) ? labels : []
    return list.map((label, idx) => ({ label, to: routes[idx] || '#' }))
  }

  const footerLinks = [
    {
      title: t('home.footer.links.essence.title'),
      items: getItems(
        t('home.footer.links.essence.items', { returnObjects: true }) as string[],
        essenceRoutes,
      ),
    },
    {
      title: t('home.footer.links.company.title'),
      items: getItems(
        t('home.footer.links.company.items', { returnObjects: true }) as string[],
        companyRoutes,
      ),
    },
    {
      title: t('home.footer.links.community.title'),
      items: getItems(
        t('home.footer.links.community.items', { returnObjects: true }) as string[],
        communityRoutes,
      ),
    },
    {
      title: t('home.footer.links.legal.title'),
      items: getItems(
        t('home.footer.links.legal.items', { returnObjects: true }) as string[],
        legalRoutes,
      ),
    },
  ]

  return (
    <footer className="relative w-full overflow-hidden border-t border-border bg-card/90 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <div className="mb-4 inline-flex items-center gap-3">
              <Card className="rounded-2xl border border-border/60 bg-card/80 px-3 py-1 text-xs uppercase tracking-[0.32em] text-muted-foreground shadow-sm">
                {t('home.footer.brand')}
              </Card>
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {t('home.footer.since')}
              </Badge>
            </div>
            <p className="mb-4 max-w-md text-sm text-muted-foreground">
              {t('home.footer.description')}
            </p>

            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-foreground">
                {t('home.footer.subscribe.title')}
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder={t('home.footer.subscribe.placeholder')}
                  className="max-w-[240px]"
                />
                <Button size="sm">{t('home.footer.subscribe.button')}</Button>
              </div>
              <p className="mt-2 max-w-sm text-xs text-muted-foreground">
                {t(
                  'home.footer.subscribe.note',
                  'Release notes, improvements, and implementation guides. Maximum one email per month.',
                )}
              </p>
              {!auth.isAuthenticated && (
                <div className="mt-4">
                  <Link
                    to="/auth"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    {t('nav.signIn', 'Sign In')}
                  </Link>
                </div>
              )}
            </div>
          </m.div>

          {footerLinks.map((section) => (
            <FooterColumn key={section.title} title={section.title} items={section.items} />
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between border-t border-border/40 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            {t('home.footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <SocialLinks />
        </div>
      </div>
    </footer>
  )
}
