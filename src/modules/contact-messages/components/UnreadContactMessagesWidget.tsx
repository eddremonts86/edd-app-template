import { IconArrowRight, IconMail } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@/components/ui'
import { WidgetRefreshButton, WidgetRefreshingIndicator } from '@/modules/core/widget'
import { useInboxNotifications } from '../api/contact-messages.queries'

export function UnreadContactMessagesWidget() {
  const { t } = useTranslation()
  const { data, isLoading, isFetching, refetch } = useInboxNotifications(6)

  const unreadCount = data?.unreadCount ?? 0
  const unreadItems = (data?.items ?? []).filter((item) => !item.isRead).slice(0, 3)

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="mt-2 h-4 w-4/5" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full border-border/70">
      <CardHeader className="flex flex-col gap-3 @md:flex-row @md:items-start @md:justify-between space-y-0 pb-4">
        <div className="min-w-0">
          <CardTitle>{t('contactMessages.widget.title', 'Unread contact messages')}</CardTitle>
          <CardDescription className="mt-1">
            {t(
              'contactMessages.widget.description',
              'Track new inbound briefs waiting for follow-up.',
            )}
          </CardDescription>
          {isFetching ? (
            <div className="mt-1">
              <WidgetRefreshingIndicator />
            </div>
          ) : null}
        </div>
        <WidgetRefreshButton
          isRefreshing={isFetching}
          onRefresh={() => {
            refetch()
          }}
          label={t('contactMessages.widget.refresh', 'Refresh unread contact messages')}
        />
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <IconMail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold leading-none">{unreadCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('contactMessages.unreadBadge', { count: unreadCount })}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          {unreadItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('contactMessages.widget.empty', 'No unread briefs right now.')}
            </p>
          ) : (
            unreadItems.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border/60 bg-muted/15 px-3 py-2.5"
              >
                <p className="line-clamp-3 text-sm leading-relaxed text-foreground">{item.body}</p>
                <p className="mt-1 text-[11px] text-muted-foreground/80">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>

        <Link
          to="/dashboard/contact-messages"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          {t('contactMessages.widget.viewAll', 'Open contact inbox')}
          <IconArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  )
}
