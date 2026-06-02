import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { ChevronRight, Menu, X, BookOpen } from 'lucide-react'
import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Card } from '@/components/ui'

export const Route = createFileRoute('/_landing/_docs')({
  component: DocsLayout,
})

interface DocLink {
  label: string
  to: string
}

interface DocGroup {
  title: string
  items: DocLink[]
}

function DocsLayout() {
  const { t } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const docGroups: DocGroup[] = [
    {
      title: t('home.footer.links.essence.title', 'Starter'),
      items: [
        {
          label: t('home.footer.links.essence.items.0', 'Architecture'),
          to: '/starter/architecture',
        },
        { label: t('home.footer.links.essence.items.1', 'Module map'), to: '/starter/module-map' },
        {
          label: t('home.footer.links.essence.items.2', 'Design tokens'),
          to: '/starter/design-tokens',
        },
        {
          label: t('home.footer.links.essence.items.3', 'Conventions'),
          to: '/starter/conventions',
        },
      ],
    },
    {
      title: t('home.footer.links.company.title', 'Product'),
      items: [
        { label: t('home.footer.links.company.items.0', 'Roadmap'), to: '/product/roadmap' },
        { label: t('home.footer.links.company.items.1', 'Changelog'), to: '/product/changelog' },
        {
          label: t('home.footer.links.company.items.2', 'Integrations'),
          to: '/product/integrations',
        },
        {
          label: t('home.footer.links.company.items.3', 'Release notes'),
          to: '/product/release-notes',
        },
      ],
    },
    {
      title: t('home.footer.links.community.title', 'Support'),
      items: [
        {
          label: t('home.footer.links.community.items.0', 'Documentation'),
          to: '/support/documentation',
        },
        { label: t('home.footer.links.community.items.1', 'Guides'), to: '/support/guides' },
        { label: t('home.footer.links.community.items.2', 'Examples'), to: '/support/examples' },
        { label: t('home.footer.links.community.items.3', 'FAQ'), to: '/support/faq' },
      ],
    },
    {
      title: t('home.footer.links.legal.title', 'Legal'),
      items: [
        { label: t('home.footer.links.legal.items.0', 'Privacy policy'), to: '/legal/privacy' },
        { label: t('home.footer.links.legal.items.1', 'Terms'), to: '/legal/terms' },
        { label: t('home.footer.links.legal.items.2', 'Cookies'), to: '/legal/cookies' },
        { label: t('home.footer.links.legal.items.3', 'Licenses'), to: '/legal/licenses' },
      ],
    },
  ]

  const handleLinkClick = useCallback(() => {
    setMobileMenuOpen(false)
  }, [])

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev)
  }, [])

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 md:py-12">
      {/* Mobile documentation navigation selector */}
      <div className="md:hidden mb-6 flex items-center justify-between border border-border/40 bg-card/60 p-3 rounded-xl backdrop-blur-md">
        <span className="text-sm font-bold flex items-center gap-2 text-foreground">
          <BookOpen className="h-4 w-4 text-primary" />
          Documentation Menu
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={toggleMobileMenu}
          className="h-8 w-8 p-0 flex items-center justify-center border-border/50"
          aria-label="Toggle navigation links list"
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 relative">
        {/* Left Side Navigation Menu Column */}
        <aside
          className={`w-full md:w-60 shrink-0 md:sticky md:top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 md:border-r md:border-border/10 space-y-6 ${
            mobileMenuOpen ? 'block' : 'hidden md:block'
          }`}
        >
          <div className="flex flex-col gap-6">
            {/* Overview / Index entry */}
            <div className="space-y-1">
              <Link
                to="/docs"
                onClick={handleLinkClick}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors hover:bg-secondary/20"
                activeProps={{ className: 'bg-primary/10 text-primary hover:bg-primary/15' }}
              >
                <BookOpen className="h-3.5 w-3.5 shrink-0" />
                Documentation Index
              </Link>
            </div>

            {/* Categorized groups links list */}
            {docGroups.map((group) => (
              <div key={group.title} className="space-y-2">
                <h4 className="px-3 text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                  {group.title}
                </h4>
                <div className="flex flex-col gap-0.5 pl-2 border-l border-border/20 ml-3">
                  {group.items.map((item) => (
                    <Link
                      key={item.to}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      to={item.to as any}
                      onClick={handleLinkClick}
                      className="group flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/35 transition-colors"
                      activeProps={{
                        className:
                          'font-semibold text-primary bg-primary/[0.04] border-l-2 border-primary -ml-[9px] rounded-l-none',
                      }}
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Right Documentation Content Display Column */}
        <main className="flex-grow min-w-0 md:pl-4">
          <Card className="border border-border/40 bg-card/25 p-6 md:p-8 shadow-xs backdrop-blur-xs min-h-[500px]">
            <Outlet />
          </Card>
        </main>
      </div>
    </div>
  )
}
