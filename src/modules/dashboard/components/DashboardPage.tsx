import { IconMail, IconShieldCheck, IconUsers } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { UnreadContactMessagesWidget } from '@/modules/contact-messages'
import { useDashboardStats } from '../api/dashboard.queries'
import { ContactByTypeWidget } from './widgets/ContactByTypeWidget'
import { QuickLinksWidget } from './widgets/QuickLinksWidget'
import { RecentSignupsWidget } from './widgets/RecentSignupsWidget'
import { StatCard } from './widgets/StatCard'
import { UsersOverviewWidget } from './widgets/UsersOverviewWidget'

export function DashboardPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useDashboardStats()

  const users = data?.users
  const cm = data?.contactMessages
  const sessions = data?.sessions
  const newDelta = users ? users.newThisWeek - users.newLastWeek : 0

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-500">
      {/* Sandbox Warning Alert + Compact Callout guide */}
      <div className="flex flex-col gap-3">
        <Alert variant="warning" className="p-4 rounded-2xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-semibold">
            {t('dashboard.overview.welcome.morning')}, Workspace Admin
          </AlertTitle>
          <AlertDescription>
            You are operating in the template sandbox workspace. Changes persist locally but
            external sync requires active API keys.
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-border/70 bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
            Rutas del Starter
          </span>
          <div className="flex items-center gap-4 flex-wrap">
            <Link
              to="/starter/architecture"
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              Doc. de Arquitectura <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              to="/starter/module-map"
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              Mapa de Módulos <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              to="/starter/design-tokens"
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              Tokens de Diseño <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              to="/starter/conventions"
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              Convenciones del Proyecto <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Core KPIs Row */}
        <div className="md:col-span-2 xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label={t('dashboard.overview.stats.totalUsers')}
            value={users?.total ?? 0}
            hint={t('dashboard.overview.stats.registeredUsers')}
            icon={<IconUsers className="h-5 w-5" aria-hidden />}
            isLoading={isLoading}
            accent="primary"
            trend={
              users
                ? {
                    value: Math.abs(newDelta),
                    label: t(
                      newDelta >= 0
                        ? 'dashboard.overview.stats.trendUp'
                        : 'dashboard.overview.stats.trendDown',
                    ),
                  }
                : undefined
            }
          />
          <StatCard
            label={t('dashboard.overview.stats.activeSessions')}
            value={sessions?.active ?? 0}
            hint={t('dashboard.overview.stats.activeSessionsHint')}
            icon={<IconShieldCheck className="h-5 w-5" aria-hidden />}
            isLoading={isLoading}
            accent="violet"
          />
          <StatCard
            label={t('dashboard.overview.stats.unreadMessages')}
            value={cm?.unread ?? 0}
            hint={t('dashboard.overview.stats.unreadMessagesHint', {
              count: cm?.newThisWeek ?? 0,
            })}
            icon={<IconMail className="h-5 w-5" aria-hidden />}
            isLoading={isLoading}
            accent="amber"
          />
        </div>

        {/* Users Overview & Recent Signups */}
        <UsersOverviewWidget className="md:col-span-2 xl:col-span-2" />
        <RecentSignupsWidget className="md:col-span-1 xl:col-span-1" />

        {/* Feedback / Contact & Action Links */}
        <div className="md:col-span-1 xl:col-span-1">
          <UnreadContactMessagesWidget />
        </div>
        <ContactByTypeWidget className="md:col-span-1 xl:col-span-1" />
        <QuickLinksWidget className="md:col-span-1 xl:col-span-1" />
      </div>
    </div>
  )
}
