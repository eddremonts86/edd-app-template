import { IconArrowRight, IconMessage2 } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'
import { useDashboardStats } from '../../api/dashboard.queries'
import { BreakdownBars } from './BreakdownBars'

const TYPE_COLORS: Record<string, string> = {
  saas: 'hsl(221 83% 53%)',
  landing: 'hsl(173 58% 39%)',
  webapp: 'hsl(262 83% 58%)',
}

interface ContactByTypeWidgetProps {
  className?: string
}

export function ContactByTypeWidget({ className }: Readonly<ContactByTypeWidgetProps>) {
  const { t } = useTranslation()
  const { data, isLoading } = useDashboardStats()
  const cm = data?.contactMessages

  const segments = cm
    ? (Object.entries(cm.byType) as Array<[keyof typeof cm.byType, number]>).map(([k, v]) => ({
        key: k,
        label: t(`dashboard.overview.contactByType.types.${k}`, { defaultValue: k }),
        value: v,
        color: TYPE_COLORS[k] ?? 'hsl(220 9% 46%)',
      }))
    : []

  let body: React.ReactNode
  if (isLoading || !cm) {
    body = <Skeleton className="h-24 w-full" />
  } else if (cm.total === 0) {
    body = (
      <p className="rounded-lg border border-dashed border-border/60 py-6 text-center text-xs text-muted-foreground">
        {t('dashboard.overview.contactByType.empty')}
      </p>
    )
  } else {
    body = (
      <>
        <div className="flex items-baseline justify-between">
          <p className="text-3xl font-bold tabular-nums leading-none">{cm.total}</p>
          <p className="text-xs text-muted-foreground">
            {t('dashboard.overview.contactByType.totalLabel')}
          </p>
        </div>
        <BreakdownBars segments={segments} total={cm.total} />
      </>
    )
  }

  return (
    <Card className={cn('flex flex-col border-border/60', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-500/10 text-sky-500">
            <IconMessage2 className="h-4 w-4" aria-hidden />
          </span>
          {t('dashboard.overview.contactByType.title')}
        </CardTitle>
        <CardDescription>{t('dashboard.overview.contactByType.description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {body}
        <Link
          to="/dashboard/contact-messages"
          className="mt-auto inline-flex items-center justify-end gap-1 pt-2 text-xs font-medium text-primary hover:underline"
        >
          {t('dashboard.overview.contactByType.viewAll')}
          <IconArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </CardContent>
    </Card>
  )
}
