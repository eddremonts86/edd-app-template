import {
  IconArrowRight,
  IconHelpCircle,
  IconLayoutGrid,
  IconMessage2,
  IconSettings,
  IconUsers,
} from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/shared/lib/utils'

interface QuickLink {
  to: string
  labelKey: string
  descKey: string
  icon: React.ReactNode
  accent: string
}

const LINKS: QuickLink[] = [
  {
    to: '/dashboard/users',
    labelKey: 'dashboard.overview.quickLinks.users',
    descKey: 'dashboard.overview.quickLinks.usersDesc',
    icon: <IconUsers className="h-4 w-4" />,
    accent: 'bg-primary/10 text-primary',
  },
  {
    to: '/dashboard/contact-messages',
    labelKey: 'dashboard.overview.quickLinks.messages',
    descKey: 'dashboard.overview.quickLinks.messagesDesc',
    icon: <IconMessage2 className="h-4 w-4" />,
    accent: 'bg-sky-500/10 text-sky-500',
  },
  {
    to: '/dashboard/help',
    labelKey: 'dashboard.overview.quickLinks.help',
    descKey: 'dashboard.overview.quickLinks.helpDesc',
    icon: <IconHelpCircle className="h-4 w-4" />,
    accent: 'bg-amber-500/10 text-amber-500',
  },
  {
    to: '/dashboard/settings',
    labelKey: 'dashboard.overview.quickLinks.settings',
    descKey: 'dashboard.overview.quickLinks.settingsDesc',
    icon: <IconSettings className="h-4 w-4" />,
    accent: 'bg-violet-500/10 text-violet-500',
  },
]

interface QuickLinksWidgetProps {
  className?: string
}

export function QuickLinksWidget({ className }: Readonly<QuickLinksWidgetProps>) {
  const { t } = useTranslation()
  return (
    <Card className={cn('border-border/60', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/10 text-violet-500">
            <IconLayoutGrid className="h-4 w-4" aria-hidden />
          </span>
          {t('dashboard.overview.quickLinks.title')}
        </CardTitle>
        <CardDescription>{t('dashboard.overview.quickLinks.description')}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="group flex items-center gap-3 rounded-lg border border-border/60 bg-muted/15 px-3 py-2.5 transition-colors hover:border-border hover:bg-muted/40"
          >
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                link.accent,
              )}
              aria-hidden
            >
              {link.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight">{t(link.labelKey)}</p>
              <p className="truncate text-[11px] text-muted-foreground">{t(link.descKey)}</p>
            </div>
            <IconArrowRight
              className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
