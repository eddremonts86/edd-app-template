import { IconShieldCheck, IconSparkles } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCurrentUser } from '@/modules/users'

function getGreetingKey(hour: number) {
  if (hour < 12) return 'dashboard.overview.welcome.morning'
  if (hour < 19) return 'dashboard.overview.welcome.afternoon'
  return 'dashboard.overview.welcome.evening'
}

export function WelcomeHero() {
  const { t } = useTranslation()
  const { user, roleKey, isReady } = useCurrentUser()
  const hour = new Date().getHours()
  const greeting = t(getGreetingKey(hour))
  const displayName = user?.name?.split(' ')[0] ?? t('dashboard.overview.welcome.fallbackName')
  const isAdmin = roleKey === 'super_admin' || roleKey === 'admin'

  return (
    <Card className="relative overflow-hidden border-border/60 p-6 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/10 via-primary/5 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl"
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary/80">
            <IconSparkles className="h-3.5 w-3.5" aria-hidden />
            {greeting}
          </div>
          {isReady ? (
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t('dashboard.overview.welcome.salute', { name: displayName })}
            </h1>
          ) : (
            <Skeleton className="h-8 w-64" />
          )}
          <p className="max-w-xl text-sm text-muted-foreground">
            {t('dashboard.overview.welcome.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
          {isReady && user ? (
            <>
              <Badge
                variant={isAdmin ? 'default' : 'secondary'}
                className="gap-1.5 px-2.5 py-1 text-[11px]"
              >
                <IconShieldCheck className="h-3.5 w-3.5" aria-hidden />
                {t(`users.roles.${roleKey}`, { defaultValue: roleKey })}
              </Badge>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </>
          ) : (
            <Skeleton className="h-6 w-32" />
          )}
        </div>
      </div>
    </Card>
  )
}
