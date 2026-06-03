import { IconMail, IconShieldCheck, IconTrendingUp, IconUsers } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { UnreadContactMessagesWidget } from '@/modules/contact-messages'
import { useDashboardStats } from '../api/dashboard.queries'
import { ContactByTypeWidget } from './widgets/ContactByTypeWidget'
import { QuickLinksWidget } from './widgets/QuickLinksWidget'
import { RecentSignupsWidget } from './widgets/RecentSignupsWidget'
import { StatCard } from './widgets/StatCard'
import { UsersOverviewWidget } from './widgets/UsersOverviewWidget'
import { WelcomeHero } from './widgets/WelcomeHero'

export function DashboardPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useDashboardStats()

  const users = data?.users
  const cm = data?.contactMessages
  const sessions = data?.sessions
  const newDelta = users ? users.newThisWeek - users.newLastWeek : 0

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <WelcomeHero />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t('dashboard.overview.stats.totalUsers')}
          value={users?.total ?? 0}
          hint={t('dashboard.overview.stats.registeredUsers')}
          icon={<IconUsers className="h-5 w-5" aria-hidden />}
          isLoading={isLoading}
          accent="primary"
        />
        <StatCard
          label={t('dashboard.overview.stats.newUsersThisWeek')}
          value={users?.newThisWeek ?? 0}
          hint={t('dashboard.overview.stats.lastSevenDays')}
          icon={<IconTrendingUp className="h-5 w-5" aria-hidden />}
          isLoading={isLoading}
          accent="emerald"
          trend={
            users
              ? { value: newDelta, label: t('dashboard.overview.stats.vsPreviousWeekShort') }
              : null
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

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <UsersOverviewWidget className="lg:col-span-2" />
        <RecentSignupsWidget />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <UnreadContactMessagesWidget />
        <ContactByTypeWidget />
        <QuickLinksWidget />
      </div>
    </div>
  )
}
