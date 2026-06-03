import { IconAdjustmentsHorizontal, IconRobot } from '@tabler/icons-react'
import { Link, Outlet, useLocation } from '@tanstack/react-router'
import { m } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function SettingsLayout() {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  const activeTab = pathname.includes('/ia_config')
    ? '/dashboard/settings/ia_config'
    : '/dashboard/settings/system'

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto w-full max-w-6xl space-y-8 pt-0 pb-6"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">{t('settings.title')}</h2>
        <p className="text-muted-foreground max-w-2xl">{t('settings.description')}</p>
      </div>

      <div className="space-y-6">
        <Tabs value={activeTab} className="w-full">
          <TabsList
            variant="line"
            className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-2"
          >
            <TabsTrigger value="/dashboard/settings/system" asChild>
              <Link to="/dashboard/settings/system" className="flex items-center gap-2">
                <IconAdjustmentsHorizontal className="size-4" />
                <span className="truncate">{t('settings.ai.tabs.system')}</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="/dashboard/settings/ia_config" asChild>
              <Link to="/dashboard/settings/ia_config" className="flex items-center gap-2">
                <IconRobot className="size-4" />
                <span className="truncate">{t('settings.ai.tabs.ai')}</span>
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="w-full">
          <Outlet />
        </div>
      </div>
    </m.div>
  )
}
